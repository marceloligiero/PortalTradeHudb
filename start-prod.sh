#!/usr/bin/env bash
# Start-production script for Portal Trade DataHub (Unix-like)
# What it does:
# - Loads .env and backend/.env into process environment (if present)
# - Builds the frontend (npm ci + npm run build) if frontend/package.json exists
# - Starts the backend using: python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
# - Writes backend logs to backend/prod.log and PID to backend/uvicorn.pid

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

load_dotenv() {
  local file="$1"
  if [[ -f "$file" ]]; then
    # shellcheck disable=SC1090
    set -o allexport
    # shellcheck disable=SC1090
    source "$file"
    set +o allexport
  fi
}

echo "Loading .env files (if any)..."
load_dotenv "$ROOT_DIR/.env"
load_dotenv "$ROOT_DIR/backend/.env"

if [[ -f "$ROOT_DIR/frontend/package.json" ]]; then
  echo "Building frontend..."
  pushd "$ROOT_DIR/frontend" >/dev/null
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
  popd >/dev/null
  echo "Frontend build finished."
else
  echo "No frontend/package.json found — skipping frontend build."
fi

echo "Starting backend (uvicorn)..."
pushd "$ROOT_DIR/backend" >/dev/null
LOGFILE="$(pwd)/prod.log"
PIDFILE="$(pwd)/uvicorn.pid"

nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info >> "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
echo "Backend started with PID $(cat $PIDFILE). Logs: $LOGFILE"
popd >/dev/null

echo "Production start sequence complete."
