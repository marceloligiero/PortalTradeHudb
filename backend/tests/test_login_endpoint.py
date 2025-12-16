from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

def test_admin_login():
    resp = client.post('/api/auth/login', json={'username': 'admin@tradehub.com', 'password': 'admin123'})
    assert resp.status_code == 200
    data = resp.json()
    assert 'access_token' in data and data['token_type'] == 'bearer'
    assert data['user']['email'] == 'admin@tradehub.com'
