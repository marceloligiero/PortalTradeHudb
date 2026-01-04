#!/usr/bin/env python3
import sys
sys.path.insert(0, '/var/www/tradehub/backend')

from passlib.context import CryptContext
from sqlalchemy import text
from app.database import engine

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Gerar hash da senha
password = "admin123"
hashed = pwd_context.hash(password)
print(f"Hash gerado para senha '{password}':")
print(hashed)

# Atualizar no banco
print("\nAtualizando senha no banco de dados...")
with engine.connect() as conn:
    conn.execute(
        text("UPDATE users SET hashed_password = :hash WHERE email = 'admin@tradehub.com'"),
        {"hash": hashed}
    )
    conn.commit()
    print("✅ Senha atualizada com sucesso!")
    
# Verificar
with engine.connect() as conn:
    result = conn.execute(text("SELECT email, role FROM users WHERE email = 'admin@tradehub.com'"))
    user = result.fetchone()
    if user:
        print(f"\n✅ Usuário: {user[0]} ({user[1]})")
        print(f"✅ Senha: {password}")
