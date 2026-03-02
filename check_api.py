import requests, json

r = requests.post('http://localhost:8000/api/auth/login', json={'email':'admin@tradehub.com','password':'admin123'})
data = r.json()
print('Login response:', data.keys() if isinstance(data, dict) else data)
if 'access_token' not in data:
    # Try alternate password
    r = requests.post('http://localhost:8000/api/auth/login', json={'email':'admin@tradehub.com','password':'Admin@2024!'})
    data = r.json()
    print('Login response 2:', data.keys() if isinstance(data, dict) else data)

token = data.get('access_token')
if not token:
    print('Cannot login, exiting')
    exit(1)

headers = {'Authorization': f'Bearer {token}'}

# Check courses
r2 = requests.get('http://localhost:8000/api/admin/courses', headers=headers)
courses = r2.json()
if courses:
    c = courses[0]
    print('=== COURSE 0 ===')
    for key in ['title','bank_id','bank_ids','banks','product_id','product_ids','products']:
        print(f'  {key}: {c.get(key)}')

# Check training plans
r3 = requests.get('http://localhost:8000/api/training-plans/', headers=headers)
plans = r3.json()
if plans:
    for i, p in enumerate(plans):
        print(f'\n=== PLAN {i} ===')
        for key in ['title','bank_id','bank_ids','banks','product_id','product_ids','products','product_code','product_name']:
            print(f'  {key}: {p.get(key)}')
