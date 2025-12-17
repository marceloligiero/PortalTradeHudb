```python
import requests

# Test form-encoded login
url = "http://localhost:8000/api/auth/login"
data = {"username": "admin@tradehub.com", "password": "admin123"}

print("Testing login...")
try:
    response = requests.post(url, data=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Success: {response.json()}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
```