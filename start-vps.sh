#!/bin/bash
# Script unificado para iniciar/parar o TradeHub no VPS
# Uso: ./start-vps.sh [start|stop|restart|status]

set -e

PROJECT_ROOT="/var/www/tradehub"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Função para iniciar os serviços
start_services() {
    log_info "Iniciando TradeHub..."
    
    # Atualizar código do GitHub
    log_info "Atualizando código do GitHub..."
    cd "$PROJECT_ROOT"
    git pull origin main
    log_success "Código atualizado"
    
    # Atualizar dependências do backend e garantir SQLAlchemy compatível
    log_info "Verificando dependências do backend..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    pip install -r requirements.txt --upgrade --quiet
    log_success "Dependências do backend atualizadas"
    
    # Build do frontend
    log_info "Fazendo build do frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm run build
    log_success "Frontend compilado"
    
    # Reiniciar serviços com PM2
    log_info "Reiniciando serviços..."
    pm2 restart tradehub-api
    sleep 2
    
    # Verificar status
    log_success "TradeHub iniciado!"
    pm2 status
}

# Função para parar os serviços
stop_services() {
    log_info "Parando TradeHub..."
    pm2 stop tradehub-api 2>/dev/null || true
    log_success "Serviços parados"
    pm2 status
}

# Função para reiniciar os serviços
restart_services() {
    log_info "Reiniciando TradeHub..."
    stop_services
    sleep 2
    start_services
}

# Função para mostrar status
show_status() {
    log_info "Status dos serviços:"
    pm2 status
    echo ""
    log_info "Últimas 20 linhas do log do backend:"
    pm2 logs tradehub-api --lines 20 --nostream
}

# Função para atualizar sem rebuild (apenas pull + restart)
quick_update() {
    log_info "Atualização rápida (sem rebuild)..."
    cd "$PROJECT_ROOT"
    git pull origin main
    log_success "Código atualizado"
    
    log_info "Atualizando dependências do backend..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    pip install -r requirements.txt --upgrade --quiet
    
    pm2 restart tradehub-api
    log_success "Backend reiniciado"
    pm2 status
}

# Função para atualizar apenas o frontend
update_frontend() {
    log_info "Atualizando frontend..."
    cd "$PROJECT_ROOT"
    git pull origin main
    
    cd "$PROJECT_ROOT/frontend"
    npm run build
    log_success "Frontend atualizado"
}

# Menu principal
case "${1:-status}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    update)
        start_services
        ;;
    quick)
        quick_update
        ;;
    frontend)
        update_frontend
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|update|quick|frontend}"
        echo ""
        echo "Comandos:"
        echo "  start     - Atualiza código, dependências, faz build e inicia"
        echo "  stop      - Para todos os serviços"
        echo "  restart   - Para e inicia novamente"
        echo "  status    - Mostra status e logs"
        echo "  update    - Igual a 'start' (atualização completa)"
        echo "  quick     - Atualização rápida (sem rebuild do frontend)"
        echo "  frontend  - Atualiza apenas o frontend"
        exit 1
        ;;
esac
