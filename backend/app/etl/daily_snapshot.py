"""ETL — Daily snapshot loader (UPSERT today's aggregated KPIs)."""
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import date
import logging

logger = logging.getLogger("etl.daily_snapshot")


def load_daily_snapshot(db: Session, target_date: date | None = None):
    """Compute and upsert a row in dw_fact_daily_snapshot for the given day."""
    if target_date is None:
        target_date = date.today()

    date_key = int(target_date.strftime("%Y%m%d"))

    # Verify date exists in dimension
    exists = db.execute(
        text("SELECT 1 FROM dw_dim_date WHERE date_key = :dk"),
        {"dk": date_key},
    ).fetchone()
    if not exists:
        logger.warning("date_key %d not in dw_dim_date, skipping snapshot", date_key)
        return None

    db.execute(text("""
        INSERT INTO dw_fact_daily_snapshot
            (date_key,
             total_users, active_users,
             users_by_role_admin, users_by_role_trainer,
             users_by_role_student, users_by_role_manager,
             total_courses, total_enrollments,
             certificates_today, certificates_mtd, certificates_total,
             errors_open, errors_created_today, errors_resolved_today,
             errors_total, avg_resolution_days,
             tickets_open, tickets_created_today, tickets_resolved_today,
             tickets_total,
             internal_errors_total, internal_errors_pending,
             learning_sheets_total,
             challenges_total, submissions_today, submissions_approved_rate)
        SELECT
            :date_key,
            -- Users
            (SELECT COUNT(*) FROM users),
            (SELECT COUNT(*) FROM users WHERE is_active = 1),
            (SELECT COUNT(*) FROM users WHERE role = 'ADMIN'),
            (SELECT COUNT(*) FROM users WHERE is_formador = 1),
            (SELECT COUNT(*) FROM users WHERE role = 'USUARIO'),
            (SELECT COUNT(*) FROM users WHERE role = 'MANAGER'),
            -- Training
            (SELECT COUNT(*) FROM courses WHERE is_active = 1),
            (SELECT COUNT(*) FROM enrollments),
            (SELECT COUNT(*) FROM certificates WHERE DATE(issued_at) = :target_date),
            (SELECT COUNT(*) FROM certificates
             WHERE DATE(issued_at) >= DATE_SUB(:target_date, INTERVAL DAYOFMONTH(:target_date) - 1 DAY)
               AND DATE(issued_at) <= :target_date),
            (SELECT COUNT(*) FROM certificates),
            -- Tutoria errors
            (SELECT COUNT(*) FROM tutoria_errors
             WHERE is_active = 1 AND status NOT IN ('COMPLETED', 'VERIFICADO')),
            (SELECT COUNT(*) FROM tutoria_errors
             WHERE is_active = 1 AND DATE(created_at) = :target_date),
            (SELECT COUNT(*) FROM tutoria_errors
             WHERE is_active = 1 AND status IN ('COMPLETED', 'VERIFICADO')
               AND DATE(updated_at) = :target_date),
            (SELECT COUNT(*) FROM tutoria_errors WHERE is_active = 1),
            (SELECT COALESCE(AVG(DATEDIFF(
                COALESCE(date_solution, CURDATE()), date_occurrence)), 0)
             FROM tutoria_errors
             WHERE is_active = 1 AND status IN ('COMPLETED', 'VERIFICADO')),
            -- Chamados (tickets)
            (SELECT COUNT(*) FROM chamados WHERE status != 'CONCLUIDO'),
            (SELECT COUNT(*) FROM chamados WHERE DATE(created_at) = :target_date),
            (SELECT COUNT(*) FROM chamados
             WHERE status = 'CONCLUIDO' AND DATE(completed_at) = :target_date),
            (SELECT COUNT(*) FROM chamados),
            -- Internal errors
            (SELECT COUNT(*) FROM internal_errors WHERE is_active = 1),
            (SELECT COUNT(*) FROM internal_errors
             WHERE is_active = 1 AND status = 'PENDENTE'),
            (SELECT COUNT(*) FROM learning_sheets),
            -- Challenges
            (SELECT COUNT(*) FROM challenges WHERE is_active = 1),
            (SELECT COUNT(*) FROM challenge_submissions
             WHERE DATE(created_at) = :target_date),
            (SELECT COALESCE(
                CASE WHEN COUNT(*) > 0
                    THEN ROUND(SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END)
                               * 100.0 / COUNT(*), 1)
                    ELSE 0 END, 0)
             FROM challenge_submissions WHERE is_approved IS NOT NULL)
        ON DUPLICATE KEY UPDATE
            total_users = VALUES(total_users),
            active_users = VALUES(active_users),
            users_by_role_admin = VALUES(users_by_role_admin),
            users_by_role_trainer = VALUES(users_by_role_trainer),
            users_by_role_student = VALUES(users_by_role_student),
            users_by_role_manager = VALUES(users_by_role_manager),
            total_courses = VALUES(total_courses),
            total_enrollments = VALUES(total_enrollments),
            certificates_today = VALUES(certificates_today),
            certificates_mtd = VALUES(certificates_mtd),
            certificates_total = VALUES(certificates_total),
            errors_open = VALUES(errors_open),
            errors_created_today = VALUES(errors_created_today),
            errors_resolved_today = VALUES(errors_resolved_today),
            errors_total = VALUES(errors_total),
            avg_resolution_days = VALUES(avg_resolution_days),
            tickets_open = VALUES(tickets_open),
            tickets_created_today = VALUES(tickets_created_today),
            tickets_resolved_today = VALUES(tickets_resolved_today),
            tickets_total = VALUES(tickets_total),
            internal_errors_total = VALUES(internal_errors_total),
            internal_errors_pending = VALUES(internal_errors_pending),
            learning_sheets_total = VALUES(learning_sheets_total),
            challenges_total = VALUES(challenges_total),
            submissions_today = VALUES(submissions_today),
            submissions_approved_rate = VALUES(submissions_approved_rate),
            snapshot_at = CURRENT_TIMESTAMP
    """), {"date_key": date_key, "target_date": target_date.isoformat()})
    db.commit()
    logger.info("Snapshot for %s (key=%d) upserted", target_date, date_key)
    return date_key
