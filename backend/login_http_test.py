import json
import urllib.request

url = 'http://127.0.0.1:8000/api/auth/login'
data = json.dumps({'username':'admin@tradehub.com','password':'admin123'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    try:
        print(e.read().decode())
    except:
        print('No body')
except Exception as e:
    import traceback
    traceback.print_exc()
