#!/usr/bin/env python3
"""Executar migração"""
import pymysql

conn = pymysql.connect(
    host='72.60.188.172',
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db',
    port=3306
)
cursor = conn.cursor()
database = 'tradehub_db'

print("Conectado à base de dados!")

# 1. Verificar/adicionar coluna status
cursor.execute("""
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = %s 
    AND table_name = 'challenge_submissions' 
    AND column_name = 'status'
""", (database,))
exists = cursor.fetchone()[0] > 0

if not exists:
    print("Adicionando coluna status...")
    cursor.execute("ALTER TABLE challenge_submissions ADD COLUMN status VARCHAR(50) DEFAULT 'IN_PROGRESS'")
    conn.commit()
    print("✓ Coluna status adicionada!")
else:
    print("✓ Coluna status já existe!")

# 2. Atualizar registros existentes
cursor.execute("""
    UPDATE challenge_submissions 
    SET status = 'REVIEWED' 
    WHERE completed_at IS NOT NULL 
    AND (status IS NULL OR status = 'IN_PROGRESS')
""")
conn.commit()
print(f"✓ {cursor.rowcount} registros atualizados para REVIEWED")

# 3. Verificar/criar tabela challenge_operations
cursor.execute("""
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = %s 
    AND table_name = 'challenge_operations'
""", (database,))
table_exists = cursor.fetchone()[0] > 0

if not table_exists:
    print("Criando tabela challenge_operations...")
    cursor.execute("""
        CREATE TABLE challenge_operations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submission_id INT NOT NULL,
            operation_number INT NOT NULL,
            operation_reference VARCHAR(255) NOT NULL,
            started_at DATETIME,
            completed_at DATETIME,
            duration_seconds INT,
            has_error BOOLEAN DEFAULT FALSE,
            is_approved BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE,
            INDEX idx_submission_id (submission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    conn.commit()
    print("✓ Tabela challenge_operations criada!")
else:
    print("✓ Tabela challenge_operations já existe!")

# 4. Verificar/criar tabela operation_errors
cursor.execute("""
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = %s 
    AND table_name = 'operation_errors'
""", (database,))
table_exists = cursor.fetchone()[0] > 0

if not table_exists:
    print("Criando tabela operation_errors...")
    cursor.execute("""
        CREATE TABLE operation_errors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            operation_id INT NOT NULL,
            error_type VARCHAR(50) NOT NULL,
            description VARCHAR(160),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (operation_id) REFERENCES challenge_operations(id) ON DELETE CASCADE,
            INDEX idx_operation_id (operation_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    conn.commit()
    print("✓ Tabela operation_errors criada!")
else:
    print("✓ Tabela operation_errors já existe!")

cursor.close()
conn.close()
print("\n✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
