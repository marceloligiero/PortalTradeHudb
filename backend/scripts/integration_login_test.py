import subprocess
import time
import requests
import os
import sys

root = os.path.dirname(os.path.dirname(__file__))
if root not in sys.path:
    sys.path.insert(0, root)

UVICORN_CMD = [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8001', '--log-level', 'info']
OUT = 'uvicorn_integration_out.log'
ERR = 'uvicorn_integration_err.log'

def wait_health(url='http://127.0.0.1:8001/health', timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=1)
            if r.status_code == 200:
                return True
        except Exception:
            time.sleep(0.5)
    return False

def run():
    with open(OUT, 'wb') as out, open(ERR, 'wb') as err:
        print('Starting uvicorn...')
        p = subprocess.Popen(UVICORN_CMD, stdout=out, stderr=err)
        try:
            up = wait_health()
            if not up:
                print('Server failed to start within timeout')
                return 2

            print('Server is up, sending login request...')
            r = requests.post('http://127.0.0.1:8001/api/auth/login', json={'username': 'admin@tradehub.com', 'password': 'admin123'}, timeout=5)
            print('Login status:', r.status_code)
            print('Response:', r.text)

            time.sleep(1)
            alive = p.poll() is None
            print('Process alive after request:', alive)
            if not alive:
                print('Server exited; check logs: ', OUT, ERR)
                return 1
            return 0
        finally:
            try:
                p.terminate()
                p.wait(timeout=5)
            except Exception:
                p.kill()

if __name__ == '__main__':
    sys.exit(run())
