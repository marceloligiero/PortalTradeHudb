#!/usr/bin/env bash
# Lightweight wrapper to the canonical `start-all.sh` at project root.
# This allows callers that still reference `scripts/start-all.sh` to work.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -x "$ROOT_DIR/start-all.sh" ]; then
  exec "$ROOT_DIR/start-all.sh" "$@"
else
  echo "start-all.sh not found at project root ($ROOT_DIR/start-all.sh)." >&2
  echo "Please run the script located at $(cd "$(dirname "$0")/.." && pwd)/start-all.sh" >&2
  exit 1
fi
