import requests

url = "http://localhost:8000/api/auth/login"
data = {"username": "admin@tradehub.com", "password": "admin123"}

response = requests.post(url, data=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
