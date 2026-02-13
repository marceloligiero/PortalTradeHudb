"""
Router para gestão de progresso de lições
Inclui: start, pause, resume, finish
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import Optional

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


def get_or_create_lesson_progress(
    db: Session,
    lesson_id: int,
    user_id: int,
    training_plan_id: Optional[int] = None,
    enrollment_id: Optional[int] = None
) -> models.LessonProgress:
    """Obtém ou cria um registo de progresso para a lição"""
    
    # Tentar encontrar progresso existente
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == user_id
    )
    
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        # Criar novo progresso
        lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lição não encontrada")
        
        # Buscar enrollment_id se não fornecido
        if not enrollment_id:
            # Buscar via training_plan_id -> TrainingPlanCourse -> course_id -> enrollment
            if training_plan_id:
                # TrainingPlan tem cursos via TrainingPlanCourse (many-to-many)
                plan_course = db.query(models.TrainingPlanCourse).filter(
                    models.TrainingPlanCourse.training_plan_id == training_plan_id
                ).first()
                if plan_course and plan_course.course_id:
                    enrollment = db.query(models.Enrollment).filter(
                        models.Enrollment.user_id == user_id,
                        models.Enrollment.course_id == plan_course.course_id
                    ).first()
                    if enrollment:
                        enrollment_id = enrollment.id
            
            # Se ainda não tem enrollment_id, buscar pelo course_id da lição
            if not enrollment_id and lesson.course_id:
                enrollment = db.query(models.Enrollment).filter(
                    models.Enrollment.user_id == user_id,
                    models.Enrollment.course_id == lesson.course_id
                ).first()
                if enrollment:
                    enrollment_id = enrollment.id
            
            # Se ainda não encontrou, criar enrollment automaticamente
            if not enrollment_id:
                # Precisamos de um course_id
                course_id = None
                if training_plan_id:
                    plan_course = db.query(models.TrainingPlanCourse).filter(
                        models.TrainingPlanCourse.training_plan_id == training_plan_id
                    ).first()
                    if plan_course:
                        course_id = plan_course.course_id
                if not course_id and lesson.course_id:
                    course_id = lesson.course_id
                
                if course_id:
                    new_enrollment = models.Enrollment(
                        user_id=user_id,
                        course_id=course_id
                    )
                    db.add(new_enrollment)
                    db.commit()
                    db.refresh(new_enrollment)
                    enrollment_id = new_enrollment.id
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail="Não foi possível determinar o enrollment para este utilizador/curso"
                    )
        
        progress = models.LessonProgress(
            lesson_id=lesson_id,
            user_id=user_id,
            training_plan_id=training_plan_id,
            enrollment_id=enrollment_id,
            estimated_minutes=lesson.estimated_minutes,
            status="NOT_STARTED",
            accumulated_seconds=0,
            is_paused=False
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return progress


def calculate_elapsed_seconds(progress: models.LessonProgress) -> int:
    """Calcula o tempo decorrido considerando pausas"""
    if not progress.started_at:
        return 0
    
    # Tempo base desde o início
    now = datetime.now()
    
    if progress.completed_at:
        # Se concluído, usar tempo até conclusão
        end_time = progress.completed_at
    elif progress.is_paused and progress.paused_at:
        # Se pausado, usar tempo até a pausa
        end_time = progress.paused_at
    else:
        # Em progresso, usar agora
        end_time = now
    
    total_seconds = (end_time - progress.started_at).total_seconds()
    
    # Subtrair tempo de pausas
    # O accumulated_seconds já guarda o tempo "válido" acumulado
    # Não precisamos subtrair pausas aqui se usarmos a lógica correta
    
    return int(total_seconds)


@router.get("/{lesson_id}/progress")
async def get_lesson_progress(
    lesson_id: int,
    user_id: Optional[int] = None,
    training_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obter progresso de uma lição para um utilizador"""
    
    # Se não especificado user_id, usar current_user se for STUDENT
    target_user_id = user_id if user_id else current_user.id
    
    # Verificar permissões
    if current_user.role == "TRAINEE" and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Buscar ou criar progresso
    progress = get_or_create_lesson_progress(db, lesson_id, target_user_id, training_plan_id)
    
    # Calcular tempos
    elapsed_seconds = progress.accumulated_seconds
    if progress.status == "IN_PROGRESS" and progress.started_at and not progress.is_paused:
        # Adicionar tempo desde última retoma ou início
        if progress.paused_at:
            # Não deveria acontecer se is_paused=False, mas por segurança
            pass
        else:
            # Tempo desde started_at ou última pausa
            last_pause = db.query(models.LessonPause).filter(
                models.LessonPause.lesson_progress_id == progress.id,
                models.LessonPause.resumed_at != None
            ).order_by(models.LessonPause.resumed_at.desc()).first()
            
            if last_pause and last_pause.resumed_at:
                elapsed_seconds += int((datetime.now() - last_pause.resumed_at).total_seconds())
            else:
                elapsed_seconds += int((datetime.now() - progress.started_at).total_seconds())
    
    remaining_seconds = max(0, (progress.estimated_minutes * 60) - elapsed_seconds)
    is_delayed = elapsed_seconds > (progress.estimated_minutes * 60)
    
    # Buscar pausas
    pauses = db.query(models.LessonPause).filter(
        models.LessonPause.lesson_progress_id == progress.id
    ).order_by(models.LessonPause.paused_at).all()
    
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    
    # Buscar nome do formador que liberou
    releaser_name = None
    if getattr(progress, 'released_by', None):
        releaser = db.query(models.User).filter(models.User.id == progress.released_by).first()
        if releaser:
            releaser_name = releaser.full_name
    
    # Buscar nome do formador que finalizou/aprovou
    finisher_name = None
    if getattr(progress, 'finished_by', None):
        finisher = db.query(models.User).filter(models.User.id == progress.finished_by).first()
        if finisher:
            finisher_name = finisher.full_name
    
    return {
        "id": progress.id,
        "lesson_id": progress.lesson_id,
        "user_id": progress.user_id,
        "training_plan_id": progress.training_plan_id,
        "status": progress.status,
        # Campos de liberação
        "is_released": getattr(progress, 'is_released', False),
        "released_at": progress.released_at.isoformat() if getattr(progress, 'released_at', None) else None,
        "released_by": releaser_name,
        # Campos de tempo
        "started_at": progress.started_at.isoformat() if progress.started_at else None,
        "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
        "paused_at": progress.paused_at.isoformat() if progress.paused_at else None,
        "is_paused": progress.is_paused,
        "accumulated_seconds": progress.accumulated_seconds,
        "elapsed_seconds": elapsed_seconds,
        "remaining_seconds": remaining_seconds,
        "estimated_minutes": progress.estimated_minutes,
        "is_delayed": is_delayed,
        "is_approved": progress.is_approved,
        "finished_by": finisher_name,
        "student_confirmed": getattr(progress, 'student_confirmed', False),
        "student_confirmed_at": progress.student_confirmed_at.isoformat() if getattr(progress, 'student_confirmed_at', None) else None,
        "pauses": [{
            "id": p.id,
            "paused_at": p.paused_at.isoformat() if p.paused_at else None,
            "resumed_at": p.resumed_at.isoformat() if p.resumed_at else None,
            "duration_seconds": p.duration_seconds,
            "pause_reason": p.pause_reason
        } for p in pauses],
        "lesson": {
            "id": lesson.id,
            "title": lesson.title,
            "estimated_minutes": lesson.estimated_minutes,
            "lesson_type": lesson.lesson_type
        } if lesson else None
    }


# ===== FORMADOR: Liberar aula para o formando =====
@router.post("/{lesson_id}/release")
async def release_lesson(
    lesson_id: int,
    user_id: int,
    training_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Liberar uma aula para o formando assistir
    Só o formador/admin pode liberar
    O formando poderá então iniciar a aula quando estiver pronto
    """
    # Validar que o aluno existe (TRAINEE, STUDENT ou TRAINER que está inscrito num plano)
    student = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role.in_(["TRAINEE", "STUDENT", "TRAINER"])
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Validar lição existe
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    
    # Obter ou criar progresso
    progress = get_or_create_lesson_progress(db, lesson_id, user_id, training_plan_id)
    
    # Verificar se já está liberada ou em progresso
    if progress.is_released:
        raise HTTPException(status_code=400, detail="Aula já foi liberada")
    
    if progress.status in ["IN_PROGRESS", "COMPLETED"]:
        raise HTTPException(status_code=400, detail="Aula já está em progresso ou concluída")
    
    # Liberar aula
    now = datetime.now()
    progress.is_released = True
    progress.released_by = current_user.id
    progress.released_at = now
    progress.status = "RELEASED"
    
    db.commit()
    db.refresh(progress)
    
    return {
        "message": "Aula liberada com sucesso",
        "progress_id": progress.id,
        "released_at": progress.released_at.isoformat(),
        "released_by": current_user.full_name,
        "student_name": student.full_name,
        "status": progress.status
    }


# ===== FORMANDO: Iniciar aula liberada =====
@router.post("/{lesson_id}/start")
async def start_lesson(
    lesson_id: int,
    training_plan_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Iniciar uma aula liberada
    Quem pode iniciar depende do campo started_by da lição:
    - TRAINEE: O formando inicia quando está pronto
    - TRAINER: O formador inicia a aula para o formando
    """
    # Validar lição existe
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    
    # Verificar quem pode iniciar a aula baseado no campo started_by
    lesson_started_by = lesson.started_by or "TRAINER"  # Default TRAINER
    
    if current_user.role in ["TRAINEE", "STUDENT"]:
        # Formando pode iniciar se started_by é TRAINEE
        if lesson_started_by != "TRAINEE":
            raise HTTPException(
                status_code=400, 
                detail="Esta aula deve ser iniciada pelo formador."
            )
        user_id = current_user.id
    elif current_user.role in ["TRAINER", "ADMIN"]:
        # Formador pode iniciar se started_by é TRAINER
        if lesson_started_by != "TRAINER":
            raise HTTPException(
                status_code=400, 
                detail="Esta aula deve ser iniciada pelo formando. Use /release para liberar."
            )
        # Usar user_id fornecido ou buscar do plano
        if user_id:
            target_user_id = user_id
        elif training_plan_id:
            plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == training_plan_id).first()
            if not plan or not plan.student_id:
                raise HTTPException(status_code=400, detail="Plano não encontrado ou sem aluno atribuído")
            target_user_id = plan.student_id
        else:
            raise HTTPException(
                status_code=400,
                detail="training_plan_id ou user_id é necessário para o formador iniciar a aula"
            )
        user_id = target_user_id
    else:
        raise HTTPException(status_code=403, detail="Sem permissão para iniciar aulas")
    
    # Obter ou criar progresso
    progress = get_or_create_lesson_progress(db, lesson_id, user_id, training_plan_id)
    
    # Verificar se a aula foi liberada pelo formador
    # ADMIN e TRAINER podem iniciar mesmo sem liberação prévia (liberam automaticamente)
    if not progress.is_released:
        if current_user.role in ["ADMIN", "TRAINER"]:
            # Admin/Trainer libera automaticamente ao iniciar
            progress.is_released = True
            progress.released_by = current_user.id
            progress.released_at = datetime.now()
        else:
            raise HTTPException(
                status_code=400, 
                detail="Aula ainda não foi liberada pelo formador. Aguarde a liberação."
            )
    
    # Verificar se já está em progresso ou concluída
    if progress.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Aula já foi concluída")
    
    if progress.status == "IN_PROGRESS" and not progress.is_paused:
        raise HTTPException(status_code=400, detail="Aula já está em progresso")
    
    # Se estava pausado, usar resume em vez de start
    if progress.is_paused:
        return await resume_lesson_student(lesson_id, training_plan_id, db, current_user)
    
    # Iniciar aula
    now = datetime.now()
    progress.started_at = now
    progress.status = "IN_PROGRESS"
    progress.is_paused = False
    progress.accumulated_seconds = 0
    
    db.commit()
    db.refresh(progress)
    
    return {
        "message": "Aula iniciada com sucesso! Bom estudo!",
        "progress_id": progress.id,
        "started_at": progress.started_at.isoformat(),
        "estimated_minutes": progress.estimated_minutes,
        "status": progress.status
    }


# ===== FORMANDO: Pausar sua própria aula =====
@router.post("/{lesson_id}/pause")
async def pause_lesson(
    lesson_id: int,
    training_plan_id: Optional[int] = None,
    pause_reason: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Pausar uma aula em progresso
    O FORMANDO pode pausar sua própria aula
    O FORMADOR pode pausar aulas onde started_by = TRAINER
    Guarda o tempo acumulado para continuar depois (mesmo em dias diferentes)
    """
    # Buscar a lição para verificar started_by
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    
    lesson_started_by = lesson.started_by or "TRAINER"
    
    # Determinar user_id baseado no role e started_by
    if current_user.role in ["TRAINEE", "STUDENT"]:
        user_id = current_user.id
    elif current_user.role in ["TRAINER", "ADMIN"]:
        # Formador só pode pausar se started_by = TRAINER
        if lesson_started_by != "TRAINER":
            raise HTTPException(
                status_code=403, 
                detail="Esta aula é controlada pelo formando. Apenas ele pode pausar."
            )
        # Usar user_id fornecido ou buscar do plano
        if user_id:
            target_user_id = user_id
        elif training_plan_id:
            plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == training_plan_id).first()
            if not plan or not plan.student_id:
                raise HTTPException(status_code=400, detail="Plano não encontrado ou sem aluno")
            target_user_id = plan.student_id
        else:
            raise HTTPException(status_code=400, detail="training_plan_id ou user_id é necessário")
        user_id = target_user_id
    else:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Buscar progresso
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == user_id
    )
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado. Inicie a aula primeiro.")
    
    if progress.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Aula já foi concluída")
    
    if progress.is_paused:
        raise HTTPException(status_code=400, detail="Aula já está pausada")
    
    if progress.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Aula não está em progresso")
    
    now = datetime.now()
    
    # Calcular tempo desde última retoma ou início
    last_pause = db.query(models.LessonPause).filter(
        models.LessonPause.lesson_progress_id == progress.id,
        models.LessonPause.resumed_at != None
    ).order_by(models.LessonPause.resumed_at.desc()).first()
    
    if last_pause and last_pause.resumed_at:
        session_seconds = int((now - last_pause.resumed_at).total_seconds())
    else:
        session_seconds = int((now - progress.started_at).total_seconds())
    
    # Atualizar tempo acumulado
    progress.accumulated_seconds = (progress.accumulated_seconds or 0) + session_seconds
    progress.paused_at = now
    progress.is_paused = True
    progress.status = "PAUSED"
    
    # Criar registo de pausa
    pause = models.LessonPause(
        lesson_progress_id=progress.id,
        paused_at=now,
        pause_reason=pause_reason
    )
    db.add(pause)
    
    db.commit()
    db.refresh(progress)
    
    return {
        "message": "Aula pausada com sucesso",
        "progress_id": progress.id,
        "paused_at": progress.paused_at.isoformat(),
        "accumulated_seconds": progress.accumulated_seconds,
        "session_seconds": session_seconds,
        "status": progress.status
    }


# ===== FORMANDO: Retomar sua própria aula =====
@router.post("/{lesson_id}/resume")
async def resume_lesson(
    lesson_id: int,
    training_plan_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retomar uma aula pausada
    O FORMANDO pode retomar sua própria aula
    O FORMADOR pode retomar aulas onde started_by = TRAINER
    Funciona mesmo em dias diferentes - continua do tempo acumulado
    """
    # Buscar a lição para verificar started_by
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    
    lesson_started_by = lesson.started_by or "TRAINER"
    
    # Determinar user_id baseado no role e started_by
    if current_user.role in ["TRAINEE", "STUDENT"]:
        user_id = current_user.id
    elif current_user.role in ["TRAINER", "ADMIN"]:
        # Formador só pode retomar se started_by = TRAINER
        if lesson_started_by != "TRAINER":
            raise HTTPException(
                status_code=403, 
                detail="Esta aula é controlada pelo formando. Apenas ele pode retomar."
            )
        # Usar user_id fornecido ou buscar do plano
        if user_id:
            target_user_id = user_id
        elif training_plan_id:
            plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == training_plan_id).first()
            if not plan or not plan.student_id:
                raise HTTPException(status_code=400, detail="Plano não encontrado ou sem aluno")
            target_user_id = plan.student_id
        else:
            raise HTTPException(status_code=400, detail="training_plan_id ou user_id é necessário")
        user_id = target_user_id
    else:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    return await resume_lesson_internal(lesson_id, user_id, training_plan_id, db)


async def resume_lesson_internal(
    lesson_id: int,
    user_id: int,
    training_plan_id: Optional[int],
    db: Session
):
    """Lógica interna para retomar aula"""
    # Buscar progresso
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == user_id
    )
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    if progress.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Aula já foi concluída")
    
    if not progress.is_paused:
        raise HTTPException(status_code=400, detail="Aula não está pausada")
    
    now = datetime.now()
    
    # Encontrar a pausa ativa (sem resumed_at)
    active_pause = db.query(models.LessonPause).filter(
        models.LessonPause.lesson_progress_id == progress.id,
        models.LessonPause.resumed_at == None
    ).order_by(models.LessonPause.paused_at.desc()).first()
    
    if active_pause:
        active_pause.resumed_at = now
        active_pause.duration_seconds = int((now - active_pause.paused_at).total_seconds())
    
    # Retomar
    progress.is_paused = False
    progress.paused_at = None
    progress.status = "IN_PROGRESS"
    
    db.commit()
    db.refresh(progress)
    
    return {
        "message": "Aula retomada com sucesso",
        "progress_id": progress.id,
        "resumed_at": now.isoformat(),
        "accumulated_seconds": progress.accumulated_seconds,
        "remaining_seconds": max(0, (progress.estimated_minutes * 60) - progress.accumulated_seconds),
        "status": progress.status
    }


async def resume_lesson_student(
    lesson_id: int,
    training_plan_id: Optional[int],
    db: Session,
    current_user: models.User
):
    """Helper para retomar aula de formando"""
    return await resume_lesson_internal(lesson_id, current_user.id, training_plan_id, db)


# ===== FORMANDO: Finalizar sua própria aula =====
@router.post("/{lesson_id}/finish")
async def finish_lesson(
    lesson_id: int,
    training_plan_id: Optional[int] = None,
    user_id: Optional[int] = None,
    request: schemas.FinalizeLessonRequest = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Finalizar uma aula
    O FORMANDO pode finalizar aulas de qualquer tipo (TRAINER ou TRAINEE started_by)
    O FORMADOR pode finalizar aulas onde started_by = TRAINER
    Calcula o tempo total e marca como concluída
    """
    # Buscar a lição para verificar started_by
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    
    lesson_started_by = lesson.started_by or "TRAINER"
    
    # Determinar user_id baseado no role e started_by
    if current_user.role in ["TRAINEE", "STUDENT"]:
        # Formando pode finalizar qualquer aula (tanto TRAINER quanto TRAINEE)
        user_id = current_user.id
    elif current_user.role in ["TRAINER", "ADMIN"]:
        # Formador só pode finalizar se started_by = TRAINER
        if lesson_started_by != "TRAINER":
            raise HTTPException(
                status_code=403, 
                detail="Esta aula é controlada pelo formando. Apenas ele pode finalizar."
            )
        # Usar user_id fornecido ou buscar do plano
        if user_id:
            target_user_id = user_id
        elif training_plan_id:
            plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == training_plan_id).first()
            if not plan or not plan.student_id:
                raise HTTPException(status_code=400, detail="Plano não encontrado ou sem aluno")
            target_user_id = plan.student_id
        else:
            raise HTTPException(status_code=400, detail="training_plan_id ou user_id é necessário")
        user_id = target_user_id
    else:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    if request is None:
        request = schemas.FinalizeLessonRequest()
    
    # Buscar progresso
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == user_id
    )
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    if progress.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Lição já foi concluída")
    
    now = datetime.now()
    
    # Se está pausado, fechar a pausa primeiro
    if progress.is_paused:
        active_pause = db.query(models.LessonPause).filter(
            models.LessonPause.lesson_progress_id == progress.id,
            models.LessonPause.resumed_at == None
        ).first()
        if active_pause:
            active_pause.resumed_at = now
            active_pause.duration_seconds = int((now - active_pause.paused_at).total_seconds())
    else:
        # Calcular tempo da sessão atual
        last_pause = db.query(models.LessonPause).filter(
            models.LessonPause.lesson_progress_id == progress.id,
            models.LessonPause.resumed_at != None
        ).order_by(models.LessonPause.resumed_at.desc()).first()
        
        if last_pause and last_pause.resumed_at:
            session_seconds = int((now - last_pause.resumed_at).total_seconds())
        elif progress.started_at:
            session_seconds = int((now - progress.started_at).total_seconds())
        else:
            session_seconds = 0
        
        progress.accumulated_seconds = (progress.accumulated_seconds or 0) + session_seconds
    
    # Finalizar
    progress.completed_at = now
    progress.status = "COMPLETED"
    progress.is_paused = False
    progress.paused_at = None
    progress.finished_by = current_user.id
    # Formando não aprova, só finaliza. Formador aprova depois via /approve
    progress.is_approved = False
    progress.actual_time_minutes = progress.accumulated_seconds // 60
    
    # Calcular MPU se aplicável
    if progress.actual_time_minutes > 0 and progress.estimated_minutes > 0:
        progress.mpu_percentage = round((progress.estimated_minutes / progress.actual_time_minutes) * 100, 2)
    
    db.commit()
    db.refresh(progress)
    
    return {
        "message": "Aula finalizada com sucesso! O formador irá rever o seu tempo.",
        "progress_id": progress.id,
        "completed_at": progress.completed_at.isoformat(),
        "actual_time_minutes": progress.actual_time_minutes,
        "accumulated_seconds": progress.accumulated_seconds,
        "is_approved": progress.is_approved,
        "is_delayed": progress.accumulated_seconds > (progress.estimated_minutes * 60),
        "status": progress.status
    }


# ===== FORMADOR: Aprovar aula finalizada pelo formando =====
@router.post("/{lesson_id}/approve")
async def approve_lesson(
    lesson_id: int,
    user_id: int,
    training_plan_id: Optional[int] = None,
    is_approved: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Formador aprova a aula finalizada pelo formando
    Pode aprovar ou reprovar (requer refazer)
    """
    # Buscar progresso
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == user_id
    )
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    if progress.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Aula ainda não foi finalizada pelo formando")
    
    progress.is_approved = is_approved
    progress.finished_by = current_user.id  # Quem aprovou
    
    db.commit()
    db.refresh(progress)
    
    status_msg = "aprovada" if is_approved else "reprovada"
    
    return {
        "message": f"Aula {status_msg} com sucesso",
        "progress_id": progress.id,
        "is_approved": progress.is_approved,
        "approved_by": current_user.full_name,
        "status": progress.status
    }


@router.get("/{lesson_id}/timer-state")
async def get_timer_state(
    lesson_id: int,
    user_id: int,
    training_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obter estado atual do cronómetro para o frontend
    Retorna o tempo restante e estado da lição
    """
    # Buscar progresso
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == user_id
    )
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        # Lição ainda não liberada/iniciada
        lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
        return {
            "status": "NOT_STARTED",
            "is_released": False,
            "remaining_seconds": lesson.estimated_minutes * 60 if lesson else 1800,
            "elapsed_seconds": 0,
            "is_paused": False,
            "is_delayed": False,
            "estimated_minutes": lesson.estimated_minutes if lesson else 30
        }
    
    # Calcular tempo atual
    elapsed_seconds = progress.accumulated_seconds or 0
    
    if progress.status == "IN_PROGRESS" and not progress.is_paused and progress.started_at:
        # Adicionar tempo desde última retoma
        last_pause = db.query(models.LessonPause).filter(
            models.LessonPause.lesson_progress_id == progress.id,
            models.LessonPause.resumed_at != None
        ).order_by(models.LessonPause.resumed_at.desc()).first()
        
        if last_pause and last_pause.resumed_at:
            elapsed_seconds += int((datetime.now() - last_pause.resumed_at).total_seconds())
        else:
            elapsed_seconds += int((datetime.now() - progress.started_at).total_seconds())
    
    estimated_seconds = progress.estimated_minutes * 60
    remaining_seconds = max(0, estimated_seconds - elapsed_seconds)
    is_delayed = elapsed_seconds > estimated_seconds
    
    return {
        "status": progress.status,
        "is_released": getattr(progress, 'is_released', False),
        "released_at": progress.released_at.isoformat() if getattr(progress, 'released_at', None) else None,
        "remaining_seconds": remaining_seconds,
        "elapsed_seconds": elapsed_seconds,
        "is_paused": progress.is_paused,
        "is_delayed": is_delayed,
        "is_approved": progress.is_approved,
        "estimated_minutes": progress.estimated_minutes,
        "started_at": progress.started_at.isoformat() if progress.started_at else None,
        "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
        "student_confirmed": getattr(progress, 'student_confirmed', False),
        "student_confirmed_at": progress.student_confirmed_at.isoformat() if getattr(progress, 'student_confirmed_at', None) else None
    }


# ===== FORMANDO: Confirmar que fez a aula =====
@router.post("/{lesson_id}/confirm")
async def confirm_lesson(
    lesson_id: int,
    training_plan_id: Optional[int] = None,
    confirmation: schemas.LessonConfirmation = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando confirma que fez a aula terminada pelo formador
    Só pode confirmar aulas com status COMPLETED
    """
    if current_user.role not in ["TRAINEE", "STUDENT"]:
        raise HTTPException(status_code=403, detail="Apenas formandos podem confirmar aulas")
    
    # Buscar progresso
    query = db.query(models.LessonProgress).filter(
        models.LessonProgress.lesson_id == lesson_id,
        models.LessonProgress.user_id == current_user.id
    )
    if training_plan_id:
        query = query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress = query.first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    if progress.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Só pode confirmar aulas já finalizadas pelo formador")
    
    if progress.student_confirmed:
        raise HTTPException(status_code=400, detail="Aula já foi confirmada")
    
    is_confirmed = confirmation.confirmed if confirmation else True
    
    progress.student_confirmed = is_confirmed
    progress.student_confirmed_at = datetime.now() if is_confirmed else None
    
    db.commit()
    db.refresh(progress)
    
    return {
        "message": "Aula confirmada com sucesso",
        "lesson_id": lesson_id,
        "student_confirmed": progress.student_confirmed,
        "student_confirmed_at": progress.student_confirmed_at.isoformat() if progress.student_confirmed_at else None
    }


# ===== FORMANDO: Listar minhas aulas =====
@router.get("/student/my-lessons")
async def list_my_lessons(
    training_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando vê TODAS as suas aulas - tanto as que já têm progresso
    como as que estão em planos de formação atribuídos ao formando.
    """
    if current_user.role not in ["TRAINEE", "STUDENT"]:
        raise HTTPException(status_code=403, detail="Apenas formandos podem acessar")
    
    # 1) Aulas com progresso (qualquer status)
    progress_query = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id
    )
    if training_plan_id:
        progress_query = progress_query.filter(models.LessonProgress.training_plan_id == training_plan_id)
    
    progress_list = progress_query.all()
    
    # Mapear lesson_id -> progress para evitar duplicados
    progress_map = {}
    for p in progress_list:
        key = (p.lesson_id, p.training_plan_id)
        progress_map[key] = p
    
    # 2) Encontrar TODAS as aulas de planos de formação atribuídos ao formando
    #    (via student_id direto ou TrainingPlanAssignment)
    from sqlalchemy import or_
    
    plans_query = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.is_active == True,
        or_(
            models.TrainingPlan.student_id == current_user.id,
            models.TrainingPlan.id.in_(
                db.query(models.TrainingPlanAssignment.training_plan_id).filter(
                    models.TrainingPlanAssignment.user_id == current_user.id
                )
            )
        )
    )
    if training_plan_id:
        plans_query = plans_query.filter(models.TrainingPlan.id == training_plan_id)
    
    plans = plans_query.all()
    
    # Para cada plano, buscar cursos e suas aulas
    for plan in plans:
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan.id
        ).all()
        
        for pc in plan_courses:
            course = db.query(models.Course).filter(models.Course.id == pc.course_id).first()
            if not course:
                continue
            lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course.id).all()
            for lesson in lessons:
                key = (lesson.id, plan.id)
                if key not in progress_map:
                    # Aula sem progresso - criar entrada virtual
                    progress_map[key] = {
                        "virtual": True,
                        "lesson_id": lesson.id,
                        "training_plan_id": plan.id,
                        "status": "NOT_STARTED",
                        "started_at": None,
                        "completed_at": None,
                        "estimated_minutes": lesson.estimated_minutes or 30,
                        "actual_time_minutes": None,
                        "student_confirmed": False,
                        "student_confirmed_at": None,
                    }
    
    # 3) Construir resultado
    result = []
    seen_lesson_ids = set()
    
    for key, p in progress_map.items():
        lesson_id = key[0]
        
        # Evitar duplicados do mesmo lesson_id (mostrar o mais relevante)
        if lesson_id in seen_lesson_ids:
            continue
        seen_lesson_ids.add(lesson_id)
        
        lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
        
        if isinstance(p, dict):
            # Entrada virtual (sem LessonProgress)
            result.append({
                "id": 0,
                "lesson_id": lesson_id,
                "training_plan_id": p["training_plan_id"],
                "lesson_title": lesson.title if lesson else None,
                "lesson_description": lesson.description if lesson else None,
                "materials_url": lesson.materials_url if lesson else None,
                "video_url": lesson.video_url if lesson else None,
                "status": "NOT_STARTED",
                "started_at": None,
                "completed_at": None,
                "estimated_minutes": p["estimated_minutes"],
                "actual_time_minutes": None,
                "accumulated_seconds": 0,
                "is_approved": False,
                "finished_by_name": None,
                "student_confirmed": False,
                "student_confirmed_at": None,
                "started_by": lesson.started_by if lesson else "TRAINER",
            })
        else:
            # Buscar nome do formador que finalizou
            finished_by_name = None
            if p.finished_by:
                finisher = db.query(models.User).filter(models.User.id == p.finished_by).first()
                if finisher:
                    finished_by_name = finisher.full_name or finisher.username
            
            result.append({
                "id": p.id,
                "lesson_id": p.lesson_id,
                "training_plan_id": p.training_plan_id,
                "lesson_title": lesson.title if lesson else None,
                "lesson_description": lesson.description if lesson else None,
                "materials_url": lesson.materials_url if lesson else None,
                "video_url": lesson.video_url if lesson else None,
                "status": p.status,
                "started_at": p.started_at.isoformat() if p.started_at else None,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "estimated_minutes": p.estimated_minutes,
                "actual_time_minutes": p.actual_time_minutes,
                "accumulated_seconds": p.accumulated_seconds or 0,
                "is_approved": getattr(p, 'is_approved', False),
                "finished_by_name": finished_by_name,
                "student_confirmed": getattr(p, 'student_confirmed', False),
                "student_confirmed_at": p.student_confirmed_at.isoformat() if getattr(p, 'student_confirmed_at', None) else None,
                "started_by": lesson.started_by if lesson else "TRAINER",
            })
    
    # Ordenar: NOT_STARTED/RELEASED primeiro, depois IN_PROGRESS/PAUSED, depois COMPLETED
    status_order = {"NOT_STARTED": 0, "RELEASED": 1, "IN_PROGRESS": 2, "PAUSED": 3, "COMPLETED": 4}
    result.sort(key=lambda x: status_order.get(x["status"], 5))
    
    return result


# ===== Endpoint para obter detalhes da lição =====
@router.get("/{lesson_id}/detail")
async def get_lesson_detail(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obter detalhes de uma lição"""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    
    # Buscar o nome do curso
    course = db.query(models.Course).filter(models.Course.id == lesson.course_id).first()
    
    return {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "content": lesson.content,
        "estimated_minutes": lesson.estimated_minutes,
        "lesson_type": lesson.lesson_type,
        "materials_url": lesson.materials_url,
        "video_url": lesson.video_url,
        "order_index": lesson.order_index,
        "course_id": lesson.course_id,
        "course_title": course.title if course else None,
        "started_by": lesson.started_by or "TRAINER"
    }
