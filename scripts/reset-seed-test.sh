#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# reset-seed-test.sh — Pipeline completo: Limpa BD → Seed Users → Testes E2E
#
# Uso:
#   bash scripts/reset-seed-test.sh              # pipeline completo
#   bash scripts/reset-seed-test.sh --no-backup  # sem backup
#   bash scripts/reset-seed-test.sh --test-only  # só testes (sem reset)
#
# Requisitos: docker CLI com acesso aos containers tradehub-db e tradehub-backend
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

CONTAINER_DB="tradehub-db"
CONTAINER_BACKEND="tradehub-backend"
DB="tradehub_db"
BACKUP_DIR="database"
NO_BACKUP=false
TEST_ONLY=false

for arg in "$@"; do
  case $arg in
    --no-backup)  NO_BACKUP=true ;;
    --test-only)  TEST_ONLY=true ;;
  esac
done

ROOT_PW=$(docker exec "$CONTAINER_DB" printenv MYSQL_ROOT_PASSWORD)

run_sql() {
  docker exec "$CONTAINER_DB" sh -c "mysql -u root -p'$ROOT_PW' $DB -e \"$1\"" 2>/dev/null
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PortalTradeHub — Reset + Seed + E2E Test Pipeline          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ══════════════════════════════════════════════════════════════════════
# ETAPA 1: LIMPEZA DO BANCO
# ══════════════════════════════════════════════════════════════════════
if [[ "$TEST_ONLY" == "false" ]]; then
  echo "━━━ ETAPA 1: Limpeza do Banco de Dados ━━━"

  # Verificar admin existe
  ADMIN_COUNT=$(run_sql "SELECT COUNT(*) FROM users WHERE id = 1 AND role = 'ADMIN';" | tail -1)
  if [[ "$ADMIN_COUNT" != "1" ]]; then
    echo "ERRO: Admin user (id=1, role=ADMIN) não encontrado. Abortando."
    exit 1
  fi
  echo "[OK] Admin user verificado (id=1)"

  # Backup
  if [[ "$NO_BACKUP" == "false" ]]; then
    BACKUP_FILE="$BACKUP_DIR/backup_pre_reset_$(date +%Y%m%d_%H%M%S).sql"
    echo "[..] Criando backup em $BACKUP_FILE ..."
    docker exec "$CONTAINER_DB" sh -c "mysqldump -u root -p'$ROOT_PW' $DB" > "$BACKUP_FILE" 2>/dev/null
    LINES=$(wc -l < "$BACKUP_FILE")
    echo "[OK] Backup criado ($LINES linhas)"
  else
    echo "[--] Backup ignorado (--no-backup)"
  fi

  # Limpeza
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

  USER_COUNT=$(run_sql "SELECT COUNT(*) FROM users;" | tail -1)
  echo "[OK] Limpeza concluída — Users restantes: $USER_COUNT"
  echo ""

# ══════════════════════════════════════════════════════════════════════
# ETAPA 2: SEED DE UTILIZADORES
# ══════════════════════════════════════════════════════════════════════
  echo "━━━ ETAPA 2: Seed de Utilizadores por Role ━━━"

  docker exec "$CONTAINER_BACKEND" sh -c 'cd /app/backend && python -c "
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()
pw = get_password_hash(\"Test1234!\")

USERS = [
    dict(email=\"manager_test@tradehub.com\", full_name=\"Manager Test\",
         role=\"MANAGER\", is_active=True, is_pending=False, is_team_lead=True),
    dict(email=\"chefe_test@tradehub.com\", full_name=\"Chefe Test\",
         role=\"MANAGER\", is_active=True, is_pending=False, is_team_lead=True),
    dict(email=\"trainer_test@tradehub.com\", full_name=\"Trainer Test\",
         role=\"TRAINER\", is_active=True, is_pending=False, is_trainer=True),
    dict(email=\"pending_trainer@tradehub.com\", full_name=\"Pending Trainer\",
         role=\"TRAINER\", is_active=True, is_pending=True, is_trainer=True),
    dict(email=\"student_test@tradehub.com\", full_name=\"Student Test\",
         role=\"TRAINEE\", is_active=True, is_pending=False),
    dict(email=\"student2_test@tradehub.com\", full_name=\"Student 2 Test\",
         role=\"TRAINEE\", is_active=True, is_pending=False),
    dict(email=\"tutor_test@tradehub.com\", full_name=\"Tutor Test\",
         role=\"TRAINEE\", is_active=True, is_pending=False, is_tutor=True),
    dict(email=\"liberador_test@tradehub.com\", full_name=\"Liberador Test\",
         role=\"TRAINEE\", is_active=True, is_pending=False, is_liberador=True),
    dict(email=\"referente_test@tradehub.com\", full_name=\"Referente Test\",
         role=\"TRAINEE\", is_active=True, is_pending=False, is_referente=True),
]

created = 0
for u in USERS:
    existing = db.query(User).filter(User.email == u[\"email\"]).first()
    if existing:
        for k, v in u.items():
            if k not in (\"email\", \"full_name\"):
                setattr(existing, k, v)
        db.commit()
    else:
        user = User(hashed_password=pw, **u)
        db.add(user)
        db.commit()
        created += 1

db.close()
print(f\"[OK] Seed: {created} criados, {len(USERS)-created} atualizados\")
"'

  # Verificar seed
  TOTAL_USERS=$(run_sql "SELECT COUNT(*) FROM users;" | tail -1)
  echo "[OK] Total users no banco: $TOTAL_USERS (esperado: 10)"
  echo ""

  # Reiniciar backend
  echo "[..] Reiniciando backend ..."
  docker restart "$CONTAINER_BACKEND" > /dev/null
  sleep 5
  HEALTH=$(docker exec "$CONTAINER_BACKEND" sh -c 'curl -sf http://localhost:8000/api/health' 2>&1 || echo "FAIL")
  echo "[OK] Backend health: $HEALTH"
  echo ""
else
  echo "[--] Reset/Seed ignorado (--test-only)"
  echo ""
fi

# ══════════════════════════════════════════════════════════════════════
# ETAPA 3: TESTES E2E
# ══════════════════════════════════════════════════════════════════════
echo "━━━ ETAPA 3: Testes E2E Completos ━━━"

# Copiar testes atualizados para o container
echo "[..] Copiando testes para o container ..."
docker cp backend/tests/conftest.py "$CONTAINER_BACKEND:/app/backend/tests/conftest.py" 2>/dev/null || true
docker cp backend/tests/test_all_portals.py "$CONTAINER_BACKEND:/app/backend/tests/test_all_portals.py" 2>/dev/null || true
docker cp backend/tests/test_all_routes.py "$CONTAINER_BACKEND:/app/backend/tests/test_all_routes.py" 2>/dev/null || true

# Executar testes
echo "[..] Executando suite completa ..."
RESULT=$(docker exec "$CONTAINER_BACKEND" sh -c "cd /app && python -m pytest backend/tests/ -q --tb=short 2>&1" | grep -E "passed|failed" || echo "ERROR")

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  RESULTADO: $RESULT"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se houve falhas
if echo "$RESULT" | grep -q "failed"; then
  echo "⚠  Existem testes falhados! Verificar logs acima."
  exit 1
else
  echo "Todos os testes passaram com sucesso!"
  exit 0
fi
