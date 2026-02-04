#!/bin/bash
# Script de Configuração do Banco de Dados MySQL

set -e

DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASSWORD="SUA_SENHA_FORTE_AQUI"  # ALTERE ESTA SENHA!

echo "==================================="
echo "Configurando Banco de Dados MySQL"
echo "==================================="

# Criar usuário e banco de dados
sudo mysql << EOF
-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User='$DB_USER';
EOF

echo ""
echo "✅ Banco de dados configurado!"
echo ""
echo "Detalhes da conexão:"
echo "  Host: localhost"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "String de conexão:"
echo "  mysql+pymysql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME"
echo ""
echo "⚠️  IMPORTANTE: Atualize o arquivo backend/.env com esta string de conexão!"
