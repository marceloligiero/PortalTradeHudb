import pyodbc

# Configurações do banco
server = 'PT-L163820\\SQLEXPRESS'
database = 'TradeDataHub'
connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;'

try:
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    
    print("Verificando usuário ID=1...")
    print("=" * 50)
    
    cursor.execute("SELECT id, email, role, is_pending FROM users WHERE id = 1")
    user = cursor.fetchone()
    
    if user:
        print(f"ID: {user[0]}")
        print(f"Email: {user[1]}")
        print(f"Role: {user[2]}")
        print(f"is_pending: {user[3]}")
    else:
        print("Usuário não encontrado!")
    
    print("\nVerificando trainers disponíveis...")
    cursor.execute("SELECT id, email, role, is_pending FROM users WHERE role = 'TRAINER'")
    trainers = cursor.fetchall()
    
    print(f"Total de trainers: {len(trainers)}")
    for trainer in trainers:
        print(f"- ID: {trainer[0]}, Email: {trainer[1]}, Role: {trainer[2]}, is_pending: {trainer[3]}")
    
    conn.close()
    print("\n" + "=" * 50)
    
except Exception as e:
    print(f"Erro: {e}")
