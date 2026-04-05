"""
Limpeza da BD — Remove todos os dados de teste, mantém dados mestres originais.
Dados mestres originais = criados em 2026-03-20 (seed inicial).
"""
from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
CUTOFF = "2026-03-21"

print("=" * 60)
print("LIMPEZA DA BD — Manter apenas dados mestres originais")
print("=" * 60)

db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
db.execute(text("SET SQL_SAFE_UPDATES = 0"))

# Phase 1: TRUNCATE all transactional tables
truncate_tables = [
    "tutoria_notifications", "tutoria_comments", "tutoria_action_items",
    "tutoria_action_plans", "tutoria_learning_sheets", "tutoria_error_refs",
    "tutoria_errors",
    "internal_error_action_items", "internal_error_action_plans", "internal_errors",
    "learning_sheets", "sensos",
    "chamado_comments", "chamados",
    "lesson_pauses", "lesson_progress", "operation_errors",
    "challenge_releases", "challenge_operations", "challenge_submissions", "challenges",
    "certificates",
    "enrollments", "training_plan_assignments", "training_plan_courses",
    "training_plan_trainers", "training_plan_banks", "training_plan_products",
    "training_plans",
    "course_banks", "course_products", "lessons", "courses",
    "ratings",
    "releaser_survey_actions", "releaser_survey_responses", "releaser_surveys",
    "org_node_audit", "org_node_members", "org_nodes",
    "password_reset_tokens", "team_members",
    "dw_fact_chamados", "dw_fact_daily_snapshot", "dw_fact_internal_errors",
    "dw_fact_training", "dw_fact_tutoria",
    "dw_view_chamados_by_status", "dw_view_chamados_by_type", "dw_view_chamados_monthly",
    "dw_view_internal_errors_monthly", "dw_view_snapshot_with_date", "dw_view_teams_overview",
    "dw_view_training_by_course", "dw_view_training_monthly",
    "dw_view_tutoria_by_category", "dw_view_tutoria_by_trainer", "dw_view_tutoria_monthly",
    "dw_dim_course", "dw_dim_error_category", "dw_dim_status", "dw_dim_team", "dw_dim_user",
]

for tbl in truncate_tables:
    try:
        c = db.execute(text(f"SELECT COUNT(*) FROM `{tbl}`")).scalar()
        if c > 0:
            db.execute(text(f"TRUNCATE TABLE `{tbl}`"))
            print(f"  TRUNCATED {tbl}: {c} rows removed")
    except Exception as e:
        print(f"  SKIP {tbl}: {e}")

db.commit()

# Phase 2: Delete test rows from master data tables
partials = [
    ("activities", f"created_at >= '{CUTOFF}'"),
    ("departments", f"created_at >= '{CUTOFF}'"),
    ("error_detected_by", f"created_at >= '{CUTOFF}'"),
    ("error_impacts", f"created_at >= '{CUTOFF}'"),
    ("error_origins", f"created_at >= '{CUTOFF}'"),
    ("error_types", f"created_at >= '{CUTOFF}'"),
    ("chat_faqs", f"created_at >= '{CUTOFF}'"),
    ("teams", f"created_at >= '{CUTOFF}'"),
    ("team_services", f"created_at >= '{CUTOFF}'"),
    ("products", "id NOT IN (1,2,3,4,5,6,7)"),
]

for tbl, where in partials:
    try:
        c = db.execute(text(f"SELECT COUNT(*) FROM `{tbl}` WHERE {where}")).scalar()
        if c > 0:
            db.execute(text(f"DELETE FROM `{tbl}` WHERE {where}"))
            print(f"  CLEANED {tbl}: {c} test rows removed")
    except Exception as e:
        print(f"  SKIP {tbl}: {e}")

db.commit()

# Phase 3: Delete test users (keep admin + 3 original users)
c = db.execute(text("SELECT COUNT(*) FROM users WHERE id NOT IN (1, 16, 17, 18)")).scalar()
if c > 0:
    db.execute(text("DELETE FROM users WHERE id NOT IN (1, 16, 17, 18)"))
    print(f"  CLEANED users: {c} test users removed")
db.commit()

# Phase 4: Restore original names that got modified by test updates
db.execute(text("UPDATE products SET name = 'Crédito Documentário' WHERE id = 1"))
db.execute(text("UPDATE teams SET name = 'MESA OPERACIONES' WHERE id = 1"))
db.execute(text("UPDATE teams SET name = 'DOCUMENTARIOS' WHERE id = 3"))
db.execute(text("UPDATE teams SET name = 'EUROCOBROS' WHERE id = 8"))
db.commit()

# Re-enable constraints
db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
db.execute(text("SET SQL_SAFE_UPDATES = 1"))

# Summary
print("\n" + "=" * 60)
print("ESTADO FINAL DA BD")
print("=" * 60)
tables_all = db.execute(text("SHOW TABLES")).fetchall()
for t in tables_all:
    name = t[0]
    c = db.execute(text(f"SELECT COUNT(*) FROM `{name}`")).scalar()
    if c > 0:
        print(f"  {name}: {c}")

db.close()
print("\nLimpeza concluída com sucesso!")
