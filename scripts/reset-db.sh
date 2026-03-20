#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# reset-db.sh — Limpa o banco MySQL mantendo apenas o admin (id=1)
#
# Uso:
#   bash scripts/reset-db.sh              # com backup automático
#   bash scripts/reset-db.sh --no-backup  # sem backup
#
# Requisitos: docker CLI com acesso ao container tradehub-db
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

CONTAINER="tradehub-db"
DB="tradehub_db"
BACKUP_DIR="database"
NO_BACKUP=false

[[ "${1:-}" == "--no-backup" ]] && NO_BACKUP=true

# Obter root password do container
ROOT_PW=$(docker exec "$CONTAINER" printenv MYSQL_ROOT_PASSWORD)

run_sql() {
  docker exec "$CONTAINER" sh -c "mysql -u root -p'$ROOT_PW' $DB -e \"$1\"" 2>/dev/null
}

echo "╔══════════════════════════════════════════════════════╗"
echo "║  PortalTradeHub — Database Reset                    ║"
echo "╚══════════════════════════════════════════════════════╝"

# ── 1. Verificar admin existe ───────────────────────────────
ADMIN_COUNT=$(run_sql "SELECT COUNT(*) FROM users WHERE id = 1 AND role = 'ADMIN';" | tail -1)
if [[ "$ADMIN_COUNT" != "1" ]]; then
  echo "ERRO: Admin user (id=1, role=ADMIN) não encontrado. Abortando."
  exit 1
fi
echo "[OK] Admin user verificado (id=1)"

# ── 2. Backup (opcional) ───────────────────────────────────
if [[ "$NO_BACKUP" == "false" ]]; then
  BACKUP_FILE="$BACKUP_DIR/backup_pre_reset_$(date +%Y%m%d_%H%M%S).sql"
  echo "[..] Criando backup em $BACKUP_FILE ..."
  docker exec "$CONTAINER" sh -c "mysqldump -u root -p'$ROOT_PW' $DB" > "$BACKUP_FILE" 2>/dev/null
  LINES=$(wc -l < "$BACKUP_FILE")
  echo "[OK] Backup criado ($LINES linhas)"
else
  echo "[--] Backup ignorado (--no-backup)"
fi

# ── 3. Limpeza ──────────────────────────────────────────────
echo "[..] Limpando banco de dados ..."

run_sql "
SET FOREIGN_KEY_CHECKS = 0;

-- Leaf / junction tables
TRUNCATE TABLE operation_errors;
TRUNCATE TABLE submission_errors;
TRUNCATE TABLE challenge_parts;
TRUNCATE TABLE challenge_operations;
TRUNCATE TABLE lesson_pauses;
TRUNCATE TABLE tutoria_error_refs;
TRUNCATE TABLE tutoria_error_motivos;
TRUNCATE TABLE tutoria_comments;
TRUNCATE TABLE tutoria_notifications;
TRUNCATE TABLE tutoria_learning_sheets;
TRUNCATE TABLE internal_error_classifications;
TRUNCATE TABLE learning_sheets;
TRUNCATE TABLE internal_error_action_items;
TRUNCATE TABLE internal_error_action_plans;
TRUNCATE TABLE chamado_comments;
TRUNCATE TABLE tutoria_action_items;
TRUNCATE TABLE tutoria_action_plans;
TRUNCATE TABLE password_reset_tokens;
TRUNCATE TABLE certificates;
TRUNCATE TABLE ratings;
TRUNCATE TABLE challenge_releases;
TRUNCATE TABLE challenge_submissions;
TRUNCATE TABLE challenges;
TRUNCATE TABLE lesson_progress;
TRUNCATE TABLE lessons;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE training_plan_trainers;
TRUNCATE TABLE training_plan_assignments;
TRUNCATE TABLE training_plan_courses;
TRUNCATE TABLE training_plan_banks;
TRUNCATE TABLE training_plan_products;
TRUNCATE TABLE training_plans;
TRUNCATE TABLE course_banks;
TRUNCATE TABLE course_products;
TRUNCATE TABLE courses;
TRUNCATE TABLE tutoria_errors;
TRUNCATE TABLE internal_errors;
TRUNCATE TABLE sensos;
TRUNCATE TABLE chamados;
TRUNCATE TABLE chat_faqs;
TRUNCATE TABLE team_members;
TRUNCATE TABLE team_services;

-- Master / reference data
TRUNCATE TABLE error_types;
TRUNCATE TABLE activities;
TRUNCATE TABLE tutoria_error_categories;
TRUNCATE TABLE error_impacts;
TRUNCATE TABLE error_origins;
TRUNCATE TABLE error_detected_by;
TRUNCATE TABLE departments;
TRUNCATE TABLE banks;
TRUNCATE TABLE products;
TRUNCATE TABLE teams;

-- Data Warehouse (keep dw_dim_date)
TRUNCATE TABLE dw_fact_training;
TRUNCATE TABLE dw_fact_tutoria;
TRUNCATE TABLE dw_fact_chamados;
TRUNCATE TABLE dw_fact_internal_errors;
TRUNCATE TABLE dw_fact_daily_snapshot;
TRUNCATE TABLE dw_dim_user;
TRUNCATE TABLE dw_dim_course;
TRUNCATE TABLE dw_dim_error_category;
TRUNCATE TABLE dw_dim_team;
TRUNCATE TABLE dw_dim_status;

-- Users: keep only admin (id=1)
DELETE FROM users WHERE id != 1;
UPDATE users SET team_id = NULL, tutor_id = NULL WHERE id = 1;

SET FOREIGN_KEY_CHECKS = 1;
"

echo "[OK] Limpeza concluída"

# ── 4. Verificação ──────────────────────────────────────────
USER_COUNT=$(run_sql "SELECT COUNT(*) FROM users;" | tail -1)
echo "[OK] Users restantes: $USER_COUNT (esperado: 1)"

ADMIN_EMAIL=$(run_sql "SELECT email FROM users WHERE id = 1;" | tail -1)
echo "[OK] Admin: $ADMIN_EMAIL"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Reset completo. Apenas o admin foi mantido."
echo "  Reinicie o backend para executar o ETL:"
echo "    docker restart tradehub-backend"
echo "════════════════════════════════════════════════════════"
