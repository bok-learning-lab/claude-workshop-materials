#!/usr/bin/env bash
# Idempotent setup for the replicate_image MCP server.
# Safe to run multiple times — skips work that's already done.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HERE/.venv"
REQS="$HERE/requirements.txt"
PYTHON_BIN="$VENV/bin/python"

# 1. Need a real python3.
if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found on PATH. Install Python 3.10+ and retry." >&2
  exit 1
fi

# 2. Create venv if missing.
if [ ! -x "$PYTHON_BIN" ]; then
  echo "[setup] Creating venv at $VENV"
  python3 -m venv "$VENV"
else
  echo "[setup] Venv already exists at $VENV — skipping create."
fi

# 3. Install / upgrade deps.
echo "[setup] Installing dependencies from $REQS"
"$PYTHON_BIN" -m pip install --quiet --upgrade pip
"$PYTHON_BIN" -m pip install --quiet -r "$REQS"

# 4. Sanity check.
echo "[setup] Verifying imports..."
"$PYTHON_BIN" -c "import mcp, replicate, pydantic; print(f'  mcp={mcp.__version__ if hasattr(mcp,\"__version__\") else \"ok\"}, replicate={replicate.__version__ if hasattr(replicate,\"__version__\") else \"ok\"}, pydantic={pydantic.VERSION}')"

echo "[setup] Done. Restart Claude Code (or /mcp reconnect) to load the server."
