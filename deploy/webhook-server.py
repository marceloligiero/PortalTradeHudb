"""
GitHub Webhook Auto-Deploy Server
Listens for push events from GitHub and auto-deploys the application.

Usage:
    python webhook-server.py [--port 9000] [--secret YOUR_SECRET]

The server listens on the specified port for GitHub webhook POST requests.
When a push to 'main' branch is detected, it:
  1. Pulls the latest code from GitHub
  2. Installs any new backend dependencies
  3. Rebuilds the frontend
  4. Restarts the backend servers
"""

import http.server
import json
import hmac
import hashlib
import subprocess
import sys
import os
import logging
import threading
import time
from pathlib import Path

# Configuration
PORT = int(os.environ.get("WEBHOOK_PORT", 9000))
SECRET = os.environ.get("WEBHOOK_SECRET", "tradehub-deploy-2024")
PROJECT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_DIR / "backend"
FRONTEND_DIR = PROJECT_DIR / "frontend"
PYTHON_EXE = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
SSL_DIR = PROJECT_DIR / "ssl" / "letsencrypt"
NPM_CMD = r"C:\Program Files\nodejs\npm.cmd"
GIT_CMD = r"C:\Program Files\Git\cmd\git.exe"
LOG_FILE = PROJECT_DIR / "deploy" / "deploy.log"

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("webhook")

# Lock to prevent concurrent deployments
deploy_lock = threading.Lock()


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the GitHub webhook HMAC-SHA256 signature."""
    if not SECRET:
        return True  # No secret configured, skip verification
    if not signature or not signature.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(
        SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def run_command(cmd: list[str], cwd: str = None, timeout: int = 300) -> tuple[int, str]:
    """Run a command and return (returncode, output)."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or str(PROJECT_DIR),
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        output = result.stdout + result.stderr
        return result.returncode, output
    except subprocess.TimeoutExpired:
        return -1, f"Command timed out after {timeout}s"
    except Exception as e:
        return -1, str(e)


def deploy():
    """Execute the full deployment pipeline."""
    if not deploy_lock.acquire(blocking=False):
        logger.warning("Deploy already in progress, skipping.")
        return False

    try:
        logger.info("=" * 60)
        logger.info("DEPLOYMENT STARTED")
        logger.info("=" * 60)
        start = time.time()

        # Step 1: Git pull
        logger.info("[1/4] Pulling latest code from GitHub...")
        code, output = run_command([GIT_CMD, "pull", "origin", "main"])
        logger.info(f"  git pull: exit={code}")
        if output.strip():
            logger.info(f"  {output.strip()[:500]}")
        if code != 0:
            logger.error("Git pull failed! Aborting deployment.")
            return False

        if "Already up to date" in output:
            logger.info("  No changes detected. Skipping build/restart.")
            return True

        # Step 2: Install backend dependencies (if requirements changed)
        logger.info("[2/4] Checking backend dependencies...")
        code, output = run_command(
            [str(PYTHON_EXE), "-m", "pip", "install", "-r", "requirements.txt", "--quiet"],
            cwd=str(BACKEND_DIR),
        )
        logger.info(f"  pip install: exit={code}")

        # Step 3: Rebuild frontend
        logger.info("[3/4] Rebuilding frontend...")
        code, output = run_command(
            [NPM_CMD, "install", "--silent"],
            cwd=str(FRONTEND_DIR),
            timeout=120,
        )
        logger.info(f"  npm install: exit={code}")

        code, output = run_command(
            [NPM_CMD, "run", "build"],
            cwd=str(FRONTEND_DIR),
            timeout=180,
        )
        logger.info(f"  npm build: exit={code}")
        if code != 0:
            logger.error(f"Frontend build failed!\n{output[:1000]}")
            return False
        logger.info("  Frontend built successfully.")

        # Step 4: Restart backend servers
        logger.info("[4/4] Restarting backend servers...")

        # Kill existing Python server processes
        code, _ = run_command(
            ["powershell", "-Command",
             "Get-Process python* -ErrorAction SilentlyContinue | "
             "Where-Object { $_.Id -ne $PID } | "
             "Stop-Process -Force -ErrorAction SilentlyContinue"],
        )
        time.sleep(3)

        # Start HTTPS server (port 8443)
        ssl_key = str(SSL_DIR / "portalformacoes.duckdns.org-key.pem")
        ssl_cert = str(SSL_DIR / "portalformacoes.duckdns.org-chain.pem")
        subprocess.Popen(
            [str(PYTHON_EXE), "-m", "uvicorn", "main:app",
             "--host", "0.0.0.0", "--port", "8443",
             "--ssl-keyfile", ssl_key, "--ssl-certfile", ssl_cert,
             "--workers", "2"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Start HTTP server (port 8000)
        subprocess.Popen(
            [str(PYTHON_EXE), "-m", "uvicorn", "main:app",
             "--host", "0.0.0.0", "--port", "8000",
             "--workers", "2"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        time.sleep(5)
        elapsed = time.time() - start
        logger.info(f"DEPLOYMENT COMPLETED in {elapsed:.1f}s")
        logger.info("=" * 60)
        return True

    except Exception as e:
        logger.error(f"Deployment error: {e}")
        return False
    finally:
        deploy_lock.release()


class WebhookHandler(http.server.BaseHTTPRequestHandler):
    """Handle GitHub webhook POST requests."""

    def do_GET(self):
        """Health check endpoint."""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "webhook server running"}).encode())

    def do_POST(self):
        """Process GitHub webhook."""
        content_length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(content_length)

        # Verify signature
        signature = self.headers.get("X-Hub-Signature-256", "")
        if not verify_signature(payload, signature):
            logger.warning(f"Invalid signature from {self.client_address[0]}")
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Invalid signature")
            return

        # Parse event
        event = self.headers.get("X-GitHub-Event", "")
        if event == "ping":
            logger.info("Received ping from GitHub - webhook configured correctly!")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"pong")
            return

        if event != "push":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"Ignored event: {event}".encode())
            return

        # Parse push data
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid JSON")
            return

        ref = data.get("ref", "")
        branch = ref.replace("refs/heads/", "")

        if branch != "main":
            logger.info(f"Push to {branch} ignored (only main triggers deploy)")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"Ignored push to {branch}".encode())
            return

        pusher = data.get("pusher", {}).get("name", "unknown")
        commits = len(data.get("commits", []))
        logger.info(f"Push to main by {pusher} ({commits} commits) - starting deploy...")

        # Respond immediately, deploy in background
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "deploying"}).encode())

        # Deploy in background thread
        threading.Thread(target=deploy, daemon=True).start()

    def log_message(self, format, *args):
        """Suppress default HTTP access logs."""
        pass


def main():
    server = http.server.HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    logger.info(f"Webhook server listening on port {PORT}")
    logger.info(f"Configure GitHub webhook URL: http://YOUR_IP:{PORT}/")
    logger.info(f"Webhook secret: {SECRET}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Webhook server stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
