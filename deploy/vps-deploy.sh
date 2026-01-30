#!/bin/bash
set -e

echo "=========================================="
echo "Portal TradeHub - Deploy VPS Completo"
echo "=========================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="/var/www/tradehub"
DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASSWORD="TradeHub2026Secure"

# 1. Atualizar sistema
echo -e "${YELLOW}[1/10] Atualizando sistema...${NC}"
apt update -y
apt upgrade -y

# 2. Instalar dependências básicas
echo -e "${YELLOW}[2/10] Instalando dependências básicas...${NC}"
apt install -y curl wget git vim build-essential software-properties-common ufw

# 3. Instalar Node.js 20.x
echo -e "${YELLOW}[3/10] Instalando Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Instalar Python 3.11
echo -e "${YELLOW}[4/10] Instalando Python 3.11...${NC}"
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# 5. Instalar MySQL
echo -e "${YELLOW}[5/10] Instalando MySQL...${NC}"
apt install -y mysql-server

# 6. Configurar MySQL
echo -e "${YELLOW}[6/10] Configurando banco de dados...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 7. Instalar Nginx
echo -e "${YELLOW}[7/10] Instalando Nginx...${NC}"
apt install -y nginx

# 8. Instalar PM2
echo -e "${YELLOW}[8/10] Instalando PM2...${NC}"
npm install -g pm2

# 9. Clonar repositório
echo -e "${YELLOW}[9/10] Clonando repositório...${NC}"
mkdir -p ${APP_DIR}
cd ${APP_DIR}

if [ -d ".git" ]; then
    echo "Atualizando repositório existente..."
    git pull origin main || git pull origin master || echo "Usando código local"
else
    echo "Pulando clone - usando código local que será enviado"
fi

# 10. Configurar firewall
echo -e "${YELLOW}[10/10] Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo -e "${GREEN}=========================================="
echo -e "✅ Setup básico concluído!"
echo -e "==========================================${NC}"
echo ""
echo "Próximos passos:"
echo "1. Enviar código do projeto"
echo "2. Configurar backend e frontend"
echo "3. Configurar Nginx"
echo "4. Iniciar serviços"
