#!/bin/bash
# Script de Deploy da Aplicação
# Execute como usuário tradehub: sudo -u tradehub bash deploy-app.sh

set -e

APP_DIR="/var/www/tradehub"
REPO_URL="SEU_REPOSITORIO_GIT_AQUI"  # Altere para seu repositório

echo "==================================="
echo "Portal TradeHub - Deploy Aplicação"
echo "==================================="

cd $APP_DIR

# Se não existe o repositório, clone
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Clonando repositório..."
    git clone $REPO_URL .
else
    echo "🔄 Atualizando código..."
    git pull origin main
fi

# ========== BACKEND ==========
echo ""
echo "🐍 Configurando Backend (Python)..."
cd $APP_DIR/backend

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "⚠️  Criando arquivo .env - CONFIGURE AS VARIÁVEIS!"
    cat > .env << EOF
DATABASE_URL=mysql+pymysql://tradehub_user:SUA_SENHA_AQUI@localhost/tradehub_db
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_NAME=TradeHub Formações
DEBUG=False
ALLOWED_ORIGINS=https://seudominio.com,http://seudominio.com
EOF
fi

deactivate

# ========== FRONTEND ==========
echo ""
echo "⚛️  Configurando Frontend (React)..."
cd $APP_DIR/frontend

# Instalar dependências
npm install

# Criar arquivo .env.production se não existir
if [ ! -f ".env.production" ]; then
    echo "⚠️  Criando arquivo .env.production - CONFIGURE A API_URL!"
    cat > .env.production << EOF
VITE_API_URL=https://seudominio.com/api
EOF
fi

# Build do frontend
echo "🏗️  Fazendo build do frontend..."
npm run build

echo ""
echo "✅ Deploy da aplicação concluído!"
echo ""
echo "Próximos passos:"
echo "1. Configure o banco de dados (script configure-database.sh)"
echo "2. Configure o Nginx (script configure-nginx.sh)"
echo "3. Configure o PM2 para backend (script start-services.sh)"
