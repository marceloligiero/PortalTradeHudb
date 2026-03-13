import requests
BASE = "http://localhost:8000/api"
s = requests.Session()
r = s.post(f"{BASE}/auth/login", json={"username": "admin@tradehub.com", "password": "admin123"})
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}"}

# Get all users
r = s.get(f"{BASE}/admin/users", headers=h, params={"page": 1, "page_size": 100})
data = r.json()
print("Type:", type(data).__name__)
if isinstance(data, dict):
    print("Keys:", list(data.keys()))
    items = data.get("items", [])
    print("Total items:", len(items))
    for u in items:
        email = u.get("email", "?")
        role = u.get("role", "?")
        pending = u.get("is_pending", "?")
        active = u.get("is_active", "?")
        uid = u.get("id", "?")
        print(f"  id={uid} email={email} role={role} pending={pending} active={active}")
elif isinstance(data, list):
    print("Total items:", len(data))
    for u in data:
        email = u.get("email", "?")
        role = u.get("role", "?")
        print(f"  id={u.get('id')} email={email} role={role}")
