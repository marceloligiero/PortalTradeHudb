#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"

echo "Repo root: $REPO_ROOT"

# Stop existing services (best-effort)
echo "Stopping existing uvicorn/node processes (if any)"
pkill -f uvicorn || true
pkill -f "node .*vite" || true

# Backend
if [ ! -d "$REPO_ROOT/backend" ]; then
  echo "Error: backend folder not found" >&2
  exit 1
fi

pushd "$REPO_ROOT/backend" >/dev/null
PYTHON_CMD="$(command -v python3 || command -v python || true)"
if [ -z "$PYTHON_CMD" ]; then
  echo "Python not found. Install Python 3.10+ and try again." >&2
  exit 1
fi

# create venv
if [ ! -d ".venv" ]; then
  echo "Creating virtualenv .venv"
  $PYTHON_CMD -m venv .venv
fi

# activate
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel

REQ_FILE="requirements-dev.txt"
if [ ! -f "$REQ_FILE" ]; then
  REQ_FILE="requirements.txt"
fi
if [ ! -f "$REQ_FILE" ]; then
  echo "No requirements file found (requirements-dev.txt or requirements.txt). Exiting." >&2
  deactivate || true
  popd >/dev/null
  exit 1
fi

echo "Installing backend dependencies from $REQ_FILE (this may take a while)"
pip install --prefer-binary -r "$REQ_FILE"

# Ensure .env has SQLite DATABASE_URL for local dev
ENV_FILE="$REPO_ROOT/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env with SQLite DATABASE_URL"
  echo "DATABASE_URL=sqlite:///./dev.db" > "$ENV_FILE"
  echo "SECRET_KEY=$(python - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
)" >> "$ENV_FILE"
else
  if ! grep -q '^DATABASE_URL=' "$ENV_FILE"; then
    echo "Appending SQLite DATABASE_URL to existing .env"
    echo "DATABASE_URL=sqlite:///./dev.db" >> "$ENV_FILE"
  fi
  if ! grep -q '^SECRET_KEY=' "$ENV_FILE"; then
    echo "Appending SECRET_KEY to existing .env"
    echo "SECRET_KEY=$(python - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
)" >> "$ENV_FILE"
  fi
fi

# Start backend (uvicorn)
echo "Starting backend (uvicorn) on 0.0.0.0:8000"
nohup .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Keep venv active context but popd to repo root for frontend
deactivate || true
popd >/dev/null

# Frontend
if [ -d "$REPO_ROOT/frontend" ]; then
  echo "Starting frontend (Vite)"
  pushd "$REPO_ROOT/frontend" >/dev/null
  if command -v npm >/dev/null 2>&1; then
    npm install --no-audit --no-fund || true
    # Run dev server bound to 0.0.0.0
    nohup npm run dev -- --host 0.0.0.0 > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
  else
    echo "npm not found. Skipping frontend start." >&2
  fi
  popd >/dev/null
else
  echo "No frontend folder detected; skipping frontend." 
fi

# Optionally try to expose via localtunnel if npm available
if command -v npx >/dev/null 2>&1; then
  echo "Attempting to create public tunnels with localtunnel (npx localtunnel). This may take a moment."
  # Start backend tunnel
  (npx --yes localtunnel --port 8000 > "$LOG_DIR/lt-backend.out" 2>&1 &) || true
  # Start frontend tunnel if frontend was started
  if [ -d "$REPO_ROOT/frontend" ]; then
    (npx --yes localtunnel --port 5173 > "$LOG_DIR/lt-frontend.out" 2>&1 &) || true
  fi
  echo "Localtunnel started in background; URLs (if any) are in $LOG_DIR/lt-*.out"
else
  echo "npx not found; skipping automatic public tunnel creation. To expose, install localtunnel or ngrok and run manually."
fi

echo "Logs: $LOG_DIR"

echo "DONE"
