"""Simple supervisor to keep uvicorn running and capture logs.
Usage: run this script with the project's venv active or via the `start_local.ps1` helper.
"""
import subprocess
import time
import sys
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
LOG_DIR = os.path.join(ROOT, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
OUT_LOG = os.path.join(LOG_DIR, 'uvicorn.out.log')
ERR_LOG = os.path.join(LOG_DIR, 'uvicorn.err.log')

CMD = [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--log-level', 'info']
RESTART_DELAY = 2

def supervise():
    while True:
        with open(OUT_LOG, 'ab') as out, open(ERR_LOG, 'ab') as err:
            print(f"Starting uvicorn: {' '.join(CMD)}")
            p = subprocess.Popen(CMD, stdout=out, stderr=err)
            try:
                # Wait and monitor process
                while True:
                    ret = p.poll()
                    if ret is not None:
                        print(f"uvicorn exited with code {ret}; restarting in {RESTART_DELAY}s")
                        break
                    time.sleep(1)
            except KeyboardInterrupt:
                print('Stopping supervisor and uvicorn')
                try:
                    p.terminate()
                    p.wait(timeout=5)
                except Exception:
                    p.kill()
                raise
        time.sleep(RESTART_DELAY)

if __name__ == '__main__':
    supervise()
