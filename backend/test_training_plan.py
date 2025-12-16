import requests
import json

# URL base da API
BASE_URL = "http://localhost:8000"

def test_create_training_plan():
    print("=" * 50)
    print("Teste: Criação de Plano de Formação")
    print("=" * 50)
    
    # 1. Login como admin
    print("\n1. Fazendo login...")
    login_url = f"{BASE_URL}/api/auth/login"
    login_data = {
        "username": "admin@tradehub.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_id = data.get("user", {}).get("id")
            print(f"   ✅ Login bem-sucedido!")
            print(f"   Token: {token[:20]}...")
            print(f"   User ID: {user_id}")
            
            # 2. Criar plano de formação
            print("\n2. Criando plano de formação...")
            create_url = f"{BASE_URL}/api/training-plans/"  # COM BARRA NO FINAL!
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            plan_data = {
                "title": "Plano Teste API",
                "trainer_id": 3,  # ID de um trainer válido!
                "course_ids": [1],
                "student_ids": [4]  # Usar ID 4 ou 5 (students)
            }
            
            print(f"   URL: {create_url}")
            print(f"   Dados: {json.dumps(plan_data, indent=2)}")
            
            response = requests.post(create_url, json=plan_data, headers=headers)
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 500:
                try:
                    error_detail = response.json()
                    print(f"   Erro detalhado: {error_detail}")
                except:
                    pass
            
            if response.status_code == 201:
                print(f"   ✅ Plano criado com sucesso!")
                plan = response.json()
                print(f"   ID: {plan.get('id')}")
                print(f"   Título: {plan.get('title')}")
            else:
                print(f"   ❌ Erro ao criar plano")
                
        else:
            print(f"   ❌ Login falhou: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Erro: {str(e)}")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_create_training_plan()
