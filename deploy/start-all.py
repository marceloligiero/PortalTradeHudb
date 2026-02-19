"""
TradeHub Start All Services
Starts MySQL, Backend (HTTPS + HTTP), and Webhook server.
Used by Windows Scheduled Task at boot.
"""
import subprocess
import time
import os
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_DIR / "backend"
PYTHON_EXE = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
SSL_DIR = PROJECT_DIR / "ssl" / "letsencrypt"
MYSQL_BIN = Path(r"C:\wamp64\bin\mysql\mysql9.1.0\bin")
MYSQL_INI = Path(r"C:\wamp64\bin\mysql\mysql9.1.0\my.ini")
LOG_FILE = PROJECT_DIR / "deploy" / "startup.log"

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except:
        pass

def is_port_open(port):
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            s.connect(("127.0.0.1", port))
            return True
    except:
        return False

def start_mysql():
    log("Starting MySQL...")
    # Check if already running
    result = subprocess.run(
        [str(MYSQL_BIN / "mysql.exe"), "-u", "root", "-pTradeHub2024!", "-e", "SELECT 1"],
        capture_output=True, timeout=10
    )
    if result.returncode == 0:
        log("  MySQL already running.")
        return True
    
    subprocess.Popen(
        [str(MYSQL_BIN / "mysqld.exe"), f"--defaults-file={MYSQL_INI}"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    for i in range(30):
        time.sleep(1)
        result = subprocess.run(
            [str(MYSQL_BIN / "mysql.exe"), "-u", "root", "-pTradeHub2024!", "-e", "SELECT 1"],
            capture_output=True, timeout=10
        )
        if result.returncode == 0:
            log("  MySQL started.")
            return True
    log("  ERROR: MySQL failed to start!")
    return False

def start_backend():
    ssl_key = str(SSL_DIR / "portalformacoes.duckdns.org-key.pem")
    ssl_cert = str(SSL_DIR / "portalformacoes.duckdns.org-chain.pem")

    # HTTPS 8443
    if not is_port_open(8443):
        log("Starting HTTPS server on port 8443...")
        subprocess.Popen(
            [str(PYTHON_EXE), "-m", "uvicorn", "main:app",
             "--host", "0.0.0.0", "--port", "8443",
             "--ssl-keyfile", ssl_key, "--ssl-certfile", ssl_cert,
             "--workers", "2"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    else:
        log("  HTTPS 8443 already running.")

    # HTTP 8000
    if not is_port_open(8000):
        log("Starting HTTP server on port 8000...")
        subprocess.Popen(
            [str(PYTHON_EXE), "-m", "uvicorn", "main:app",
             "--host", "0.0.0.0", "--port", "8000",
             "--workers", "2"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    else:
        log("  HTTP 8000 already running.")

def start_webhook():
    if not is_port_open(9000):
        log("Starting Webhook server on port 9000...")
        subprocess.Popen(
            [str(PYTHON_EXE), str(PROJECT_DIR / "deploy" / "webhook-server.py")],
            cwd=str(PROJECT_DIR),
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    else:
        log("  Webhook 9000 already running.")

def main():
    log("=" * 50)
    log("TRADEHUB STARTUP")
    log("=" * 50)

    start_mysql()
    start_backend()
    start_webhook()

    time.sleep(5)

    # Verify
    services = {8443: "HTTPS", 8000: "HTTP", 9000: "Webhook"}
    all_ok = True
    for port, name in services.items():
        ok = is_port_open(port)
        status = "OK" if ok else "FAILED"
        log(f"  {name} (:{port}): {status}")
        if not ok:
            all_ok = False

    if all_ok:
        log("All services started successfully!")
    else:
        log("WARNING: Some services failed to start.")
    log("=" * 50)

if __name__ == "__main__":
    main()
