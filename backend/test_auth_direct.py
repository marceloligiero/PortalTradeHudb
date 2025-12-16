import sys
sys.path.insert(0, 'c:\\Portal Trade DataHub\\backend')

from app.database import SessionLocal
from app import models, auth

# Test database and authentication
print("🔍 Testando autenticação diretamente...")

db = SessionLocal()

# Check if user exists
user = db.query(models.User).filter(models.User.email == "admin@tradehub.com").first()
if user:
    print(f"✅ Usuário encontrado: {user.email}")
    print(f"   Nome: {user.full_name}")
    print(f"   Role: {user.role}")
    print(f"   Hash: {user.hashed_password[:50]}...")
else:
    print("❌ Usuário não encontrado!")
    db.close()
    sys.exit(1)

# Test password verification
print("\n🔐 Testando verificação de senha...")
password = "admin123"

try:
    result = auth.verify_password(password, user.hashed_password)
    if result:
        print("✅ Senha verificada com sucesso!")
    else:
        print("❌ Senha inválida!")
except Exception as e:
    print(f"❌ Erro ao verificar senha: {e}")
    import traceback
    traceback.print_exc()

# Test authenticate_user function
print("\n🔓 Testando função authenticate_user...")
try:
    authenticated_user = auth.authenticate_user(db, "admin@tradehub.com", "admin123")
    if authenticated_user:
        print(f"✅ Autenticação bem-sucedida: {authenticated_user.email}")
    else:
        print("❌ Autenticação falhou!")
except Exception as e:
    print(f"❌ Erro na autenticação: {e}")
    import traceback
    traceback.print_exc()

db.close()
