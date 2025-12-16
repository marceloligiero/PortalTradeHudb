import subprocess
import time
import requests
import sys
import os

UVICORN_CMD = [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--log-level', 'debug']
OUT = 'uvicorn_preflight_out.log'
ERR = 'uvicorn_preflight_err.log'

def wait_health(url='http://127.0.0.1:8000/health', timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=1)
            if r.status_code == 200:
                return True
        except Exception:
            time.sleep(0.2)
    return False

def run():
    with open(OUT, 'wb') as out, open(ERR, 'wb') as err:
        p = subprocess.Popen(UVICORN_CMD, stdout=out, stderr=err)
        try:
            if not wait_health():
                print('server failed to start')
                return 2

            print('sending OPTIONS preflight')
            r = requests.options('http://127.0.0.1:8000/api/auth/login', headers={
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
            }, timeout=5)
            print('status', r.status_code)
            print('headers:', r.headers)

            time.sleep(0.5)
            alive = p.poll() is None
            print('process alive after preflight:', alive)
            return 0 if alive else 1
        finally:
            try:
                p.terminate()
                p.wait(timeout=5)
            except Exception:
                p.kill()

if __name__ == '__main__':
    sys.exit(run())
