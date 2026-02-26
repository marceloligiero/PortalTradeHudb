"""
Router para finalização de cursos e planos de formação
Inclui lógica de verificação de conclusão e geração de certificados
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime
from typing import Optional
import uuid

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/finalization", tags=["finalization"])


def check_course_completion(
    db: Session,
    training_plan_id: int,
    course_id: int,
    user_id: int
) -> dict:
    """
    Verifica se um curso está completo dentro de um plano
    Retorna detalhes do progresso
    """
    # Buscar lições do curso
    lessons = db.query(models.Lesson).filter(
        models.Lesson.course_id == course_id
    ).all()
    
    lesson_ids = [l.id for l in lessons]
    total_lessons = len(lesson_ids)
    
    # Buscar progresso das lições
    completed_lessons = 0
    if lesson_ids:
        completed_lessons = db.query(models.LessonProgress).filter(
            models.LessonProgress.lesson_id.in_(lesson_ids),
            models.LessonProgress.user_id == user_id,
            models.LessonProgress.training_plan_id == training_plan_id,
            models.LessonProgress.status == "COMPLETED"
        ).count()
    
    # Buscar desafios do curso
    challenges = db.query(models.Challenge).filter(
        models.Challenge.course_id == course_id,
        models.Challenge.is_active == True
    ).all()
    
    challenge_ids = [c.id for c in challenges]
    total_challenges = len(challenge_ids)
    
    # Buscar submissions aprovadas
    completed_challenges = 0
    if challenge_ids:
        completed_challenges = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.challenge_id.in_(challenge_ids),
            models.ChallengeSubmission.user_id == user_id,
            models.ChallengeSubmission.is_approved == True,
            models.ChallengeSubmission.completed_at != None
        ).count()
    
    all_lessons_done = total_lessons == 0 or completed_lessons >= total_lessons
    all_challenges_done = total_challenges == 0 or completed_challenges >= total_challenges
    can_finalize = all_lessons_done and all_challenges_done
    
    progress = 0
    if (total_lessons + total_challenges) > 0:
        progress = ((completed_lessons + completed_challenges) / (total_lessons + total_challenges)) * 100
    
    return {
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "total_challenges": total_challenges,
        "completed_challenges": completed_challenges,
        "can_finalize": can_finalize,
        "progress_percentage": round(progress, 1),
        "all_lessons_done": all_lessons_done,
        "all_challenges_done": all_challenges_done
    }


def check_plan_completion(
    db: Session,
    training_plan_id: int,
    user_id: int
) -> dict:
    """
    Verifica se um plano está completo
    Retorna detalhes do progresso
    """
    # Buscar cursos do plano
    plan_courses = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == training_plan_id
    ).all()
    
    total_courses = len(plan_courses)
    completed_courses = 0
    total_lessons = 0
    completed_lessons = 0
    total_challenges = 0
    completed_challenges = 0
    
    course_statuses = []
    
    for pc in plan_courses:
        course_check = check_course_completion(db, training_plan_id, pc.course_id, user_id)
        
        if pc.status == "COMPLETED" or course_check["can_finalize"]:
            completed_courses += 1
        
        total_lessons += course_check["total_lessons"]
        completed_lessons += course_check["completed_lessons"]
        total_challenges += course_check["total_challenges"]
        completed_challenges += course_check["completed_challenges"]
        
        course = db.query(models.Course).filter(models.Course.id == pc.course_id).first()
        course_statuses.append({
            "course_id": pc.course_id,
            "course_title": course.title if course else "N/A",
            "status": pc.status,
            "can_finalize": course_check["can_finalize"],
            "progress_percentage": course_check["progress_percentage"]
        })
    
    all_courses_done = total_courses == 0 or completed_courses >= total_courses
    can_finalize = all_courses_done
    
    progress = 0
    if total_courses > 0:
        progress = (completed_courses / total_courses) * 100
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "total_challenges": total_challenges,
        "completed_challenges": completed_challenges,
        "can_finalize": can_finalize,
        "progress_percentage": round(progress, 1),
        "courses": course_statuses
    }


@router.get("/course/{training_plan_id}/{course_id}/status")
async def get_course_finalization_status(
    training_plan_id: int,
    course_id: int,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obter status de finalização de um curso dentro de um plano
    """
    # Validar plano
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == training_plan_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Determinar user_id
    target_user_id = user_id if user_id else plan.student_id
    if not target_user_id:
        raise HTTPException(status_code=400, detail="Aluno não especificado")
    
    # Verificar permissões
    if current_user.role == "TRAINEE" and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    status = check_course_completion(db, training_plan_id, course_id, target_user_id)
    
    # Adicionar info do curso no plano
    plan_course = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == training_plan_id,
        models.TrainingPlanCourse.course_id == course_id
    ).first()
    
    if plan_course:
        status["current_status"] = plan_course.status
        status["completed_at"] = plan_course.completed_at.isoformat() if plan_course.completed_at else None
    
    return status


@router.post("/course/{training_plan_id}/{course_id}/finalize")
async def finalize_course(
    training_plan_id: int,
    course_id: int,
    user_id: Optional[int] = None,
    request: schemas.FinalizeCourseRequest = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Finalizar um curso dentro de um plano
    Só pode ser finalizado se todas as lições e desafios estiverem completos
    """
    if request is None:
        request = schemas.FinalizeCourseRequest()
    
    # Validar plano
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == training_plan_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Verificar se é o formador do plano (se não for ADMIN)
    if current_user.role == "TRAINER" and plan.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o formador responsável pode finalizar")
    
    target_user_id = user_id if user_id else plan.student_id
    if not target_user_id:
        raise HTTPException(status_code=400, detail="Aluno não especificado")
    
    # Verificar se pode finalizar
    status = check_course_completion(db, training_plan_id, course_id, target_user_id)
    
    if not status["can_finalize"]:
        missing = []
        if not status["all_lessons_done"]:
            missing.append(f"Lições: {status['completed_lessons']}/{status['total_lessons']}")
        if not status["all_challenges_done"]:
            missing.append(f"Desafios: {status['completed_challenges']}/{status['total_challenges']}")
        
        raise HTTPException(
            status_code=400, 
            detail=f"Curso não pode ser finalizado. Pendente: {', '.join(missing)}"
        )
    
    # Buscar curso no plano
    plan_course = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == training_plan_id,
        models.TrainingPlanCourse.course_id == course_id
    ).first()
    
    if not plan_course:
        raise HTTPException(status_code=404, detail="Curso não está no plano")
    
    if plan_course.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Curso já foi finalizado")
    
    # Finalizar
    now = datetime.now()
    plan_course.status = "COMPLETED"
    plan_course.completed_at = now
    plan_course.finalized_by = current_user.id
    
    # Atualizar status do plano se necessário
    plan_status = check_plan_completion(db, training_plan_id, target_user_id)
    if plan.status == "PENDING":
        plan.status = "IN_PROGRESS"
    
    db.commit()
    
    return schemas.FinalizationResponse(
        success=True,
        message="Curso finalizado com sucesso",
        finalized_at=now
    )


@router.get("/plan/{training_plan_id}/status")
async def get_plan_finalization_status(
    training_plan_id: int,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obter status completo de finalização de um plano
    """
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == training_plan_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    target_user_id = user_id if user_id else plan.student_id
    if not target_user_id:
        raise HTTPException(status_code=400, detail="Aluno não especificado")
    
    # Verificar permissões
    if current_user.role == "TRAINEE" and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    status = check_plan_completion(db, training_plan_id, target_user_id)
    
    # Calcular dias
    days_total = None
    days_remaining = None
    days_delayed = None
    
    if plan.start_date and plan.end_date:
        now = datetime.now()
        days_total = (plan.end_date - plan.start_date).days
        
        if now < plan.end_date:
            days_remaining = (plan.end_date - now).days
            days_delayed = 0
        else:
            days_remaining = 0
            days_delayed = (now - plan.end_date).days
    
    status["plan_status"] = plan.status
    status["days_total"] = days_total
    status["days_remaining"] = days_remaining
    status["days_delayed"] = days_delayed
    status["is_delayed"] = days_delayed and days_delayed > 0
    status["completed_at"] = plan.completed_at.isoformat() if plan.completed_at else None
    
    return status


@router.post("/plan/{training_plan_id}/finalize")
async def finalize_plan(
    training_plan_id: int,
    user_id: Optional[int] = None,
    request: schemas.FinalizePlanRequest = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Finalizar um plano de formação
    Só pode ser finalizado se todos os cursos estiverem completos
    Opcionalmente gera certificado
    """
    if request is None:
        request = schemas.FinalizePlanRequest()
    
    # Validar plano
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == training_plan_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Verificar permissões
    if current_user.role == "TRAINER" and plan.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o formador responsável pode finalizar")
    
    target_user_id = user_id if user_id else plan.student_id
    if not target_user_id:
        raise HTTPException(status_code=400, detail="Aluno não especificado")
    
    # Verificar se pode finalizar
    status = check_plan_completion(db, training_plan_id, target_user_id)
    
    if not status["can_finalize"]:
        incomplete = [c for c in status["courses"] if not c["can_finalize"]]
        raise HTTPException(
            status_code=400,
            detail=f"Plano não pode ser finalizado. Cursos pendentes: {len(incomplete)}"
        )
    
    if plan.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Plano já foi finalizado")
    
    now = datetime.now()
    
    # Finalizar todos os cursos pendentes
    plan_courses = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == training_plan_id,
        models.TrainingPlanCourse.status != "COMPLETED"
    ).all()
    
    for pc in plan_courses:
        pc.status = "COMPLETED"
        pc.completed_at = now
        pc.finalized_by = current_user.id
    
    # Finalizar plano
    plan.status = "COMPLETED"
    plan.completed_at = now
    plan.finalized_by = current_user.id
    
    certificate_id = None
    
    # Gerar certificado se solicitado
    if request.generate_certificate:
        student = db.query(models.User).filter(models.User.id == target_user_id).first()
        
        if student:
            # Calcular estatísticas para o certificado
            total_hours = 0
            avg_mpu = 0
            mpu_count = 0
            
            # Calcular horas dos cursos
            for pc in db.query(models.TrainingPlanCourse).filter(
                models.TrainingPlanCourse.training_plan_id == training_plan_id
            ).all():
                lessons = db.query(models.Lesson).filter(
                    models.Lesson.course_id == pc.course_id
                ).all()
                total_hours += sum(l.estimated_minutes for l in lessons) / 60
                
                challenges = db.query(models.Challenge).filter(
                    models.Challenge.course_id == pc.course_id
                ).all()
                total_hours += sum(c.time_limit_minutes for c in challenges) / 60
            
            # Calcular MPU médio
            submissions = db.query(models.ChallengeSubmission).filter(
                models.ChallengeSubmission.user_id == target_user_id,
                models.ChallengeSubmission.is_approved == True,
                models.ChallengeSubmission.calculated_mpu != None
            ).all()
            
            if submissions:
                avg_mpu = sum(s.calculated_mpu for s in submissions) / len(submissions)
                mpu_count = len(submissions)
            
            # Gerar número único
            cert_number = f"CERT-{plan.id}-{target_user_id}-{uuid.uuid4().hex[:8].upper()}"
            
            certificate = models.Certificate(
                user_id=target_user_id,
                training_plan_id=training_plan_id,
                certificate_number=cert_number,
                student_name=student.full_name,
                student_email=student.email,
                training_plan_title=plan.title,
                total_hours=round(total_hours, 1),
                courses_completed=status["completed_courses"],
                average_mpu=round(avg_mpu, 2),
                average_approval_rate=100.0  # Todos aprovados para finalizar
            )
            
            db.add(certificate)
            db.commit()
            db.refresh(certificate)
            certificate_id = certificate.id
    
    db.commit()
    
    return schemas.FinalizationResponse(
        success=True,
        message="Plano de formação finalizado com sucesso",
        finalized_at=now,
        certificate_id=certificate_id
    )


@router.get("/plan/{training_plan_id}/calculate-status")
async def calculate_plan_status(
    training_plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Calcular e atualizar o status de um plano baseado no progresso
    Retorna: PENDING, IN_PROGRESS, COMPLETED, DELAYED
    """
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == training_plan_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    if not plan.student_id:
        return {"status": "PENDING", "reason": "Sem aluno atribuído"}
    
    status_check = check_plan_completion(db, training_plan_id, plan.student_id)
    
    new_status = "PENDING"
    
    if status_check["can_finalize"] or plan.completed_at:
        new_status = "COMPLETED"
    elif status_check["completed_lessons"] > 0 or status_check["completed_challenges"] > 0:
        new_status = "IN_PROGRESS"
        
        # Verificar se está atrasado
        if plan.end_date and datetime.now() > plan.end_date:
            new_status = "DELAYED"
    else:
        # Verificar se deveria ter começado
        if plan.start_date and datetime.now() > plan.start_date:
            new_status = "DELAYED"
    
    # Atualizar se mudou
    if plan.status != new_status and plan.status != "COMPLETED":
        plan.status = new_status
        db.commit()
    
    days_info = {}
    if plan.start_date and plan.end_date:
        now = datetime.now()
        days_info["days_total"] = (plan.end_date - plan.start_date).days
        if now < plan.end_date:
            days_info["days_remaining"] = (plan.end_date - now).days
            days_info["days_delayed"] = 0
        else:
            days_info["days_remaining"] = 0
            days_info["days_delayed"] = (now - plan.end_date).days
    
    return {
        "status": new_status,
        "progress": status_check,
        **days_info
    }
