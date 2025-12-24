#!/usr/bin/env bash
set -euo pipefail

# Single entrypoint to start the project (backend, frontend, cloudflared tunnels)
# Usage:
#   ./start-all.sh        # start all
#   ./start-all.sh stop   # stop all processes started by this script
#   ./start-all.sh restart

# Determine script dir and project root. Works when script is in project root or in scripts/
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$(basename "$SCRIPT_DIR")" = "scripts" ]; then
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  ROOT="$SCRIPT_DIR"
fi

LOGS="$ROOT/logs"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

FRONTEND_PORT=5173
BACKEND_PORT=8000

mkdir -p "$LOGS"

pid_file_kill() {
  local pf="$1"
  if [ -f "$pf" ]; then
    local pid
    pid=$(cat "$pf" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Killing pid $pid (from $pf)"
      kill "$pid" 2>/dev/null || true
      sleep 1
    fi
    rm -f "$pf"
  fi
}

stop_all() {
  pid_file_kill "$LOGS/prod-backend.pid"
  pid_file_kill "$LOGS/prod-frontend.pid"
  pid_file_kill "$LOGS/cloudflared-backend.pid"
  pid_file_kill "$LOGS/cloudflared-frontend.pid"
  echo "Stopped processes and removed pid files."
}

case "${1:-}" in
  stop)
    stop_all
    exit 0
    ;;
  restart)
    stop_all
    ;;
  "")
    ;;
  *)
    echo "Unknown command: $1" >&2
    echo "Usage: $0 [stop|restart]" >&2
    exit 2
    ;;
esac

echo "Starting backend..."
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
  echo "Creating virtualenv and installing requirements..."
  python3 -m venv .venv
  . .venv/bin/activate
  pip install --upgrade pip
  if [ -f requirements.txt ]; then
    pip install -r requirements.txt
  fi
else
  . .venv/bin/activate
fi

nohup .venv/bin/uvicorn main:app --host 127.0.0.1 --port $BACKEND_PORT --log-level info > "$LOGS/backend-uvicorn.log" 2>&1 &
echo $! > "$LOGS/prod-backend.pid"

echo "Starting frontend..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies (npm)..."
  npm install
fi
nohup npm run dev -- --host > "$LOGS/frontend-vite.log" 2>&1 &
echo $! > "$LOGS/prod-frontend.pid"

echo "Starting cloudflared tunnels (quick tunnels)..."
cd "$ROOT"
nohup cloudflared tunnel --url "http://127.0.0.1:$BACKEND_PORT" > "$LOGS/cloudflared-backend.log" 2>&1 &
echo $! > "$LOGS/cloudflared-backend.pid"
nohup cloudflared tunnel --url "http://127.0.0.1:$FRONTEND_PORT" > "$LOGS/cloudflared-frontend.log" 2>&1 &
echo $! > "$LOGS/cloudflared-frontend.pid"

sleep 2

echo "Started. PIDs:"
echo "  Backend: $(cat "$LOGS/prod-backend.pid" 2>/dev/null || echo '-')"
echo "  Frontend: $(cat "$LOGS/prod-frontend.pid" 2>/dev/null || echo '-')"
echo "  Cloudflared backend: $(cat "$LOGS/cloudflared-backend.pid" 2>/dev/null || echo '-')"
echo "  Cloudflared frontend: $(cat "$LOGS/cloudflared-frontend.pid" 2>/dev/null || echo '-')"

echo
echo "Tail logs with: tail -f $LOGS/backend-uvicorn.log $LOGS/frontend-vite.log $LOGS/cloudflared-backend.log $LOGS/cloudflared-frontend.log"

exit 0
