```python
import requests
import json

# Test 1: Check if backend is running
health_url = "http://localhost:8000/health"
print("🏥 Testando health check...")
try:
    response = requests.get(health_url)
    print(f"Health Status: {response.json()}")
except Exception as e:
    print(f"❌ Backend não está rodando: {e}")
    exit(1)

# Test 2: Check database users table
print("\n📊 Testando query direta no banco...")
import pyodbc

try:
    conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=192.168.1.78;DATABASE=TradeHub;UID=sa;PWD=TorreDosMacacos.7"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email, role, is_active FROM users WHERE email = 'admin@tradehub.com'")
    row = cursor.fetchone()
    
    if row:
        print(f"✅ Usuário encontrado no banco:")
        print(f"   ID: {row[0]}")
        print(f"   Email: {row[1]}")
        print(f"   Role: {row[2]}")
        print(f"   Active: {row[3]}")
    else:
        print("❌ Usuário admin@tradehub.com NÃO encontrado no banco!")
    
    conn.close()
except Exception as e:
    print(f"❌ Erro ao conectar ao banco: {e}")

# Test 3: Try login
print("\n🔐 Testando login via API...")
url = "http://localhost:8000/api/auth/login"
data = {
    "username": "admin@tradehub.com",
    "password": "admin123"
}

try:
    # Send as form data, not JSON
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("\n✅ Login bem-sucedido!")
    else:
        print(f"Response: {response.text}")
        print("\n❌ Login falhou!")
except Exception as e:
    print(f"❌ Erro na requisição: {str(e)}")
```