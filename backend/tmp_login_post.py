import requests
url='http://127.0.0.1:8000/api/auth/login'
try:
    r = requests.post(url, json={'username':'admin@tradehub.com','password':'admin123'}, timeout=10)
    print('STATUS', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
except Exception as e:
    import traceback
    print('EXC', e)
    traceback.print_exc()
