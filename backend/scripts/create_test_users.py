"""
Create test users for each role in the database.
Run: cd backend && python scripts/create_test_users.py
"""
import requests
import json

BASE = "http://localhost:8000/api"
s = requests.Session()

# Login as admin
r = s.post(f"{BASE}/auth/login", json={"username": "admin@tradehub.com", "password": "admin123"})
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}"}
print("Admin login OK")

# Users to create
users = [
    {
        "email": "chefe_test@tradehub.com",
        "password": "Test1234!",
        "full_name": "Chefe Teste",
        "role": "MANAGER",
        "flags": {"is_active": True, "is_pending": False, "is_team_lead": True},
    },
    {
        "email": "referente_test@tradehub.com",
        "password": "Test1234!",
        "full_name": "Referente Teste",
        "role": "TRAINEE",
        "flags": {"is_active": True, "is_pending": False, "is_referente": True},
    },
    {
        "email": "tutor_test@tradehub.com",
        "password": "Test1234!",
        "full_name": "Tutor Teste",
        "role": "TRAINEE",
        "flags": {"is_active": True, "is_pending": False, "is_tutor": True},
    },
    {
        "email": "student_test@tradehub.com",
        "password": "Test1234!",
        "full_name": "Estudante Teste",
        "role": "TRAINEE",
        "flags": {"is_active": True, "is_pending": False},
    },
    {
        "email": "trainer_test@tradehub.com",
        "password": "Test1234!",
        "full_name": "Trainer Teste",
        "role": "TRAINEE",
        "flags": {"is_active": True, "is_pending": False, "is_trainer": True, "role": "TRAINER"},
    },
    {
        "email": "liberador_test@tradehub.com",
        "password": "Test1234!",
        "full_name": "Liberador Teste",
        "role": "TRAINEE",
        "flags": {"is_active": True, "is_pending": False, "is_liberador": True},
    },
]


import time


def find_user(email):
    r = s.get(f"{BASE}/admin/users", headers=h, params={"page": 1, "page_size": 100})
    data = r.json()
    items = data.get("items", data) if isinstance(data, dict) else data
    for u in items:
        if u.get("email") == email:
            return u["id"]
    return None


for u in users:
    email = u["email"]
    uid = find_user(email)
    if uid:
        print(f"{email}: already exists (id={uid}), updating flags...")
    else:
        # Use admin endpoint to create with any role
        rr = s.post(
            f"{BASE}/admin/users",
            headers=h,
            json={
                "email": email,
                "password": u["password"],
                "full_name": u["full_name"],
                "role": u["role"],
            },
        )
        if rr.status_code >= 400:
            # Fallback to register
            rr = s.post(
                f"{BASE}/auth/register",
                json={
                    "email": email,
                    "password": u["password"],
                    "full_name": u["full_name"],
                    "role": "TRAINEE",
                },
            )
        print(f"{email}: create status={rr.status_code}")
        if rr.status_code >= 400:
            print(f"  response: {rr.text[:200]}")
        uid = find_user(email)

    if uid:
        rr = s.put(f"{BASE}/admin/users/{uid}", headers=h, json=u["flags"])
        print(f"  update flags: {rr.status_code}")
    else:
        print(f"  ERROR: could not find/create user")

# Wait a bit to avoid rate limit
time.sleep(2)

print()
print("=== ALL TEST USERS ===")
for u in users:
    email = u["email"]
    uid = find_user(email)
    rr = s.post(f"{BASE}/auth/login", json={"username": email, "password": u["password"]})
    status = "OK" if rr.status_code == 200 else f"FAIL({rr.status_code})"
    print(f"  {email}: id={uid}, login={status}, role={u['role']}, flags={u['flags']}")
    time.sleep(0.5)  # avoid rate limit
