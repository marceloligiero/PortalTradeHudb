#!/bin/bash
set -e

echo "=========================================="
echo "Deploy Automático - Portal TradeHub"
echo "VPS: 72.60.188.172"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
REPO_URL="https://github.com/marceloligiero/PortalTradeHudb.git"
APP_DIR="/var/www/tradehub"
DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASSWORD="TradeHub2026!@Secure"

echo -e "${YELLOW}[1/8] Atualizando sistema...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1

echo -e "${YELLOW}[2/8] Instalando dependências...${NC}"
apt install -y curl wget git vim build-essential software-properties-common > /dev/null 2>&1

echo -e "${YELLOW}[3/8] Instalando Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1

echo -e "${YELLOW}[4/8] Instalando Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y > /dev/null 2>&1
apt update > /dev/null 2>&1
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip > /dev/null 2>&1

echo -e "${YELLOW}[5/8] Instalando MySQL...${NC}"
apt install -y mysql-server > /dev/null 2>&1

echo -e "${YELLOW}[6/8] Configurando MySQL...${NC}"
mysql << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${YELLOW}[7/8] Instalando Nginx e PM2...${NC}"
apt install -y nginx > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

echo -e "${YELLOW}[8/8] Configurando Firewall...${NC}"
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
echo "y" | ufw enable > /dev/null 2>&1

echo -e "${GREEN}✅ Setup básico concluído!${NC}"
echo ""

# Clonar repositório
echo -e "${YELLOW}Clonando repositório...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR
if [ -d ".git" ]; then
    git pull origin main
else
    git clone $REPO_URL .
fi

# Configurar Backend
echo -e "${YELLOW}Configurando Backend...${NC}"
cd $APP_DIR/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

cat > .env << EOF
DATABASE_URL=mysql+pymysql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_NAME=TradeHub Formações
DEBUG=False
ALLOWED_ORIGINS=http://72.60.188.172,https://72.60.188.172
EOF

deactivate

# Configurar Frontend
echo -e "${YELLOW}Configurando Frontend...${NC}"
cd $APP_DIR/frontend
npm install > /dev/null 2>&1

cat > .env.production << EOF
VITE_API_URL=http://72.60.188.172/api
EOF

npm run build > /dev/null 2>&1

# Configurar Nginx
echo -e "${YELLOW}Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/tradehub << 'NGINX_EOF'
server {
    listen 80;
    server_name 72.60.188.172;

    access_log /var/log/nginx/tradehub_access.log;
    error_log /var/log/nginx/tradehub_error.log;

    location / {
        root /var/www/tradehub/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/tradehub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Iniciar Backend
echo -e "${YELLOW}Iniciando Backend...${NC}"
cd $APP_DIR/backend
source venv/bin/activate
pm2 delete tradehub-backend 2>/dev/null || true
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4" --name tradehub-backend
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash

echo ""
echo -e "${GREEN}=========================================="
echo -e "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo -e "==========================================${NC}"
echo ""
echo -e "🌐 Acesse: ${YELLOW}http://72.60.188.172${NC}"
echo ""
echo -e "📊 Detalhes:"
echo -e "   Database: $DB_NAME"
echo -e "   DB User: $DB_USER"
echo -e "   DB Pass: $DB_PASSWORD"
echo ""
echo -e "📝 Comandos úteis:"
echo -e "   ${YELLOW}pm2 status${NC}              - Status do backend"
echo -e "   ${YELLOW}pm2 logs${NC}                - Ver logs"
echo -e "   ${YELLOW}pm2 restart all${NC}         - Reiniciar backend"
echo -e "   ${YELLOW}systemctl status nginx${NC}  - Status do Nginx"
echo ""
