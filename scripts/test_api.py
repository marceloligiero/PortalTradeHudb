import requests

# Login
r = requests.post('http://localhost:8000/api/auth/login', json={'username':'admin@tradehub.com','password':'admin123'})
print('Login response:', r.status_code, r.text[:200])
data_login = r.json()
token = data_login.get('access_token') or data_login.get('token')
if not token:
    print("No token found in:", list(data_login.keys()))
    exit(1)
h = {'Authorization': f'Bearer {token}'}

print('=== Activities (first 5) ===')
data = requests.get('http://localhost:8000/api/admin/master/activities', headers=h).json()
for a in data[:5]:
    print(f"  {a['id']}: {a['name']} | bank={a.get('bank_name')} | dept={a.get('department_name')}")

print(f'\n=== Error Types (first 5) ===')
data = requests.get('http://localhost:8000/api/admin/master/error-types', headers=h).json()
for a in data[:5]:
    print(f"  {a['id']}: {a['name']} | activity={a.get('activity_name')}")

print(f'\n=== Categories (first 10) ===')
data = requests.get('http://localhost:8000/api/tutoria/categories', headers=h).json()
for a in data[:10]:
    print(f"  {a['id']}: {a['name']} | origin_id={a.get('origin_id')}")

print(f'\n=== Banks ===')
data = requests.get('http://localhost:8000/api/admin/banks', headers=h).json()
for b in data:
    print(f"  {b['id']}: {b.get('code','?')} - {b['name']}")

print('\nAll OK!')
