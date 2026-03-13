"""
Limpa a base de dados mantendo APENAS o utilizador admin.
Remove TODOS os dados de teste e utilizadores não-admin.

Uso: cd backend && python scripts/clean_database.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.database import SessionLocal

# Tables to truncate in order (respecting foreign keys)
TABLES_TO_TRUNCATE = [
    # Notifications & comments first (leaf tables)
    "tutoria_notifications",
    "tutoria_comments",
    "tutoria_learning_sheets",
    "chamado_comments",
    "chat_faqs",
    "ratings",
    # Internal errors subsystem
    "learning_sheets",
    "internal_error_action_items",
    "internal_error_action_plans",
    "internal_error_classifications",
    "internal_errors",
    "sensos",
    # Tutoria subsystem
    "tutoria_action_items",
    "tutoria_action_plans",
    "tutoria_error_motivos",
    "tutoria_error_refs",
    "tutoria_errors",
    "tutoria_error_categories",
    # Challenges subsystem
    "operation_errors",
    "submission_errors",
    "challenge_operations",
    "challenge_releases",
    "challenge_submissions",
    "challenge_parts",
    "challenges",
    # Certificates
    "certificates",
    # Lessons & progress
    "lesson_pauses",
    "lesson_progress",
    "enrollments",
    "lessons",
    # Training plans
    "training_plan_trainers",
    "training_plan_assignments",
    "training_plan_courses",
    "training_plan_products",
    "training_plan_banks",
    "training_plans",
    # Courses & associations
    "course_products",
    "course_banks",
    "courses",
    # Master data
    "products",
    "banks",
    # Support tickets
    "chamados",
    # Teams
    "team_services",
    "team_members",
    "teams",
    # Auth tokens
    "password_reset_tokens",
    # Lookup tables (tutoria/internal errors)
    "error_types",
    "activities",
    "departments",
    "error_detected_by",
    "error_origins",
    "error_impacts",
]

def clean_database():
    db = SessionLocal()
    try:
        # Disable FK checks for clean truncation
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

        for table in TABLES_TO_TRUNCATE:
            try:
                db.execute(text(f"TRUNCATE TABLE `{table}`"))
                print(f"  ✓ {table}")
            except Exception as e:
                print(f"  ✗ {table}: {e}")

        # Delete all users except admin (id=1)
        result = db.execute(text("DELETE FROM users WHERE id != 1"))
        print(f"  ✓ users: deleted {result.rowcount} non-admin users")

        # Reset auto increment on users
        db.execute(text("ALTER TABLE users AUTO_INCREMENT = 2"))

        # Re-enable FK checks
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        db.commit()
        print("\n✅ Base de dados limpa. Apenas admin@tradehub.com mantido.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🗑️  A limpar base de dados...")
    print("=" * 50)
    clean_database()
