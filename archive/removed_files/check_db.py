```python
import pyodbc

conn_str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=PT-L163820\\SQLEXPRESS;DATABASE=TradeDataHub;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;"

try:
    print("Conectando ao banco...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Check if users table exists
    print("\n📊 Verificando se tabela users existe...")
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'users'
    """)
    table_exists = cursor.fetchone()[0]
    print(f"Tabela users existe: {table_exists > 0}")
    
    if table_exists:
        # Check users count
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"\n👥 Total de usuários: {count}")
        
        # List all users
        cursor.execute("SELECT id, email, full_name, role, is_active FROM users")
        users = cursor.fetchall()
        
        if users:
            print("\n📝 Usuários cadastrados:")
            for user in users:
                print(f"   ID: {user[0]} | Email: {user[1]} | Nome: {user[2]} | Role: {user[3]} | Ativo: {user[4]}")
        else:
            print("\n❌ Nenhum usuário cadastrado!")
    else:
        print("\n❌ Tabela users NÃO EXISTE no banco TradeDataHub!")
    
    conn.close()
    
except Exception as e:
    print(f"\n❌ Erro: {e}")
```