#!/bin/bash
set -e

# NARI CLI wrapper for Linux

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
CLI="$ROOT/cli/nari.py"
PYTHON="$BACKEND/.venv/bin/python"

# Default UV cache directory if not set
if [ -z "$UV_CACHE_DIR" ]; then
    export UV_CACHE_DIR="/tmp/uv-cache-nari"
fi

# Ensure we are in the backend directory for path consistency
cd "$BACKEND"

# Try to use the virtual environment python if it exists
if [ -f "$PYTHON" ]; then
    "$PYTHON" "$CLI" "$@"
else
    # Fallback to uv run if venv isn't found
    uv run python "$CLI" "$@"
fi
