#!/usr/bin/env python3
"""
Script de Migração - Sistema de Desafios v2
Execute este script para atualizar o schema da base de dados.

Uso: python apply_migration.py
"""

import pymysql
import os
import sys

# Adicionar path do backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_db_config():
    """Obter configuração da base de dados"""
    # Tentar importar do config
    try:
        from app.config import settings
        return {
            'host': settings.DB_HOST,
            'user': settings.DB_USER,
            'password': settings.DB_PASSWORD,
            'database': settings.DB_NAME,
            'port': int(settings.DB_PORT)
        }
    except:
        # Fallback para variáveis de ambiente ou valores default
        return {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'tradehub_user'),
            'password': os.getenv('DB_PASSWORD', 'TH@2024!Secure#DB'),
            'database': os.getenv('DB_NAME', 'tradehub_db'),
            'port': int(os.getenv('DB_PORT', 3306))
        }

def column_exists(cursor, table, column, database):
    """Verificar se uma coluna existe"""
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = %s 
        AND table_name = %s 
        AND column_name = %s
    """, (database, table, column))
    return cursor.fetchone()[0] > 0

def table_exists(cursor, table, database):
    """Verificar se uma tabela existe"""
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = %s 
        AND table_name = %s
    """, (database, table))
    return cursor.fetchone()[0] > 0

def main():
    config = get_db_config()
    print(f"Conectando à base de dados {config['database']}@{config['host']}...")
    
    try:
        conn = pymysql.connect(**config)
        cursor = conn.cursor()
        database = config['database']
        
        print("\n=== Migração Sistema de Desafios v2 ===\n")
        
        # 1. Adicionar coluna status à tabela challenge_submissions
        print("1. Verificando coluna 'status' em challenge_submissions...")
        if not column_exists(cursor, 'challenge_submissions', 'status', database):
            print("   Adicionando coluna 'status'...")
            cursor.execute("""
                ALTER TABLE challenge_submissions 
                ADD COLUMN status VARCHAR(50) DEFAULT 'IN_PROGRESS'
            """)
            conn.commit()
            print("   ✓ Coluna 'status' adicionada!")
        else:
            print("   ✓ Coluna 'status' já existe!")
        
        # 2. Atualizar registros existentes
        print("\n2. Atualizando registros existentes...")
        cursor.execute("""
            UPDATE challenge_submissions 
            SET status = 'REVIEWED' 
            WHERE completed_at IS NOT NULL 
            AND (status IS NULL OR status = 'IN_PROGRESS')
        """)
        conn.commit()
        print(f"   ✓ {cursor.rowcount} registros atualizados para 'REVIEWED'")
        
        # 3. Criar tabela challenge_operations
        print("\n3. Verificando tabela 'challenge_operations'...")
        if not table_exists(cursor, 'challenge_operations', database):
            print("   Criando tabela 'challenge_operations'...")
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
                    INDEX idx_submission_id (submission_id),
                    INDEX idx_operation_number (operation_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            conn.commit()
            print("   ✓ Tabela 'challenge_operations' criada!")
        else:
            print("   ✓ Tabela 'challenge_operations' já existe!")
        
        # 4. Criar tabela operation_errors
        print("\n4. Verificando tabela 'operation_errors'...")
        if not table_exists(cursor, 'operation_errors', database):
            print("   Criando tabela 'operation_errors'...")
            cursor.execute("""
                CREATE TABLE operation_errors (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    operation_id INT NOT NULL,
                    error_type VARCHAR(50) NOT NULL,
                    description VARCHAR(160),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (operation_id) REFERENCES challenge_operations(id) ON DELETE CASCADE,
                    INDEX idx_operation_id (operation_id),
                    INDEX idx_error_type (error_type)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            conn.commit()
            print("   ✓ Tabela 'operation_errors' criada!")
        else:
            print("   ✓ Tabela 'operation_errors' já existe!")
        
        print("\n" + "="*50)
        print("✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*50)
        
        # Mostrar resumo
        print("\nResumo das tabelas:")
        for table in ['challenge_submissions', 'challenge_operations', 'operation_errors']:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  - {table}: {count} registros")
        
    except pymysql.err.OperationalError as e:
        print(f"\n✗ Erro de conexão: {e}")
        print("\nVerifique:")
        print("  - O servidor MySQL está a correr?")
        print("  - As credenciais estão corretas?")
        print("  - O IP tem permissão de acesso?")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Erro: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
