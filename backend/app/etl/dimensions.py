"""ETL — Dimension loaders (TRUNCATE + INSERT for each dimension)."""
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger("etl.dimensions")


def load_dim_user(db: Session):
    """Reload dw_dim_user from users + teams."""
    db.execute(text("DELETE FROM dw_dim_user"))
    db.execute(text("""
        INSERT INTO dw_dim_user (user_id, email, full_name, `role`, team_name, team_id, is_active, is_trainer, is_tutor)
        SELECT u.id, u.email, u.full_name, u.`role`,
               t.`name`, u.team_id, u.is_active, u.is_trainer, u.is_tutor
        FROM users u
        LEFT JOIN teams t ON t.id = u.team_id
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_dim_user")).scalar()
    db.commit()
    logger.info("Loaded dw_dim_user: %d rows", count)
    return count


def load_dim_course(db: Session):
    """Reload dw_dim_course from courses + lessons + challenges."""
    db.execute(text("DELETE FROM dw_dim_course"))
    db.execute(text("""
        INSERT INTO dw_dim_course (course_id, title, `level`, total_lessons, total_challenges, trainer_name, trainer_id, is_active)
        SELECT c.id, c.title, c.`level`,
               (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id),
               (SELECT COUNT(*) FROM challenges ch WHERE ch.course_id = c.id),
               u.full_name, c.created_by, c.is_active
        FROM courses c
        LEFT JOIN users u ON u.id = c.created_by
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_dim_course")).scalar()
    db.commit()
    logger.info("Loaded dw_dim_course: %d rows", count)
    return count


def load_dim_error_category(db: Session):
    """Reload dw_dim_error_category."""
    db.execute(text("DELETE FROM dw_dim_error_category"))
    db.execute(text("""
        INSERT INTO dw_dim_error_category (category_id, `name`, parent_name, is_active)
        SELECT ec.id, ec.`name`,
               (SELECT p.`name` FROM tutoria_error_categories p WHERE p.id = ec.parent_id),
               ec.is_active
        FROM tutoria_error_categories ec
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_dim_error_category")).scalar()
    db.commit()
    logger.info("Loaded dw_dim_error_category: %d rows", count)
    return count


def load_dim_team(db: Session):
    """Reload dw_dim_team from teams."""
    db.execute(text("DELETE FROM dw_dim_team"))
    db.execute(text("""
        INSERT INTO dw_dim_team (team_id, `name`, manager_name, total_members, is_active)
        SELECT t.id, t.`name`,
               (SELECT u.full_name FROM users u WHERE u.id = t.manager_id),
               (SELECT COUNT(*) FROM users u2 WHERE u2.team_id = t.id),
               t.is_active
        FROM teams t
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_dim_team")).scalar()
    db.commit()
    logger.info("Loaded dw_dim_team: %d rows", count)
    return count


def load_dim_status(db: Session):
    """Ensure dw_dim_status has all status codes (INSERT IGNORE)."""
    db.execute(text("""
        INSERT IGNORE INTO dw_dim_status (`domain`, status_code, status_label) VALUES
        ('TUTORIA', 'REGISTERED', 'Registado'),
        ('TUTORIA', 'IN_PROGRESS', 'Em Progresso'),
        ('TUTORIA', 'COMPLETED', 'Concluído'),
        ('TUTORIA', 'DELAYED', 'Atrasado'),
        ('CHAMADOS', 'ABERTO', 'Aberto'),
        ('CHAMADOS', 'EM_ANDAMENTO', 'Em Andamento'),
        ('CHAMADOS', 'EM_REVISAO', 'Em Revisão'),
        ('CHAMADOS', 'CONCLUIDO', 'Concluído'),
        ('TRAINING_PLAN', 'PENDING', 'Pendente'),
        ('TRAINING_PLAN', 'IN_PROGRESS', 'Em Progresso'),
        ('TRAINING_PLAN', 'COMPLETED', 'Concluído'),
        ('TRAINING_PLAN', 'DELAYED', 'Atrasado'),
        ('INTERNAL_ERROR', 'PENDENTE', 'Pendente'),
        ('INTERNAL_ERROR', 'AGUARDANDO_GRAVADOR', 'Aguardando Gravador'),
        ('INTERNAL_ERROR', 'AVALIADO', 'Avaliado'),
        ('INTERNAL_ERROR', 'PLANO_CRIADO', 'Plano Criado'),
        ('INTERNAL_ERROR', 'CONCLUIDO', 'Concluído')
    """))
    count = db.execute(text("SELECT COUNT(*) FROM dw_dim_status")).scalar()
    db.commit()
    logger.info("Loaded dw_dim_status: %d rows", count)
    return count


def load_all_dimensions(db: Session) -> dict:
    """Load all dimensions, return counts."""
    return {
        "dim_user": load_dim_user(db),
        "dim_course": load_dim_course(db),
        "dim_error_category": load_dim_error_category(db),
        "dim_team": load_dim_team(db),
        "dim_status": load_dim_status(db),
    }
