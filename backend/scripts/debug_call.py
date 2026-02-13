from fastapi.testclient import TestClient
import runpy, sys, os

# Ensure backend dir is on sys.path so `app` package can be imported
sys.path.insert(0, os.getcwd())

# Load main.py module at runtime to get the FastAPI `app` object
module_globals = runpy.run_path('main.py')
app = module_globals.get('app')
if app is None:
    raise RuntimeError('Could not find `app` in main.py')

client = TestClient(app)

print("Logging in...")
login = client.post("/api/auth/login", json={"username": "admin@tradehub.com", "password": "admin123"})
print("Login status:", login.status_code)
try:
    print(login.json())
except Exception:
    print("Login raw:", login.content)

token = None
try:
    token = login.json().get("access_token")
except Exception:
    pass

print("Calling /api/admin/users")
try:
    resp = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"}, follow_redirects=True)
    print("Status:", resp.status_code)
    try:
        print(resp.json())
    except Exception:
        print("Response raw:", resp.content)
except Exception as e:
    import traceback
    print("Server exception:")
    traceback.print_exc()
    raise

print("Calling /api/training-plans/")
try:
    resp2 = client.get("/api/training-plans/", headers={"Authorization": f"Bearer {token}"}, follow_redirects=True)
    print("Status:", resp2.status_code)
    try:
        print(resp2.json())
    except Exception:
        print("Response raw:", resp2.content)
except Exception:
    import traceback
    print("Training plans call raised:")
    traceback.print_exc()

print("Calling /api/admin/reports/training-plans")
try:
    resp3 = client.get("/api/admin/reports/training-plans", headers={"Authorization": f"Bearer {token}"}, follow_redirects=True)
    print("Status:", resp3.status_code)
    try:
        print(resp3.json())
    except Exception:
        print("Response raw:", resp3.content)
except Exception:
    import traceback
    print("Reports call raised:")
    traceback.print_exc()
