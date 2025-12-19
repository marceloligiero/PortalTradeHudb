import pyodbc
import bcrypt

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
        
        # Test password verification with bcrypt directly
        test_password = "admin123"
        print(f"Testando senha: '{test_password}'")
        
        try:
            # Convert to bytes
            password_bytes = test_password.encode('utf-8')
            hash_bytes = stored_hash.encode('utf-8')
            
            is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
            
            if is_valid:
                print("✅ Senha VÁLIDA! O hash está correto.")
            else:
                print("❌ Senha INVÁLIDA! O hash não corresponde.")
                print("\nGerando novo hash...")
                new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
                print(f"Novo hash: {new_hash.decode('utf-8')}")
                
                # Update database
                print("\nAtualizando banco de dados...")
                cursor.execute(
                    "UPDATE users SET hashed_password = ? WHERE email = 'admin@tradehub.com'",
                    new_hash.decode('utf-8')
                )
                conn.commit()
                print("✅ Hash atualizado com sucesso!")
                
        except Exception as e:
            print(f"❌ Erro ao verificar hash: {e}")
    else:
        print("❌ Usuário admin@tradehub.com não encontrado")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erro: {e}")
