import requests
import json

url = "http://localhost:8000/api/auth/login"
data = {"username": "admin@tradehub.com", "password": "admin123"}

print("Testing JSON login...")
try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
