#!/bin/bash
set -e

echo "=========================================="
echo "Deploy Completo - Portal TradeHub"
echo "VPS: 72.60.188.172"
echo "=========================================="

# Variáveis
APP_DIR="/var/www/tradehub"
DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASSWORD="TradeHub2026Secure"

# 1. Atualizar sistema
echo "[1/10] Atualizando sistema..."
apt update -y && apt upgrade -y

# 2. Instalar dependências básicas
echo "[2/10] Instalando dependências básicas..."
apt install -y curl wget git vim build-essential software-properties-common ufw

# 3. Instalar Node.js 20.x
echo "[3/10] Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Instalar Python 3.11
echo "[4/10] Instalando Python..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# 5. Instalar MySQL
echo "[5/10] Instalando MySQL..."
apt install -y mysql-server

# 6. Configurar MySQL
echo "[6/10] Configurando banco de dados..."
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 7. Instalar Nginx
echo "[7/10] Instalando Nginx..."
apt install -y nginx

# 8. Instalar PM2
echo "[8/10] Instalando PM2..."
npm install -g pm2

# 9. Criar diretório e clonar repositório
echo "[9/10] Preparando aplicação..."
mkdir -p $APP_DIR
cd $APP_DIR

# Se já existe, limpa
rm -rf *

# Criar estrutura básica
mkdir -p backend frontend deploy

# 10. Configurar Firewall
echo "[10/10] Configurando Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable || true

echo ""
echo "✅ Setup base concluído!"
echo "Agora vou receber os arquivos da aplicação..."
