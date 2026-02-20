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

    # Ensure UPnP port mappings are active
    ensure_upnp_mappings()


def ensure_upnp_mappings():
    """Check and restore UPnP port mappings if they disappeared."""
    try:
        import miniupnpc
    except ImportError:
        return

    try:
        u = miniupnpc.UPnP()
        u.discoverdelay = 200
        u.discover()
        u.selectigd()

        required = [
            (8443, "TradeHub HTTPS"),
            (8000, "TradeHub HTTP"),
            (9000, "TradeHub Webhook"),
            (3389, "TradeHub RDP"),
            (5985, "WinRM HTTP"),
            (5986, "WinRM HTTPS"),
        ]

        # Get existing mappings
        existing_ports = set()
        i = 0
        while True:
            p = u.getgenericportmapping(i)
            if p is None:
                break
            existing_ports.add(p[0])
            i += 1

        restored = False
        for port, name in required:
            if port not in existing_ports:
                try:
                    u.addportmapping(port, "TCP", "192.168.1.93", port, name, "")
                    log(f"  UPnP: Restored port {port} ({name})")
                    restored = True
                except Exception as e:
                    log(f"  UPnP: Failed to restore port {port}: {e}")

        if restored:
            log("UPnP port mappings restored by watchdog.")

        # Also update DuckDNS if IP changed
        import socket
        ext_ip = u.externalipaddress()
        try:
            dns_ip = socket.gethostbyname("portalformacoes.duckdns.org")
            if ext_ip != dns_ip:
                import urllib.request
                url = f"https://www.duckdns.org/update?domains=portalformacoes&token=97ca3d82-a186-4c2b-b589-8818069678d6&ip={ext_ip}"
                urllib.request.urlopen(url, timeout=10)
                log(f"  DuckDNS: Updated IP from {dns_ip} to {ext_ip}")
        except Exception as e:
            log(f"  DuckDNS check error: {e}")

    except Exception as e:
        log(f"  UPnP check error: {e}")


if __name__ == "__main__":
    main()
