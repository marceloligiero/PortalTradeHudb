from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

def calculate_mpu(operations: int, time_minutes: float) -> float:
    """Calcula MPU (Movimentos Por Unidade de tempo)"""
    if time_minutes <= 0:
        return 0.0
    return round(operations / time_minutes, 2)

def calculate_approval(calculated_mpu: float, target_mpu: float) -> tuple[bool, float]:
    """
    Calcula aprovação e percentual vs meta
    Returns: (is_approved, mpu_vs_target_percentage)
    """
    if target_mpu <= 0:
        return False, 0.0
    
    mpu_vs_target = round((calculated_mpu / target_mpu) * 100, 2)
    is_approved = calculated_mpu >= target_mpu
    
    return is_approved, mpu_vs_target

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
        models.User.role == "STUDENT"
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")
    
    # Calcular MPU
    calculated_mpu = calculate_mpu(submission.total_operations, submission.total_time_minutes)
    
    # Verificar aprovação
    is_approved, mpu_vs_target = calculate_approval(calculated_mpu, challenge.target_mpu)
    
    # Calcular score (0-100)
    score = min(mpu_vs_target, 100.0)
    
    # Criar submission
    now = datetime.now()
    db_submission = models.ChallengeSubmission(
        challenge_id=submission.challenge_id,
        user_id=submission.user_id,
        submission_type="SUMMARY",
        total_operations=submission.total_operations,
        total_time_minutes=submission.total_time_minutes,
        started_at=now,
        completed_at=now,
        calculated_mpu=calculated_mpu,
        mpu_vs_target=mpu_vs_target,
        is_approved=is_approved,
        score=score,
        submitted_by=current_user.id
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
        models.User.role == "STUDENT"
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")
    
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
    
    is_approved, mpu_vs_target = calculate_approval(calculated_mpu, challenge.target_mpu)
    score = min(mpu_vs_target, 100.0)
    
    # Atualizar submission
    submission.total_operations = total_operations
    submission.total_time_minutes = int(total_time)
    submission.completed_at = datetime.now()
    submission.calculated_mpu = calculated_mpu
    submission.mpu_vs_target = mpu_vs_target
    submission.is_approved = is_approved
    submission.score = score
    submission.updated_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    # Retornar com detalhes
    return schemas.ChallengeSubmissionDetail(
        **submission.__dict__,
        parts=[schemas.ChallengePart(**part.__dict__) for part in parts],
        challenge=schemas.Challenge(**challenge.__dict__)
    )

# ===== LISTAR Submissions de um Desafio =====
@router.get("/{challenge_id}/submissions", response_model=List[schemas.ChallengeSubmission])
async def list_challenge_submissions(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "TRAINER"]))
):
    """Listar todas as submissions de um desafio"""
    submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id
    ).all()
    
    return submissions

# ===== VER Detalhes de uma Submission =====
@router.get("/submissions/{submission_id}", response_model=schemas.ChallengeSubmissionDetail)
async def get_submission_detail(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Ver detalhes completos de uma submission incluindo partes"""
    submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission não encontrada")
    
    # Buscar partes se for tipo COMPLETE
    parts = []
    if submission.submission_type == "COMPLETE":
        parts = db.query(models.ChallengePart).filter(
            models.ChallengePart.submission_id == submission_id
        ).all()
    
    # Buscar challenge
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == submission.challenge_id
    ).first()
    
    # Buscar user e submitter
    user = db.query(models.User).filter(models.User.id == submission.user_id).first()
    submitter = db.query(models.User).filter(models.User.id == submission.submitted_by).first() if submission.submitted_by else None
    
    return schemas.ChallengeSubmissionDetail(
        **submission.__dict__,
        parts=[schemas.ChallengePart(**part.__dict__) for part in parts],
        challenge=schemas.Challenge(**challenge.__dict__) if challenge else None,
        user=schemas.UserBasic(**user.__dict__) if user else None,
        submitter=schemas.UserBasic(**submitter.__dict__) if submitter else None
    )
