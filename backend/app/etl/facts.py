"""ETL — Fact table loaders (TRUNCATE + INSERT with JOINs for dimension keys)."""
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger("etl.facts")


def load_fact_training(db: Session):
    """Populate dw_fact_training from certificates + enrollments."""
    db.execute(text("DELETE FROM dw_fact_training"))
    db.execute(text("""
        INSERT INTO dw_fact_training
            (date_key, user_key, course_key, certificate_id, training_plan_id,
             days_to_complete, total_hours, courses_completed, average_mpu, average_approval_rate)
        SELECT
            CAST(DATE_FORMAT(c.issued_at, '%Y%m%d') AS UNSIGNED) AS date_key,
            du.user_key,
            dc.course_key,
            c.id,
            c.training_plan_id,
            DATEDIFF(c.issued_at, e.enrolled_at),
            c.total_hours,
            c.courses_completed,
            c.average_mpu,
            c.average_approval_rate
        FROM certificates c
        JOIN dw_dim_user du ON du.user_id = c.user_id
        JOIN training_plans tp ON tp.id = c.training_plan_id
        JOIN training_plan_courses tpc ON tpc.training_plan_id = tp.id
        JOIN dw_dim_course dc ON dc.course_id = tpc.course_id
        LEFT JOIN enrollments e ON e.user_id = c.user_id AND e.course_id = tpc.course_id
        WHERE EXISTS (SELECT 1 FROM dw_dim_date dd WHERE dd.date_key = CAST(DATE_FORMAT(c.issued_at, '%Y%m%d') AS UNSIGNED))
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_fact_training")).scalar()
    db.commit()
    logger.info("Loaded dw_fact_training: %d rows", count)
    return count


def load_fact_tutoria(db: Session):
    """Populate dw_fact_tutoria from tutoria_errors."""
    db.execute(text("DELETE FROM dw_fact_tutoria"))
    db.execute(text("""
        INSERT INTO dw_fact_tutoria
            (date_key, student_key, trainer_key, category_key, status_key, error_id,
             is_resolved, days_to_resolve, comments_count, action_items_count,
             action_items_completed, impact_level)
        SELECT
            CAST(DATE_FORMAT(te.date_occurrence, '%Y%m%d') AS UNSIGNED),
            du_student.user_key,
            du_trainer.user_key,
            dec2.category_key,
            ds.status_key,
            te.id,
            CASE WHEN te.status = 'COMPLETED' THEN 1 ELSE 0 END,
            CASE WHEN te.date_solution IS NOT NULL
                 THEN DATEDIFF(te.date_solution, te.date_occurrence)
                 ELSE NULL END,
            (SELECT COUNT(*) FROM tutoria_comments tc
             WHERE tc.ref_type = 'ERROR' AND tc.ref_id = te.id),
            (SELECT COUNT(*) FROM tutoria_action_plans tap
             JOIN tutoria_action_items tai ON tai.plan_id = tap.id
             WHERE tap.error_id = te.id),
            (SELECT COUNT(*) FROM tutoria_action_plans tap
             JOIN tutoria_action_items tai ON tai.plan_id = tap.id
             WHERE tap.error_id = te.id AND tai.status = 'CONCLUIDO'),
            te.impact_level
        FROM tutoria_errors te
        JOIN dw_dim_user du_student ON du_student.user_id = te.tutorado_id
        LEFT JOIN dw_dim_user du_trainer ON du_trainer.user_id = te.created_by_id
        LEFT JOIN dw_dim_error_category dec2 ON dec2.category_id = te.category_id
        LEFT JOIN dw_dim_status ds ON ds.domain = 'TUTORIA' AND ds.status_code = te.status
        WHERE te.is_active = 1
          AND EXISTS (SELECT 1 FROM dw_dim_date dd WHERE dd.date_key = CAST(DATE_FORMAT(te.date_occurrence, '%Y%m%d') AS UNSIGNED))
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_fact_tutoria")).scalar()
    db.commit()
    logger.info("Loaded dw_fact_tutoria: %d rows", count)
    return count


def load_fact_chamados(db: Session):
    """Populate dw_fact_chamados from chamados."""
    db.execute(text("DELETE FROM dw_fact_chamados"))
    db.execute(text("""
        INSERT INTO dw_fact_chamados
            (date_key, creator_key, assignee_key, status_key, chamado_id,
             type, priority, is_resolved, days_to_resolve, comments_count)
        SELECT
            CAST(DATE_FORMAT(ch.created_at, '%Y%m%d') AS UNSIGNED),
            du_creator.user_key,
            du_assignee.user_key,
            ds.status_key,
            ch.id,
            ch.type,
            ch.priority,
            CASE WHEN ch.status = 'CONCLUIDO' THEN 1 ELSE 0 END,
            CASE WHEN ch.completed_at IS NOT NULL
                 THEN DATEDIFF(ch.completed_at, ch.created_at)
                 ELSE NULL END,
            (SELECT COUNT(*) FROM chamado_comments cc WHERE cc.chamado_id = ch.id)
        FROM chamados ch
        JOIN dw_dim_user du_creator ON du_creator.user_id = ch.created_by_id
        LEFT JOIN dw_dim_user du_assignee ON du_assignee.user_id = ch.assigned_to_id
        LEFT JOIN dw_dim_status ds ON ds.domain = 'CHAMADOS' AND ds.status_code = ch.status
        WHERE EXISTS (SELECT 1 FROM dw_dim_date dd WHERE dd.date_key = CAST(DATE_FORMAT(ch.created_at, '%Y%m%d') AS UNSIGNED))
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_fact_chamados")).scalar()
    db.commit()
    logger.info("Loaded dw_fact_chamados: %d rows", count)
    return count


def load_fact_internal_errors(db: Session):
    """Populate dw_fact_internal_errors from internal_errors."""
    db.execute(text("DELETE FROM dw_fact_internal_errors"))
    db.execute(text("""
        INSERT INTO dw_fact_internal_errors
            (date_key, reporter_key, gravador_key, liberador_key, status_key,
             internal_error_id, has_learning_sheet, has_action_plan, peso_tutor)
        SELECT
            CAST(DATE_FORMAT(ie.date_occurrence, '%Y%m%d') AS UNSIGNED),
            du_creator.user_key,
            du_gravador.user_key,
            du_liberador.user_key,
            ds.status_key,
            ie.id,
            CASE WHEN ls.id IS NOT NULL THEN 1 ELSE 0 END,
            CASE WHEN ap.id IS NOT NULL THEN 1 ELSE 0 END,
            ie.peso_tutor
        FROM internal_errors ie
        JOIN dw_dim_user du_creator ON du_creator.user_id = ie.created_by_id
        JOIN dw_dim_user du_gravador ON du_gravador.user_id = ie.gravador_id
        JOIN dw_dim_user du_liberador ON du_liberador.user_id = ie.liberador_id
        LEFT JOIN dw_dim_status ds ON ds.domain = 'INTERNAL_ERROR' AND ds.status_code = ie.status
        LEFT JOIN learning_sheets ls ON ls.internal_error_id = ie.id
        LEFT JOIN internal_error_action_plans ap ON ap.internal_error_id = ie.id
        WHERE ie.is_active = 1
          AND EXISTS (SELECT 1 FROM dw_dim_date dd WHERE dd.date_key = CAST(DATE_FORMAT(ie.date_occurrence, '%Y%m%d') AS UNSIGNED))
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_fact_internal_errors")).scalar()
    db.commit()
    logger.info("Loaded dw_fact_internal_errors: %d rows", count)
    return count


def load_all_facts(db: Session) -> dict:
    """Load all fact tables, return counts."""
    return {
        "fact_training": load_fact_training(db),
        "fact_tutoria": load_fact_tutoria(db),
        "fact_chamados": load_fact_chamados(db),
        "fact_internal_errors": load_fact_internal_errors(db),
    }
