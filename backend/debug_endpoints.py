import requests

# Test different endpoints
BASE_URL = "http://localhost:8000"

print("Testing endpoints...")
print("=" * 50)

# 1. Test GET /
print("\n1. GET /api/training-plans")
try:
    response = requests.get(f"{BASE_URL}/api/training-plans/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:100]}")
except Exception as e:
    print(f"   Error: {e}")

# 2. Test POST / without auth
print("\n2. POST /api/training-plans (no auth)")
try:
    response = requests.post(f"{BASE_URL}/api/training-plans/", json={"title": "test"})
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# 3. List all routes
print("\n3. GET /openapi.json")
try:
    response = requests.get(f"{BASE_URL}/openapi.json")
    if response.status_code == 200:
        openapi = response.json()
        paths = openapi.get('paths', {})
        training_plan_paths = {k: v for k, v in paths.items() if 'training-plans' in k}
        print("   Training plan endpoints found:")
        for path, methods in training_plan_paths.items():
            print(f"   - {path}: {list(methods.keys())}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 50)
