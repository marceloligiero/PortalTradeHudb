#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"

echo "Starting production services from $REPO_ROOT"

# Determine host IP on LAN
HOST_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ {print $7; exit}')"
if [ -z "$HOST_IP" ]; then
  HOST_IP="127.0.0.1"
fi

# Backend: use gunicorn + uvicorn workers
if [ -d "$REPO_ROOT/backend" ]; then
  echo "Preparing backend..."
  pushd "$REPO_ROOT/backend" >/dev/null
  PY="$REPO_ROOT/backend/.venv/bin/python"
  PIP="$REPO_ROOT/backend/.venv/bin/pip"
  GUNICORN_BIN="$REPO_ROOT/backend/.venv/bin/gunicorn"

  if [ ! -x "$PY" ]; then
    echo "Virtualenv not found; creating..."
    python3 -m venv .venv
  fi

  # ensure pip upgraded and gunicorn installed
  "$PY" -m pip install --upgrade pip setuptools wheel
  "$PIP" install --upgrade gunicorn uvicorn

  echo "Starting Gunicorn (Uvicorn workers) on 0.0.0.0:8000"
  nohup "$GUNICORN_BIN" -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000 main:app --chdir "$REPO_ROOT/backend" > "$LOG_DIR/prod-backend.log" 2>&1 &
  echo $! > "$LOG_DIR/prod-backend.pid"
  popd >/dev/null
else
  echo "No backend directory found; skipping backend start." >&2
fi

# Frontend: build and serve static files
if [ -d "$REPO_ROOT/frontend" ]; then
  echo "Preparing frontend..."
  pushd "$REPO_ROOT/frontend" >/dev/null
  if command -v npm >/dev/null 2>&1; then
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund
    echo "Building frontend (vite build)"
    npm run build
    # serve built files on port 5173 using npx serve
    echo "Serving frontend on 0.0.0.0:5173"
    nohup npx --yes serve -s dist -l 5173 > "$LOG_DIR/prod-frontend.log" 2>&1 &
    echo $! > "$LOG_DIR/prod-frontend.pid"
  else
    echo "npm not found; cannot build/serve frontend" >&2
  fi
  popd >/dev/null
else
  echo "No frontend directory found; skipping frontend start." 
fi

sleep 1

echo "Production services started. Access locally:"
echo "- Backend: http://$HOST_IP:8000" 
echo "- Frontend: http://$HOST_IP:5173"
echo "Logs: $LOG_DIR (prod-*.log)
PIDs: $LOG_DIR/prod-*-pid"
