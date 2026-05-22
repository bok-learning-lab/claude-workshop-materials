#!/usr/bin/env python3
"""MCP server wrapping the Replicate image-generation API.

Exposes four tools:
  - replicate_generate_image: prompt -> saved image file(s) (defaults to flux-schnell)
  - replicate_run_model:      run any Replicate model with arbitrary input dict
  - replicate_get_model:      fetch model description + input schema (for discovery)
  - replicate_get_prediction: look up a prediction by id

Auth: requires REPLICATE_API_TOKEN in the environment.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from enum import Enum
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse

import replicate
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field, field_validator
from replicate.client import Client
from replicate.exceptions import ModelError, ReplicateError

# --- Constants ---------------------------------------------------------------

DEFAULT_IMAGE_MODEL = "black-forest-labs/flux-schnell"
CHARACTER_LIMIT = 25_000  # max response size before truncation kicks in

# Project root = two levels up from this file (_mcp/replicate_image/server.py)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "output"

# --- Server init -------------------------------------------------------------

mcp = FastMCP("replicate_image_mcp")


def _get_client() -> Client:
    """Build a Replicate client from REPLICATE_API_TOKEN. Raises if unset.

    A fresh client per call is cheap and keeps the token check close to use.
    """
    token = os.environ.get("REPLICATE_API_TOKEN")
    if not token:
        raise RuntimeError(
            "REPLICATE_API_TOKEN is not set. Generate a token at "
            "https://replicate.com/account/api-tokens and export it before "
            "starting the MCP server."
        )
    return Client(api_token=token)


# --- Enums and shared models -------------------------------------------------


class ResponseFormat(str, Enum):
    MARKDOWN = "markdown"
    JSON = "json"


# --- Input models ------------------------------------------------------------


class GenerateImageInput(BaseModel):
    """Inputs for replicate_generate_image."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )

    prompt: str = Field(
        ...,
        description=(
            "Text prompt describing the image to generate "
            "(e.g., 'an iguana on the beach, pointillism')."
        ),
        min_length=1,
        max_length=2000,
    )
    model: str = Field(
        default=DEFAULT_IMAGE_MODEL,
        description=(
            "Replicate model reference. Format 'owner/name' for the latest "
            "version, or 'owner/name:version_hash' to pin a specific version. "
            f"Default: '{DEFAULT_IMAGE_MODEL}' (fast, low-cost FLUX schnell)."
        ),
        max_length=200,
    )
    num_outputs: int = Field(
        default=1,
        description="How many images to generate (1-4). Not all models honor this.",
        ge=1,
        le=4,
    )
    aspect_ratio: Optional[str] = Field(
        default=None,
        description=(
            "Aspect ratio passed through to the model when supported "
            "(e.g., '1:1', '16:9', '9:16', '3:2'). Omit to use the model's default."
        ),
        max_length=10,
    )
    seed: Optional[int] = Field(
        default=None,
        description="Optional integer seed for reproducible output.",
    )
    extra_input: Optional[dict[str, Any]] = Field(
        default=None,
        description=(
            "Extra model-specific input fields, merged into the input dict. "
            "Use replicate_get_model first to discover supported keys."
        ),
    )
    output_dir: Optional[str] = Field(
        default=None,
        description=(
            "Directory to save generated images into. Absolute path, or relative "
            "to the project root. Default: <project_root>/output/."
        ),
        max_length=500,
    )
    filename_prefix: Optional[str] = Field(
        default=None,
        description=(
            "Optional filename prefix. If omitted, derived from the model name "
            "and a timestamp."
        ),
        max_length=100,
    )

    @field_validator("model")
    @classmethod
    def _validate_model_ref(cls, v: str) -> str:
        # owner/name or owner/name:hash
        if not re.match(r"^[\w.\-]+/[\w.\-]+(?::[a-f0-9]{6,64})?$", v):
            raise ValueError(
                "model must look like 'owner/name' or 'owner/name:version_hash'"
            )
        return v


class RunModelInput(BaseModel):
    """Inputs for replicate_run_model — generic model runner."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )

    model: str = Field(
        ...,
        description=(
            "Replicate model reference: 'owner/name' or 'owner/name:version_hash'."
        ),
        max_length=200,
    )
    input: dict[str, Any] = Field(
        ...,
        description=(
            "Input dictionary for the model. Run replicate_get_model first to "
            "see required/optional keys for the target model."
        ),
    )
    output_dir: Optional[str] = Field(
        default=None,
        description=(
            "Where to save any file outputs. Default: <project_root>/output/."
        ),
        max_length=500,
    )
    filename_prefix: Optional[str] = Field(
        default=None,
        description="Optional filename prefix for any saved files.",
        max_length=100,
    )

    @field_validator("model")
    @classmethod
    def _validate_model_ref(cls, v: str) -> str:
        if not re.match(r"^[\w.\-]+/[\w.\-]+(?::[a-f0-9]{6,64})?$", v):
            raise ValueError(
                "model must look like 'owner/name' or 'owner/name:version_hash'"
            )
        return v


class GetModelInput(BaseModel):
    """Inputs for replicate_get_model."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )

    model: str = Field(
        ...,
        description="Model reference, format 'owner/name' (e.g., 'black-forest-labs/flux-schnell').",
        max_length=200,
    )
    include_schema: bool = Field(
        default=True,
        description=(
            "If true, include the model's input/output OpenAPI schema (can be large). "
            "Set to false for a concise summary."
        ),
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="'markdown' for human-readable, 'json' for raw structured data.",
    )

    @field_validator("model")
    @classmethod
    def _validate_model_ref(cls, v: str) -> str:
        if not re.match(r"^[\w.\-]+/[\w.\-]+$", v):
            raise ValueError("model must look like 'owner/name' (no version hash)")
        return v


class GetPredictionInput(BaseModel):
    """Inputs for replicate_get_prediction."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )

    prediction_id: str = Field(
        ...,
        description="The Replicate prediction id (e.g., from a prior async run).",
        min_length=1,
        max_length=100,
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="'markdown' or 'json'.",
    )


# --- Shared helpers ----------------------------------------------------------


def _resolve_output_dir(raw: Optional[str]) -> Path:
    """Resolve `output_dir` against PROJECT_ROOT, creating it if needed."""
    if not raw:
        out = DEFAULT_OUTPUT_DIR
    else:
        p = Path(raw).expanduser()
        out = p if p.is_absolute() else (PROJECT_ROOT / p)
    out.mkdir(parents=True, exist_ok=True)
    return out


def _slugify(text: str, max_len: int = 40) -> str:
    """Cheap slug for filename use."""
    slug = re.sub(r"[^A-Za-z0-9_-]+", "-", text).strip("-").lower()
    return (slug or "out")[:max_len]


def _ext_from_url(url: str, fallback: str = "bin") -> str:
    """Best-effort file extension from a URL path."""
    path = urlparse(url).path
    _, _, ext = path.rpartition(".")
    if 1 <= len(ext) <= 5 and ext.isalnum():
        return ext.lower()
    return fallback


def _looks_like_file_output(obj: Any) -> bool:
    """Detect Replicate FileOutput-ish objects without importing internal types."""
    return hasattr(obj, "read") and hasattr(obj, "url")


async def _save_file_output(
    file_output: Any, out_dir: Path, base_name: str, index: int
) -> dict[str, Any]:
    """Read a single FileOutput to disk and return a small descriptor dict."""
    url = getattr(file_output, "url", None) or ""
    ext = _ext_from_url(url, fallback="png")
    dest = out_dir / f"{base_name}_{index}.{ext}"

    # Prefer async read if available; fall back to sync read in a thread.
    if hasattr(file_output, "aread"):
        data = await file_output.aread()
    else:
        data = await asyncio.to_thread(file_output.read)

    await asyncio.to_thread(dest.write_bytes, data)
    return {
        "path": str(dest),
        "url": url,
        "bytes": len(data),
    }


async def _save_any_outputs(
    output: Any, out_dir: Path, base_name: str
) -> tuple[list[dict[str, Any]], Any]:
    """Walk an arbitrary model output and persist any FileOutput-ish objects.

    Returns (saved_files, residual). `residual` is the original output with file
    objects replaced by `{ "saved_as": "<path>" }` markers so callers can show
    the full structure without binary blobs.
    """
    saved: list[dict[str, Any]] = []

    async def walk(node: Any, prefix: str) -> Any:
        if _looks_like_file_output(node):
            idx = len(saved)
            info = await _save_file_output(node, out_dir, base_name, idx)
            saved.append(info)
            return {"saved_as": info["path"], "url": info["url"]}
        if isinstance(node, list):
            return [await walk(v, f"{prefix}_{i}") for i, v in enumerate(node)]
        if isinstance(node, dict):
            return {k: await walk(v, f"{prefix}_{k}") for k, v in node.items()}
        return node

    residual = await walk(output, base_name)
    return saved, residual


def _format_error(e: Exception) -> str:
    """Map Replicate / runtime errors to actionable LLM-facing messages."""
    if isinstance(e, ModelError):
        pid = getattr(getattr(e, "prediction", None), "id", "<unknown>")
        logs = getattr(getattr(e, "prediction", None), "logs", "") or ""
        tail = logs.strip().splitlines()[-5:]
        log_tail = "\n".join(tail)
        return (
            f"Error: model run failed (prediction {pid}). "
            f"Inspect logs with replicate_get_prediction. Tail:\n{log_tail}"
        )
    if isinstance(e, ReplicateError):
        msg = str(e)
        if "401" in msg or "authentication" in msg.lower():
            return (
                "Error: Replicate authentication failed. Check REPLICATE_API_TOKEN."
            )
        if "402" in msg or "billing" in msg.lower():
            return "Error: Replicate billing problem. Check your account credits."
        if "404" in msg:
            return (
                "Error: model or prediction not found. Verify the 'owner/name' "
                "reference is correct and publicly accessible."
            )
        if "429" in msg or "rate" in msg.lower():
            return "Error: rate limited by Replicate. Wait and retry."
        return f"Error from Replicate API: {msg}"
    if isinstance(e, RuntimeError):
        return f"Error: {e}"
    return f"Error: {type(e).__name__}: {e}"


def _truncate_if_huge(payload: str, hint: str) -> str:
    """Return payload as-is, or a truncation envelope if it exceeds the limit."""
    if len(payload) <= CHARACTER_LIMIT:
        return payload
    head = payload[: CHARACTER_LIMIT - 500]
    return (
        head
        + "\n\n...[truncated]...\n"
        + json.dumps(
            {
                "truncated": True,
                "original_length": len(payload),
                "guidance": hint,
            },
            indent=2,
        )
    )


# --- Tools -------------------------------------------------------------------


@mcp.tool(
    name="replicate_generate_image",
    annotations={
        "title": "Generate Image with Replicate",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    },
)
async def replicate_generate_image(params: GenerateImageInput) -> str:
    """Generate one or more images from a text prompt and save them locally.

    Calls Replicate's `run` endpoint with `black-forest-labs/flux-schnell` by
    default. Returns a JSON object with the saved file paths plus the source
    URLs and the input that was sent. Images are written to
    `<project_root>/output/` unless `output_dir` is specified.

    Args:
        params: GenerateImageInput
            - prompt (str): text prompt for the image.
            - model (str): 'owner/name' or 'owner/name:version_hash'.
              Default 'black-forest-labs/flux-schnell'.
            - num_outputs (int): 1-4 (default 1; not all models honor this).
            - aspect_ratio (str | None): e.g. '1:1', '16:9'.
            - seed (int | None): reproducibility seed.
            - extra_input (dict | None): model-specific extra input fields.
            - output_dir (str | None): override save directory.
            - filename_prefix (str | None): override filename prefix.

    Returns:
        JSON string with shape:
        {
          "model": "owner/name",
          "input": {...},               # what was actually sent
          "saved": [
            {"path": "...", "url": "https://...", "bytes": 12345}
          ],
          "output_dir": "/abs/path",
          "duration_seconds": 4.21
        }

        On failure, a string starting with "Error: ..." with actionable detail.

    When to use:
      - "Make me a picture of X" -> use this tool.
      - "Generate 3 variations of Y" -> set num_outputs=3.
      - "Use SDXL instead" -> set model='stability-ai/sdxl'.

    When NOT to use:
      - For non-image models (audio, video, text) -> use replicate_run_model.
      - To discover what input fields a model takes -> use replicate_get_model.
    """
    try:
        client = _get_client()

        input_payload: dict[str, Any] = {"prompt": params.prompt}
        if params.num_outputs and params.num_outputs > 1:
            input_payload["num_outputs"] = params.num_outputs
        if params.aspect_ratio:
            input_payload["aspect_ratio"] = params.aspect_ratio
        if params.seed is not None:
            input_payload["seed"] = params.seed
        if params.extra_input:
            input_payload.update(params.extra_input)

        out_dir = _resolve_output_dir(params.output_dir)
        prefix = params.filename_prefix or _slugify(
            f"{int(time.time())}_{params.model.split('/')[-1].split(':')[0]}"
        )

        started = time.monotonic()
        # client.async_run exists in replicate>=1.0; fall back to sync in a thread.
        try:
            output = await client.async_run(params.model, input=input_payload)
        except AttributeError:
            output = await asyncio.to_thread(
                client.run, params.model, input=input_payload
            )
        duration = round(time.monotonic() - started, 2)

        # Normalize to list of file outputs when possible.
        candidates = output if isinstance(output, list) else [output]
        saved: list[dict[str, Any]] = []
        for i, item in enumerate(candidates):
            if _looks_like_file_output(item):
                saved.append(await _save_file_output(item, out_dir, prefix, i))
            elif isinstance(item, str) and item.startswith(("http://", "https://")):
                # Some models return URL strings — record without download.
                saved.append({"path": None, "url": item, "bytes": None})

        if not saved:
            # Unexpected — surface the raw output for debugging.
            return json.dumps(
                {
                    "warning": "Model returned no file-like outputs.",
                    "model": params.model,
                    "input": input_payload,
                    "raw_output": str(output)[:1000],
                },
                indent=2,
            )

        return json.dumps(
            {
                "model": params.model,
                "input": input_payload,
                "saved": saved,
                "output_dir": str(out_dir),
                "duration_seconds": duration,
            },
            indent=2,
        )
    except Exception as e:  # noqa: BLE001 - tool boundary, surface to LLM
        return _format_error(e)


@mcp.tool(
    name="replicate_run_model",
    annotations={
        "title": "Run Any Replicate Model",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    },
)
async def replicate_run_model(params: RunModelInput) -> str:
    """Run an arbitrary Replicate model with a caller-supplied input dict.

    Use this when `replicate_generate_image` isn't a fit (e.g., image-to-image
    with a file input, video models, audio, vision-language models). Any file
    outputs are saved to disk; non-file outputs are returned verbatim.

    Args:
        params: RunModelInput
            - model (str): 'owner/name' or 'owner/name:version_hash'.
            - input (dict): full input dict for the model. URLs may be passed
              as strings; local files must be uploaded by the caller first.
            - output_dir (str | None): override save directory.
            - filename_prefix (str | None): override filename prefix.

    Returns:
        JSON string with shape:
        {
          "model": "owner/name",
          "input": {...},
          "saved": [ {"path": "...", "url": "..."} ],
          "output": <residual non-file output with files replaced by markers>,
          "duration_seconds": 4.21
        }
        Or "Error: ..." on failure.

    Tip:
      - Discover required input keys with replicate_get_model before calling.
    """
    try:
        client = _get_client()
        out_dir = _resolve_output_dir(params.output_dir)
        prefix = params.filename_prefix or _slugify(
            f"{int(time.time())}_{params.model.split('/')[-1].split(':')[0]}"
        )

        started = time.monotonic()
        try:
            output = await client.async_run(params.model, input=params.input)
        except AttributeError:
            output = await asyncio.to_thread(
                client.run, params.model, input=params.input
            )
        duration = round(time.monotonic() - started, 2)

        saved, residual = await _save_any_outputs(output, out_dir, prefix)

        payload = json.dumps(
            {
                "model": params.model,
                "input": params.input,
                "saved": saved,
                "output": residual,
                "output_dir": str(out_dir),
                "duration_seconds": duration,
            },
            indent=2,
            default=str,
        )
        return _truncate_if_huge(
            payload,
            "Run with a smaller input or fetch the prediction by id later.",
        )
    except Exception as e:  # noqa: BLE001
        return _format_error(e)


@mcp.tool(
    name="replicate_get_model",
    annotations={
        "title": "Get Replicate Model Info",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    },
)
async def replicate_get_model(params: GetModelInput) -> str:
    """Fetch metadata for a Replicate model, including its input schema.

    Useful before calling replicate_run_model to discover what input fields a
    model expects (names, types, required/optional, defaults).

    Args:
        params: GetModelInput
            - model (str): 'owner/name' (no version hash).
            - include_schema (bool): include the OpenAPI input/output schema.
            - response_format ('markdown'|'json'): output format.

    Returns:
        Markdown summary by default, or JSON with full metadata. The schema
        section can be large; set include_schema=False for a concise view.
    """
    try:
        client = _get_client()
        owner, name = params.model.split("/", 1)

        # Models API doesn't always expose async_get across versions; use thread.
        model = await asyncio.to_thread(client.models.get, params.model)

        latest_version = getattr(model, "latest_version", None)
        version_id = getattr(latest_version, "id", None)
        schema: Optional[dict[str, Any]] = None
        if params.include_schema and latest_version is not None:
            # openapi_schema is a dict on the version object
            schema = getattr(latest_version, "openapi_schema", None)

        meta = {
            "owner": owner,
            "name": name,
            "description": getattr(model, "description", None),
            "visibility": getattr(model, "visibility", None),
            "github_url": getattr(model, "github_url", None),
            "paper_url": getattr(model, "paper_url", None),
            "license_url": getattr(model, "license_url", None),
            "run_count": getattr(model, "run_count", None),
            "cover_image_url": getattr(model, "cover_image_url", None),
            "default_example": getattr(model, "default_example", None),
            "latest_version_id": version_id,
        }
        if params.include_schema:
            meta["openapi_schema"] = schema

        if params.response_format == ResponseFormat.JSON:
            return _truncate_if_huge(
                json.dumps(meta, indent=2, default=str),
                "Set include_schema=false to shrink the response.",
            )

        # Markdown rendering
        lines = [
            f"# {owner}/{name}",
            "",
            meta["description"] or "_No description provided._",
            "",
            "## Metadata",
            f"- **Visibility:** {meta['visibility']}",
            f"- **Run count:** {meta['run_count']}",
            f"- **Latest version:** `{version_id or 'unknown'}`",
        ]
        for key in ("github_url", "paper_url", "license_url"):
            if meta.get(key):
                lines.append(f"- **{key.replace('_', ' ').title()}:** {meta[key]}")

        if params.include_schema and schema:
            lines.append("")
            lines.append("## Input schema")
            input_props = (
                schema.get("components", {})
                .get("schemas", {})
                .get("Input", {})
                .get("properties", {})
            )
            required = (
                schema.get("components", {})
                .get("schemas", {})
                .get("Input", {})
                .get("required", [])
            )
            if input_props:
                for prop, info in input_props.items():
                    typ = info.get("type") or info.get("allOf") or "?"
                    desc = info.get("description", "")
                    default = info.get("default", None)
                    req = " *(required)*" if prop in required else ""
                    default_str = (
                        f" — default: `{default}`" if default is not None else ""
                    )
                    lines.append(f"- **`{prop}`** ({typ}){req}{default_str} — {desc}")
            else:
                lines.append("_(schema not available)_")

        return _truncate_if_huge(
            "\n".join(lines),
            "Set include_schema=false or use response_format='json' with filters.",
        )
    except Exception as e:  # noqa: BLE001
        return _format_error(e)


@mcp.tool(
    name="replicate_get_prediction",
    annotations={
        "title": "Get Replicate Prediction",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    },
)
async def replicate_get_prediction(params: GetPredictionInput) -> str:
    """Fetch a Replicate prediction by id.

    Args:
        params: GetPredictionInput
            - prediction_id (str): the prediction id.
            - response_format ('markdown'|'json'): output format.

    Returns:
        Markdown or JSON with: id, status, model, output (URLs only — no
        download), error, logs (tail), created_at, started_at, completed_at,
        metrics.
    """
    try:
        client = _get_client()
        pred = await asyncio.to_thread(client.predictions.get, params.prediction_id)

        logs = getattr(pred, "logs", "") or ""
        log_tail = "\n".join(logs.strip().splitlines()[-20:])

        data = {
            "id": getattr(pred, "id", None),
            "status": getattr(pred, "status", None),
            "model": getattr(pred, "model", None),
            "version": getattr(pred, "version", None),
            "output": getattr(pred, "output", None),
            "error": getattr(pred, "error", None),
            "logs_tail": log_tail,
            "created_at": str(getattr(pred, "created_at", "") or ""),
            "started_at": str(getattr(pred, "started_at", "") or ""),
            "completed_at": str(getattr(pred, "completed_at", "") or ""),
            "metrics": getattr(pred, "metrics", None),
        }

        if params.response_format == ResponseFormat.JSON:
            return _truncate_if_huge(
                json.dumps(data, indent=2, default=str),
                "Logs are already tailed; nothing else to filter.",
            )

        lines = [
            f"# Prediction `{data['id']}`",
            f"- **Status:** {data['status']}",
            f"- **Model:** {data['model']}",
            f"- **Version:** `{data['version']}`",
            f"- **Created:** {data['created_at']}",
            f"- **Started:** {data['started_at']}",
            f"- **Completed:** {data['completed_at']}",
        ]
        if data["error"]:
            lines += ["", "## Error", f"```\n{data['error']}\n```"]
        if data["output"] is not None:
            lines += ["", "## Output", f"```\n{json.dumps(data['output'], default=str, indent=2)[:2000]}\n```"]
        if log_tail:
            lines += ["", "## Logs (tail)", f"```\n{log_tail}\n```"]

        return _truncate_if_huge("\n".join(lines), "Use response_format='json'.")
    except Exception as e:  # noqa: BLE001
        return _format_error(e)


# --- Entrypoint --------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
