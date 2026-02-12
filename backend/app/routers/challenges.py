from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from .. import models, schemas
from fastapi import Body
from ..database import get_db
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


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


def calculate_mpu(operations: int, time_minutes: float) -> float:
    """Calcula MPU (Minutos Por Unidade) = tempo / operações"""
    if operations <= 0:
        return 0.0
    return round(time_minutes / operations, 2)

def calculate_approval(calculated_mpu: float, target_mpu: float) -> tuple[bool, float]:
    """
    Calcula aprovação e percentual vs meta
    Para MPU (tempo/operações), quanto MENOR melhor
    Returns: (is_approved, mpu_vs_target_percentage)
    """
    if calculated_mpu <= 0:
        return False, 0.0
    
    # Percentual: se target=0.2 e calculated=0.1, então 200% (2x mais rápido que a meta)
    # Se calculated <= target, está aprovado (foi mais rápido ou igual à meta)
    mpu_vs_target = round((target_mpu / calculated_mpu) * 100, 2)
    is_approved = calculated_mpu <= target_mpu
    
    return is_approved, mpu_vs_target


def calculate_kpi_approval(
    challenge: models.Challenge,
    total_operations: int,
    calculated_mpu: float,
    errors_count: int
) -> tuple[bool, dict]:
    """
    Calcula aprovação baseada nos KPIs configurados no desafio.
    
    Args:
        challenge: O desafio com as configurações de KPI
        total_operations: Total de operações realizadas
        calculated_mpu: MPU calculado
        errors_count: Número de operações com erro
    
    Returns:
        (is_approved, kpi_details) onde kpi_details contém detalhes de cada KPI
    """
    kpi_details = {
        'volume': {'enabled': challenge.use_volume_kpi, 'passed': True, 'target': challenge.operations_required, 'actual': total_operations},
        'mpu': {'enabled': challenge.use_mpu_kpi, 'passed': True, 'target': challenge.target_mpu, 'actual': calculated_mpu},
        'errors': {'enabled': challenge.use_errors_kpi, 'passed': True, 'target': challenge.max_errors, 'actual': errors_count}
    }
    
    # Se kpi_mode é MANUAL, nenhum KPI é avaliado automaticamente
    kpi_mode = getattr(challenge, 'kpi_mode', 'AUTO') or 'AUTO'
    if kpi_mode == 'MANUAL':
        return None, kpi_details  # None indica que precisa de avaliação manual
    
    # Avaliar cada KPI habilitado
    if challenge.use_volume_kpi:
        kpi_details['volume']['passed'] = total_operations >= challenge.operations_required
    
    if challenge.use_mpu_kpi and challenge.target_mpu > 0:
        # MPU: quanto menor, melhor. Aprovado se calculated <= target
        kpi_details['mpu']['passed'] = calculated_mpu <= challenge.target_mpu if calculated_mpu > 0 else False
    
    if challenge.use_errors_kpi:
        kpi_details['errors']['passed'] = errors_count <= challenge.max_errors
    
    # Aprovação geral: todos os KPIs habilitados devem passar
    is_approved = True
    for kpi_name, kpi_data in kpi_details.items():
        if kpi_data['enabled'] and not kpi_data['passed']:
            is_approved = False
            break
    
    return is_approved, kpi_details

# ===== ADMIN/TRAINER: Criar Desafio =====
@router.post("/", response_model=schemas.Challenge, status_code=status.HTTP_201_CREATED)
async def create_challenge(
    challenge: schemas.ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Criar novo desafio (Admin ou Formador)
    - challenge_type: COMPLETE (com partes) ou SUMMARY (resumido)
    """
    # Validar course existe
    course = db.query(models.Course).filter(models.Course.id == challenge.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Validar tipo de desafio
    if challenge.challenge_type not in ["COMPLETE", "SUMMARY"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo de desafio inválido. Use 'COMPLETE' ou 'SUMMARY'"
        )
    
    db_challenge = models.Challenge(
        **challenge.model_dump(),
        created_by=current_user.id
    )
    
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    
    # Reabrir planos de formação concluídos que contêm este curso
    reopened_count = reopen_completed_training_plans(db, challenge.course_id, "new_challenge")
    if reopened_count > 0:
        print(f"[INFO] {reopened_count} plano(s) de formação reaberto(s) devido a novo desafio no curso {challenge.course_id}")
    
    return db_challenge

# ===== LISTAR Desafios de um Curso =====
@router.get("/course/{course_id}", response_model=List[schemas.Challenge])
async def list_course_challenges(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Listar todos os desafios de um curso"""
    challenges = db.query(models.Challenge).filter(
        models.Challenge.course_id == course_id,
        models.Challenge.is_active == True
    ).all()
    
    return challenges

# ===== VER Desafio Específico =====
@router.get("/{challenge_id}", response_model=schemas.Challenge)
async def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obter detalhes de um desafio específico"""
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    return challenge


@router.get("/{challenge_id}/eligible-students")
async def get_eligible_students(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """Return students assigned to training plans that include the course of this challenge.
    TRAINERs will only see students from their own plans.
    """
    # Fetch challenge.course_id only (avoid selecting new columns not present in DB)
    challenge_course = db.query(models.Challenge.course_id).filter(models.Challenge.id == challenge_id).first()
    if not challenge_course:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    course_id = challenge_course[0]

    # Find plans that include the course
    plans = db.query(models.TrainingPlan).join(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.course_id == course_id
    ).all()

    if not plans:
        return []

    student_ids = set()
    for plan in plans:
        # If trainer, skip plans not owned by trainer
        if current_user.role == 'TRAINER' and plan.trainer_id != current_user.id:
            continue

        # Usar student_id diretamente do plano (1 aluno por plano)
        if plan.student_id:
            student_ids.add(plan.student_id)

    if not student_ids:
        return []

    students = db.query(models.User).filter(
        models.User.id.in_(list(student_ids)),
        models.User.role == 'TRAINEE',
        models.User.is_active == True
    ).all()

    result = []
    for s in students:
        result.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email
        })

    return result


@router.get("/{challenge_id}/eligible-students/debug")
async def get_eligible_students_debug(
    challenge_id: int,
    db: Session = Depends(get_db),
):
    """Debug endpoint (no auth) — returns same as eligible-students for local debugging only."""
    # Debug variant: fetch course_id directly
    challenge_course = db.query(models.Challenge.course_id).filter(models.Challenge.id == challenge_id).first()
    if not challenge_course:
        return []
    course_id = challenge_course[0]

    plans = db.query(models.TrainingPlan).join(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.course_id == course_id
    ).all()

    if not plans:
        return []

    student_ids = set()
    for plan in plans:
        # Usar student_id diretamente do plano (1 aluno por plano)
        if plan.student_id:
            student_ids.add(plan.student_id)

    if not student_ids:
        return []

    students = db.query(models.User).filter(
        models.User.id.in_(list(student_ids)),
        models.User.role == 'TRAINEE',
        models.User.is_active == True
    ).all()

    result = []
    for s in students:
        result.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email
        })

    return result

# ===== ATUALIZAR Desafio =====
@router.put("/{challenge_id}", response_model=schemas.Challenge)
async def update_challenge(
    challenge_id: int,
    challenge_update: schemas.ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """Atualizar desafio existente (Admin ou Formador)"""
    db_challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Atualizar campos fornecidos
    update_data = challenge_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_challenge, field, value)
    
    db_challenge.updated_at = datetime.now()
    db.commit()
    db.refresh(db_challenge)
    
    return db_challenge


# ===== LIBERAR Desafio para Formandos =====
@router.post("/{challenge_id}/release", response_model=schemas.Challenge)
async def release_challenge(
    challenge_id: int,
    release_data: schemas.ChallengeRelease = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Liberar ou bloquear desafio para formandos
    Apenas desafios liberados aparecem para o formando
    """
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    is_released = release_data.is_released if release_data else True
    
    challenge.is_released = is_released
    if is_released:
        challenge.released_at = datetime.now()
        challenge.released_by = current_user.id
    else:
        challenge.released_at = None
        challenge.released_by = None
    
    challenge.updated_at = datetime.now()
    db.commit()
    db.refresh(challenge)
    
    return challenge


# ===== LISTAR Desafios Liberados para Formando =====
@router.get("/student/released", response_model=List[schemas.Challenge])
async def list_released_challenges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Listar desafios liberados para o formando atual
    Verifica na tabela challenge_releases se o desafio foi liberado para este estudante
    """
    if current_user.role not in ["TRAINEE", "STUDENT"]:
        raise HTTPException(status_code=403, detail="Apenas formandos podem acessar")
    
    # Buscar desafios liberados para este estudante
    releases = db.query(models.ChallengeRelease).filter(
        models.ChallengeRelease.student_id == current_user.id
    ).all()
    
    if not releases:
        return []
    
    challenge_ids = [r.challenge_id for r in releases]
    
    # Buscar desafios ativos
    challenges = db.query(models.Challenge).filter(
        models.Challenge.id.in_(challenge_ids),
        models.Challenge.is_active == True
    ).all()
    
    return challenges


# ===== FORMADOR: Liberar Desafio para Estudante =====
@router.post("/{challenge_id}/release/{student_id}")
async def release_challenge_for_student(
    challenge_id: int,
    student_id: int,
    training_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Formador/Admin libera um desafio para um estudante específico
    """
    # Validar desafio existe
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Validar estudante existe (TRAINEE ou TRAINER inscrito como formando)
    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role.in_(["TRAINEE", "STUDENT", "TRAINER"])
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")
    
    # Verificar se já está liberado
    existing = db.query(models.ChallengeRelease).filter(
        models.ChallengeRelease.challenge_id == challenge_id,
        models.ChallengeRelease.student_id == student_id
    ).first()
    
    if existing:
        return {"message": "Desafio já está liberado para este estudante", "released": True}
    
    # Criar liberação
    release = models.ChallengeRelease(
        challenge_id=challenge_id,
        student_id=student_id,
        training_plan_id=training_plan_id,
        released_by=current_user.id
    )
    
    db.add(release)
    db.commit()
    
    return {"message": "Desafio liberado com sucesso", "released": True}


# ===== VERIFICAR se Desafio está Liberado =====
@router.get("/{challenge_id}/is-released/{student_id}")
async def check_challenge_released(
    challenge_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Verificar se um desafio está liberado para um estudante
    """
    release = db.query(models.ChallengeRelease).filter(
        models.ChallengeRelease.challenge_id == challenge_id,
        models.ChallengeRelease.student_id == student_id
    ).first()
    
    return {"released": release is not None}

# ===== SUBMETER Desafio SUMMARY (Resumido) =====
@router.post("/submit/summary", response_model=schemas.ChallengeSubmission, status_code=status.HTTP_201_CREATED)
async def submit_challenge_summary(
    submission: schemas.ChallengeSubmissionSummary,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Submeter desafio tipo SUMMARY (resumido)
    Formador insere apenas: total de operações + tempo total
    Sistema calcula MPU e aprova/reprova
    """
    # Validar challenge existe e é tipo SUMMARY
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    if challenge.challenge_type != "SUMMARY":
        raise HTTPException(
            status_code=400,
            detail="Este desafio é tipo COMPLETE. Use o endpoint apropriado."
        )
    
    # Validar estudante existe
    student = db.query(models.User).filter(
        models.User.id == submission.user_id,
        models.User.role == "TRAINEE"
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")

    # Verificar se o estudante está atribuído a algum plano que contenha o curso do desafio
    plans_with_course = db.query(models.TrainingPlan).join(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.course_id == challenge.course_id
    ).all()

    if not plans_with_course:
        # Se o curso não está em nenhum plano, rejeitamos por segurança
        raise HTTPException(status_code=400, detail="Curso do desafio não está associado a nenhum plano de formação")

    # Verificar se existe pelo menos um plano onde o estudante esteja atribuído
    assignment_found = False
    for plan in plans_with_course:
        # Verificar via TrainingPlanAssignment (novo modelo N:N)
        assignment = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan.id,
            models.TrainingPlanAssignment.user_id == submission.user_id
        ).first()
        
        if assignment:
            # Se o aplicador for TRAINER, garantir que o plan pertence ao trainer atual
            if current_user.role == 'TRAINER' and plan.trainer_id != current_user.id:
                # este plano não pertence ao trainer atual — ignorar e continuar procurando
                continue
            assignment_found = True
            break
        
        # Fallback: verificar student_id legacy no plano
        if plan.student_id == submission.user_id:
            # Se o aplicador for TRAINER, garantir que o plan pertence ao trainer atual
            if current_user.role == 'TRAINER' and plan.trainer_id != current_user.id:
                # este plano não pertence ao trainer atual — ignorar e continuar procurando
                continue
            assignment_found = True
            break

    if not assignment_found:
        raise HTTPException(status_code=403, detail="Estudante não está atribuído a um plano que contenha este curso ou sem permissão para aplicar")
    
    # Calcular MPU
    calculated_mpu = calculate_mpu(submission.total_operations, submission.total_time_minutes)

    # Verificar aprovação por MPU
    is_approved_mpu, mpu_vs_target = calculate_approval(calculated_mpu, challenge.target_mpu)

    # Para SUMMARY: errors_count é o número de OPERAÇÕES com erro inserido pelo formador
    # Os campos error_methodology, error_knowledge, etc são totais de erros por tipo (para relatório)
    max_errors = getattr(challenge, 'max_errors', 0) or 0
    operations_with_errors = submission.errors_count or 0  # Número de operações com pelo menos 1 erro
    errors_ok = operations_with_errors <= max_errors

    # Verificar modo de avaliação
    kpi_mode = getattr(challenge, 'kpi_mode', 'AUTO') or 'AUTO'
    
    if kpi_mode == 'MANUAL':
        # Modo manual: formador decide depois
        is_approved = None
        status = "PENDING_REVIEW"
    else:
        # Modo automático: calcular aprovação baseado em KPIs
        is_approved, _ = calculate_kpi_approval(challenge, submission.total_operations, calculated_mpu, operations_with_errors)
        status = "APPROVED" if is_approved else "REJECTED"
    
    # Total de erros individuais (para relatório) - não afeta aprovação
    total_individual_errors = (submission.error_methodology or 0) + \
                              (submission.error_knowledge or 0) + \
                              (submission.error_detail or 0) + \
                              (submission.error_procedure or 0)
    
    # Calcular score (0-100)
    score = min(mpu_vs_target, 100.0)
    
    # Criar submission
    now = datetime.now()
    db_submission = models.ChallengeSubmission(
        challenge_id=submission.challenge_id,
        user_id=submission.user_id,
        training_plan_id=submission.training_plan_id,
        submission_type="SUMMARY",
        status=status,
        total_operations=submission.total_operations,
        total_time_minutes=submission.total_time_minutes,
        errors_count=operations_with_errors,  # Número de OPERAÇÕES com erro
        error_methodology=submission.error_methodology,
        error_knowledge=submission.error_knowledge,
        error_detail=submission.error_detail,
        error_procedure=submission.error_procedure,
        operation_reference=submission.operation_reference,
        started_at=now,
        completed_at=now if status == "COMPLETED" else None,
        calculated_mpu=calculated_mpu,
        mpu_vs_target=mpu_vs_target,
        is_approved=is_approved,
        score=score,
        submitted_by=current_user.id
    )
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    # Salvar detalhes dos erros (para SUMMARY)
    if submission.error_details:
        for err_detail in submission.error_details:
            db_error = models.SubmissionError(
                submission_id=db_submission.id,
                error_type=err_detail.get('error_type', 'METHODOLOGY'),
                description=err_detail.get('description', ''),
                operation_reference=err_detail.get('operation_reference')
            )
            db.add(db_error)
        db.commit()
    
    return db_submission

# ===== FORMANDO: INICIAR Desafio COMPLETE (por conta própria) =====
@router.post("/submit/complete/start/{challenge_id}/self", response_model=schemas.ChallengeSubmission)
async def start_challenge_complete_self(
    challenge_id: int,
    body: Optional[dict] = Body(default={}),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando inicia desafio tipo COMPLETE por conta própria
    """
    # Extrair training_plan_id do body
    training_plan_id = body.get('training_plan_id') if body else None
    
    # Verificar se é formando
    if current_user.role not in ["TRAINEE", "STUDENT"]:
        raise HTTPException(status_code=403, detail="Apenas formandos podem iniciar desafios desta forma")
    
    # Validar challenge
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    if challenge.challenge_type != "COMPLETE":
        raise HTTPException(
            status_code=400,
            detail="Este desafio é tipo SUMMARY. Use o endpoint apropriado."
        )
    
    # Verificar se o formando está atribuído a um plano que contenha o curso do desafio
    # Usar TrainingPlanAssignment para verificar atribuição (novo modelo N:N)
    plans_with_course = db.query(models.TrainingPlan).join(
        models.TrainingPlanCourse
    ).join(
        models.TrainingPlanAssignment
    ).filter(
        models.TrainingPlanCourse.course_id == challenge.course_id,
        models.TrainingPlanAssignment.user_id == current_user.id
    ).all()
    
    # Fallback: também verificar student_id legacy
    if not plans_with_course:
        plans_with_course = db.query(models.TrainingPlan).join(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.course_id == challenge.course_id,
            models.TrainingPlan.student_id == current_user.id
        ).all()
    
    if not plans_with_course:
        raise HTTPException(status_code=403, detail="Não está atribuído a um plano que contenha este desafio")
    
    # Verificar se já existe submissão submetida ou concluída (não pode refazer)
    completed_submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.status.in_(["SUBMITTED", "COMPLETED", "PENDING_REVIEW", "APPROVED", "REJECTED"])
    ).first()
    
    if completed_submission:
        raise HTTPException(
            status_code=400, 
            detail="Você já submeteu este desafio. Não é possível refazer."
        )
    
    # Verificar se já existe submission em aberto (retornar existente)
    existing = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.completed_at == None
    ).first()
    
    if existing:
        return existing
    
    # Criar nova submission
    db_submission = models.ChallengeSubmission(
        challenge_id=challenge_id,
        user_id=current_user.id,
        submission_type="COMPLETE",
        status="IN_PROGRESS",
        started_at=datetime.now(),
        submitted_by=current_user.id,
        training_plan_id=training_plan_id,
        is_approved=False
    )
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    return db_submission


# ===== INICIAR Desafio COMPLETE (Com partes) =====
@router.post("/submit/complete/start/{challenge_id}", response_model=schemas.ChallengeSubmission)
async def start_challenge_complete(
    challenge_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Iniciar desafio tipo COMPLETE
    Cria submission vazio para depois adicionar partes
    """
    # Validar challenge
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    if challenge.challenge_type != "COMPLETE":
        raise HTTPException(
            status_code=400,
            detail="Este desafio é tipo SUMMARY. Use o endpoint apropriado."
        )
    
    # Validar estudante
    student = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "TRAINEE"
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")

    # Verificar se o estudante está atribuído a algum plano que contenha o curso do desafio
    plans_with_course = db.query(models.TrainingPlan).join(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.course_id == challenge.course_id
    ).all()

    if not plans_with_course:
        raise HTTPException(status_code=400, detail="Curso do desafio não está associado a nenhum plano de formação")

    assignment_found = False
    for plan in plans_with_course:
        # Usar student_id diretamente do plano (1 aluno por plano)
        if plan.student_id == user_id:
            if current_user.role == 'TRAINER' and plan.trainer_id != current_user.id:
                continue
            assignment_found = True
            break

    if not assignment_found:
        raise HTTPException(status_code=403, detail="Estudante não está atribuído a um plano que contenha este curso ou sem permissão para aplicar")
    
    # Verificar se já existe submissão submetida ou concluída (não pode refazer)
    completed_submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.status.in_(["SUBMITTED", "COMPLETED", "PENDING_REVIEW", "APPROVED", "REJECTED"])
    ).first()
    
    if completed_submission:
        raise HTTPException(
            status_code=400, 
            detail="Este estudante já submeteu este desafio. Não é possível refazer."
        )
    
    # Verificar se já existe submission em aberto
    existing = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.completed_at == None
    ).first()
    
    if existing:
        return existing
    
    # Criar nova submission
    db_submission = models.ChallengeSubmission(
        challenge_id=challenge_id,
        user_id=user_id,
        submission_type="COMPLETE",
        started_at=datetime.now(),
        submitted_by=current_user.id,
        is_approved=False
    )
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    return db_submission

# ===== ADICIONAR Parte ao Desafio COMPLETE =====
@router.post("/submit/complete/{submission_id}/part", response_model=schemas.ChallengePart)
async def add_challenge_part(
    submission_id: int,
    part: schemas.ChallengePartCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Adicionar uma parte individual ao desafio COMPLETE
    Cada parte tem: número, operações, início, fim
    """
    # Validar submission existe
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    if submission.submission_type != "COMPLETE":
        raise HTTPException(status_code=400, detail="Submission não é tipo COMPLETE")
    
    if submission.completed_at:
        raise HTTPException(status_code=400, detail="Submission já foi finalizada")
    
    # Calcular duração e MPU
    duration = (part.completed_at - part.started_at).total_seconds() / 60  # minutos
    mpu = calculate_mpu(part.operations_count, duration)
    
    # Criar parte
    db_part = models.ChallengePart(
        challenge_id=submission.challenge_id,
        submission_id=submission_id,
        part_number=part.part_number,
        operations_count=part.operations_count,
        started_at=part.started_at,
        completed_at=part.completed_at,
        duration_minutes=duration,
        mpu=mpu
    )
    
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    
    return db_part

# ===== FINALIZAR Desafio COMPLETE =====
@router.post("/submit/complete/{submission_id}/finish", response_model=schemas.ChallengeSubmissionDetail)
async def finish_challenge_complete(
    submission_id: int,
    finish_input: schemas.ChallengeFinishInput = Body(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Finalizar desafio COMPLETE
    Calcula totais de todas as partes, MPU médio e aprova/reprova
    """
    # Buscar submission com partes
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    if submission.completed_at:
        raise HTTPException(status_code=400, detail="Submission já foi finalizada")
    
    # Buscar partes
    parts = db.query(models.ChallengePart).filter(
        models.ChallengePart.submission_id == submission_id
    ).all()
    
    if not parts:
        raise HTTPException(
            status_code=400,
            detail="Nenhuma parte foi adicionada. Adicione pelo menos uma parte antes de finalizar."
        )
    
    # Calcular totais
    total_operations = sum(part.operations_count for part in parts)
    total_time = sum(part.duration_minutes for part in parts)
    
    # Calcular MPU geral
    calculated_mpu = calculate_mpu(total_operations, total_time)
    
    # Buscar challenge para comparar com target
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    # Aprovação por MPU
    is_approved_mpu, mpu_vs_target = calculate_approval(calculated_mpu, challenge.target_mpu)
    score = min(mpu_vs_target, 100.0)

    # Contar OPERAÇÕES com erro (não total de erros)
    # Para COMPLETE: conta operations onde has_error=True
    operations_with_errors = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission.id,
        models.ChallengeOperation.has_error == True
    ).count()
    
    # errors_count guarda o número de OPERAÇÕES com erro
    errors_count = operations_with_errors

    # Também guardar totais de erros por tipo (para relatórios)
    error_methodology = 0
    error_knowledge = 0
    error_detail = 0
    error_procedure = 0
    
    # Buscar todos os erros de todas as operações desta submission
    all_operations = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission.id
    ).all()
    
    for op in all_operations:
        for err in op.errors:
            if err.error_type == 'METHODOLOGY':
                error_methodology += 1
            elif err.error_type == 'KNOWLEDGE':
                error_knowledge += 1
            elif err.error_type == 'DETAIL':
                error_detail += 1
            elif err.error_type == 'PROCEDURE':
                error_procedure += 1

    # Aprovação por erros: max_errors refere-se a OPERAÇÕES com erro, não total de erros
    max_errors = getattr(challenge, 'max_errors', 0) or 0
    errors_ok = operations_with_errors <= max_errors

    is_approved = is_approved_mpu and errors_ok
    
    # Atualizar submission
    submission.total_operations = total_operations
    submission.total_time_minutes = int(total_time)
    submission.errors_count = errors_count
    submission.error_methodology = error_methodology
    submission.error_knowledge = error_knowledge
    submission.error_detail = error_detail
    submission.error_procedure = error_procedure
    submission.completed_at = datetime.now()
    submission.calculated_mpu = calculated_mpu
    submission.mpu_vs_target = mpu_vs_target
    submission.is_approved = is_approved
    submission.score = score
    submission.updated_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    # Retornar com detalhes (construir dict explícito para evitar __dict__ issues)
    resp = {
        "id": submission.id,
        "challenge_id": submission.challenge_id,
        "user_id": submission.user_id,
        "submission_type": submission.submission_type,
        "total_operations": submission.total_operations,
        "total_time_minutes": submission.total_time_minutes,
        "started_at": submission.started_at.isoformat() if submission.started_at else None,
        "completed_at": submission.completed_at.isoformat() if submission.completed_at else None,
        "calculated_mpu": submission.calculated_mpu,
        "mpu_vs_target": submission.mpu_vs_target,
        "is_approved": submission.is_approved,
        "score": submission.score,
        "feedback": submission.feedback,
        "submitted_by": submission.submitted_by,
        "created_at": submission.created_at.isoformat() if submission.created_at else None,
        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
        "parts": [
            {
                "id": p.id,
                "challenge_id": p.challenge_id,
                "submission_id": p.submission_id,
                "part_number": p.part_number,
                "operations_count": p.operations_count,
                "started_at": p.started_at.isoformat() if p.started_at else None,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "duration_minutes": p.duration_minutes,
                "mpu": p.mpu,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parts
        ],
        "challenge": {
            "id": challenge.id,
            "course_id": challenge.course_id,
            "title": challenge.title,
            "description": challenge.description,
            "challenge_type": challenge.challenge_type,
            "operations_required": challenge.operations_required,
            "time_limit_minutes": challenge.time_limit_minutes,
            "target_mpu": challenge.target_mpu,
            "max_errors": getattr(challenge, 'max_errors', 0),
            "created_by": getattr(challenge, 'created_by', None),
            "is_active": challenge.is_active,
            "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
            "updated_at": challenge.updated_at.isoformat() if challenge.updated_at else None,
        }
    }

    return resp

# ===== LISTAR Submissions de um Desafio =====
@router.get("/{challenge_id}/submissions", response_model=List[schemas.ChallengeSubmission])
async def list_challenge_submissions(
    challenge_id: int,
    user_id: Optional[int] = None,
    training_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Listar submissions de um desafio
    - Formador pode ver todas ou filtrar por user_id e training_plan_id
    - Formando só pode ver as suas próprias
    """
    query = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id
    )
    
    # Se é formando, só pode ver suas próprias submissions
    if current_user.role in ["TRAINEE", "STUDENT"]:
        query = query.filter(models.ChallengeSubmission.user_id == current_user.id)
    else:
        # Formador pode filtrar por user_id
        if user_id:
            query = query.filter(models.ChallengeSubmission.user_id == user_id)
    
    # Filtrar por training_plan_id se fornecido
    if training_plan_id:
        query = query.filter(models.ChallengeSubmission.training_plan_id == training_plan_id)
    
    submissions = query.order_by(models.ChallengeSubmission.created_at.desc()).all()
    
    return submissions


# ===== LISTAR Submissions Pendentes de Revisão (para Formador) =====
@router.get("/pending-review/list", response_model=List[schemas.ChallengeSubmissionDetail])
async def list_pending_review_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Listar todas as submissions pendentes de revisão
    Ordenadas por data de submissão (mais antigas primeiro)
    """
    submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.status == "PENDING_REVIEW"
    ).order_by(models.ChallengeSubmission.updated_at.asc()).all()
    
    # Enriquecer com dados de challenge e user
    result = []
    for sub in submissions:
        challenge = db.query(models.Challenge).filter(
            models.Challenge.id == sub.challenge_id
        ).first()
        user = db.query(models.User).filter(
            models.User.id == sub.user_id
        ).first()
        
        # Contar operações
        ops_count = db.query(models.ChallengeOperation).filter(
            models.ChallengeOperation.submission_id == sub.id
        ).count()
        
        result.append({
            "id": sub.id,
            "challenge_id": sub.challenge_id,
            "user_id": sub.user_id,
            "submission_type": sub.submission_type,
            "status": getattr(sub, 'status', 'IN_PROGRESS'),
            "total_operations": sub.total_operations or ops_count,
            "total_time_minutes": sub.total_time_minutes,
            "started_at": sub.started_at,
            "completed_at": sub.completed_at,
            "calculated_mpu": sub.calculated_mpu,
            "mpu_vs_target": sub.mpu_vs_target,
            "is_approved": sub.is_approved,
            "score": sub.score,
            "feedback": sub.feedback,
            "submitted_by": sub.submitted_by,
            "errors_count": sub.errors_count or 0,
            "error_methodology": sub.error_methodology or 0,
            "error_knowledge": sub.error_knowledge or 0,
            "error_detail": sub.error_detail or 0,
            "error_procedure": sub.error_procedure or 0,
            "operation_reference": sub.operation_reference,
            "created_at": sub.created_at,
            "updated_at": sub.updated_at,
            "parts": [],
            "operations": [],
            "challenge": {
                "id": challenge.id,
                "course_id": challenge.course_id,
                "title": challenge.title,
                "description": challenge.description,
                "challenge_type": challenge.challenge_type,
                "operations_required": challenge.operations_required,
                "time_limit_minutes": challenge.time_limit_minutes,
                "target_mpu": challenge.target_mpu,
            } if challenge else None,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            } if user else None,
            "submitter": None
        })
    
    return result


# ===== VER Detalhes de uma Submission =====
@router.get("/submissions/{submission_id}", response_model=schemas.ChallengeSubmissionDetail)
async def get_submission_detail(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Ver detalhes completos de uma submission incluindo partes e erros"""
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    # Formando só pode ver suas próprias submissions
    if current_user.role in ["TRAINEE", "STUDENT"]:
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão para ver esta submission")
    
    # Buscar partes se for tipo COMPLETE
    parts = []
    if submission.submission_type == "COMPLETE":
        parts = db.query(models.ChallengePart).filter(
            models.ChallengePart.submission_id == submission_id
        ).all()
    
    # Buscar operações com seus erros
    operations = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission_id
    ).order_by(models.ChallengeOperation.operation_number).all()
    
    # Contar operações completadas (para COMPLETE)
    completed_operations_count = len([op for op in operations if op.completed_at])
    
    operations_data = []
    for op in operations:
        errors = db.query(models.OperationError).filter(
            models.OperationError.operation_id == op.id
        ).all()
        operations_data.append({
            "id": op.id,
            "submission_id": op.submission_id,
            "operation_number": op.operation_number,
            "operation_reference": op.operation_reference,
            "started_at": op.started_at.isoformat() if op.started_at else None,
            "completed_at": op.completed_at.isoformat() if op.completed_at else None,
            "duration_seconds": op.duration_seconds,
            "has_error": op.has_error,
            "is_approved": op.is_approved,
            "created_at": op.created_at.isoformat() if op.created_at else None,
            "errors": [
                {
                    "id": err.id,
                    "operation_id": err.operation_id,
                    "error_type": err.error_type,
                    "description": err.description,
                    "created_at": err.created_at.isoformat() if err.created_at else None
                } for err in errors
            ]
        })
    
    # Buscar challenge
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    # Buscar user e submitter
    user = db.query(models.User).filter(models.User.id == submission.user_id).first()
    submitter = db.query(models.User).filter(models.User.id == submission.submitted_by).first() if submission.submitted_by else None
    
    # Buscar erros da submission (para SUMMARY)
    submission_errors = db.query(models.SubmissionError).filter(
        models.SubmissionError.submission_id == submission_id
    ).all()
    
    # Calcular valores para COMPLETE baseado nas operações reais
    actual_total_operations = completed_operations_count if submission.submission_type == "COMPLETE" else (submission.total_operations or 0)
    
    # Calcular tempo total e MPU para COMPLETE
    total_time_calculated = submission.total_time_minutes or 0
    calculated_mpu_value = submission.calculated_mpu or 0
    
    if submission.submission_type == "COMPLETE" and operations:
        total_seconds = sum(op.duration_seconds or 0 for op in operations if op.completed_at)
        total_time_calculated = round(total_seconds / 60, 2) if total_seconds > 0 else 0
        if actual_total_operations > 0 and total_time_calculated > 0:
            # MPU = tempo / operações (minutos por unidade)
            calculated_mpu_value = round(total_time_calculated / actual_total_operations, 2)
    
    # Calcular erros para COMPLETE
    errors_in_operations = len([op for op in operations if op.has_error])
    actual_errors_count = errors_in_operations if submission.submission_type == "COMPLETE" else (submission.errors_count or 0)
    
    # Calcular mpu_vs_target (quanto menor o MPU calculado, melhor)
    mpu_vs_target_value = (challenge.target_mpu / calculated_mpu_value * 100) if challenge and challenge.target_mpu and calculated_mpu_value else (submission.mpu_vs_target or 0)
    
    resp = {
        "id": submission.id,
        "challenge_id": submission.challenge_id,
        "user_id": submission.user_id,
        "training_plan_id": submission.training_plan_id,
        "submission_type": submission.submission_type,
        "status": submission.status,
        "total_operations": actual_total_operations,
        "total_time_minutes": total_time_calculated,
        "started_at": submission.started_at.isoformat() if submission.started_at else None,
        "completed_at": submission.completed_at.isoformat() if submission.completed_at else None,
        "calculated_mpu": calculated_mpu_value,
        "mpu_vs_target": mpu_vs_target_value,
        "is_approved": submission.is_approved,
        "score": submission.score,
        "feedback": submission.feedback,
        "submitted_by": submission.submitted_by,
        "errors_count": actual_errors_count,
        "retry_count": getattr(submission, 'retry_count', 0),
        "is_retry_allowed": getattr(submission, 'is_retry_allowed', False),
        "trainer_notes": getattr(submission, 'trainer_notes', None),
        "created_at": submission.created_at.isoformat() if submission.created_at else None,
        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
        "parts": [
            {
                "id": p.id,
                "challenge_id": p.challenge_id,
                "submission_id": p.submission_id,
                "part_number": p.part_number,
                "operations_count": p.operations_count,
                "started_at": p.started_at.isoformat() if p.started_at else None,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "duration_minutes": p.duration_minutes,
                "mpu": p.mpu,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parts
        ],
        "operations": operations_data,  # Operações com erros detalhados (COMPLETE)
        "submission_errors": [  # Erros detalhados (SUMMARY)
            {
                "id": se.id,
                "error_type": se.error_type,
                "description": se.description,
                "operation_reference": se.operation_reference,
                "created_at": se.created_at.isoformat() if se.created_at else None
            }
            for se in submission_errors
        ],
        "challenge": {
            "id": challenge.id,
            "course_id": challenge.course_id,
            "title": challenge.title,
            "description": challenge.description,
            "challenge_type": challenge.challenge_type,
            "operations_required": challenge.operations_required,
            "time_limit_minutes": challenge.time_limit_minutes,
            "target_mpu": challenge.target_mpu,
            "max_errors": getattr(challenge, 'max_errors', 0) if challenge else 0,
            "use_volume_kpi": getattr(challenge, 'use_volume_kpi', True) if challenge else True,
            "use_mpu_kpi": getattr(challenge, 'use_mpu_kpi', True) if challenge else True,
            "use_errors_kpi": getattr(challenge, 'use_errors_kpi', True) if challenge else True,
            "kpi_mode": getattr(challenge, 'kpi_mode', 'AUTO') if challenge else 'AUTO',
            "allow_retry": getattr(challenge, 'allow_retry', False) if challenge else False,
            "created_by": getattr(challenge, 'created_by', None) if challenge else None,
            "is_active": challenge.is_active if challenge else None,
            "created_at": challenge.created_at.isoformat() if challenge and challenge.created_at else None,
            "updated_at": challenge.updated_at.isoformat() if challenge and challenge.updated_at else None,
        } if challenge else None,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        } if user else None,
        "submitter": {
            "id": submitter.id,
            "email": submitter.email,
            "full_name": submitter.full_name,
            "role": submitter.role
        } if submitter else None,
        # Resumo de erros (para formando ver claramente)
        "errors_summary": {
            "operations_with_errors": actual_errors_count,
            "max_errors_allowed": getattr(challenge, 'max_errors', 0) if challenge else 0,
            "error_methodology": submission.error_methodology or 0,
            "error_knowledge": submission.error_knowledge or 0,
            "error_detail": submission.error_detail or 0,
            "error_procedure": submission.error_procedure or 0,
            "total_individual_errors": (submission.error_methodology or 0) + 
                                       (submission.error_knowledge or 0) + 
                                       (submission.error_detail or 0) + 
                                       (submission.error_procedure or 0)
        }
    }

    return resp


# ===== FORMANDO: Iniciar Operação (COMPLETE) =====
@router.post("/submissions/{submission_id}/operations/start", response_model=schemas.ChallengeOperation)
async def start_operation(
    submission_id: int,
    operation_data: schemas.ChallengeOperationStart,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando inicia uma operação com referência
    Usado em desafios COMPLETE onde cada operação é registrada
    """
    # Validar submission
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    if submission.completed_at:
        raise HTTPException(status_code=400, detail="Submission já foi finalizada")
    
    # Verificar se é o formando da submission ou formador/admin
    if current_user.role in ["TRAINEE", "STUDENT"]:
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Contar operações existentes para determinar número
    existing_count = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission_id
    ).count()
    
    # Validar limite de operações do desafio
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    if challenge and challenge.operations_required:
        if existing_count >= challenge.operations_required:
            raise HTTPException(
                status_code=400, 
                detail=f"Limite de operações atingido ({challenge.operations_required}). Submeta o desafio para revisão."
            )
    
    operation_number = existing_count + 1
    
    # Criar operação (is_approved=None significa pendente de revisão)
    db_operation = models.ChallengeOperation(
        submission_id=submission_id,
        operation_number=operation_number,
        operation_reference=operation_data.operation_reference,
        started_at=datetime.now(),
        has_error=False,
        is_approved=None  # Pendente de revisão pelo formador
    )
    
    db.add(db_operation)
    db.commit()
    db.refresh(db_operation)
    
    return db_operation


# ===== FORMANDO: Finalizar Operação (COMPLETE) =====
class OperationErrorInput(BaseModel):
    error_type: str  # METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE
    description: Optional[str] = None

class FinishOperationInput(BaseModel):
    has_error: bool = False
    errors: List[OperationErrorInput] = []

@router.post("/operations/{operation_id}/finish", response_model=schemas.ChallengeOperation)
async def finish_operation(
    operation_id: int,
    data: Optional[FinishOperationInput] = Body(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando finaliza uma operação (para contagem de tempo) e pode classificar erros
    """
    operation = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.id == operation_id
    ).first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    
    if operation.completed_at:
        raise HTTPException(status_code=400, detail="Operação já foi finalizada")
    
    # Verificar permissão
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == operation.submission_id
    ).first()
    
    if current_user.role in ["TRAINEE", "STUDENT"]:
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    now = datetime.now()
    operation.completed_at = now
    
    # Calcular duração
    if operation.started_at:
        duration = (now - operation.started_at).total_seconds()
        operation.duration_seconds = int(duration)
    
    # Registar erros se fornecidos
    if data:
        operation.has_error = data.has_error or len(data.errors) > 0
        
        # Criar registos de erro
        for err in data.errors:
            error_type = err.error_type.upper()
            if error_type not in ['METHODOLOGY', 'KNOWLEDGE', 'DETAIL', 'PROCEDURE']:
                continue
            
            op_error = models.OperationError(
                operation_id=operation.id,
                error_type=error_type,
                description=err.description
            )
            db.add(op_error)
    
    db.commit()
    db.refresh(operation)
    
    return operation


# ===== FORMANDO: Submeter para Revisão =====
@router.post("/submissions/{submission_id}/submit-for-review", response_model=schemas.ChallengeSubmission)
async def submit_for_review(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando finaliza a execução e submete para revisão do formador
    Todas as operações requeridas devem estar finalizadas
    """
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    # Verificar permissão - formando só pode submeter sua própria
    if current_user.role in ["TRAINEE", "STUDENT"]:
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Verificar se já foi submetida
    if getattr(submission, 'status', None) == "PENDING_REVIEW":
        raise HTTPException(status_code=400, detail="Já submetida para revisão")
    
    if submission.completed_at:
        raise HTTPException(status_code=400, detail="Submission já foi finalizada")
    
    # Buscar challenge para saber operações requeridas
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    required_operations = challenge.operations_required if challenge else 0
    
    # Verificar se há operações
    operations = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission_id
    ).all()
    
    if not operations:
        raise HTTPException(status_code=400, detail="Nenhuma operação registrada")
    
    # Contar operações completas
    completed_ops = [op for op in operations if op.completed_at]
    
    # Verificar se todas as operações requeridas foram completadas
    if len(completed_ops) < required_operations:
        raise HTTPException(
            status_code=400, 
            detail=f"Complete todas as {required_operations} operações antes de submeter. {len(completed_ops)}/{required_operations} concluídas."
        )
    
    # Calcular totais parciais
    total_operations = len(completed_ops)
    total_time_seconds = sum(op.duration_seconds or 0 for op in completed_ops)
    total_time_minutes = total_time_seconds / 60
    
    # Atualizar submission
    submission.status = "PENDING_REVIEW"
    submission.total_operations = total_operations
    submission.total_time_minutes = int(total_time_minutes)
    submission.updated_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    return submission


# ===== FORMADOR: Classificar Operação com Erros =====
@router.post("/operations/{operation_id}/classify", response_model=schemas.ChallengeOperation)
async def classify_operation(
    operation_id: int,
    classification: schemas.ChallengeOperationFinish,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Formador classifica uma operação indicando se tem erro e os detalhes dos erros
    Uma operação pode ter múltiplos erros, mas conta como 1 operação errada
    """
    operation = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.id == operation_id
    ).first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    
    operation.has_error = classification.has_error
    operation.is_approved = not classification.has_error
    
    # Remover erros anteriores se existirem
    db.query(models.OperationError).filter(
        models.OperationError.operation_id == operation_id
    ).delete()
    
    # Adicionar novos erros
    if classification.has_error and classification.errors:
        for err in classification.errors:
            db_error = models.OperationError(
                operation_id=operation_id,
                error_type=err.error_type,
                description=err.description[:160] if err.description else None
            )
            db.add(db_error)
    
    db.commit()
    db.refresh(operation)
    
    # Buscar erros para retorno
    operation.errors = db.query(models.OperationError).filter(
        models.OperationError.operation_id == operation_id
    ).all()
    
    return operation


# ===== LISTAR Operações de uma Submission =====
@router.get("/submissions/{submission_id}/operations", response_model=List[schemas.ChallengeOperation])
async def list_submission_operations(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Listar todas as operações de uma submission
    """
    operations = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission_id
    ).order_by(models.ChallengeOperation.operation_number).all()
    
    # Buscar erros para cada operação
    for op in operations:
        op.errors = db.query(models.OperationError).filter(
            models.OperationError.operation_id == op.id
        ).all()
    
    return operations


# ===== FORMANDO: Listar meus Desafios em Andamento =====
@router.get("/student/my-submissions")
async def list_my_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Listar todas as submissions do formando atual
    Inclui desafios em andamento e finalizados
    """
    if current_user.role not in ["TRAINEE", "STUDENT"]:
        raise HTTPException(status_code=403, detail="Apenas formandos podem acessar")
    
    submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.user_id == current_user.id
    ).order_by(models.ChallengeSubmission.created_at.desc()).all()
    
    result = []
    for sub in submissions:
        challenge = db.query(models.Challenge).filter(
            models.Challenge.id == sub.challenge_id
        ).first()
        
        # Contar operações
        operations_count = db.query(models.ChallengeOperation).filter(
            models.ChallengeOperation.submission_id == sub.id
        ).count()
        
        # Contar operações com erro
        errors_count = db.query(models.ChallengeOperation).filter(
            models.ChallengeOperation.submission_id == sub.id,
            models.ChallengeOperation.has_error == True
        ).count()
        
        result.append({
            "id": sub.id,
            "challenge_id": sub.challenge_id,
            "challenge_title": challenge.title if challenge else None,
            "challenge_type": challenge.challenge_type if challenge else None,
            "submission_type": sub.submission_type,
            "total_operations": sub.total_operations or operations_count,
            "started_at": sub.started_at.isoformat() if sub.started_at else None,
            "completed_at": sub.completed_at.isoformat() if sub.completed_at else None,
            "is_approved": sub.is_approved,
            "calculated_mpu": sub.calculated_mpu,
            "errors_count": sub.errors_count or errors_count,
            "is_in_progress": sub.started_at and not sub.completed_at,
            "is_retry_allowed": getattr(sub, 'is_retry_allowed', False),
            "retry_count": getattr(sub, 'retry_count', 0)
        })
    
    return result

# ===== FORMADOR: Finalizar Revisão de uma Submission =====
@router.post("/submissions/{submission_id}/finalize-review")
async def finalize_submission_review(
    submission_id: int,
    approve: bool = True,  # True = Aprovar, False = Reprovar (decisão manual do formador)
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Finalizar a revisão de uma submission.
    - Verifica se todas as operações requeridas foram executadas
    - Verifica se todas as operações foram classificadas
    - Calcula estatísticas finais (MPU, erros por tipo)
    - O formador decide manualmente se aprova ou reprova
    """
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    # Buscar challenge para os KPIs
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Buscar operações
    operations = db.query(models.ChallengeOperation).filter(
        models.ChallengeOperation.submission_id == submission_id
    ).all()
    
    completed_ops = [op for op in operations if op.completed_at]
    
    if len(completed_ops) == 0:
        raise HTTPException(status_code=400, detail="Não há operações concluídas para revisar")
    
    # Verificar se todas as operações requeridas foram executadas
    required_ops = challenge.operations_required or 0
    if len(completed_ops) < required_ops:
        raise HTTPException(
            status_code=400, 
            detail=f"O formando ainda não completou todas as operações. {len(completed_ops)}/{required_ops} concluídas."
        )
    
    # Verificar se todas as operações foram classificadas (is_approved não é None)
    pending_ops = [op for op in completed_ops if op.is_approved is None]
    if len(pending_ops) > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Existem {len(pending_ops)} operações pendentes de classificação"
        )
    
    # Calcular estatísticas
    total_ops = len(completed_ops)
    correct_ops = len([op for op in completed_ops if op.is_approved == True and not op.has_error])
    error_ops = len([op for op in completed_ops if op.has_error])
    
    # Calcular erros por tipo (para relatórios)
    error_methodology = 0
    error_knowledge = 0
    error_detail = 0
    error_procedure = 0
    
    for op in completed_ops:
        if op.has_error:
            errors = db.query(models.OperationError).filter(
                models.OperationError.operation_id == op.id
            ).all()
            for err in errors:
                if err.error_type == "METODOLOGIA":
                    error_methodology += 1
                elif err.error_type == "CONHECIMENTO":
                    error_knowledge += 1
                elif err.error_type == "DETALHE":
                    error_detail += 1
                elif err.error_type == "PROCEDIMENTO":
                    error_procedure += 1
    
    # O errors_count é o número de OPERAÇÕES com erro (não total de erros)
    operations_with_error = error_ops
    
    # Calcular MPU (Movimentos Por Unidade de tempo)
    # Prioridade: 1) soma dos duration_seconds das operações, 2) total_time_minutes, 3) diferença started_at/completed_at
    total_time_minutes = None
    
    # Primeiro: calcular a partir das operações (mais preciso)
    total_duration_seconds = sum(op.duration_seconds or 0 for op in completed_ops)
    if total_duration_seconds > 0:
        total_time_minutes = total_duration_seconds / 60.0
    # Segundo: usar total_time_minutes da submission se existir
    elif submission.total_time_minutes and submission.total_time_minutes > 0:
        total_time_minutes = submission.total_time_minutes
    # Terceiro: calcular a partir de started_at/completed_at
    elif submission.started_at and submission.completed_at:
        delta = submission.completed_at - submission.started_at
        total_time_minutes = delta.total_seconds() / 60
    
    calculated_mpu = 0.0
    if correct_ops > 0 and total_time_minutes and total_time_minutes > 0:
        # MPU = tempo / operações (minutos por unidade)
        calculated_mpu = round(total_time_minutes / correct_ops, 2)
    
    # Verificar aprovação - decisão manual do formador
    target_mpu = challenge.target_mpu or 0
    max_errors = challenge.max_errors
    
    # O formador decide manualmente se aprova ou reprova
    is_approved = approve
    
    # Total de erros registados (para relatório)
    total_errors_registered = error_methodology + error_knowledge + error_detail + error_procedure
    
    # Atualizar submission
    submission.total_operations = total_ops
    submission.total_time_minutes = int(total_time_minutes) if total_time_minutes else 0
    submission.errors_count = operations_with_error  # Número de operações com erro
    submission.error_methodology = error_methodology
    submission.error_knowledge = error_knowledge
    submission.error_detail = error_detail
    submission.error_procedure = error_procedure
    submission.calculated_mpu = calculated_mpu
    submission.mpu_vs_target = round((calculated_mpu / target_mpu * 100) if target_mpu > 0 else 100, 1)
    submission.is_approved = is_approved
    submission.status = "APPROVED" if is_approved else "REJECTED"
    # Garantir que completed_at seja definido
    if not submission.completed_at:
        submission.completed_at = datetime.utcnow()
    submission.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    
    return {
        "id": submission.id,
        "status": submission.status,
        "is_approved": submission.is_approved,
        "total_operations": total_ops,
        "correct_operations": correct_ops,
        "operations_with_error": operations_with_error,
        "total_errors_registered": total_errors_registered,
        "error_breakdown": {
            "methodology": error_methodology,
            "knowledge": error_knowledge,
            "detail": error_detail,
            "procedure": error_procedure
        },
        "calculated_mpu": calculated_mpu,
        "target_mpu": target_mpu,
        "mpu_vs_target": submission.mpu_vs_target,
        "max_errors": max_errors,
        "message": f"Revisão finalizada. Submission {'aprovada' if is_approved else 'rejeitada'}."
    }


# ===== FORMADOR: Habilitar Nova Tentativa após Reprovação =====
@router.post("/submissions/{submission_id}/allow-retry")
async def allow_submission_retry(
    submission_id: int,
    notes: Optional[str] = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Formador habilita nova tentativa para um formando reprovado.
    O formando poderá iniciar um novo desafio.
    """
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    if submission.status not in ["REJECTED", "APPROVED"]:
        raise HTTPException(status_code=400, detail="Só é possível habilitar nova tentativa para submissions finalizadas")
    
    # Verificar se o desafio permite retry
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    if not getattr(challenge, 'allow_retry', False):
        raise HTTPException(status_code=400, detail="Este desafio não permite novas tentativas")
    
    # Marcar como permitida nova tentativa
    submission.is_retry_allowed = True
    submission.trainer_notes = notes
    submission.updated_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    return {
        "message": "Nova tentativa habilitada com sucesso",
        "submission_id": submission.id,
        "is_retry_allowed": True
    }


# ===== FORMANDO: Iniciar Nova Tentativa =====
@router.post("/submissions/{submission_id}/start-retry", response_model=schemas.ChallengeSubmission)
async def start_submission_retry(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Formando inicia nova tentativa após ser habilitado pelo formador.
    Cria uma nova submission com retry_count incrementado.
    """
    # Buscar submission original
    original = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not original:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    # Verificar se é o formando da submission
    if current_user.role in ["TRAINEE", "STUDENT"] and original.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Verificar se retry foi habilitado
    if not getattr(original, 'is_retry_allowed', False):
        raise HTTPException(status_code=400, detail="Nova tentativa não foi habilitada pelo formador")
    
    # Criar nova submission
    retry_count = (getattr(original, 'retry_count', 0) or 0) + 1
    
    new_submission = models.ChallengeSubmission(
        challenge_id=original.challenge_id,
        user_id=original.user_id,
        training_plan_id=original.training_plan_id,
        submission_type=original.submission_type,
        status="IN_PROGRESS",
        started_at=datetime.now(),
        submitted_by=current_user.id,
        retry_count=retry_count,
        is_approved=False
    )
    
    # Desabilitar retry na submission original
    original.is_retry_allowed = False
    original.updated_at = datetime.now()
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    return new_submission


# ===== FORMADOR: Finalizar Desafio Manualmente (KPI_MODE=MANUAL) =====
@router.post("/submissions/{submission_id}/manual-finalize")
async def manual_finalize_submission(
    submission_id: int,
    approve: bool = Body(..., embed=True),
    notes: Optional[str] = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Formador finaliza manualmente um desafio quando kpi_mode=MANUAL.
    O formador decide se aprova ou reprova independente dos KPIs.
    """
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Verificar se o desafio está em modo manual
    kpi_mode = getattr(challenge, 'kpi_mode', 'AUTO') or 'AUTO'
    if kpi_mode != 'MANUAL':
        raise HTTPException(
            status_code=400, 
            detail="Este desafio usa avaliação automática por KPI. Use o endpoint finalize-review."
        )
    
    # Para SUMMARY, os dados já estão na submission
    # Para COMPLETE, precisamos calcular a partir das operações
    if submission.submission_type == 'COMPLETE':
        # Calcular estatísticas para registro
        operations = db.query(models.ChallengeOperation).filter(
            models.ChallengeOperation.submission_id == submission_id
        ).all()
        
        total_ops = len([op for op in operations if op.completed_at])
        errors_ops = len([op for op in operations if op.has_error])
        total_seconds = sum(op.duration_seconds or 0 for op in operations if op.completed_at)
        total_minutes = total_seconds / 60 if total_seconds > 0 else 0
        
        calculated_mpu = calculate_mpu(total_ops, total_minutes)
        
        # Atualizar submission
        submission.total_operations = total_ops
        submission.total_time_minutes = int(total_minutes)
        submission.errors_count = errors_ops
        submission.calculated_mpu = calculated_mpu
        submission.mpu_vs_target = round((challenge.target_mpu / calculated_mpu * 100) if calculated_mpu > 0 else 0, 1)
    
    # Para ambos, atualizar status de aprovação
    submission.is_approved = approve
    submission.status = "APPROVED" if approve else "REJECTED"
    submission.trainer_notes = notes
    submission.completed_at = datetime.now()
    submission.updated_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    return {
        "id": submission.id,
        "status": submission.status,
        "is_approved": submission.is_approved,
        "kpi_mode": "MANUAL",
        "trainer_notes": notes,
        "message": f"Desafio {'aprovado' if approve else 'reprovado'} manualmente pelo formador."
    }


# ===== VERIFICAR se Formando pode Iniciar Desafio =====
@router.get("/{challenge_id}/can-start/{student_id}")
async def can_start_challenge(
    challenge_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Verifica se um formando pode iniciar um desafio.
    Considera: já submeteu? tem retry habilitado? está em progresso?
    """
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id
    ).first()
    
    if not challenge:
        return {"can_start": False, "reason": "Desafio não encontrado"}
    
    # Buscar submissions do formando para este desafio
    submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.user_id == student_id
    ).order_by(models.ChallengeSubmission.created_at.desc()).all()
    
    if not submissions:
        # Nunca fez - pode iniciar
        return {"can_start": True, "reason": "Pode iniciar novo desafio"}
    
    latest = submissions[0]
    
    # Em progresso - pode continuar
    if latest.status == "IN_PROGRESS":
        return {
            "can_start": True, 
            "reason": "Desafio em progresso",
            "submission_id": latest.id,
            "is_continuation": True
        }
    
    # Pendente de revisão - não pode iniciar
    if latest.status == "PENDING_REVIEW":
        return {"can_start": False, "reason": "Aguardando revisão do formador"}
    
    # Aprovado - não pode refazer
    if latest.status == "APPROVED" and not getattr(latest, 'is_retry_allowed', False):
        return {"can_start": False, "reason": "Desafio já aprovado"}
    
    # Reprovado - verifica se tem retry habilitado
    if latest.status == "REJECTED":
        if getattr(latest, 'is_retry_allowed', False):
            return {
                "can_start": True, 
                "reason": "Nova tentativa habilitada pelo formador",
                "previous_submission_id": latest.id,
                "is_retry": True
            }
        elif getattr(challenge, 'allow_retry', False):
            return {"can_start": False, "reason": "Aguardando formador habilitar nova tentativa"}
        else:
            return {"can_start": False, "reason": "Desafio reprovado e não permite novas tentativas"}
    
    return {"can_start": False, "reason": "Estado desconhecido"}


# ===== FORMADOR: Finalizar Submission SUMMARY em Retry =====
@router.post("/submissions/{submission_id}/finalize-summary")
async def finalize_summary_submission(
    submission_id: int,
    total_operations: int = Body(..., embed=True),
    total_time_minutes: float = Body(..., embed=True),
    errors_count: int = Body(0, embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """
    Formador finaliza uma submission SUMMARY (útil para retry ou submissions em progresso).
    Preenche os dados e calcula aprovação por KPI.
    """
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    if submission.submission_type != "SUMMARY":
        raise HTTPException(status_code=400, detail="Este endpoint é apenas para submissions SUMMARY")
    
    if submission.status not in ["IN_PROGRESS", "PENDING_REVIEW"]:
        raise HTTPException(status_code=400, detail=f"Submission já finalizada com status: {submission.status}")
    
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Calcular MPU
    calculated_mpu = calculate_mpu(total_operations, total_time_minutes)
    
    # Verificar aprovação por KPIs
    kpi_mode = getattr(challenge, 'kpi_mode', 'AUTO') or 'AUTO'
    
    if kpi_mode == 'MANUAL':
        is_approved = None
        status = "PENDING_REVIEW"
    else:
        is_approved, kpi_details = calculate_kpi_approval(challenge, total_operations, calculated_mpu, errors_count)
        status = "APPROVED" if is_approved else "REJECTED"
    
    # Atualizar submission
    submission.total_operations = total_operations
    submission.total_time_minutes = int(total_time_minutes)
    submission.errors_count = errors_count
    submission.calculated_mpu = calculated_mpu
    submission.mpu_vs_target = round((challenge.target_mpu / calculated_mpu * 100) if calculated_mpu > 0 else 0, 1)
    submission.is_approved = is_approved
    submission.status = status
    submission.completed_at = datetime.now()
    submission.updated_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    return {
        "id": submission.id,
        "status": submission.status,
        "is_approved": submission.is_approved,
        "total_operations": submission.total_operations,
        "total_time_minutes": submission.total_time_minutes,
        "calculated_mpu": submission.calculated_mpu,
        "errors_count": submission.errors_count,
        "retry_count": getattr(submission, 'retry_count', 0),
        "message": f"Submission finalizada com status: {status}"
    }