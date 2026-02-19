"""
TradeHub Watchdog - monitors and restarts services if they go down.
Runs every minute via Windows Scheduled Task.
"""
import socket
import subprocess
import time
import os
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_DIR / "backend"
PYTHON_EXE = str(BACKEND_DIR / "venv" / "Scripts" / "python.exe")
SSL_DIR = PROJECT_DIR / "ssl" / "letsencrypt"
LOG_FILE = PROJECT_DIR / "deploy" / "watchdog.log"

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except:
        pass

def is_port_open(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            s.connect(("127.0.0.1", port))
            return True
    except:
        return False

def start_service(name, args, cwd=None):
    log(f"  Restarting {name}...")
    try:
        subprocess.Popen(
            args,
            cwd=cwd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP
        )
        return True
    except Exception as e:
        log(f"  ERROR starting {name}: {e}")
        return False

def main():
    ssl_key = str(SSL_DIR / "portalformacoes.duckdns.org-key.pem")
    ssl_cert = str(SSL_DIR / "portalformacoes.duckdns.org-chain.pem")

    restarted = False

    # Check HTTPS 8443
    if not is_port_open(8443):
        start_service("HTTPS:8443", [
            PYTHON_EXE, "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0", "--port", "8443",
            "--ssl-keyfile", ssl_key, "--ssl-certfile", ssl_cert,
            "--workers", "2"
        ], cwd=str(BACKEND_DIR))
        restarted = True

    # Check HTTP 8000
    if not is_port_open(8000):
        start_service("HTTP:8000", [
            PYTHON_EXE, "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0", "--port", "8000",
            "--workers", "2"
        ], cwd=str(BACKEND_DIR))
        restarted = True

    # Check Webhook 9000
    if not is_port_open(9000):
        start_service("Webhook:9000", [
            PYTHON_EXE, str(PROJECT_DIR / "deploy" / "webhook-server.py")
        ], cwd=str(PROJECT_DIR))
        restarted = True

    if restarted:
        log("Services restarted by watchdog.")

if __name__ == "__main__":
    main()
