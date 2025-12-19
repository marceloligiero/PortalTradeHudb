```python
import pyodbc
from passlib.context import CryptContext

# Setup password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn_str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=PT-L163820\\SQLEXPRESS;DATABASE=TradeDataHub;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Get admin password hash
    cursor.execute("SELECT hashed_password FROM users WHERE email = 'admin@tradehub.com'")
    row = cursor.fetchone()
    
    if row:
        stored_hash = row[0]
        print(f"Hash armazenado no banco:\n{stored_hash}\n")
        print(f"Comprimento do hash: {len(stored_hash)} caracteres")
        
        # Test password verification
        test_password = "admin123"
        print(f"\nTestando senha: '{test_password}'")
        
        try:
            is_valid = pwd_context.verify(test_password, stored_hash)
            if is_valid:
                print("✅ Senha VÁLIDA! O hash está correto.")
            else:
                print("❌ Senha INVÁLIDA! O hash não corresponde.")
                
                # Try generating a new hash
                new_hash = pwd_context.hash(test_password)
                print(f"\nNovo hash gerado para 'admin123':\n{new_hash}")
                
                # Test the new hash
                if pwd_context.verify(test_password, new_hash):
                    print("✅ Novo hash funciona corretamente")
                    
                    # Offer to update
                    print("\n⚠️ Deseja atualizar o hash no banco? (y/n)")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar hash: {e}")
    else:
        print("❌ Usuário admin@tradehub.com não encontrado")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erro: {e}")
```