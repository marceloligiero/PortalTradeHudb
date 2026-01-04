#!/usr/bin/env python3
import sys
sys.path.insert(0, '/var/www/tradehub/backend')

from app.database import test_connection, engine
from sqlalchemy import text

try:
    print("Testando conexão...")
    test_connection()
    print("✅ Conexão OK!")
    
    print("\nVerificando tabelas...")
    with engine.connect() as conn:
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        print(f"Tabelas encontradas: {len(tables)}")
        for table in tables:
            print(f"  - {table}")
            
    print("\nVerificando usuário admin...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email, role FROM users WHERE email = 'admin@tradehub.com'"))
        user = result.fetchone()
        if user:
            print(f"✅ Usuário encontrado: {user[0]} - {user[1]}")
        else:
            print("❌ Usuário não encontrado!")
            
except Exception as e:
    print(f"❌ Erro: {e}")
