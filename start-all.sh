#!/usr/bin/env bash
# Start backend and frontend in development mode (UNIX-like systems)
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Portal Trade DataHub (backend + frontend)"

cd "$ROOT_DIR/backend" || exit 1
if command -v python >/dev/null 2>&1; then
  echo "Starting backend (uvicorn)"
  nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > "$ROOT_DIR/backend.log" 2>&1 &
  echo "Backend PID: $!"
else
  echo "Python not found in PATH"
fi

cd "$ROOT_DIR/frontend" || exit 1
if command -v npm >/dev/null 2>&1; then
  echo "Starting frontend (vite)"
  nohup npm run dev > "$ROOT_DIR/frontend.log" 2>&1 &
  echo "Frontend PID: $!"
else
  echo "npm not found in PATH"
fi

echo "Start commands issued. Check backend.log and frontend.log for output."
