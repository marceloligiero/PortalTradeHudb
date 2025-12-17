```python
import requests
import json

# Primeiro faz login
login_url = "http://localhost:8000/api/auth/login"
login_data = {"username": "admin@tradehub.com", "password": "admin123"}

print("1. Fazendo login...")
login_response = requests.post(login_url, json=login_data)
if login_response.status_code != 200:
    print(f"Erro no login: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
user_id = login_response.json()["user"]["id"]
print(f"✓ Login OK - Token obtido, User ID: {user_id}")

# Tenta criar um plano de formação
create_url = "http://localhost:8000/api/training-plans"
headers = {"Authorization": f"Bearer {token}"}
plan_data = {
    "title": "Plano Teste",
    "description": "Teste via Python",
    "trainer_id": user_id,
    "bank_id": None,
    "product_id": None,
    "start_date": None,
    "end_date": None,
    "course_ids": [],
    "student_ids": []
}

print("\n2. Criando plano de formação...")
print(f"URL: {create_url}")
print(f"Headers: Authorization: Bearer {token[:20]}...")
print(f"Data: {json.dumps(plan_data, indent=2)}")

try:
    response = requests.post(create_url, json=plan_data, headers=headers)
    print(f"\n3. Response Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("\n✓ Plano criado com sucesso!")
    else:
        print("\n✗ Erro ao criar plano")
except Exception as e:
    print(f"\n✗ Exceção: {e}")
```