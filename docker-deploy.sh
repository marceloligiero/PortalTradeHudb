#!/bin/bash
# Script para deploy do TradeHub usando Docker na VPS
# Uso: ./docker-deploy.sh [start|stop|restart|status|logs|update|rebuild|backup]

set -e

PROJECT_ROOT="/var/www/tradehub"
BACKUP_DIR="/var/backups/tradehub"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml não encontrado!"
    log_info "Execute este script no diretório raiz do projeto: $PROJECT_ROOT"
    exit 1
fi

# Verificar se .env existe
check_env() {
    if [ ! -f ".env" ]; then
        log_warning "Arquivo .env não encontrado!"
        log_info "Criando .env a partir do .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Configure o arquivo .env antes de continuar!"
            exit 1
        else
            log_error ".env.example não encontrado!"
            exit 1
        fi
    fi
}

# Função para iniciar os containers
start_services() {
    log_info "Iniciando TradeHub com Docker..."
    check_env
    
    docker compose up -d
    
    log_success "Containers iniciados!"
    sleep 3
    docker compose ps
}

# Função para parar os containers
stop_services() {
    log_info "Parando containers..."
    docker compose down
    log_success "Containers parados"
}

# Função para reiniciar os containers
restart_services() {
    log_info "Reiniciando containers..."
    docker compose restart
    log_success "Containers reiniciados"
    docker compose ps
}

# Função para mostrar status
show_status() {
    log_info "Status dos containers:"
    docker compose ps
    echo ""
    log_info "Uso de recursos:"
    docker stats --no-stream
}

# Função para mostrar logs
show_logs() {
    if [ -z "$2" ]; then
        log_info "Mostrando logs de todos os containers (Ctrl+C para sair)..."
        docker compose logs -f
    else
        log_info "Mostrando logs de $2 (Ctrl+C para sair)..."
        docker compose logs -f "$2"
    fi
}

# Função para atualizar (pull + rebuild + restart)
update_services() {
    log_info "Atualizando TradeHub..."
    
    # Pull do código
    log_info "Fazendo pull do GitHub..."
    git pull origin main
    log_success "Código atualizado"
    
    # Rebuild e restart
    log_info "Reconstruindo e reiniciando containers..."
    docker compose up -d --build
    
    log_success "Atualização completa!"
    docker compose ps
}

# Função para rebuild completo (sem cache)
rebuild_services() {
    log_info "Rebuild completo (sem cache)..."
    
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    
    log_success "Rebuild completo!"
    docker compose ps
}

# Função para fazer backup do banco
backup_database() {
    log_info "Fazendo backup do banco de dados..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker compose exec -T db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" tradehub_db > "$BACKUP_FILE"
    
    log_success "Backup salvo em: $BACKUP_FILE"
    
    # Manter apenas últimos 7 backups
    log_info "Limpando backups antigos..."
    cd "$BACKUP_DIR" && ls -t | tail -n +8 | xargs -r rm
    log_success "Backups antigos removidos"
}

# Função para restaurar backup
restore_database() {
    if [ -z "$2" ]; then
        log_error "Especifique o arquivo de backup!"
        log_info "Uso: $0 restore /path/to/backup.sql"
        exit 1
    fi
    
    if [ ! -f "$2" ]; then
        log_error "Arquivo de backup não encontrado: $2"
        exit 1
    fi
    
    log_warning "ATENÇÃO: Isso irá substituir o banco de dados atual!"
    read -p "Tem certeza? (sim/não): " confirm
    
    if [ "$confirm" != "sim" ]; then
        log_info "Operação cancelada"
        exit 0
    fi
    
    log_info "Restaurando banco de dados..."
    docker compose exec -T db mysql -u root -p"${MYSQL_ROOT_PASSWORD}" tradehub_db < "$2"
    log_success "Banco de dados restaurado!"
}

# Função para limpar containers e volumes não utilizados
cleanup() {
    log_warning "Limpando containers e imagens não utilizadas..."
    docker system prune -f
    log_success "Limpeza concluída"
}

# Função para executar comando no container
exec_container() {
    if [ -z "$2" ]; then
        log_error "Especifique o container!"
        log_info "Uso: $0 exec [backend|frontend|db] [comando]"
        exit 1
    fi
    
    shift
    SERVICE=$1
    shift
    
    log_info "Executando comando no container $SERVICE..."
    docker compose exec "$SERVICE" "$@"
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
    logs)
        show_logs "$@"
        ;;
    update)
        update_services
        ;;
    rebuild)
        rebuild_services
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$@"
        ;;
    cleanup)
        cleanup
        ;;
    exec)
        exec_container "$@"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs|update|rebuild|backup|restore|cleanup|exec}"
        echo ""
        echo "Comandos:"
        echo "  start     - Inicia os containers"
        echo "  stop      - Para os containers"
        echo "  restart   - Reinicia os containers"
        echo "  status    - Mostra status e uso de recursos"
        echo "  logs      - Mostra logs (opcional: logs backend|frontend|db)"
        echo "  update    - Pull + rebuild + restart"
        echo "  rebuild   - Rebuild completo sem cache"
        echo "  backup    - Faz backup do banco de dados"
        echo "  restore   - Restaura backup (uso: restore /path/to/backup.sql)"
        echo "  cleanup   - Limpa containers e imagens não utilizados"
        echo "  exec      - Executa comando em container (uso: exec backend bash)"
        exit 1
        ;;
esac
