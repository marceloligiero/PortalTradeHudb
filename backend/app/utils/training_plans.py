"""
Utilidades para gestão de planos de formação
"""
from sqlalchemy.orm import Session
from .. import models


def reopen_completed_training_plans(db: Session, course_id: int, reason: str = "new_content"):
    """
    Reabre planos de formação concluídos que contêm o curso especificado.
    Quando nova aula/desafio é adicionado, planos concluídos devem voltar a pendente.
    
    Args:
        db: Database session
        course_id: ID do curso que recebeu novo conteúdo
        reason: Motivo da reabertura ('new_lesson' ou 'new_challenge')
    
    Returns:
        int: Número de planos reabertos
    """
    # Encontrar todos os planos que contêm esse curso
    plan_courses = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.course_id == course_id
    ).all()
    
    if not plan_courses:
        return 0
    
    plan_ids = [pc.training_plan_id for pc in plan_courses]
    
    # Encontrar planos que estão concluídos
    completed_plans = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id.in_(plan_ids),
        models.TrainingPlan.status == "COMPLETED"
    ).all()
    
    reopened_count = 0
    
    for plan in completed_plans:
        # Reabrir o plano
        plan.status = "IN_PROGRESS"
        plan.completed_at = None
        plan.finalized_by = None
        
        # Também reabrir o curso dentro do plano
        for pc in plan_courses:
            if pc.training_plan_id == plan.id:
                pc.status = "IN_PROGRESS"
                pc.completed_at = None
                pc.finalized_by = None
        
        reopened_count += 1
    
    if reopened_count > 0:
        db.commit()
    
    return reopened_count
