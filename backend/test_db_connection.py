"""Script para testar a conexão com o banco de dados MySQL"""
from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        print("✅ Conexão com MySQL db4free.net bem-sucedida!")
        
        # Verificar tabelas existentes
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        
        if tables:
            print(f"\nTabelas encontradas ({len(tables)}):")
            for table in tables:
                print(f"  - {table}")
        else:
            print("\n⚠️  Nenhuma tabela encontrada. O banco de dados está vazio.")
            print("   Execute as migrations para criar as tabelas necessárias.")
        
        # Verificar versão do MySQL
        result = conn.execute(text("SELECT VERSION()"))
        version = result.fetchone()[0]
        print(f"\nVersão do MySQL: {version}")
        
except Exception as e:
    print(f"❌ Erro ao conectar ao banco de dados:")
    print(f"   {type(e).__name__}: {e}")
    print("\nVerifique:")
    print("  1. As credenciais no arquivo .env")
    print("  2. A conexão com a internet")
    print("  3. Se o servidor db4free.net está acessível")
