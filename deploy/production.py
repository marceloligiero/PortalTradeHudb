"""
TradeHub Production Manager
============================
Unified script for all production operations:
  - start   : Start all services (MySQL, HTTPS:8443, HTTP:8000, Webhook:9000)
  - stop    : Stop all services
  - restart : Stop + Start
  - status  : Show status of all services
  - watchdog: Check and restart dead services + UPnP + DuckDNS (for scheduled task)

Usage:
    python production.py start
    python production.py stop
    python production.py restart
    python production.py status
    python production.py watchdog

Scheduled Tasks:
    - Boot:      python production.py start
    - Every min: python production.py watchdog
"""

import subprocess
import socket
import time
import os
import sys
import signal
from pathlib import Path

# ============================================================
# Configuration
# ============================================================
PROJECT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_DIR / "backend"
PYTHON_EXE = str(BACKEND_DIR / "venv" / "Scripts" / "python.exe")
SSL_DIR = PROJECT_DIR / "ssl" / "letsencrypt"
SSL_KEY = str(SSL_DIR / "portalformacoes.duckdns.org-key.pem")
SSL_CERT = str(SSL_DIR / "portalformacoes.duckdns.org-chain.pem")
MYSQL_BIN = Path(r"C:\wamp64\bin\mysql\mysql9.1.0\bin")
MYSQL_INI = Path(r"C:\wamp64\bin\mysql\mysql9.1.0\my.ini")
WEBHOOK_SCRIPT = str(PROJECT_DIR / "deploy" / "webhook-server.py")
LOG_FILE = PROJECT_DIR / "deploy" / "production.log"

MYSQL_USER = "root"
MYSQL_PASS = "TradeHub2024!"
LOCAL_IP = "192.168.1.93"

DUCKDNS_DOMAIN = "portalformacoes"
DUCKDNS_TOKEN = "97ca3d82-a186-4c2b-b589-8818069678d6"

# Services: (port, name, start_args, working_dir)
SERVICES = {
    8443: {
        "name": "HTTPS Backend",
        "args": [PYTHON_EXE, "-m", "uvicorn", "main:app",
                 "--host", "0.0.0.0", "--port", "8443",
                 "--ssl-keyfile", SSL_KEY, "--ssl-certfile", SSL_CERT,
                 "--workers", "2"],
        "cwd": str(BACKEND_DIR),
    },
    8000: {
        "name": "HTTP Backend",
        "args": [PYTHON_EXE, "-m", "uvicorn", "main:app",
                 "--host", "0.0.0.0", "--port", "8000",
                 "--workers", "2"],
        "cwd": str(BACKEND_DIR),
    },
    9000: {
        "name": "Webhook Server",
        "args": [PYTHON_EXE, WEBHOOK_SCRIPT],
        "cwd": str(PROJECT_DIR),
    },
}

# UPnP port mappings to maintain
UPNP_MAPPINGS = [
    (8443, "TradeHub HTTPS"),
    (8000, "TradeHub HTTP"),
    (9000, "TradeHub Webhook"),
    (3389, "TradeHub RDP"),
    (5985, "WinRM HTTP"),
    (5986, "WinRM HTTPS"),
]

CREATE_FLAGS = 0x08000000 | 0x00000200  # CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP


# ============================================================
# Logging
# ============================================================
def log(msg, print_too=True):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    if print_too:
        print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


# ============================================================
# Helpers
# ============================================================
def is_port_open(port: int) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            s.connect(("127.0.0.1", port))
            return True
    except Exception:
        return False


def is_mysql_running() -> bool:
    try:
        result = subprocess.run(
            [str(MYSQL_BIN / "mysql.exe"), "-u", MYSQL_USER,
             f"-p{MYSQL_PASS}", "-e", "SELECT 1"],
            capture_output=True, timeout=10
        )
        return result.returncode == 0
    except Exception:
        return False


def get_python_pids():
    """Return dict of {pid: command_line} for all running python processes."""
    pids = {}
    try:
        import wmi
        c = wmi.WMI()
        for proc in c.Win32_Process(Name="python.exe"):
            pids[proc.ProcessId] = proc.CommandLine or ""
    except ImportError:
        # Fallback without wmi module
        result = subprocess.run(
            ["wmic", "process", "where", "Name='python.exe'",
             "get", "ProcessId,CommandLine", "/format:csv"],
            capture_output=True, text=True, timeout=10
        )
        for line in result.stdout.strip().split("\n"):
            parts = line.strip().split(",")
            if len(parts) >= 3 and parts[-1].strip().isdigit():
                pid = int(parts[-1].strip())
                cmdline = ",".join(parts[1:-1])
                pids[pid] = cmdline
    return pids


# ============================================================
# START
# ============================================================
def cmd_start():
    log("=" * 60)
    log("TRADEHUB PRODUCTION - STARTING ALL SERVICES")
    log("=" * 60)

    # 1. MySQL
    if not is_mysql_running():
        log("[1/4] Starting MySQL...")
        subprocess.Popen(
            [str(MYSQL_BIN / "mysqld.exe"), f"--defaults-file={MYSQL_INI}"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=CREATE_FLAGS
        )
        for i in range(30):
            time.sleep(1)
            if is_mysql_running():
                log("  MySQL started.")
                break
        else:
            log("  ERROR: MySQL failed to start after 30s!")
    else:
        log("[1/4] MySQL already running.")

    # 2-4. App services
    step = 2
    for port, svc in SERVICES.items():
        if not is_port_open(port):
            log(f"[{step}/4] Starting {svc['name']} on port {port}...")
            subprocess.Popen(
                svc["args"],
                cwd=svc["cwd"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=CREATE_FLAGS
            )
        else:
            log(f"[{step}/4] {svc['name']} (:{port}) already running.")
        step += 1

    # Wait and verify
    time.sleep(5)
    log("-" * 40)
    all_ok = True
    for port, svc in SERVICES.items():
        ok = is_port_open(port)
        status = "OK" if ok else "FAILED"
        log(f"  {svc['name']} (:{port}): {status}")
        if not ok:
            all_ok = False

    mysql_ok = is_mysql_running()
    log(f"  MySQL (:{3306}): {'OK' if mysql_ok else 'FAILED'}")

    if all_ok and mysql_ok:
        log("All services started successfully!")
    else:
        log("WARNING: Some services failed to start.")
    log("=" * 60)

    # Ensure UPnP mappings
    ensure_upnp_mappings()
    ensure_duckdns()


# ============================================================
# STOP
# ============================================================
def cmd_stop():
    log("=" * 60)
    log("TRADEHUB PRODUCTION - STOPPING ALL SERVICES")
    log("=" * 60)

    my_pid = os.getpid()
    pids = get_python_pids()

    # Kill uvicorn and webhook processes
    killed = 0
    for pid, cmdline in pids.items():
        if pid == my_pid:
            continue
        if "uvicorn" in cmdline or "webhook-server" in cmdline:
            try:
                os.kill(pid, signal.SIGTERM)
                log(f"  Stopped PID {pid}: {cmdline[:80]}")
                killed += 1
            except Exception:
                pass

    # Stop MySQL gracefully
    log("  Stopping MySQL...")
    try:
        subprocess.run(
            [str(MYSQL_BIN / "mysqladmin.exe"), "-u", MYSQL_USER,
             f"-p{MYSQL_PASS}", "shutdown"],
            capture_output=True, timeout=15
        )
        log("  MySQL stopped.")
    except Exception as e:
        log(f"  MySQL stop error: {e}")

    time.sleep(2)
    log(f"Stopped {killed} Python processes + MySQL.")
    log("=" * 60)


# ============================================================
# RESTART
# ============================================================
def cmd_restart():
    cmd_stop()
    time.sleep(3)
    cmd_start()


# ============================================================
# STATUS
# ============================================================
def cmd_status():
    print("=" * 50)
    print("  TRADEHUB PRODUCTION STATUS")
    print("=" * 50)

    # MySQL
    mysql_ok = is_mysql_running()
    print(f"  MySQL      (:{3306}):  {'RUNNING' if mysql_ok else 'STOPPED'}")

    # App services
    for port, svc in SERVICES.items():
        ok = is_port_open(port)
        print(f"  {svc['name']:15s} (:{port}):  {'RUNNING' if ok else 'STOPPED'}")

    # UPnP
    try:
        import miniupnpc
        u = miniupnpc.UPnP()
        u.discoverdelay = 200
        u.discover()
        u.selectigd()
        ext_ip = u.externalipaddress()
        print(f"\n  Public IP:   {ext_ip}")

        dns_ip = socket.gethostbyname("portalformacoes.duckdns.org")
        dns_match = "OK" if ext_ip == dns_ip else f"MISMATCH (DNS={dns_ip})"
        print(f"  DuckDNS IP:  {dns_ip} [{dns_match}]")

        # Check mappings
        existing = set()
        i = 0
        while True:
            p = u.getgenericportmapping(i)
            if p is None:
                break
            existing.add(p[0])
            i += 1

        print(f"\n  UPnP Port Mappings:")
        for port, name in UPNP_MAPPINGS:
            status = "ACTIVE" if port in existing else "MISSING"
            print(f"    {port:5d} ({name:20s}): {status}")
    except ImportError:
        print("\n  UPnP: miniupnpc not installed")
    except Exception as e:
        print(f"\n  UPnP: Error - {e}")

    print()
    print(f"  URLs:")
    print(f"    HTTPS: https://portalformacoes.duckdns.org:8443")
    print(f"    HTTP:  http://{LOCAL_IP}:8000")
    print(f"    API:   https://portalformacoes.duckdns.org:8443/docs")
    print("=" * 50)


# ============================================================
# WATCHDOG (runs every minute via scheduled task)
# ============================================================
def cmd_watchdog():
    """Check and restart dead services. Called every minute by scheduled task."""
    restarted = False

    # Check MySQL
    if not is_mysql_running():
        log("Watchdog: MySQL down, restarting...", print_too=False)
        subprocess.Popen(
            [str(MYSQL_BIN / "mysqld.exe"), f"--defaults-file={MYSQL_INI}"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=CREATE_FLAGS
        )
        restarted = True

    # Check app services
    for port, svc in SERVICES.items():
        if not is_port_open(port):
            log(f"Watchdog: {svc['name']} (:{port}) down, restarting...", print_too=False)
            subprocess.Popen(
                svc["args"],
                cwd=svc["cwd"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=CREATE_FLAGS
            )
            restarted = True

    if restarted:
        log("Watchdog: Services restarted.", print_too=False)

    # Ensure UPnP + DuckDNS
    ensure_upnp_mappings(quiet=True)
    ensure_duckdns(quiet=True)


# ============================================================
# UPnP & DuckDNS
# ============================================================
def ensure_upnp_mappings(quiet=False):
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

        # Get existing mappings
        existing = set()
        i = 0
        while True:
            p = u.getgenericportmapping(i)
            if p is None:
                break
            existing.add(p[0])
            i += 1

        restored = False
        for port, name in UPNP_MAPPINGS:
            if port not in existing:
                try:
                    u.addportmapping(port, "TCP", LOCAL_IP, port, name, "")
                    log(f"  UPnP: Restored port {port} ({name})", print_too=not quiet)
                    restored = True
                except Exception as e:
                    log(f"  UPnP: Failed port {port}: {e}", print_too=not quiet)

        if restored:
            log("UPnP port mappings restored.", print_too=not quiet)

    except Exception as e:
        log(f"UPnP check error: {e}", print_too=not quiet)


def ensure_duckdns(quiet=False):
    """Update DuckDNS if public IP changed."""
    try:
        import miniupnpc
        u = miniupnpc.UPnP()
        u.discoverdelay = 200
        u.discover()
        u.selectigd()
        ext_ip = u.externalipaddress()

        dns_ip = socket.gethostbyname(f"{DUCKDNS_DOMAIN}.duckdns.org")
        if ext_ip != dns_ip:
            import urllib.request
            url = (f"https://www.duckdns.org/update?"
                   f"domains={DUCKDNS_DOMAIN}&token={DUCKDNS_TOKEN}&ip={ext_ip}")
            urllib.request.urlopen(url, timeout=10)
            log(f"DuckDNS: Updated IP {dns_ip} -> {ext_ip}", print_too=not quiet)
    except Exception as e:
        if not quiet:
            log(f"DuckDNS check error: {e}")


# ============================================================
# Main
# ============================================================
def main():
    if len(sys.argv) < 2:
        print("Usage: python production.py <command>")
        print()
        print("Commands:")
        print("  start    - Start all services")
        print("  stop     - Stop all services")
        print("  restart  - Restart all services")
        print("  status   - Show service status")
        print("  watchdog - Check & restart dead services (for scheduled task)")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "start":
        cmd_start()
    elif command == "stop":
        cmd_stop()
    elif command == "restart":
        cmd_restart()
    elif command == "status":
        cmd_status()
    elif command == "watchdog":
        cmd_watchdog()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
