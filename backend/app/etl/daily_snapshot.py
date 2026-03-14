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
            (date_key, active_users, total_enrollments, enrollments_completed,
             enrollments_in_progress, certificates_issued, avg_training_hours,
             avg_mpu, open_tutoria_errors, resolved_tutoria_errors,
             open_chamados, resolved_chamados, internal_errors_count,
             learning_sheets_count)
        SELECT
            :date_key,
            (SELECT COUNT(*) FROM users WHERE is_active = 1),
            (SELECT COUNT(*) FROM enrollments),
            (SELECT COUNT(*) FROM enrollments WHERE status = 'COMPLETED'),
            (SELECT COUNT(*) FROM enrollments WHERE status = 'IN_PROGRESS'),
            (SELECT COUNT(*) FROM certificates WHERE DATE(issued_at) <= :target_date),
            (SELECT COALESCE(AVG(total_hours), 0) FROM certificates),
            (SELECT COALESCE(AVG(average_mpu), 0) FROM certificates),
            (SELECT COUNT(*) FROM tutoria_errors WHERE is_active = 1 AND status != 'COMPLETED'),
            (SELECT COUNT(*) FROM tutoria_errors WHERE is_active = 1 AND status = 'COMPLETED'),
            (SELECT COUNT(*) FROM chamados WHERE status != 'CONCLUIDO'),
            (SELECT COUNT(*) FROM chamados WHERE status = 'CONCLUIDO'),
            (SELECT COUNT(*) FROM internal_errors WHERE is_active = 1),
            (SELECT COUNT(*) FROM learning_sheets)
        ON DUPLICATE KEY UPDATE
            active_users = VALUES(active_users),
            total_enrollments = VALUES(total_enrollments),
            enrollments_completed = VALUES(enrollments_completed),
            enrollments_in_progress = VALUES(enrollments_in_progress),
            certificates_issued = VALUES(certificates_issued),
            avg_training_hours = VALUES(avg_training_hours),
            avg_mpu = VALUES(avg_mpu),
            open_tutoria_errors = VALUES(open_tutoria_errors),
            resolved_tutoria_errors = VALUES(resolved_tutoria_errors),
            open_chamados = VALUES(open_chamados),
            resolved_chamados = VALUES(resolved_chamados),
            internal_errors_count = VALUES(internal_errors_count),
            learning_sheets_count = VALUES(learning_sheets_count)
    """), {"date_key": date_key, "target_date": target_date.isoformat()})
    db.commit()
    logger.info("Snapshot for %s (key=%d) upserted", target_date, date_key)
    return date_key
