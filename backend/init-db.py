#!/usr/bin/env python3
import sys
sys.path.insert(0, '/var/www/tradehub/backend')

# Import all models first so they are registered with Base.metadata
from app import models
from app.database import init_db, engine
from sqlalchemy import text

print("Inicializando banco de dados...")
print("Modelos importados, criando tabelas...")
init_db()
print("✅ Tabelas criadas com sucesso!")

# Verificar tabelas criadas
with engine.connect() as conn:
    result = conn.execute(text("SHOW TABLES"))
    tables = [row[0] for row in result]
    print(f"\nTabelas criadas: {len(tables)}")
    for table in tables:
        print(f"  - {table}")
