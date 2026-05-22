# replicate_image_mcp

A small MCP server that wraps Replicate's image-generation API. Generated
images land in `<project_root>/output/` by default.

## Tools

- `replicate_generate_image` — Prompt → image file(s). Defaults to `black-forest-labs/flux-schnell`.
- `replicate_run_model` — Run any Replicate model with an arbitrary `input` dict; auto-saves file outputs.
- `replicate_get_model` — Fetch a model's description + input schema (use before `run_model`).
- `replicate_get_prediction` — Look up a prediction by id.

## Setup (faculty: read this)

The only thing you need to do by hand is paste your Replicate API token.

1. Get a token at <https://replicate.com/account/api-tokens>.
2. Open `.mcp.json` at the repo root in your editor. Replace
   `r8_REPLACE_WITH_YOUR_TOKEN` with your real token. Save.
3. Open Claude Code in this repo.
4. Claude will notice the Python environment isn't set up yet and offer to
   create it for you. If it doesn't proactively, just say:
   > Set up the replicate MCP server.
5. When Claude says it's done, restart Claude Code (close and reopen) so the
   new server is picked up.

That's it. No terminal commands required.

## What's happening under the hood

- `setup.sh` (in this folder) is an idempotent script. It creates a Python
  virtual environment at `_mcp/replicate_image/.venv/`, installs `mcp`,
  `replicate`, and `pydantic`, and runs a quick sanity check.
- `.mcp.json` at the repo root tells Claude Code where to find the server's
  Python and `server.py`. Your token is stored there. The file is gitignored,
  so it won't be committed.
- When Claude Code starts a session, it launches `server.py` as a subprocess
  using the venv's Python. The subprocess lives only for that session.

## Manual setup (if you prefer the terminal)

```bash
cd _mcp/replicate_image
bash setup.sh
```

## Troubleshooting

- **"replicate-image" doesn't appear in `/mcp`.** Make sure `.mcp.json`
  exists (copy from `.mcp.json.example` if not), has a real token in it, and
  that `_mcp/replicate_image/.venv/bin/python` exists. Then restart Claude
  Code.
- **"Authentication failed."** The token in `.mcp.json` is wrong or expired.
  Regenerate at <https://replicate.com/account/api-tokens>.
- **Hot-reload doesn't work after editing `server.py`.** Restart Claude
  Code (or `/mcp reconnect`). The subprocess doesn't pick up file changes.
