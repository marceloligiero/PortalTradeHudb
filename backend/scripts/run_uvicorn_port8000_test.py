import subprocess, time, requests, sys
p = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--log-level', 'info'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
# wait for startup
for i in range(20):
    try:
        r = requests.get('http://127.0.0.1:8000/health', timeout=1)
        if r.status_code == 200:
            print('up')
            break
    except Exception:
        time.sleep(0.2)
else:
    print('failed to start')
    p.terminate()
    sys.exit(2)

print('server up, sending login')
r = requests.post('http://127.0.0.1:8000/api/auth/login', json={'username':'admin@tradehub.com','password':'admin123'}, timeout=5)
print('status', r.status_code)
print('text', r.text[:200])
# wait 1s and check if process still alive
time.sleep(1)
print('alive after', p.poll() is None)
# collect logs
try:
    out, err = p.communicate(timeout=2)
    print('stdout:', out.decode('utf-8')[:400])
    print('stderr:', err.decode('utf-8')[:400])
except Exception as e:
    print('could not collect logs:', e)
    p.terminate()