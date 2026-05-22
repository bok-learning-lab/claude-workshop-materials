"""One-shot smoke test: calls the same tool function the MCP would expose.

Reads the token out of the project's .mcp.json so we don't have to export it
in the shell. Delete this file after testing — it's not part of the server.
"""
import asyncio
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))

# Load token from .mcp.json into env so server.py can see it.
with open(PROJECT_ROOT / ".mcp.json") as f:
    cfg = json.load(f)
os.environ["REPLICATE_API_TOKEN"] = cfg["mcpServers"]["replicate-image"]["env"][
    "REPLICATE_API_TOKEN"
]

from server import GenerateImageInput, replicate_generate_image  # noqa: E402


async def main() -> None:
    result = await replicate_generate_image(
        GenerateImageInput(
            prompt=(
                "a cat solving a physics problem at a chalkboard, "
                "equations visible, warm classroom lighting, illustrated style"
            ),
            filename_prefix="cat_physics",
        )
    )
    print(result)


asyncio.run(main())
