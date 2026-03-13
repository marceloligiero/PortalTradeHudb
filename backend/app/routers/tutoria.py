"""
Portal de Gestão de Erros e Planos de Ação — Router v2
Roles:
  ADMIN   → acesso total
  TRAINER → apenas seus tutorados (tutor_id = current user)
  STUDENT/TRAINEE → apenas os seus próprios dados
"""
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, validator
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    ErrorCategory, TutoriaError, TutoriaErrorMotivo, TutoriaErrorRef,
    TutoriaActionPlan, TutoriaActionItem, TutoriaComment, TutoriaNotification,
    TutoriaLearningSheet, User, Product, Bank,
    ErrorImpact, ErrorOrigin, ErrorDetectedBy, Department, Activity,
)
from app.auth import get_current_user

router = APIRouter()

# ─── Helpers ──────────────────────────────────────────────────────────────────

def is_manager(user: User) -> bool:
    return user.role in ("ADMIN", "TRAINER", "MANAGER") or getattr(user, 'is_tutor', False)

def require_manager(user: User):
    if not is_manager(user):
        raise HTTPException(status_code=403, detail="Acesso negado")

def _is_tutor_or_admin(user: User) -> bool:
    return user.role == "ADMIN" or getattr(user, 'is_tutor', False)

def _require_tutor_or_admin(user: User):
    if not _is_tutor_or_admin(user):
        raise HTTPException(status_code=403, detail="Apenas admins e tutores")

def require_admin(user: User):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Apenas admins")

def is_chefe_or_manager(u: User) -> bool:
    return getattr(u, 'is_team_lead', False) or u.role in ("MANAGER", "ADMIN")

def is_referente_user(u: User) -> bool:
    return getattr(u, 'is_referente', False)

def is_chefe_referente_manager(u: User) -> bool:
    return getattr(u, 'is_team_lead', False) or getattr(u, 'is_referente', False) or u.role in ("MANAGER", "ADMIN")

def is_tutor_or_above(u: User) -> bool:
    return getattr(u, 'is_tutor', False) or u.role in ("MANAGER", "ADMIN")

def _user_name(u) -> Optional[str]:
    return u.full_name if u else None

def create_notification(db: Session, user_id: int, ntype: str, message: str, error_id: int = None, plan_id: int = None):
    notif = TutoriaNotification(
        user_id=user_id, type=ntype, message=message,
        error_id=error_id, plan_id=plan_id,
    )
    db.add(notif)
    return notif

# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class CategoryIn(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    origin_id: Optional[int] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    origin_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

# ── Errors ──

class MotivoIn(BaseModel):
    typology: str  # METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE
    description: Optional[str] = None

class RefIn(BaseModel):
    referencia: Optional[str] = None
    divisa: Optional[str] = None
    importe: Optional[float] = None
    cliente_final: Optional[str] = None

class ErrorIn(BaseModel):
    date_occurrence: date
    description: str
    tutorado_id: Optional[int] = None
    # Novos campos Access
    date_detection: Optional[date] = None
    date_solution: Optional[date] = None
    bank_id: Optional[int] = None
    office: Optional[str] = None
    reference_code: Optional[str] = None
    currency: Optional[str] = None
    amount: Optional[float] = None
    final_client: Optional[str] = None
    impact_id: Optional[int] = None
    origin_id: Optional[int] = None
    category_id: Optional[int] = None
    detected_by_id: Optional[int] = None
    department_id: Optional[int] = None
    activity_id: Optional[int] = None
    error_type_id: Optional[int] = None
    approver_id: Optional[int] = None
    product_id: Optional[int] = None
    severity: str = "MEDIA"
    solution: Optional[str] = None
    action_plan_text: Optional[str] = None
    recurrence_type: Optional[str] = None
    tags: Optional[List[str]] = None
    analysis_5_why: Optional[str] = None
    motivos: Optional[List[MotivoIn]] = None
    refs: Optional[List[RefIn]] = None

class AnalysisIn(BaseModel):
    impact_level: Optional[str] = None
    impact_detail: Optional[str] = None
    origin_id: Optional[int] = None
    origin_detail: Optional[str] = None
    grabador_id: Optional[int] = None
    liberador_id: Optional[int] = None
    date_solution: Optional[date] = None
    solution: Optional[str] = None
    solution_confirmed: Optional[bool] = None
    recurrence_type: Optional[str] = None
    action_plan_summary: Optional[str] = None

class CancelErrorIn(BaseModel):
    reason: str

class ConfirmSolutionIn(BaseModel):
    date_solution: date
    solution: str

class ReturnAnalysisIn(BaseModel):
    reason: str

class ErrorUpdate(BaseModel):
    status: Optional[str] = None
    analysis_5_why: Optional[str] = None
    category_id: Optional[int] = None
    severity: Optional[str] = None
    tags: Optional[List[str]] = None
    date_detection: Optional[date] = None
    date_solution: Optional[date] = None
    bank_id: Optional[int] = None
    office: Optional[str] = None
    reference_code: Optional[str] = None
    currency: Optional[str] = None
    amount: Optional[float] = None
    final_client: Optional[str] = None
    impact_id: Optional[int] = None
    origin_id: Optional[int] = None
    detected_by_id: Optional[int] = None
    department_id: Optional[int] = None
    activity_id: Optional[int] = None
    error_type_id: Optional[int] = None
    approver_id: Optional[int] = None
    product_id: Optional[int] = None
    solution: Optional[str] = None
    action_plan_text: Optional[str] = None
    recurrence_type: Optional[str] = None
    impact_level: Optional[str] = None
    impact_detail: Optional[str] = None
    origin_detail: Optional[str] = None
    grabador_id: Optional[int] = None
    liberador_id: Optional[int] = None
    solution_confirmed: Optional[bool] = None
    pending_solution: Optional[bool] = None
    excel_sent: Optional[bool] = None
    action_plan_summary: Optional[str] = None
    refs: Optional[List[RefIn]] = None

class DeactivateIn(BaseModel):
    reason: str

def _motivo_out(m: TutoriaErrorMotivo) -> dict:
    return {
        "id": m.id,
        "typology": m.typology,
        "description": m.description,
        "created_at": m.created_at,
    }

def _error_out(e: TutoriaError) -> dict:
    motivos_list = []
    try:
        motivos_list = [_motivo_out(m) for m in (e.motivos or [])]
    except Exception:
        pass
    return {
        "id": e.id,
        "date_occurrence": e.date_occurrence,
        "date_detection": getattr(e, 'date_detection', None),
        "date_solution": getattr(e, 'date_solution', None),
        "description": e.description,
        "solution": getattr(e, 'solution', None),
        "action_plan_text": getattr(e, 'action_plan_text', None),
        # Pessoas
        "tutorado_id": e.tutorado_id,
        "tutorado_name": _user_name(e.tutorado),
        "created_by_id": e.created_by_id,
        "created_by_name": _user_name(e.creator),
        "approver_id": getattr(e, 'approver_id', None),
        "approver_name": _user_name(getattr(e, 'approver', None)),
        # Transação
        "bank_id": getattr(e, 'bank_id', None),
        "bank_name": e.bank.name if getattr(e, 'bank', None) else None,
        "office": getattr(e, 'office', None),
        "reference_code": getattr(e, 'reference_code', None),
        "currency": getattr(e, 'currency', None),
        "amount": getattr(e, 'amount', None),
        "final_client": getattr(e, 'final_client', None),
        # Classificação
        "category_id": e.category_id,
        "category_name": e.category.name if e.category else None,
        "product_id": e.product_id,
        "product_name": e.product.name if hasattr(e, 'product') and e.product else None,
        "impact_id": getattr(e, 'impact_id', None),
        "impact_name": e.impact.name if getattr(e, 'impact', None) else None,
        "origin_id": getattr(e, 'origin_id', None),
        "origin_name": e.origin.name if getattr(e, 'origin', None) else None,
        "detected_by_id": getattr(e, 'detected_by_id', None),
        "detected_by_name": e.detected_by.name if getattr(e, 'detected_by', None) else None,
        "department_id": getattr(e, 'department_id', None),
        "department_name": e.department.name if getattr(e, 'department', None) else None,
        "activity_id": getattr(e, 'activity_id', None),
        "activity_name": e.activity.name if getattr(e, 'activity', None) else None,
        "error_type_id": getattr(e, 'error_type_id', None),
        "error_type_name": e.error_type.name if getattr(e, 'error_type', None) else None,
        # Análise
        "impact_level": getattr(e, 'impact_level', None),
        "impact_detail": getattr(e, 'impact_detail', None),
        "origin_detail": getattr(e, 'origin_detail', None),
        "grabador_id": getattr(e, 'grabador_id', None),
        "grabador_name": _user_name(getattr(e, 'grabador', None)),
        "liberador_id": getattr(e, 'liberador_id', None),
        "liberador_name": _user_name(getattr(e, 'liberador', None)),
        "solution_confirmed": getattr(e, 'solution_confirmed', False),
        "pending_solution": getattr(e, 'pending_solution', False),
        "excel_sent": getattr(e, 'excel_sent', False),
        "action_plan_summary": getattr(e, 'action_plan_summary', None),
        "cancelled_reason": getattr(e, 'cancelled_reason', None),
        "cancelled_by_id": getattr(e, 'cancelled_by_id', None),
        "cancelled_by_name": _user_name(getattr(e, 'cancelled_by', None)),
        # Estado
        "severity": e.severity,
        "status": e.status,
        "tags": e.tags,
        "analysis_5_why": e.analysis_5_why,
        "is_recurrent": e.is_recurrent,
        "recurrence_count": e.recurrence_count,
        "recurrence_type": getattr(e, 'recurrence_type', None),
        "is_active": e.is_active,
        "inactivation_reason": e.inactivation_reason,
        "plans_count": len(e.action_plans),
        "motivos": motivos_list,
        "refs": [{"id": r.id, "referencia": r.referencia, "divisa": r.divisa, "importe": r.importe, "cliente_final": r.cliente_final} for r in (getattr(e, 'refs', None) or [])],
        "created_at": e.created_at,
        "updated_at": e.updated_at,
    }

# ── Action Plans ──

class PlanIn(BaseModel):
    tutorado_id: int
    plan_type: Optional[str] = None        # CORRECTIVO | PREVENTIVO | MELHORIA
    responsible_id: Optional[int] = None
    expected_result: Optional[str] = None
    deadline: Optional[date] = None
    description: Optional[str] = None      # alias for "what" in simplified flow
    analysis_5_why: Optional[str] = None
    immediate_correction: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    what: Optional[str] = None
    why: Optional[str] = None
    where_field: Optional[str] = None
    when_deadline: Optional[date] = None
    who: Optional[str] = None
    how: Optional[str] = None
    how_much: Optional[str] = None

    @validator("when_deadline", pre=True)
    def _empty_date_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v

class PlanUpdate(BaseModel):
    analysis_5_why: Optional[str] = None
    immediate_correction: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    what: Optional[str] = None
    why: Optional[str] = None
    where_field: Optional[str] = None
    when_deadline: Optional[date] = None
    who: Optional[str] = None
    how: Optional[str] = None
    how_much: Optional[str] = None

class ReturnPlanIn(BaseModel):
    comment: str

def _plan_items_summary(plan: TutoriaActionPlan) -> dict:
    items = plan.items or []
    total = len(items)
    done = sum(1 for i in items if i.status == "CONCLUIDO")
    return {"total": total, "completed": done}

def _plan_out(p: TutoriaActionPlan) -> dict:
    s = _plan_items_summary(p)
    return {
        "id": p.id,
        "error_id": p.error_id,
        "created_by_id": p.created_by_id,
        "created_by_name": _user_name(p.creator),
        "tutorado_id": p.tutorado_id,
        "tutorado_name": _user_name(p.tutorado),
        "plan_type": getattr(p, 'plan_type', None),
        "responsible_id": getattr(p, 'responsible_id', None),
        "responsible_name": _user_name(getattr(p, 'responsible', None)),
        "expected_result": getattr(p, 'expected_result', None),
        "deadline": getattr(p, 'deadline', None),
        "result_score": getattr(p, 'result_score', None),
        "result_comment": getattr(p, 'result_comment', None),
        "started_at": getattr(p, 'started_at', None),
        "completed_at": getattr(p, 'completed_at', None),
        "analysis_5_why": p.analysis_5_why,
        "immediate_correction": p.immediate_correction,
        "corrective_action": p.corrective_action,
        "preventive_action": p.preventive_action,
        "what": p.what,
        "why": p.why,
        "where_field": p.where_field,
        "when_deadline": p.when_deadline,
        "who": p.who,
        "how": p.how,
        "how_much": p.how_much,
        "status": p.status,
        "approved_by_id": p.approved_by_id,
        "approved_by_name": _user_name(p.approver),
        "approved_at": p.approved_at,
        "validated_by_id": p.validated_by_id,
        "validated_by_name": _user_name(p.validator),
        "validated_at": p.validated_at,
        "items_total": s["total"],
        "items_completed": s["completed"],
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }

# ── Action Items ──

class ItemIn(BaseModel):
    type: str = "CORRETIVA"
    description: str
    responsible_id: Optional[int] = None
    due_date: Optional[date] = None

class ItemUpdate(BaseModel):
    description: Optional[str] = None
    responsible_id: Optional[int] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    evidence_text: Optional[str] = None
    reviewer_comment: Optional[str] = None

class ItemReturnIn(BaseModel):
    comment: str

# Valid item status transitions
VALID_ITEM_TRANSITIONS = {
    "PENDENTE": ["EM_ANDAMENTO"],
    "EM_ANDAMENTO": ["CONCLUIDO"],
    "CONCLUIDO": ["DEVOLVIDO"],
    "DEVOLVIDO": ["EM_ANDAMENTO"],
}

def _item_out(i: TutoriaActionItem) -> dict:
    is_overdue = (i.due_date and i.due_date < date.today() and i.status != "CONCLUIDO")
    return {
        "id": i.id,
        "plan_id": i.plan_id,
        "type": i.type,
        "description": i.description,
        "responsible_id": i.responsible_id,
        "responsible_name": _user_name(i.responsible),
        "due_date": i.due_date,
        "status": i.status,
        "evidence_text": i.evidence_text,
        "reviewer_comment": i.reviewer_comment,
        "is_overdue": bool(is_overdue),
        "created_at": i.created_at,
        "updated_at": i.updated_at,
    }

# ── Comments ──

class CommentIn(BaseModel):
    content: str

def _comment_out(c: TutoriaComment) -> dict:
    return {
        "id": c.id,
        "ref_type": c.ref_type,
        "ref_id": c.ref_id,
        "author_id": c.author_id,
        "author_name": _user_name(c.author),
        "content": c.content,
        "created_at": c.created_at,
    }

# ─── DB query helpers ─────────────────────────────────────────────────────────

def _errors_query(db: Session, user: User):
    q = (
        db.query(TutoriaError)
        .options(
            joinedload(TutoriaError.tutorado),
            joinedload(TutoriaError.creator),
            joinedload(TutoriaError.approver),
            joinedload(TutoriaError.bank),
            joinedload(TutoriaError.category),
            joinedload(TutoriaError.product),
            joinedload(TutoriaError.impact),
            joinedload(TutoriaError.origin),
            joinedload(TutoriaError.detected_by),
            joinedload(TutoriaError.department),
            joinedload(TutoriaError.activity),
            joinedload(TutoriaError.error_type),
            joinedload(TutoriaError.action_plans).joinedload(TutoriaActionPlan.items),
            joinedload(TutoriaError.motivos),
            joinedload(TutoriaError.refs),
            joinedload(TutoriaError.grabador),
            joinedload(TutoriaError.liberador),
            joinedload(TutoriaError.cancelled_by),
        )
        .filter(TutoriaError.is_active == True)
    )
    if user.role == "TRAINER" and not getattr(user, 'is_tutor', False):
        q = q.join(TutoriaError.tutorado).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE") and not is_chefe_referente_manager(user):
        q = q.filter(TutoriaError.tutorado_id == user.id)
    return q

def _plans_query(db: Session, user: User):
    q = (
        db.query(TutoriaActionPlan)
        .options(
            joinedload(TutoriaActionPlan.creator),
            joinedload(TutoriaActionPlan.tutorado),
            joinedload(TutoriaActionPlan.approver),
            joinedload(TutoriaActionPlan.validator),
            joinedload(TutoriaActionPlan.items).joinedload(TutoriaActionItem.responsible),
        )
    )
    if user.role == "TRAINER" and not is_chefe_referente_manager(user):
        q = q.join(TutoriaActionPlan.tutorado).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE") and not is_chefe_referente_manager(user):
        q = q.filter(TutoriaActionPlan.tutorado_id == user.id)
    return q

# ─── CATEGORIES ───────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ErrorCategory).filter(ErrorCategory.is_active == True).order_by(ErrorCategory.name).all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(
    body: CategoryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    cat = ErrorCategory(**body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/categories/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    body: CategoryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    cat = db.get(ErrorCategory, cat_id)
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", status_code=204)
def deactivate_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    cat = db.get(ErrorCategory, cat_id)
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    cat.is_active = False
    db.commit()
# ─── PRODUCTS (serviços) ─────────────────────────────────────────────────────────────

@router.get("/products")
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Active products for the error form dropdown."""
    return [
        {"id": p.id, "code": p.code, "name": p.name}
        for p in db.query(Product).filter(Product.is_active == True).order_by(Product.name).all()
    ]
# ─── ERRORS ───────────────────────────────────────────────────────────────────

@router.get("/errors")
def list_errors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    tutorado_id: Optional[int] = None,
    is_recurrent: Optional[bool] = None,
):
    q = _errors_query(db, current_user)
    if severity:
        q = q.filter(TutoriaError.severity == severity)
    if status:
        q = q.filter(TutoriaError.status == status)
    if category_id:
        q = q.filter(TutoriaError.category_id == category_id)
    if tutorado_id and current_user.role == "ADMIN":
        q = q.filter(TutoriaError.tutorado_id == tutorado_id)
    if is_recurrent is not None:
        q = q.filter(TutoriaError.is_recurrent == is_recurrent)
    errors = q.order_by(TutoriaError.created_at.desc()).all()
    return [_error_out(e) for e in errors]


@router.post("/errors", status_code=201)
def create_error(
    body: ErrorIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Any authenticated user can register a client error
    tutorado_id = body.tutorado_id or current_user.id
    tutorado = db.get(User, tutorado_id)
    if not tutorado:
        raise HTTPException(404, "Tutorado não encontrado")

    # Only chefe/referente/manager/tutor can assign to other users
    if tutorado_id != current_user.id and not is_chefe_referente_manager(current_user) and not _is_tutor_or_admin(current_user):
        raise HTTPException(403, "Sem permissão para atribuir a outro utilizador")

    # Recurrence detection
    count = 0
    if body.category_id:
        count = (
            db.query(func.count(TutoriaError.id))
            .filter(
                TutoriaError.tutorado_id == body.tutorado_id,
                TutoriaError.category_id == body.category_id,
                TutoriaError.is_active == True,
            )
            .scalar()
        ) or 0

    error = TutoriaError(
        date_occurrence=body.date_occurrence,
        date_detection=body.date_detection,
        date_solution=body.date_solution,
        description=body.description,
        solution=body.solution,
        action_plan_text=body.action_plan_text,
        tutorado_id=tutorado_id,
        created_by_id=current_user.id,
        approver_id=body.approver_id,
        bank_id=body.bank_id,
        office=body.office,
        reference_code=body.reference_code,
        currency=body.currency,
        amount=body.amount,
        final_client=body.final_client,
        impact_id=body.impact_id,
        origin_id=body.origin_id,
        category_id=body.category_id,
        detected_by_id=body.detected_by_id,
        department_id=body.department_id,
        activity_id=body.activity_id,
        error_type_id=body.error_type_id,
        product_id=body.product_id,
        severity=body.severity,
        status="REGISTERED",
        tags=body.tags,
        analysis_5_why=body.analysis_5_why,
        recurrence_type=body.recurrence_type,
        is_recurrent=(count > 0),
        recurrence_count=count,
    )
    db.add(error)
    db.flush()

    # Save motivos (multiple per error)
    if body.motivos:
        for m in body.motivos:
            db.add(TutoriaErrorMotivo(error_id=error.id, typology=m.typology, description=m.description))

    # Save refs (multiple per error)
    if body.refs:
        for r in body.refs:
            db.add(TutoriaErrorRef(error_id=error.id, referencia=r.referencia, divisa=r.divisa, importe=r.importe, cliente_final=r.cliente_final))

    # Notify chefe/manager of the tutorado's team
    if tutorado.team_id:
        from app.models import Team
        team = db.get(Team, tutorado.team_id)
        if team and team.manager_id:
            create_notification(db, team.manager_id, "NEW_ERROR", f"Nova incidência registada por {current_user.full_name}", error_id=error.id)
    # Notify chefes de equipa in the same team
    if tutorado.team_id:
        chefes = db.query(User).filter(User.team_id == tutorado.team_id, User.is_team_lead == True, User.id != current_user.id).all()
        for c in chefes:
            create_notification(db, c.id, "NEW_ERROR", f"Nova incidência registada por {current_user.full_name}", error_id=error.id)

    db.commit()
    db.refresh(error)

    error = (
        db.query(TutoriaError)
        .options(
            joinedload(TutoriaError.tutorado),
            joinedload(TutoriaError.creator),
            joinedload(TutoriaError.approver),
            joinedload(TutoriaError.bank),
            joinedload(TutoriaError.category),
            joinedload(TutoriaError.product),
            joinedload(TutoriaError.impact),
            joinedload(TutoriaError.origin),
            joinedload(TutoriaError.detected_by),
            joinedload(TutoriaError.department),
            joinedload(TutoriaError.activity),
            joinedload(TutoriaError.action_plans),
            joinedload(TutoriaError.motivos),
        )
        .filter(TutoriaError.id == error.id)
        .first()
    )
    return _error_out(error)


@router.get("/errors/{error_id}")
def get_error(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    error = (
        db.query(TutoriaError)
        .options(
            joinedload(TutoriaError.tutorado),
            joinedload(TutoriaError.creator),
            joinedload(TutoriaError.approver),
            joinedload(TutoriaError.bank),
            joinedload(TutoriaError.category),
            joinedload(TutoriaError.product),
            joinedload(TutoriaError.impact),
            joinedload(TutoriaError.origin),
            joinedload(TutoriaError.detected_by),
            joinedload(TutoriaError.department),
            joinedload(TutoriaError.activity),
            joinedload(TutoriaError.action_plans)
            .joinedload(TutoriaActionPlan.items)
            .joinedload(TutoriaActionItem.responsible),
            joinedload(TutoriaError.action_plans).joinedload(TutoriaActionPlan.creator),
            joinedload(TutoriaError.action_plans).joinedload(TutoriaActionPlan.tutorado),
            joinedload(TutoriaError.motivos),
        )
        .filter(TutoriaError.id == error_id)
        .first()
    )
    if not error:
        raise HTTPException(404, "Erro não encontrado")
    if current_user.role in ("STUDENT", "TRAINEE") and error.tutorado_id != current_user.id:
        raise HTTPException(403, "Acesso negado")
    return _error_out(error)


@router.patch("/errors/{error_id}")
def update_error(
    error_id: int,
    body: ErrorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_manager(current_user)
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")

    data = body.model_dump(exclude_none=True)
    refs_data = data.pop("refs", None)

    for k, v in data.items():
        setattr(error, k, v)

    # Replace refs if provided
    if refs_data is not None:
        db.query(TutoriaErrorRef).filter(TutoriaErrorRef.error_id == error_id).delete()
        for r in refs_data:
            db.add(TutoriaErrorRef(error_id=error_id, referencia=r.get("referencia"), divisa=r.get("divisa"), importe=r.get("importe"), cliente_final=r.get("cliente_final")))

    db.commit()

    error = (
        db.query(TutoriaError)
        .options(
            joinedload(TutoriaError.tutorado),
            joinedload(TutoriaError.creator),
            joinedload(TutoriaError.approver),
            joinedload(TutoriaError.bank),
            joinedload(TutoriaError.category),
            joinedload(TutoriaError.product),
            joinedload(TutoriaError.impact),
            joinedload(TutoriaError.origin),
            joinedload(TutoriaError.detected_by),
            joinedload(TutoriaError.department),
            joinedload(TutoriaError.activity),
            joinedload(TutoriaError.error_type),
            joinedload(TutoriaError.action_plans),
            joinedload(TutoriaError.motivos),
            joinedload(TutoriaError.refs),
        )
        .filter(TutoriaError.id == error_id)
        .first()
    )
    return _error_out(error)


@router.post("/errors/{error_id}/deactivate")
def deactivate_error(
    error_id: int,
    body: DeactivateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    if not body.reason or not body.reason.strip():
        raise HTTPException(400, "Motivo de inativação é obrigatório")
    error = db.get(TutoriaError, error_id)
    if not error:
        raise HTTPException(404, "Erro não encontrado")
    error.is_active = False
    error.inactivation_reason = body.reason.strip()
    db.commit()
    return {"ok": True}


@router.post("/errors/{error_id}/verify")
def verify_error(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    error = db.get(TutoriaError, error_id)
    if not error:
        raise HTTPException(404, "Erro não encontrado")
    if error.status != "CONCLUIDO":
        raise HTTPException(400, "Erro ainda não foi concluído")
    error.status = "VERIFICADO"
    db.commit()
    return {"ok": True}

# ─── PLANS ────────────────────────────────────────────────────────────────────

@router.get("/errors/{error_id}/plans")
def list_plans_for_error(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plans = (
        _plans_query(db, current_user)
        .filter(TutoriaActionPlan.error_id == error_id)
        .all()
    )
    return [_plan_out(p) for p in plans]


@router.post("/errors/{error_id}/plans", status_code=201)
def create_plan(
    error_id: int,
    body: PlanIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")

    # Validate tutorado exists
    tutorado = db.get(User, body.tutorado_id)
    if not tutorado:
        raise HTTPException(400, "Tutorado não encontrado")

    try:
        data = body.model_dump()
        # Map description alias to 'what' column
        desc = data.pop("description", None)
        if desc and not data.get("what"):
            data["what"] = desc
        plan = TutoriaActionPlan(
            error_id=error_id,
            created_by_id=current_user.id,
            **data,
        )
        db.add(plan)

        db.commit()
        db.refresh(plan)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao criar plano: {str(e)}")

    plan = (
        _plans_query(db, current_user)
        .filter(TutoriaActionPlan.id == plan.id)
        .first()
    )
    if not plan:
        raise HTTPException(500, "Plano criado mas não encontrado na query")
    return _plan_out(plan)


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    plan_status: Optional[str] = None,
):
    q = _plans_query(db, current_user)
    if plan_status:
        q = q.filter(TutoriaActionPlan.status == plan_status)
    plans = q.order_by(TutoriaActionPlan.created_at.desc()).all()
    return [_plan_out(p) for p in plans]


@router.get("/plans/{plan_id}")
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    return _plan_out(plan)


@router.patch("/plans/{plan_id}")
def update_plan(
    plan_id: int,
    body: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_manager(current_user)
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    if plan.status not in ("RASCUNHO", "DEVOLVIDO", "OPEN"):
        raise HTTPException(400, "Só é possível editar planos em rascunho, abertos ou devolvidos")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(plan, k, v)
    db.commit()

    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)


@router.post("/plans/{plan_id}/submit")
def submit_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_manager(current_user):
        raise HTTPException(403, "Acesso negado")
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    if plan.status not in ("RASCUNHO", "DEVOLVIDO", "OPEN"):
        raise HTTPException(400, "Plano não pode ser submetido no estado atual")
    if current_user.role == "ADMIN":
        plan.status = "APROVADO"
        plan.approved_by_id = current_user.id
        plan.approved_at = datetime.utcnow()
    else:
        plan.status = "AGUARDANDO_APROVACAO"
    db.commit()

    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)


@router.post("/plans/{plan_id}/approve")
def approve_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    if plan.status != "AGUARDANDO_APROVACAO":
        raise HTTPException(400, "Plano não está aguardando aprovação")
    plan.status = "APROVADO"
    plan.approved_by_id = current_user.id
    plan.approved_at = datetime.utcnow()

    error = db.get(TutoriaError, plan.error_id)
    if error and error.status == "PLANO_CRIADO":
        error.status = "EM_EXECUCAO"

    db.commit()
    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)


@router.post("/plans/{plan_id}/return")
def return_plan(
    plan_id: int,
    body: ReturnPlanIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_manager(current_user)
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    plan.status = "DEVOLVIDO"
    db.commit()
    comment = TutoriaComment(
        ref_type="PLAN", ref_id=plan_id,
        author_id=current_user.id,
        content=f"[DEVOLVIDO] {body.comment}",
    )
    db.add(comment)
    db.commit()

    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)


@router.post("/plans/{plan_id}/validate")
def validate_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_manager(current_user)
    plan = (
        db.query(TutoriaActionPlan)
        .options(joinedload(TutoriaActionPlan.items))
        .filter(TutoriaActionPlan.id == plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(404, "Plano não encontrado")

    items = plan.items or []
    if items and any(i.status != "CONCLUIDO" for i in items):
        raise HTTPException(400, "Todos os itens de ação devem estar concluídos antes de validar")

    plan.status = "CONCLUIDO"
    plan.validated_by_id = current_user.id
    plan.validated_at = datetime.utcnow()

    error = db.get(TutoriaError, plan.error_id)
    if error:
        error.status = "CONCLUIDO"

    db.commit()
    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)

# ─── ACTION ITEMS ──────────────────────────────────────────────────────────────

@router.get("/plans/{plan_id}/items")
def list_items(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(TutoriaActionItem)
        .options(joinedload(TutoriaActionItem.responsible))
        .filter(TutoriaActionItem.plan_id == plan_id)
        .order_by(TutoriaActionItem.id)
        .all()
    )
    return [_item_out(i) for i in items]


@router.post("/plans/{plan_id}/items", status_code=201)
def create_item(
    plan_id: int,
    body: ItemIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_manager(current_user)
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")

    item = TutoriaActionItem(plan_id=plan_id, **body.model_dump())
    db.add(item)

    if plan.status == "APROVADO":
        plan.status = "EM_EXECUCAO"
        error = db.get(TutoriaError, plan.error_id)
        if error:
            error.status = "EM_EXECUCAO"

    db.commit()
    db.refresh(item)
    item = (
        db.query(TutoriaActionItem)
        .options(joinedload(TutoriaActionItem.responsible))
        .filter(TutoriaActionItem.id == item.id)
        .first()
    )
    return _item_out(item)


@router.patch("/items/{item_id}")
def update_item(
    item_id: int,
    body: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(TutoriaActionItem)
        .options(joinedload(TutoriaActionItem.responsible))
        .filter(TutoriaActionItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Item não encontrado")

    # Block changes if parent plan is concluded
    plan = db.get(TutoriaActionPlan, item.plan_id)
    if plan and plan.status == "CONCLUIDO":
        raise HTTPException(400, "Não é possível alterar ações de um plano concluído")

    # Validate status transition if status is being changed
    new_status = body.status
    if new_status and new_status != item.status:
        allowed_next = VALID_ITEM_TRANSITIONS.get(item.status, [])
        if new_status not in allowed_next:
            raise HTTPException(
                400,
                f"Transição inválida: {item.status} → {new_status}. "
                f"Transições permitidas: {', '.join(allowed_next) if allowed_next else 'nenhuma'}",
            )

    if current_user.role in ("STUDENT", "TRAINEE"):
        if item.responsible_id != current_user.id:
            raise HTTPException(403, "Só pode atualizar os seus próprios itens")
        allowed = {"evidence_text", "status"}
        for k, v in body.model_dump(exclude_none=True).items():
            if k in allowed:
                setattr(item, k, v)
    else:
        for k, v in body.model_dump(exclude_none=True).items():
            setattr(item, k, v)

    db.commit()
    item = (
        db.query(TutoriaActionItem)
        .options(joinedload(TutoriaActionItem.responsible))
        .filter(TutoriaActionItem.id == item_id)
        .first()
    )
    return _item_out(item)


@router.post("/items/{item_id}/return")
def return_item(
    item_id: int,
    body: ItemReturnIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devolver uma ação para correção (manager only)"""
    require_manager(current_user)
    item = (
        db.query(TutoriaActionItem)
        .options(joinedload(TutoriaActionItem.responsible))
        .filter(TutoriaActionItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Item não encontrado")

    # Block changes if parent plan is concluded
    plan = db.get(TutoriaActionPlan, item.plan_id)
    if plan and plan.status == "CONCLUIDO":
        raise HTTPException(400, "Não é possível devolver ações de um plano concluído")

    if item.status not in ("EM_ANDAMENTO", "CONCLUIDO"):
        raise HTTPException(400, "Só é possível devolver itens em andamento ou concluídos")

    item.status = "DEVOLVIDO"
    item.reviewer_comment = body.comment

    db.commit()
    item = (
        db.query(TutoriaActionItem)
        .options(joinedload(TutoriaActionItem.responsible))
        .filter(TutoriaActionItem.id == item_id)
        .first()
    )
    return _item_out(item)

# ─── COMMENTS ────────────────────────────────────────────────────────────────

@router.get("/errors/{error_id}/comments")
def list_error_comments(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comments = (
        db.query(TutoriaComment)
        .options(joinedload(TutoriaComment.author))
        .filter(TutoriaComment.ref_type == "ERROR", TutoriaComment.ref_id == error_id)
        .order_by(TutoriaComment.created_at)
        .all()
    )
    return [_comment_out(c) for c in comments]


@router.post("/errors/{error_id}/comments", status_code=201)
def add_error_comment(
    error_id: int,
    body: CommentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = TutoriaComment(
        ref_type="ERROR", ref_id=error_id,
        author_id=current_user.id, content=body.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    comment = (
        db.query(TutoriaComment)
        .options(joinedload(TutoriaComment.author))
        .filter(TutoriaComment.id == comment.id)
        .first()
    )
    return _comment_out(comment)


@router.get("/plans/{plan_id}/comments")
def list_plan_comments(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comments = (
        db.query(TutoriaComment)
        .options(joinedload(TutoriaComment.author))
        .filter(TutoriaComment.ref_type == "PLAN", TutoriaComment.ref_id == plan_id)
        .order_by(TutoriaComment.created_at)
        .all()
    )
    return [_comment_out(c) for c in comments]


@router.post("/plans/{plan_id}/comments", status_code=201)
def add_plan_comment(
    plan_id: int,
    body: CommentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = TutoriaComment(
        ref_type="PLAN", ref_id=plan_id,
        author_id=current_user.id, content=body.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    comment = (
        db.query(TutoriaComment)
        .options(joinedload(TutoriaComment.author))
        .filter(TutoriaComment.id == comment.id)
        .first()
    )
    return _comment_out(comment)

# ─── UTILITY ──────────────────────────────────────────────────────────────────

@router.get("/students")
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_chefe_referente_manager(current_user) and not is_tutor_or_above(current_user):
        raise HTTPException(403, "Acesso negado")
    q = db.query(User).filter(User.role.in_(["STUDENT", "TRAINEE"]), User.is_active == True)
    if current_user.role == "TRAINER" and not getattr(current_user, 'is_team_lead', False):
        q = q.filter(User.tutor_id == current_user.id)
    users = q.order_by(User.full_name).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "tutor_id": u.tutor_id} for u in users]

@router.get("/team")
def list_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All active users (admins + trainers + students) — used in responsible dropdowns."""
    if not is_chefe_referente_manager(current_user) and not is_tutor_or_above(current_user):
        raise HTTPException(403, "Acesso negado")
    users = db.query(User).filter(User.is_active == True).order_by(User.full_name).all()
    return [{"id": u.id, "full_name": u.full_name, "role": u.role, "is_tutor": getattr(u, 'is_tutor', False), "is_team_lead": getattr(u, 'is_team_lead', False), "is_referente": getattr(u, 'is_referente', False)} for u in users]

@router.get("/my-plans")
def my_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plans = (
        db.query(TutoriaActionPlan)
        .options(
            joinedload(TutoriaActionPlan.creator),
            joinedload(TutoriaActionPlan.tutorado),
            joinedload(TutoriaActionPlan.approver),
            joinedload(TutoriaActionPlan.validator),
            joinedload(TutoriaActionPlan.items).joinedload(TutoriaActionItem.responsible),
        )
        .filter(TutoriaActionPlan.tutorado_id == current_user.id)
        .order_by(TutoriaActionPlan.created_at.desc())
        .all()
    )
    return [_plan_out(p) for p in plans]


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    errors_q = _errors_query(db, current_user)
    plans_q = _plans_query(db, current_user)

    total_errors = errors_q.count()

    errors_by_status: dict = {}
    for row in (
        errors_q.with_entities(TutoriaError.status, func.count(TutoriaError.id))
        .group_by(TutoriaError.status)
        .all()
    ):
        errors_by_status[row[0]] = row[1]

    total_plans = plans_q.count()

    plans_by_status: dict = {}
    for row in (
        plans_q.with_entities(TutoriaActionPlan.status, func.count(TutoriaActionPlan.id))
        .group_by(TutoriaActionPlan.status)
        .all()
    ):
        plans_by_status[row[0]] = row[1]

    recurrent_errors = errors_q.filter(TutoriaError.is_recurrent == True).count()

    today = date.today()
    overdue_plans = plans_q.filter(
        TutoriaActionPlan.when_deadline < today,
        TutoriaActionPlan.status.notin_(["CONCLUIDO"]),
    ).count()

    severity_counts: dict = {}
    for row in (
        errors_q.with_entities(TutoriaError.severity, func.count(TutoriaError.id))
        .group_by(TutoriaError.severity)
        .all()
    ):
        severity_counts[row[0]] = row[1]

    return {
        "total_errors": total_errors,
        "errors_by_status": errors_by_status,
        "recurrent_errors": recurrent_errors,
        "total_plans": total_plans,
        "plans_by_status": plans_by_status,
        "overdue_plans": overdue_plans,
        "severity_counts": severity_counts,
    }

# ─── ANALYSIS ENDPOINTS ──────────────────────────────────────────────────────

@router.patch("/errors/{error_id}/analysis")
def save_analysis(
    error_id: int,
    body: AnalysisIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save analysis draft — does NOT change status."""
    if not is_chefe_referente_manager(current_user):
        raise HTTPException(403, "Apenas Chefe/Referente/Manager pode analisar")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.status not in ("REGISTERED", "ANALYSIS"):
        raise HTTPException(400, f"Incidência não está em estado analisável (atual: {error.status})")
    if error.status == "REGISTERED":
        error.status = "ANALYSIS"
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(error, k, v)
    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


@router.post("/errors/{error_id}/submit-analysis")
def submit_analysis(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit analysis for tutor review → PENDING_TUTOR_REVIEW."""
    if not is_chefe_referente_manager(current_user):
        raise HTTPException(403, "Apenas Chefe/Referente/Manager pode submeter análise")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.status not in ("ANALYSIS", "REGISTERED"):
        raise HTTPException(400, "Incidência não está em estado para submissão de análise")

    # If referente, needs chief approval first
    if is_referente_user(current_user) and not is_chefe_or_manager(current_user):
        error.status = "PENDING_CHIEF_APPROVAL"
        db.commit()
        # Notify chefes
        if error.tutorado:
            tutorado = error.tutorado
            if hasattr(tutorado, 'team_id') and tutorado.team_id:
                chefes = db.query(User).filter(User.team_id == tutorado.team_id, User.is_team_lead == True).all()
                for c in chefes:
                    create_notification(db, c.id, "PENDING_REVIEW", f"Análise do Referente aguarda aprovação", error_id=error.id)
        db.commit()
        error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
        return _error_out(error)

    # Check if solution is pending
    if not error.date_solution:
        error.pending_solution = True

    error.status = "PENDING_TUTOR_REVIEW"
    db.flush()

    # Notify tutors responsible for the plans
    plans = db.query(TutoriaActionPlan).filter(TutoriaActionPlan.error_id == error_id).all()
    notified_ids = set()
    for p in plans:
        rid = getattr(p, 'responsible_id', None)
        if rid and rid not in notified_ids:
            create_notification(db, rid, "PENDING_REVIEW", f"Incidência #{error_id} submetida para revisão", error_id=error.id)
            notified_ids.add(rid)
    # Also notify tutorado's tutor
    if error.tutorado and error.tutorado.tutor_id and error.tutorado.tutor_id not in notified_ids:
        create_notification(db, error.tutorado.tutor_id, "PENDING_REVIEW", f"Incidência #{error_id} submetida para revisão", error_id=error.id)

    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


@router.post("/errors/{error_id}/approve-chief")
def approve_chief(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Chefe approves referente's analysis → PENDING_TUTOR_REVIEW."""
    if not is_chefe_or_manager(current_user):
        raise HTTPException(403, "Apenas Chefe/Manager pode aprovar")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.status != "PENDING_CHIEF_APPROVAL":
        raise HTTPException(400, "Incidência não está pendente de aprovação do Chefe")

    if not error.date_solution:
        error.pending_solution = True

    error.status = "PENDING_TUTOR_REVIEW"
    db.flush()

    # Notify tutors
    plans = db.query(TutoriaActionPlan).filter(TutoriaActionPlan.error_id == error_id).all()
    notified_ids = set()
    for p in plans:
        rid = getattr(p, 'responsible_id', None)
        if rid and rid not in notified_ids:
            create_notification(db, rid, "PENDING_REVIEW", f"Incidência #{error_id} aprovada pelo Chefe, aguarda revisão", error_id=error.id)
            notified_ids.add(rid)
    if error.tutorado and error.tutorado.tutor_id and error.tutorado.tutor_id not in notified_ids:
        create_notification(db, error.tutorado.tutor_id, "PENDING_REVIEW", f"Incidência #{error_id} aprovada pelo Chefe, aguarda revisão", error_id=error.id)

    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


@router.post("/errors/{error_id}/cancel")
def cancel_error(
    error_id: int,
    body: CancelErrorIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel (eliminate) an incident — Chefe/Manager only."""
    if not is_chefe_or_manager(current_user):
        raise HTTPException(403, "Apenas Chefe/Manager pode eliminar incidências")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if not body.reason or not body.reason.strip():
        raise HTTPException(400, "Motivo de eliminação é obrigatório")

    error.status = "CANCELLED"
    error.cancelled_reason = body.reason.strip()
    error.cancelled_by_id = current_user.id
    db.flush()

    # Notify the original registrant
    if error.created_by_id and error.created_by_id != current_user.id:
        create_notification(db, error.created_by_id, "CANCELLED_ERROR",
                          f"Incidência #{error_id} eliminada: {body.reason.strip()[:100]}", error_id=error.id)

    db.commit()
    return {"ok": True, "status": "CANCELLED"}


@router.post("/errors/{error_id}/approve-plans")
def approve_plans(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor approves plans → APPROVED. If origin is Trade_Personas, auto-create learning sheets."""
    if not is_tutor_or_above(current_user):
        raise HTTPException(403, "Apenas Tutor/Manager/Admin pode aprovar planos")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.status != "PENDING_TUTOR_REVIEW":
        raise HTTPException(400, f"Incidência não está em PENDING_TUTOR_REVIEW (atual: {error.status})")

    error.status = "APPROVED"
    db.flush()

    # Notify responsible of each plan
    plans = db.query(TutoriaActionPlan).filter(TutoriaActionPlan.error_id == error_id).all()
    for p in plans:
        rid = getattr(p, 'responsible_id', None)
        if rid:
            create_notification(db, rid, "PLAN_APPROVED", f"Plano #{p.id} aprovado pelo Tutor para incidência #{error_id}", error_id=error.id, plan_id=p.id)

    # Auto-create learning sheets if origin is Trade_Personas
    origin_name = None
    if error.origin:
        origin_name = error.origin.name
    if origin_name and "persona" in origin_name.lower():
        participants = set()
        if getattr(error, 'grabador_id', None):
            participants.add(error.grabador_id)
        if getattr(error, 'liberador_id', None):
            participants.add(error.liberador_id)
        for uid in participants:
            existing = db.query(TutoriaLearningSheet).filter(
                TutoriaLearningSheet.error_id == error_id,
                TutoriaLearningSheet.tutorado_id == uid,
            ).first()
            if not existing:
                sheet = TutoriaLearningSheet(
                    error_id=error_id,
                    tutorado_id=uid,
                    created_by_id=current_user.id,
                    title=f"Ficha de aprendizagem — Incidência #{error_id}",
                    error_summary=error.description or "",
                    status="PENDENTE",
                    is_mandatory=False,
                    tutor_id=error.tutorado.tutor_id if error.tutorado else None,
                )
                db.add(sheet)
                create_notification(db, uid, "LEARNING_SHEET", f"Nova ficha de aprendizagem para incidência #{error_id}", error_id=error.id)

    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


@router.post("/errors/{error_id}/return-analysis")
def return_analysis(
    error_id: int,
    body: ReturnAnalysisIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor returns analysis to Chefe/Manager → ANALYSIS."""
    if not is_tutor_or_above(current_user):
        raise HTTPException(403, "Apenas Tutor/Manager/Admin pode devolver análise")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.status != "PENDING_TUTOR_REVIEW":
        raise HTTPException(400, "Incidência não está em PENDING_TUTOR_REVIEW")
    if not body.reason or not body.reason.strip():
        raise HTTPException(400, "Motivo de devolução é obrigatório")

    error.status = "ANALYSIS"
    db.flush()

    # Add comment with reason
    db.add(TutoriaComment(
        ref_type="ERROR", ref_id=error_id,
        author_id=current_user.id,
        content=f"[DEVOLVIDO PELO TUTOR] {body.reason.strip()}",
    ))

    # Notify chefe/manager who submitted
    if error.created_by_id:
        create_notification(db, error.created_by_id, "PLAN_RETURNED",
                          f"Análise da incidência #{error_id} devolvida: {body.reason.strip()[:100]}", error_id=error.id)
    # Also notify chefes of team
    if error.tutorado and hasattr(error.tutorado, 'team_id') and error.tutorado.team_id:
        chefes = db.query(User).filter(User.team_id == error.tutorado.team_id, User.is_team_lead == True, User.id != error.created_by_id).all()
        for c in chefes:
            create_notification(db, c.id, "PLAN_RETURNED",
                              f"Análise da incidência #{error_id} devolvida pelo Tutor", error_id=error.id)

    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


@router.post("/errors/{error_id}/confirm-solution")
def confirm_solution(
    error_id: int,
    body: ConfirmSolutionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Chefe/Manager confirms solution → back to PENDING_TUTOR_REVIEW for final confirmation."""
    if not is_chefe_referente_manager(current_user):
        raise HTTPException(403, "Apenas Chefe/Referente/Manager pode confirmar solução")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")

    error.date_solution = body.date_solution
    error.solution = body.solution
    error.solution_confirmed = True
    error.pending_solution = False
    error.status = "PENDING_TUTOR_REVIEW"
    db.flush()

    # Notify tutor
    if error.tutorado and error.tutorado.tutor_id:
        create_notification(db, error.tutorado.tutor_id, "PENDING_REVIEW",
                          f"Solução confirmada para incidência #{error_id}, aguarda revisão final", error_id=error.id)

    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


@router.post("/errors/{error_id}/resolve")
def resolve_error(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor confirms final solution → RESOLVED."""
    if not is_tutor_or_above(current_user):
        raise HTTPException(403, "Apenas Tutor/Manager/Admin pode resolver")
    error = db.get(TutoriaError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.status not in ("APPROVED", "PENDING_TUTOR_REVIEW"):
        raise HTTPException(400, f"Incidência não está em estado resolúvel (atual: {error.status})")

    error.status = "RESOLVED"
    db.commit()
    error = _errors_query(db, current_user).filter(TutoriaError.id == error_id).first()
    return _error_out(error)


# ─── PLAN START / COMPLETE ────────────────────────────────────────────────────

@router.patch("/plans/{plan_id}/start")
def start_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start plan execution: OPEN → IN_PROGRESS."""
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    if plan.status != "OPEN":
        raise HTTPException(400, f"Plano não está OPEN (atual: {plan.status})")
    # Only responsible or admin can start
    if getattr(plan, 'responsible_id', None) and plan.responsible_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(403, "Apenas o responsável pode iniciar o plano")

    plan.status = "IN_PROGRESS"
    plan.started_at = datetime.utcnow()
    db.commit()
    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)


class CompletePlanIn(BaseModel):
    result_score: int
    result_comment: str


@router.patch("/plans/{plan_id}/complete")
def complete_plan(
    plan_id: int,
    body: CompletePlanIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete plan: IN_PROGRESS → DONE with result score and comment."""
    plan = db.get(TutoriaActionPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    if plan.status != "IN_PROGRESS":
        raise HTTPException(400, f"Plano não está IN_PROGRESS (atual: {plan.status})")
    if getattr(plan, 'responsible_id', None) and plan.responsible_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(403, "Apenas o responsável pode concluir o plano")
    if body.result_score < 0 or body.result_score > 5:
        raise HTTPException(400, "result_score deve ser entre 0 e 5")
    if len(body.result_comment) > 160:
        raise HTTPException(400, "result_comment máximo 160 caracteres")

    plan.status = "DONE"
    plan.result_score = body.result_score
    plan.result_comment = body.result_comment
    plan.completed_at = datetime.utcnow()
    db.commit()
    plan = _plans_query(db, current_user).filter(TutoriaActionPlan.id == plan_id).first()
    return _plan_out(plan)


# ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifs = (
        db.query(TutoriaNotification)
        .filter(TutoriaNotification.user_id == current_user.id, TutoriaNotification.is_read == False)
        .order_by(TutoriaNotification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "error_id": n.error_id,
            "plan_id": n.plan_id,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.get(TutoriaNotification, notif_id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(404, "Notificação não encontrada")
    notif.is_read = True
    db.commit()
    return {"ok": True}


@router.patch("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(TutoriaNotification).filter(
        TutoriaNotification.user_id == current_user.id,
        TutoriaNotification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}


# ─── LEARNING SHEETS ─────────────────────────────────────────────────────────

def _sheet_out(s: TutoriaLearningSheet) -> dict:
    return {
        "id": s.id,
        "error_id": s.error_id,
        "user_id": s.tutorado_id,
        "user_name": _user_name(s.tutorado) if hasattr(s, 'tutorado') and s.tutorado else None,
        "title": getattr(s, 'title', None),
        "error_summary": getattr(s, 'error_summary', None),
        "root_cause": getattr(s, 'root_cause', None),
        "correct_procedure": getattr(s, 'correct_procedure', None),
        "key_learnings": getattr(s, 'key_learnings', None),
        "reference_material": getattr(s, 'reference_material', None),
        "acknowledgment_note": getattr(s, 'acknowledgment_note', None),
        "status": s.status,
        "is_mandatory": getattr(s, 'is_mandatory', False),
        "reflection": getattr(s, 'reflection', None),
        "submitted_at": getattr(s, 'submitted_at', None),
        "tutor_id": getattr(s, 'tutor_id', None),
        "tutor_name": _user_name(getattr(s, 'tutor', None)),
        "tutor_outcome": getattr(s, 'tutor_outcome', None),
        "tutor_notes": getattr(s, 'tutor_notes', None),
        "reviewed_at": getattr(s, 'reviewed_at', None),
        "created_at": s.created_at,
    }


@router.get("/learning-sheets")
def list_learning_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = None,
):
    """List learning sheets — Tutors see submitted sheets from their tutorados."""
    if not is_tutor_or_above(current_user):
        raise HTTPException(403, "Apenas Tutor/Manager/Admin pode listar fichas")
    q = (
        db.query(TutoriaLearningSheet)
        .options(
            joinedload(TutoriaLearningSheet.tutorado),
            joinedload(TutoriaLearningSheet.tutor),
        )
    )
    if current_user.role not in ("ADMIN", "MANAGER"):
        # Tutor sees sheets where they are the tutor
        q = q.filter(TutoriaLearningSheet.tutor_id == current_user.id)
    if status:
        q = q.filter(TutoriaLearningSheet.status == status)
    sheets = q.order_by(TutoriaLearningSheet.created_at.desc()).all()
    return [_sheet_out(s) for s in sheets]


class CreateSheetIn(BaseModel):
    error_id: int
    tutorado_id: Optional[int] = None
    title: str
    error_summary: str
    root_cause: Optional[str] = None
    correct_procedure: Optional[str] = None
    key_learnings: Optional[str] = None
    reference_material: Optional[str] = None
    is_mandatory: bool = False


@router.post("/learning-sheets", status_code=201)
def create_learning_sheet(
    body: CreateSheetIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually create a learning sheet — Tutor/Manager/Admin only."""
    if not is_tutor_or_above(current_user):
        raise HTTPException(403, "Apenas Tutor/Manager/Admin pode criar fichas")

    error = db.get(TutoriaError, body.error_id)
    if not error:
        raise HTTPException(404, "Erro não encontrado")

    tutorado_id = body.tutorado_id or error.tutorado_id
    if tutorado_id:
        tutorado = db.get(User, tutorado_id)
        if not tutorado:
            raise HTTPException(404, "Tutorado não encontrado")

    sheet = TutoriaLearningSheet(
        error_id=body.error_id,
        tutorado_id=tutorado_id or current_user.id,
        created_by_id=current_user.id,
        title=body.title,
        error_summary=body.error_summary,
        root_cause=body.root_cause,
        correct_procedure=body.correct_procedure,
        key_learnings=body.key_learnings,
        reference_material=body.reference_material,
        is_mandatory=body.is_mandatory,
        tutor_id=current_user.id,
    )
    db.add(sheet)
    db.flush()

    if tutorado_id and tutorado_id != current_user.id:
        create_notification(db, tutorado_id, "LEARNING_SHEET",
                            f"Nova ficha de aprendizagem: {body.title}", error_id=body.error_id)
    db.commit()
    sheet = (
        db.query(TutoriaLearningSheet)
        .options(joinedload(TutoriaLearningSheet.tutorado), joinedload(TutoriaLearningSheet.tutor))
        .filter(TutoriaLearningSheet.id == sheet.id)
        .first()
    )
    return _sheet_out(sheet)


@router.get("/learning-sheets/mine")
def my_learning_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List learning sheets for current user."""
    sheets = (
        db.query(TutoriaLearningSheet)
        .options(
            joinedload(TutoriaLearningSheet.tutorado),
            joinedload(TutoriaLearningSheet.tutor),
        )
        .filter(TutoriaLearningSheet.tutorado_id == current_user.id)
        .order_by(TutoriaLearningSheet.created_at.desc())
        .all()
    )
    return [_sheet_out(s) for s in sheets]


class SubmitReflectionIn(BaseModel):
    reflection: str


@router.post("/learning-sheets/{sheet_id}/submit")
def submit_reflection(
    sheet_id: int,
    body: SubmitReflectionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Participant submits reflection."""
    sheet = db.get(TutoriaLearningSheet, sheet_id)
    if not sheet:
        raise HTTPException(404, "Ficha não encontrada")
    if sheet.tutorado_id != current_user.id:
        raise HTTPException(403, "Só pode submeter a sua própria ficha")
    if sheet.status not in ("PENDENTE",):
        raise HTTPException(400, "Ficha já foi submetida")

    sheet.reflection = body.reflection
    sheet.submitted_at = datetime.utcnow()
    sheet.status = "SUBMITTED"
    db.flush()

    # Notify tutor
    if sheet.tutor_id:
        create_notification(db, sheet.tutor_id, "LEARNING_SHEET",
                          f"Ficha de aprendizagem submetida por {current_user.full_name}", error_id=sheet.error_id)

    db.commit()
    sheet = (
        db.query(TutoriaLearningSheet)
        .options(joinedload(TutoriaLearningSheet.tutorado), joinedload(TutoriaLearningSheet.tutor))
        .filter(TutoriaLearningSheet.id == sheet_id)
        .first()
    )
    return _sheet_out(sheet)


class ReviewSheetIn(BaseModel):
    tutor_outcome: str  # SEM_ACAO | FEEDBACK_DIRETO | TUTORIA_INDIVIDUAL | TUTORIA_GRUPAL
    tutor_notes: Optional[str] = None


@router.patch("/learning-sheets/{sheet_id}/review")
def review_sheet(
    sheet_id: int,
    body: ReviewSheetIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor reviews a submitted sheet."""
    if not is_tutor_or_above(current_user):
        raise HTTPException(403, "Apenas Tutor/Manager/Admin pode revisar fichas")
    sheet = db.get(TutoriaLearningSheet, sheet_id)
    if not sheet:
        raise HTTPException(404, "Ficha não encontrada")
    if sheet.status != "SUBMITTED":
        raise HTTPException(400, "Ficha não está em estado SUBMITTED")

    sheet.tutor_outcome = body.tutor_outcome
    sheet.tutor_notes = body.tutor_notes
    sheet.reviewed_at = datetime.utcnow()
    sheet.status = "REVIEWED"
    db.commit()
    sheet = (
        db.query(TutoriaLearningSheet)
        .options(joinedload(TutoriaLearningSheet.tutorado), joinedload(TutoriaLearningSheet.tutor))
        .filter(TutoriaLearningSheet.id == sheet_id)
        .first()
    )
    return _sheet_out(sheet)
