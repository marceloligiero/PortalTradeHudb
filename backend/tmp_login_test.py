import urllib.request, json, traceback
url='http://127.0.0.1:8000/api/auth/login'
data=json.dumps({'username':'admin@tradehub.com','password':'admin123'}).encode()
req=urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
try:
    resp=urllib.request.urlopen(req, timeout=10)
    print('STATUS', resp.getcode())
    print(resp.read().decode())
except Exception as e:
    print('EXC', repr(e))
    traceback.print_exc()
