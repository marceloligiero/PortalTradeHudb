# ===============================================
# GUIA DE DEPLOY MANUAL - Portal TradeHub
# VPS Hostinger - 72.60.188.172
# ===============================================

## PASSO 1: Conectar na VPS
Abra um terminal PowerShell e execute:

```powershell
ssh root@72.60.188.172
# Senha: Escambal4...
```

## PASSO 2: Instalar Dependências

Cole e execute todo este bloco de uma vez:

```bash
# Atualizar sistema
export DEBIAN_FRONTEND=noninteractive
apt update -y && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git vim build-essential software-properties-common ufw

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar Python 3.11
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Instalar MySQL
apt install -y mysql-server

# Instalar Nginx
apt install -y nginx

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

echo "✅ Todas as dependências instaladas!"
```

## PASSO 3: Configurar MySQL

```bash
# Iniciar MySQL
systemctl start mysql
systemctl enable mysql

# Criar banco de dados e usuário
mysql -u root << 'EOFMYSQL'
CREATE DATABASE IF NOT EXISTS tradehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'tradehub_user'@'localhost' IDENTIFIED BY 'TradeHub2026SecurePass';
GRANT ALL PRIVILEGES ON tradehub_db.* TO 'tradehub_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOFMYSQL

echo "✅ Banco de dados configurado!"
```

## PASSO 4: Criar Diretórios

```bash
mkdir -p /var/www/tradehub
cd /var/www/tradehub
echo "✅ Diretórios criados!"
```

## PASSO 5: Fazer Upload dos Arquivos

Abra OUTRO terminal PowerShell na sua máquina local (não na VPS) e execute:

```powershell
cd "C:\Users\ripma\Desktop\Portal Formações\PortalTradeHudb"

# Enviar backend
scp -r backend root@72.60.188.172:/var/www/tradehub/

# Enviar frontend
scp -r frontend root@72.60.188.172:/var/www/tradehub/

# Enviar database
scp -r database root@72.60.188.172:/var/www/tradehub/

# Senha: Escambal4...
```

## PASSO 6: Configurar Backend (na VPS)

Volte para o terminal da VPS e execute:

```bash
cd /var/www/tradehub/backend

# Criar ambiente virtual Python
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env
cat > .env << 'EOF'
DATABASE_URL=mysql+pymysql://tradehub_user:TradeHub2026SecurePass@localhost/tradehub_db
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_NAME=TradeHub Formações
DEBUG=False
ALLOWED_ORIGINS=http://72.60.188.172,https://72.60.188.172,http://srv1242193.hstgr.cloud
EOF

# Executar migrações do banco
alembic upgrade head || echo "Migrações não encontradas, pulando..."

# Criar usuário admin (opcional)
python3.11 -c "
from app.database import get_db
from app.models import User
from app.auth import get_password_hash

db = next(get_db())
admin = User(
    email='admin@tradehub.com',
    username='admin',
    full_name='Administrador',
    hashed_password=get_password_hash('Admin@123'),
    is_active=True,
    is_admin=True
)
db.add(admin)
db.commit()
print('✅ Usuário admin criado!')
" || echo "Usuário já existe"

deactivate

echo "✅ Backend configurado!"
```

## PASSO 7: Configurar Frontend (na VPS)

```bash
cd /var/www/tradehub/frontend

# Instalar dependências
npm install

# Criar arquivo .env.production
cat > .env.production << 'EOF'
VITE_API_BASE_URL=http://72.60.188.172/api
EOF

# Fazer build de produção
npm run build

echo "✅ Frontend configurado e compilado!"
```

## PASSO 8: Iniciar Backend com PM2

```bash
cd /var/www/tradehub/backend

# Iniciar backend com PM2
pm2 start venv/bin/python --name tradehub-backend -- -m uvicorn main:app --host 127.0.0.1 --port 8000

# Salvar configuração do PM2
pm2 save
pm2 startup systemd

echo "✅ Backend rodando com PM2!"
```

## PASSO 9: Configurar Nginx

```bash
# Criar configuração do Nginx
cat > /etc/nginx/sites-available/tradehub << 'EOF'
server {
    listen 80;
    server_name 72.60.188.172 srv1242193.hstgr.cloud;

    # Frontend (arquivos estáticos)
    location / {
        root /var/www/tradehub/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Docs do backend
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000/redoc;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/tradehub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configurado!"
```

## PASSO 10: Configurar Firewall

```bash
# Configurar firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo "✅ Firewall configurado!"
```

## PASSO 11: Verificar Status

```bash
# Verificar serviços
echo "=== Status dos Serviços ==="
echo ""
echo "Backend (PM2):"
pm2 status

echo ""
echo "Nginx:"
systemctl status nginx --no-pager

echo ""
echo "MySQL:"
systemctl status mysql --no-pager

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "Acesse a aplicação em:"
echo "http://72.60.188.172"
echo "ou"
echo "http://srv1242193.hstgr.cloud"
```

## COMANDOS ÚTEIS

### Ver logs do backend:
```bash
pm2 logs tradehub-backend
```

### Reiniciar backend:
```bash
pm2 restart tradehub-backend
```

### Ver logs do Nginx:
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Atualizar aplicação:
```bash
cd /var/www/tradehub
# Fazer upload dos novos arquivos via scp
pm2 restart tradehub-backend
```

## PRONTO! 🎉

A aplicação deve estar rodando em:
- **Frontend**: http://72.60.188.172
- **Backend API**: http://72.60.188.172/api
- **Documentação**: http://72.60.188.172/docs
