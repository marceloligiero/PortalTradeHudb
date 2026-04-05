#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# deploy/update.sh — Actualizar o servidor após git push
#
# Executar no servidor:
#   sudo bash /opt/tradehub/deploy/update.sh
#
# Ou com opções:
#   sudo bash deploy/update.sh --skip-pull    # não faz git pull
#   sudo bash deploy/update.sh --skip-build   # não refaz npm build
#   sudo bash deploy/update.sh --skip-migrate # não corre migrações
# ════════════════════════════════════════════════════════════════════════════
set -euo pipefail

INSTALL_DIR="/opt/tradehub"
APP_USER="tradehub"
SERVICE_NAME="tradehub"
VENV_DIR="$INSTALL_DIR/backend/.venv"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}  $*"; }
warn() { echo -e "${YELLOW}[AVISO]${NC}  $*"; }
info() { echo -e "${BLUE}[INFO]${NC}  $*"; }
err()  { echo -e "${RED}[ERRO]${NC}  $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && err "Execute como root: sudo bash deploy/update.sh"

# ── Argumentos ────────────────────────────────────────────────────────────────
SKIP_PULL=false
SKIP_BUILD=false
SKIP_MIGRATE=false
for arg in "$@"; do
    case $arg in
        --skip-pull)    SKIP_PULL=true ;;
        --skip-build)   SKIP_BUILD=true ;;
        --skip-migrate) SKIP_MIGRATE=true ;;
        *) warn "Argumento desconhecido: $arg" ;;
    esac
done

echo ""
echo "════════════════════════════════════════════"
echo "  PortalTradeHub — Actualização"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"
echo ""

cd "$INSTALL_DIR"

# ── 1. Git pull ───────────────────────────────────────────────────────────────
if [[ "$SKIP_PULL" == "false" ]]; then
    info "Fazendo git pull..."
    sudo -u "$APP_USER" git pull --ff-only origin main 2>/dev/null || \
    sudo -u "$APP_USER" git pull --ff-only origin master 2>/dev/null || \
    git pull --ff-only
    ok "Código actualizado."
else
    warn "git pull ignorado (--skip-pull)."
fi

CURRENT_COMMIT=$(git rev-parse --short HEAD)
info "Versão: $CURRENT_COMMIT"

# ── 2. Dependências Python (apenas se requirements.txt mudou) ─────────────────
if git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -q "requirements.txt"; then
    info "requirements.txt mudou — actualizando venv..."
    "$VENV_DIR/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" --quiet
    ok "Dependências Python actualizadas."
else
    info "requirements.txt não mudou — venv OK."
fi

# ── 3. Build do frontend ──────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == "false" ]]; then
    # Só refaz se ficheiros frontend mudaram
    FRONTEND_CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "^frontend/" || true)
    if [[ "$FRONTEND_CHANGED" -gt 0 ]] || [[ ! -d "$INSTALL_DIR/frontend/dist" ]]; then
        info "Frontend mudou — a recompilar..."
        cd "$INSTALL_DIR/frontend"
        npm ci --prefer-offline --quiet 2>/dev/null || npm install --quiet
        npm run build
        cd "$INSTALL_DIR"
        ok "Frontend recompilado."
    else
        info "Frontend não mudou — a saltar build."
    fi
else
    warn "Build do frontend ignorado (--skip-build)."
fi

# ── 4. Migrações ──────────────────────────────────────────────────────────────
if [[ "$SKIP_MIGRATE" == "false" ]]; then
    MIGRATIONS_CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "database/migrations/" || true)
    if [[ "$MIGRATIONS_CHANGED" -gt 0 ]]; then
        info "Novas migrations detectadas — a aplicar..."
        "$VENV_DIR/bin/python" scripts/run_migrations.py
        ok "Migrações aplicadas."
    else
        info "Sem novas migrations."
    fi
else
    warn "Migrações ignoradas (--skip-migrate)."
fi

# ── 5. Permissões ─────────────────────────────────────────────────────────────
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"

# ── 6. Restart do backend ─────────────────────────────────────────────────────
info "A reiniciar o backend..."
systemctl restart "$SERVICE_NAME"
sleep 3

# Verificar saúde
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health || echo "000")
if [[ "$HEALTH" == "200" ]]; then
    ok "Backend saudável: HTTP $HEALTH"
else
    err "Backend não respondeu (HTTP $HEALTH). Ver logs: journalctl -u tradehub -n 50"
fi

# ── 7. Reload nginx (se config mudou) ─────────────────────────────────────────
NGINX_CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "deploy/nginx.conf" || true)
if [[ "$NGINX_CHANGED" -gt 0 ]]; then
    info "nginx.conf mudou — a aplicar..."
    sed "s|/opt/tradehub|$INSTALL_DIR|g" \
        "$INSTALL_DIR/deploy/nginx.conf" \
        > /etc/nginx/sites-available/tradehub
    nginx -t && systemctl reload nginx
    ok "nginx recarregado."
fi

echo ""
echo "════════════════════════════════════════════"
echo "  Actualização concluída!"
echo "  Versão: $CURRENT_COMMIT"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"
