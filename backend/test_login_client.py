from fastapi.testclient import TestClient
import main
from main import app as fastapi_app

client = TestClient(fastapi_app)

resp = client.post('/api/auth/login', json={'username': 'admin@tradehub.com', 'password': 'admin123'})
print('status_code:', resp.status_code)
print('response:', resp.json())
