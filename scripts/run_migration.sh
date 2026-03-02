#!/usr/bin/env bash
# =============================================================================
# run_migration.sh — Executa migration_new_modules.sql usando o .env do backend
# Uso: bash scripts/run_migration.sh [caminho_para_.env]
#
# Exemplos:
#   bash scripts/run_migration.sh
#   bash scripts/run_migration.sh /opt/tradehub/backend/.env
# =============================================================================

set -euo pipefail

# ── Localizar o .env ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${1:-$ROOT_DIR/backend/.env}"
MIGRATION="$ROOT_DIR/database/migration_new_modules.sql"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Ficheiro .env não encontrado: $ENV_FILE"
    exit 1
fi

if [[ ! -f "$MIGRATION" ]]; then
    echo "❌ Script de migração não encontrado: $MIGRATION"
    exit 1
fi

# ── Ler DATABASE_URL do .env ──────────────────────────────────────────────────
DATABASE_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)

if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL não encontrado em $ENV_FILE"
    exit 1
fi

# ── Fazer parse da URL: mysql+pymysql://user:pass@host:port/dbname ────────────
# Remove prefixo do driver (mysql+pymysql:// ou mysql://)
URL="${DATABASE_URL#*://}"

# Separar credenciais do resto
CREDENTIALS="${URL%%@*}"
HOSTDB="${URL#*@}"

# Utilizador e password
DB_USER="${CREDENTIALS%%:*}"
DB_PASS="${CREDENTIALS#*:}"
# Se não houver ':', user e pass são iguais → sem password
[[ "$CREDENTIALS" == *:* ]] || DB_PASS=""

# Host, porta e nome da base de dados
HOSTPORT="${HOSTDB%%/*}"
DB_NAME="${HOSTDB#*/}"
DB_NAME="${DB_NAME%%\?*}"   # remover query string (?charset=utf8...)

DB_HOST="${HOSTPORT%%:*}"
DB_PORT="${HOSTPORT#*:}"
[[ "$HOSTPORT" == *:* ]] || DB_PORT="3306"

# ── Resumo ────────────────────────────────────────────────────────────────────
echo "============================================="
echo "  Portal TradeHub — Migração de produção"
echo "============================================="
echo "  Host     : $DB_HOST:$DB_PORT"
echo "  Utilizador: $DB_USER"
echo "  Base dados: $DB_NAME"
echo "  Script    : $MIGRATION"
echo "============================================="
echo ""
read -r -p "Confirmar execução? [s/N] " CONFIRM
[[ "$CONFIRM" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }

# ── Executar migração ─────────────────────────────────────────────────────────
MYSQL_ARGS=(-u "$DB_USER" -h "$DB_HOST" -P "$DB_PORT")
[[ -n "$DB_PASS" ]] && MYSQL_ARGS+=("-p$DB_PASS")

echo ""
echo "A executar migração..."
mysql "${MYSQL_ARGS[@]}" "$DB_NAME" < "$MIGRATION"

echo ""
echo "✅ Migração concluída com sucesso!"
