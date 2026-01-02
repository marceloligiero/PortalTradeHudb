#!/bin/bash
# Script de Setup para VPS Ubuntu - Portal TradeHub
# Execute este script na sua VPS após conectar via SSH

set -e

echo "==================================="
echo "Portal TradeHub - Setup VPS Ubuntu"
echo "==================================="

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo "🔧 Instalando dependências..."
sudo apt install -y curl wget git vim build-essential software-properties-common

# Instalar Node.js 20.x
echo "📗 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python 3.11+
echo "🐍 Instalando Python..."
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Instalar MySQL
echo "🐬 Instalando MySQL..."
sudo apt install -y mysql-server

# Instalar Nginx
echo "🌐 Instalando Nginx..."
sudo apt install -y nginx

# Instalar PM2 para gerenciar processos Node.js
echo "⚙️ Instalando PM2..."
sudo npm install -g pm2

# Instalar Certbot para SSL
echo "🔒 Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Criar usuário para a aplicação
echo "👤 Criando usuário 'tradehub'..."
sudo useradd -m -s /bin/bash tradehub || echo "Usuário já existe"

# Criar diretório da aplicação
echo "📁 Criando diretórios..."
sudo mkdir -p /var/www/tradehub
sudo chown -R tradehub:tradehub /var/www/tradehub

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo ""
echo "✅ Setup básico concluído!"
echo ""
echo "Próximos passos:"
echo "1. Configure o MySQL: sudo mysql_secure_installation"
echo "2. Clone o repositório em /var/www/tradehub"
echo "3. Execute o script deploy-app.sh"
