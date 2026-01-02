```python
import requests

url = "http://192.168.1.78:8000/api/auth/login"
data = {"username": "admin@tradehub.com", "password": "admin123"}

print("Testing login via network IP...")
try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Success! Token: {result['access_token'][:50]}...")
        print(f"User: {result['user']['email']} ({result['user']['role']})")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
```