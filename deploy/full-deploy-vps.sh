#!/bin/bash
# =================================================
# SCRIPT DE DEPLOY COMPLETO - Portal TradeHub
# Execute na VPS: bash < (curl -s https://raw.githubusercontent.com/.../full-deploy.sh)
# Ou: wget -O- URL | bash
# Ou copie este arquivo para a VPS e execute: bash full-deploy.sh
# =================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/tradehub"
DB_NAME="tradehub_db"
DB_USER="tradehub_user"
DB_PASS="TradeHub2026SecurePass"
DOMAIN="72.60.188.172"

echo -e "${BLUE}"
echo "================================================="
echo "🚀 Deploy Automático - Portal TradeHub"
echo "================================================="
echo -e "${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo bash $0${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/12] Atualizando sistema...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update -y > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1

echo -e "${YELLOW}[2/12] Instalando dependências básicas...${NC}"
apt install -y curl wget git vim build-essential software-properties-common ufw > /dev/null 2>&1

echo -e "${YELLOW}[3/12] Instalando Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1

echo -e "${YELLOW}[4/12] Instalando Python 3.11...${NC}"
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip > /dev/null 2>&1

echo -e "${YELLOW}[5/12] Instalando MySQL...${NC}"
apt install -y mysql-server > /dev/null 2>&1
systemctl start mysql
systemctl enable mysql

echo -e "${YELLOW}[6/12] Configurando banco de dados...${NC}"
mysql -u root << EOFMYSQL
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOFMYSQL

echo -e "${GREEN}✅ Banco de dados criado: $DB_NAME${NC}"

echo -e "${YELLOW}[7/12] Instalando Nginx e PM2...${NC}"
apt install -y nginx > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

echo -e "${YELLOW}[8/12] Configurando firewall...${NC}"
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
echo "y" | ufw enable > /dev/null 2>&1

echo -e "${YELLOW}[9/12] Criando diretórios...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}[10/12] Configurando PM2 para iniciar no boot...${NC}"
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

echo -e "${YELLOW}[11/12] Habilitando serviços...${NC}"
systemctl enable nginx
systemctl enable mysql
systemctl start nginx

echo -e "${YELLOW}[12/12] Criando scripts auxiliares...${NC}"

# Script para configurar aplicação após upload
cat > $APP_DIR/setup-app.sh << 'EOFSETUP'
#!/bin/bash
set -e

APP_DIR="/var/www/tradehub"
DB_USER="tradehub_user"
DB_PASS="TradeHub2026SecurePass"
DB_NAME="tradehub_db"

echo "Configurando Backend..."
cd $APP_DIR/backend

# Criar venv
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip > /dev/null
pip install -r requirements.txt > /dev/null

# Criar .env
cat > .env << EOF
DATABASE_URL=mysql+pymysql://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_NAME=TradeHub Formações
DEBUG=False
ALLOWED_ORIGINS=http://72.60.188.172,https://72.60.188.172
EOF

deactivate
echo "✅ Backend configurado!"

echo "Configurando Frontend..."
cd $APP_DIR/frontend

npm install > /dev/null

cat > .env.production << EOF
VITE_API_BASE_URL=http://72.60.188.172/api
EOF

npm run build > /dev/null
echo "✅ Frontend buildado!"

echo "Iniciando serviços..."
cd $APP_DIR/backend
pm2 delete tradehub-backend 2>/dev/null || true
pm2 start venv/bin/python --name tradehub-backend -- -m uvicorn main:app --host 127.0.0.1 --port 8000
pm2 save

echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/tradehub << 'EOFNGINX'
server {
    listen 80;
    server_name 72.60.188.172 srv1242193.hstgr.cloud;

    location / {
        root /var/www/tradehub/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000/redoc;
    }
}
EOFNGINX

ln -sf /etc/nginx/sites-available/tradehub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "Acesse: http://72.60.188.172"
echo "API Docs: http://72.60.188.172/docs"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs tradehub-backend  # Ver logs"
echo "  pm2 restart tradehub-backend  # Reiniciar"
EOFSETUP

chmod +x $APP_DIR/setup-app.sh

echo ""
echo -e "${GREEN}================================================="
echo "✅ SETUP INICIAL CONCLUÍDO!"
echo "=================================================${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo ""
echo "1. Envie os arquivos da sua máquina local:"
echo -e "${YELLOW}"
echo "   scp -r backend root@72.60.188.172:/var/www/tradehub/"
echo "   scp -r frontend root@72.60.188.172:/var/www/tradehub/"
echo "   scp -r database root@72.60.188.172:/var/www/tradehub/"
echo -e "${NC}"
echo "2. Execute o script de configuração:"
echo -e "${YELLOW}"
echo "   bash /var/www/tradehub/setup-app.sh"
echo -e "${NC}"
echo ""
echo "Informações:"
echo "  • IP: 72.60.188.172"
echo "  • App Dir: /var/www/tradehub"
echo "  • Database: $DB_NAME"
echo "  • DB User: $DB_USER"
echo ""
