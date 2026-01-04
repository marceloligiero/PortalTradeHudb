#!/bin/bash
# Script de Deploy Completo - Portal TradeHub
# Execute na VPS: bash deploy-complete.sh

set -e

echo "=========================================="
echo "🚀 Deploy Portal TradeHub - VPS Hostinger"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variáveis
APP_DIR="/var/www/tradehub"
DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASSWORD="TradeHub2026SecurePass"
DOMAIN="72.60.188.172"

echo -e "${BLUE}[1/10] Atualizando sistema...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update -y
apt upgrade -y

echo -e "${BLUE}[2/10] Instalando dependências básicas...${NC}"
apt install -y curl wget git vim build-essential software-properties-common ufw

echo -e "${BLUE}[3/10] Instalando Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${BLUE}[4/10] Instalando Python 3.11...${NC}"
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

echo -e "${BLUE}[5/10] Instalando MySQL...${NC}"
apt install -y mysql-server

echo -e "${BLUE}[6/10] Configurando MySQL...${NC}"
systemctl start mysql
systemctl enable mysql

mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✅ Banco de dados criado: $DB_NAME${NC}"

echo -e "${BLUE}[7/10] Instalando Nginx e PM2...${NC}"
apt install -y nginx
npm install -g pm2

echo -e "${BLUE}[8/10] Configurando Firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo -e "${BLUE}[9/10] Clonando aplicação...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Se já existe, fazer backup
if [ -d "backend" ]; then
    echo "Fazendo backup da instalação anterior..."
    mv backend backend.bak.$(date +%s) 2>/dev/null || true
    mv frontend frontend.bak.$(date +%s) 2>/dev/null || true
fi

# Criar estrutura
mkdir -p backend frontend

echo -e "${GREEN}✅ Diretórios criados${NC}"

echo -e "${BLUE}[10/10] Instalando serviços...${NC}"
pm2 startup systemd -u root --hp /root
systemctl enable nginx
systemctl start nginx

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Setup Completo!"
echo "==========================================${NC}"
echo ""
echo "Próximos passos:"
echo "1. Fazer upload dos arquivos backend/ e frontend/"
echo "2. Executar deploy-app.sh para configurar aplicação"
echo ""
echo "Informações:"
echo "- IP: $DOMAIN"
echo "- Banco: $DB_NAME"
echo "- Usuário DB: $DB_USER"
echo "- App Dir: $APP_DIR"
