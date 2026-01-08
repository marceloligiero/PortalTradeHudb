#!/bin/bash
# Script para configurar MySQL para aceitar conexões remotas
# Execute este script na VPS: sudo bash configure-mysql-remote.sh

set -e

DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASSWORD="TradeHub2026Secure"

echo "==================================="
echo "Configurando MySQL para Acesso Remoto"
echo "==================================="

# 1. Configurar bind-address para aceitar conexões de qualquer IP
echo "📝 Configurando bind-address..."
MYSQL_CNF="/etc/mysql/mysql.conf.d/mysqld.cnf"
if [ -f "$MYSQL_CNF" ]; then
    sudo sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' "$MYSQL_CNF"
    echo "✅ bind-address configurado para 0.0.0.0"
else
    echo "⚠️  Arquivo $MYSQL_CNF não encontrado, tentando /etc/mysql/my.cnf..."
    MYSQL_CNF="/etc/mysql/my.cnf"
    if [ -f "$MYSQL_CNF" ]; then
        if grep -q "bind-address" "$MYSQL_CNF"; then
            sudo sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' "$MYSQL_CNF"
        else
            echo "[mysqld]" | sudo tee -a "$MYSQL_CNF"
            echo "bind-address = 0.0.0.0" | sudo tee -a "$MYSQL_CNF"
        fi
    fi
fi

# 2. Criar usuário para acesso remoto
echo "👤 Criando usuário para acesso remoto..."
sudo mysql << EOF
-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário para acesso remoto (de qualquer IP)
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';

-- Manter também o acesso local
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar usuários
SELECT User, Host FROM mysql.user WHERE User='$DB_USER';
EOF

# 3. Reiniciar MySQL
echo "🔄 Reiniciando MySQL..."
sudo systemctl restart mysql

# 4. Abrir porta no firewall
echo "🔥 Configurando firewall..."
sudo ufw allow 3306/tcp

echo ""
echo "✅ MySQL configurado para acesso remoto!"
echo ""
echo "Detalhes da conexão:"
echo "  Host: $(hostname -I | awk '{print $1}')"
echo "  Port: 3306"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "String de conexão:"
echo "  mysql+pymysql://$DB_USER:$DB_PASSWORD@$(hostname -I | awk '{print $1}'):3306/$DB_NAME?charset=utf8mb4"
echo ""
echo "⚠️  SEGURANÇA: Em produção, considere limitar o acesso por IP específico"
