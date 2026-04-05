#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# deploy/install.sh — Instalação inicial no servidor (Ubuntu 22.04 / 24.04)
#
# Executar como root ou com sudo:
#   sudo bash deploy/install.sh
#
# O que faz:
#   1. Instala dependências do sistema (python3, node, nginx, mysql)
#   2. Cria utilizador 'tradehub' dedicado
#   3. Copia o projecto para /opt/tradehub/
#   4. Cria Python venv + instala requirements.txt
#   5. Build do frontend (npm ci + npm run build)
#   6. Cria base de dados MySQL e utilizador
#   7. Corre migrações (scripts/run_migrations.py)
#   8. Instala e activa o serviço systemd
#   9. Configura nginx
# ════════════════════════════════════════════════════════════════════════════
set -euo pipefail

INSTALL_DIR="/opt/tradehub"
APP_USER="tradehub"
SERVICE_NAME="tradehub"
BACKEND_PORT="8000"

# Cores
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}  $*"; }
warn() { echo -e "${YELLOW}[AVISO]${NC}  $*"; }
err()  { echo -e "${RED}[ERRO]${NC}  $*" >&2; exit 1; }

# ── Verificar root ────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Execute como root: sudo bash deploy/install.sh"

# ── Detectar a raiz do projecto ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "════════════════════════════════════════════"
echo "  PortalTradeHub — Instalação no servidor"
echo "  Projecto: $PROJECT_DIR"
echo "  Destino:  $INSTALL_DIR"
echo "════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 1 — Pacotes do sistema
# ─────────────────────────────────────────────────────────────────────────────
echo "[1/9] Instalando dependências do sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -q

# Python 3.11+
apt-get install -yq python3 python3-pip python3-venv python3-dev \
    build-essential libmysqlclient-dev pkg-config

# Node.js 20 LTS
if ! command -v node &>/dev/null || [[ $(node -e "process.exit(parseInt(process.version.slice(1))>=18?0:1)" 2>/dev/null; echo $?) -ne 0 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -yq nodejs
fi

# nginx
apt-get install -yq nginx

# MySQL 8.0
if ! command -v mysql &>/dev/null; then
    apt-get install -yq mysql-server mysql-client
    systemctl enable mysql
    systemctl start mysql
fi

# Utilitários
apt-get install -yq git curl wget unzip logrotate

ok "Pacotes instalados: python=$(python3 --version), node=$(node -v), nginx=$(nginx -v 2>&1), mysql=$(mysql --version)"

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 2 — Utilizador e directório
# ─────────────────────────────────────────────────────────────────────────────
echo "[2/9] Criando utilizador '$APP_USER'..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --shell /bin/bash --home "$INSTALL_DIR" --create-home "$APP_USER"
    ok "Utilizador '$APP_USER' criado."
else
    warn "Utilizador '$APP_USER' já existe."
fi

mkdir -p "$INSTALL_DIR"
mkdir -p /var/log/tradehub

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 3 — Copiar ficheiros do projecto
# ─────────────────────────────────────────────────────────────────────────────
echo "[3/9] Copiando ficheiros do projecto..."
# Copiar tudo exceto .git, node_modules, .venv, __pycache__
rsync -a --delete \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='frontend/node_modules/' \
    --exclude='backend/.venv/' \
    --exclude='backend/__pycache__/' \
    --exclude='**/__pycache__/' \
    --exclude='*.pyc' \
    --exclude='frontend/dist/' \
    --exclude='logs/' \
    --exclude='.env' \
    "$PROJECT_DIR/" "$INSTALL_DIR/"

ok "Ficheiros copiados para $INSTALL_DIR/"

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 4 — Configurar backend/.env
# ─────────────────────────────────────────────────────────────────────────────
echo "[4/9] Configurando backend/.env..."
ENV_FILE="$INSTALL_DIR/backend/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$INSTALL_DIR/deploy/env.production.example" ]]; then
        cp "$INSTALL_DIR/deploy/env.production.example" "$ENV_FILE"
        warn "backend/.env criado a partir do template."
        warn "OBRIGATÓRIO: editar $ENV_FILE com:"
        warn "  DATABASE_URL — senha da BD"
        warn "  SECRET_KEY   — chave JWT única"
        echo ""
        echo "  Execute: nano $ENV_FILE"
        echo ""
    fi
else
    ok "backend/.env já existe."
fi

# Verificar se os valores placeholder ainda estão lá
if grep -q "SENHA_FORTE_AQUI\|GERAR_CHAVE_UNICA_AQUI" "$ENV_FILE" 2>/dev/null; then
    err "backend/.env contém valores placeholder. Preencha antes de continuar."
fi

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 5 — Python venv + dependências
# ─────────────────────────────────────────────────────────────────────────────
echo "[5/9] Criando Python venv e instalando dependências..."
VENV_DIR="$INSTALL_DIR/backend/.venv"

if [[ ! -d "$VENV_DIR" ]]; then
    python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --upgrade pip --quiet
"$VENV_DIR/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" --quiet

ok "Python venv pronto: $($VENV_DIR/bin/python --version)"

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 6 — Build do frontend
# ─────────────────────────────────────────────────────────────────────────────
echo "[6/9] Build do frontend React..."
cd "$INSTALL_DIR/frontend"

# .env do frontend para produção (API no mesmo host)
cat > "$INSTALL_DIR/frontend/.env.production" << 'FRONTEND_ENV'
VITE_API_URL=/api
VITE_API_BASE_URL=
FRONTEND_ENV

npm ci --prefer-offline --quiet 2>/dev/null || npm install --quiet
npm run build

ok "Frontend compilado: $(du -sh "$INSTALL_DIR/frontend/dist" | cut -f1)"
cd "$INSTALL_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 7 — Base de dados MySQL
# ─────────────────────────────────────────────────────────────────────────────
echo "[7/9] Configurando base de dados MySQL..."

# Extrair credenciais do .env
DB_URL=$(grep "^DATABASE_URL" "$ENV_FILE" | cut -d= -f2-)
DB_USER=$(echo "$DB_URL" | sed 's|mysql+pymysql://||' | cut -d: -f1)
DB_PASS=$(echo "$DB_URL" | cut -d: -f3 | cut -d@ -f1)
DB_HOST=$(echo "$DB_URL" | cut -d@ -f2 | cut -d: -f1)
DB_PORT=$(echo "$DB_URL" | cut -d@ -f2 | grep -oP ':\d+' | tr -d ':' || echo "3306")
DB_NAME=$(echo "$DB_URL" | rev | cut -d/ -f1 | rev)

# Criar BD e utilizador via mysql root (socket auth)
mysql --user=root << SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
  IDENTIFIED BY '${DB_PASS}';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX,
      DROP, REFERENCES, LOCK TABLES
  ON \`${DB_NAME}\`.*
  TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;
SQL

ok "Base de dados '$DB_NAME' e utilizador '$DB_USER' configurados."

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 8 — Migrações + seed admin
# ─────────────────────────────────────────────────────────────────────────────
echo "[8/9] Aplicando migrações e seed..."
cd "$INSTALL_DIR"
"$VENV_DIR/bin/python" scripts/run_migrations.py

ok "Migrações aplicadas."

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 9 — systemd + nginx
# ─────────────────────────────────────────────────────────────────────────────
echo "[9/9] Configurando systemd e nginx..."

# Ajustar WorkingDirectory e ExecStart com o caminho real
sed "s|/opt/tradehub|$INSTALL_DIR|g" \
    "$INSTALL_DIR/deploy/tradehub.service" \
    > /etc/systemd/system/tradehub.service

# Corrigir User= (se INSTALL_DIR não for /opt/tradehub, APP_USER pode ser diferente)
sed -i "s/^User=.*/User=$APP_USER/" /etc/systemd/system/tradehub.service
sed -i "s/^Group=.*/Group=$APP_USER/" /etc/systemd/system/tradehub.service

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

# nginx
sed "s|/opt/tradehub|$INSTALL_DIR|g" \
    "$INSTALL_DIR/deploy/nginx.conf" \
    > /etc/nginx/sites-available/tradehub

ln -sf /etc/nginx/sites-available/tradehub /etc/nginx/sites-enabled/tradehub
rm -f /etc/nginx/sites-enabled/default

nginx -t || err "Configuração nginx inválida."

# ── Permissões ────────────────────────────────────────────────────────────────
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"
chown -R "$APP_USER:$APP_USER" /var/log/tradehub

# ── Logrotate ─────────────────────────────────────────────────────────────────
cat > /etc/logrotate.d/tradehub << 'LOGROTATE'
/var/log/tradehub/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 tradehub tradehub
    postrotate
        systemctl kill -s USR1 tradehub.service 2>/dev/null || true
    endscript
}
LOGROTATE

# ── Iniciar serviços ──────────────────────────────────────────────────────────
systemctl start "$SERVICE_NAME"
sleep 3
systemctl reload nginx

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Instalação concluída!"
echo ""
echo "  Estado do backend:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -10
echo ""
echo "  Testar:"
echo "    curl http://localhost:$BACKEND_PORT/api/health"
echo "    curl http://localhost/api/health"
echo ""
echo "  Logs em tempo real:"
echo "    sudo journalctl -u tradehub -f"
echo ""
echo "  Próximos passos:"
echo "    1. Alterar a senha do admin em http://localhost/"
echo "    2. Configurar firewall: ufw allow 80 && ufw enable"
echo "    3. Configurar HTTPS: certbot --nginx"
echo "════════════════════════════════════════════════════════════"
