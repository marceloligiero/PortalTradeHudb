#!/usr/bin/env python3
"""
Script para adicionar a coluna status à tabela challenge_submissions
Execute este script no servidor ou onde tenha acesso à base de dados.

Uso: python add_status_column.py
"""

import pymysql
import os

# Configurações da base de dados
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '72.60.188.172'),
    'user': os.getenv('DB_USER', 'tradehub_user'),
    'password': os.getenv('DB_PASSWORD', 'TH@2024!Secure#DB'),
    'database': os.getenv('DB_NAME', 'tradehub_db'),
    'port': int(os.getenv('DB_PORT', 3306))
}

def main():
    print("Conectando à base de dados...")
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_schema = %s 
            AND table_name = 'challenge_submissions' 
            AND column_name = 'status'
        """, (DB_CONFIG['database'],))
        
        if cursor.fetchone()[0] > 0:
            print("✓ Coluna 'status' já existe!")
        else:
            print("Adicionando coluna 'status'...")
            cursor.execute("""
                ALTER TABLE challenge_submissions 
                ADD COLUMN status VARCHAR(50) DEFAULT 'IN_PROGRESS'
            """)
            conn.commit()
            print("✓ Coluna 'status' adicionada com sucesso!")
        
        # Atualizar registos existentes
        print("Atualizando registos existentes...")
        cursor.execute("""
            UPDATE challenge_submissions 
            SET status = 'REVIEWED' 
            WHERE completed_at IS NOT NULL AND (status IS NULL OR status = 'IN_PROGRESS')
        """)
        conn.commit()
        affected = cursor.rowcount
        print(f"✓ {affected} registos atualizados para 'REVIEWED'")
        
        print("\n✓ Migração concluída com sucesso!")
        
    except Exception as e:
        print(f"✗ Erro: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
