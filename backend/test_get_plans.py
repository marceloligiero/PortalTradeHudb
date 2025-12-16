import requests

BASE_URL = "http://localhost:8000"


def run_demo():
    # Login
    print("1. Login...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin@tradehub.com", "password": "admin123"}
    )
    print(f"   Status: {login_response.status_code}")

    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        print(f"   Token obtido")
        
        # Get training plans
        print("\n2. Buscando planos...")
        headers = {"Authorization": f"Bearer {token}"}
        
        plans_response = requests.get(f"{BASE_URL}/api/training-plans/", headers=headers)
        print(f"   Status: {plans_response.status_code}")
        print(f"   Response: {plans_response.text}")
        
        if plans_response.status_code == 200:
            plans = plans_response.json()
            print(f"   Total de planos: {len(plans)}")
            for plan in plans:
                print(f"   - {plan.get('id')}: {plan.get('title')}")


if __name__ == '__main__':
    run_demo()
