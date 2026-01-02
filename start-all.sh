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

# Define services to start and expose via cloudflared quick-tunnels.
# Format: name:host:port:workdir:start_cmd
# - name: used for log/pid filenames and tunnel naming
# - host: host to bind the service (usually 127.0.0.1)
# - port: port the service listens on
# - workdir: directory to run the start command in
# - start_cmd: shell command to start the service (should background with nohup here)
SERVICES=(
  # Backend must bind to 0.0.0.0 so it can be reached via the machine public IP
  "backend|0.0.0.0|$BACKEND_PORT|$BACKEND_DIR|.venv/bin/uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --log-level info"
  # Frontend uses vite --host (already binds 0.0.0.0 via vite.config)
  "frontend|0.0.0.0|$FRONTEND_PORT|$FRONTEND_DIR|npm run dev -- --host"
)

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
  # Kill any pid files created for services and their tunnels
  for svc in "${SERVICES[@]}"; do
    IFS="|" read -r name host port workdir cmd <<<"$svc"
    pid_file_kill "$LOGS/prod-${name}.pid"
    pid_file_kill "$LOGS/prod-${name}.tunnel.pid"
  done
  # Also remove any legacy pid files if present
  pid_file_kill "$LOGS/prod-backend.pid" || true
  pid_file_kill "$LOGS/prod-frontend.pid" || true
  # Remove any leftover cloudflared processes (we're no longer using tunnels)
  pkill -f cloudflared >/dev/null 2>&1 || true
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

# Helper: start a single service and its cloudflared quick-tunnel
start_service_and_tunnel() {
  local name="$1"
  local host="$2"
  local port="$3"
  local workdir="$4"
  local start_cmd="$5"

  local service_log="$LOGS/${name}-service.log"
  local service_pid="$LOGS/prod-${name}.pid"
  local tunnel_log=""
  local tunnel_pid=""

  echo "Starting service '$name' in $workdir..."
  mkdir -p "$workdir" || true
  pushd "$workdir" >/dev/null || true

  # Special-case common setup: backend venv and frontend npm install
  if [ "$name" = "backend" ]; then
    if [ ! -d ".venv" ]; then
      echo "Creating virtualenv for backend and installing requirements..."
      python3 -m venv .venv
      . .venv/bin/activate
      pip install --upgrade pip
      if [ -f requirements.txt ]; then
        pip install -r requirements.txt
      fi
    else
      . .venv/bin/activate
    fi
  fi

  if [ "$name" = "frontend" ]; then
    if [ ! -d node_modules ]; then
      echo "Installing frontend dependencies (npm)..."
      npm install
    fi
  fi
  # Start service
  # If this is frontend, detect public IP and pass it as DEV_PUBLIC_IP
  if [ "$name" = "frontend" ]; then
    PUB_IP=''
    # Try obtaining public IP (best-effort). Falls back to empty string.
    if command -v curl >/dev/null 2>&1; then
      PUB_IP=$(curl -s https://ifconfig.co || true)
    elif command -v wget >/dev/null 2>&1; then
      PUB_IP=$(wget -qO- https://ifconfig.co || true)
    fi
    if [ -n "$PUB_IP" ]; then
      echo "Detected public IP: $PUB_IP — passing to frontend as DEV_PUBLIC_IP"
    else
      echo "No public IP detected; frontend will start without DEV_PUBLIC_IP"
    fi
    nohup bash -c "DEV_PUBLIC_IP='$PUB_IP' $start_cmd" > "$service_log" 2>&1 &
  else
    nohup bash -c "$start_cmd" > "$service_log" 2>&1 &
  fi
  echo $! > "$service_pid"
  popd >/dev/null || true

  sleep 1
    # Start a cloudflared quick-tunnel so the service is reachable publicly
    # using Cloudflare's free "trycloudflare" quick tunnels. This requires
    # the `cloudflared` binary to be installed and on PATH.
    if command -v cloudflared >/dev/null 2>&1; then
      echo "Starting cloudflared quick tunnel for $name (-> $host:$port)..."
      tunnel_log="$LOGS/${name}-tunnel.log"
      tunnel_pid_file="$LOGS/prod-${name}.tunnel.pid"
      # Launch cloudflared quick tunnel in background and capture pid
      nohup cloudflared tunnel --url "http://$host:$port" > "$tunnel_log" 2>&1 &
      echo $! > "$tunnel_pid_file"
      # Wait a bit and try to extract the public URL from the tunnel log
      sleep 2
      TUNNEL_URL=$(grep -Eo 'https?://[^ ]+trycloudflare.com' "$tunnel_log" | head -n1 || true)
      if [ -n "$TUNNEL_URL" ]; then
        echo "Tunnel for $name available at: $TUNNEL_URL"
        echo "$TUNNEL_URL" > "$LOGS/${name}.tunnel.url"
      else
        # If we didn't capture the URL yet, tail the log for a short window
        timeout 6s bash -c "(while ! grep -Eo 'https?://[^ ]+trycloudflare.com' '$tunnel_log' >/dev/null 2>&1; do sleep 1; done)" 2>/dev/null || true
        TUNNEL_URL=$(grep -Eo 'https?://[^ ]+trycloudflare.com' "$tunnel_log" | head -n1 || true)
        if [ -n "$TUNNEL_URL" ]; then
          echo "Tunnel for $name available at: $TUNNEL_URL"
          echo "$TUNNEL_URL" > "$LOGS/${name}.tunnel.url"
        else
          echo "Started cloudflared for $name but did not detect public URL yet. Check $tunnel_log"
        fi
      fi
    else
      echo "cloudflared not found; skipping quick-tunnel for $name. Install cloudflared to enable public tunnels."
    fi
}

for svc in "${SERVICES[@]}"; do
  IFS="|" read -r name host port workdir cmd <<<"$svc"
  start_service_and_tunnel "$name" "$host" "$port" "$workdir" "$cmd"
done

sleep 2

echo "Started services. PIDs:" 
for svc in "${SERVICES[@]}"; do
  IFS="|" read -r name host port workdir cmd <<<"$svc"
  echo "  $name service: $(cat "$LOGS/prod-${name}.pid" 2>/dev/null || echo '-')"
done

echo
echo "Tail logs with: tail -f $LOGS/*-service.log"

exit 0
