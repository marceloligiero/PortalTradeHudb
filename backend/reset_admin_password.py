import os
import sys
root = os.path.dirname(os.path.abspath(__file__))
if root not in sys.path:
    sys.path.insert(0, root)

from app.database import get_db
from app.models import User
import bcrypt

db = next(get_db())

# Buscar admin
admin = db.query(User).filter(User.email == 'admin@tradehub.com').first()

if admin:
    print(f"✅ Admin encontrado: {admin.email}")
    print(f"   Nome: {admin.full_name}")
    print(f"   Role: {admin.role}")
    print(f"   Ativo: {admin.is_active}")
    print(f"   Pendente: {admin.is_pending}")
    
    # Garantir status correto
    admin.is_active = True
    admin.is_pending = False
    
    # Resetar senha usando o mesmo método do auth.py
    password = "admin123"
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    admin.hashed_password = hashed.decode('utf-8')
    
    # Validate before committing
    from app import auth as _auth
    if not _auth.is_valid_bcrypt_hash(admin.hashed_password):
        print("❌ Generated hash failed validation. Aborting commit.")
        db.rollback()
    else:
        db.commit()
        print(f"\n✅ Senha resetada com sucesso!")
    print(f"   Email: admin@tradehub.com")
    print(f"   Senha: admin123")
    
    # Testar a senha
    test_password_bytes = password.encode('utf-8')[:72]
    hashed_bytes = admin.hashed_password.encode('utf-8')
    if bcrypt.checkpw(test_password_bytes, hashed_bytes):
        print(f"\n✅ Verificação de senha: OK!")
    else:
        print(f"\n❌ Verificação de senha: FALHOU!")
else:
    print("❌ Admin não encontrado!")

db.close()
