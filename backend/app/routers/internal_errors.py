"""
Rotas para Erros Internos — Censos, registo de erros internos, fichas de aprendizagem
"""
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Senso, InternalError, InternalErrorActionPlan,
    InternalErrorActionItem, LearningSheet, InternalErrorClassification,
    ErrorImpact, ErrorCategory, ErrorType, Department, Activity, Bank,
)

router = APIRouter(prefix="/api/internal-errors", tags=["internal-errors"])

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _is_tutor_or_admin(user: User) -> bool:
    return user.role == "ADMIN" or getattr(user, "is_tutor", False)

def _require_tutor_or_admin(user: User):
    if not _is_tutor_or_admin(user):
        raise HTTPException(403, "Apenas tutores e admins")

def _is_liberador(user: User) -> bool:
    return getattr(user, "is_liberador", False) or user.role == "ADMIN"

def _require_liberador(user: User):
    if not _is_liberador(user):
        raise HTTPException(403, "Apenas liberadores")

def _user_name(u) -> Optional[str]:
    return u.full_name if u else None

def _internal_error_out(e: InternalError) -> dict:
    return {
        "id": e.id,
        "senso_id": e.senso_id,
        "gravador_id": e.gravador_id,
        "gravador_name": _user_name(e.gravador),
        "liberador_id": e.liberador_id,
        "liberador_name": _user_name(e.liberador),
        "created_by_id": e.created_by_id,
        "creator_name": _user_name(e.creator),
        "impact_id": e.impact_id,
        "impact_name": e.impact.name if e.impact else None,
        "impact_level": e.impact.level if e.impact else None,
        "category_id": e.category_id,
        "category_name": e.category.name if e.category else None,
        "error_type_id": e.error_type_id,
        "error_type_name": e.error_type.name if e.error_type else None,
        "department_id": e.department_id,
        "department_name": e.department.name if e.department else None,
        "activity_id": e.activity_id,
        "activity_name": e.activity.name if e.activity else None,
        "bank_id": e.bank_id,
        "bank_name": e.bank.name if e.bank else None,
        "classifications": [{"id": c.id, "classification": c.classification, "description": c.description} for c in (e.classifications or [])],
        "description": e.description,
        "reference_code": e.reference_code,
        "date_occurrence": e.date_occurrence.isoformat() if e.date_occurrence else None,
        "peso_liberador": e.peso_liberador,
        "peso_gravador": e.peso_gravador,
        "peso_tutor": e.peso_tutor,
        "why_1": e.why_1,
        "why_2": e.why_2,
        "why_3": e.why_3,
        "why_4": e.why_4,
        "why_5": e.why_5,
        "tutor_evaluation": e.tutor_evaluation,
        "tutor_evaluated_by_id": e.tutor_evaluated_by_id,
        "status": e.status,
        "is_active": e.is_active,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "has_learning_sheet": e.learning_sheet is not None,
        "has_action_plan": e.action_plan is not None,
    }

# ─── Schemas ──────────────────────────────────────────────────────────────────

class SensoIn(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date

class SensoUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class ClassificationItem(BaseModel):
    classification: str
    description: Optional[str] = None

class InternalErrorIn(BaseModel):
    senso_id: int
    gravador_id: int
    description: str
    reference_code: Optional[str] = None
    date_occurrence: date
    impact_id: Optional[int] = None
    category_id: Optional[int] = None
    error_type_id: Optional[int] = None
    department_id: Optional[int] = None
    activity_id: Optional[int] = None
    bank_id: Optional[int] = None
    classifications: Optional[List[ClassificationItem]] = None
    peso_liberador: Optional[int] = None

class InternalErrorUpdate(BaseModel):
    description: Optional[str] = None
    impact_id: Optional[int] = None
    category_id: Optional[int] = None
    error_type_id: Optional[int] = None
    department_id: Optional[int] = None
    activity_id: Optional[int] = None
    bank_id: Optional[int] = None
    classifications: Optional[List[ClassificationItem]] = None
    peso_liberador: Optional[int] = None
    peso_gravador: Optional[int] = None
    peso_tutor: Optional[int] = None
    why_1: Optional[str] = None
    why_2: Optional[str] = None
    why_3: Optional[str] = None
    why_4: Optional[str] = None
    why_5: Optional[str] = None
    tutor_evaluation: Optional[str] = None
    status: Optional[str] = None

class ActionPlanIn(BaseModel):
    description: Optional[str] = None
    items: Optional[List[dict]] = []

class ActionItemIn(BaseModel):
    description: str
    type: str = "CORRETIVA"
    responsible_id: Optional[int] = None
    due_date: Optional[date] = None

class LearningSheetIn(BaseModel):
    error_summary: str
    impact_description: Optional[str] = None
    actions_taken: Optional[str] = None
    error_weight: Optional[int] = None
    tutor_evaluation: Optional[str] = None
    lessons_learned: Optional[str] = None
    recommendations: Optional[str] = None


# ═══════════════════ LOOKUPS ═════════════════════════════════════════════

def _lookup_list(db: Session, model):
    q = db.query(model)
    if hasattr(model, 'is_active'):
        q = q.filter(model.is_active == True)
    return [{"id": r.id, "name": r.name} for r in q.order_by(model.name).all()]

@router.get("/lookups/impacts")
def lookup_impacts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _lookup_list(db, ErrorImpact)

@router.get("/lookups/categories")
def lookup_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models import ErrorCategory
    return _lookup_list(db, ErrorCategory)

@router.get("/lookups/error-types")
def lookup_error_types(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _lookup_list(db, ErrorType)

@router.get("/lookups/departments")
def lookup_departments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _lookup_list(db, Department)

@router.get("/lookups/activities")
def lookup_activities(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _lookup_list(db, Activity)

@router.get("/lookups/banks")
def lookup_banks(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _lookup_list(db, Bank)


# ═══════════════════ SENSOS ═══════════════════════════════════════════════════

@router.get("/sensos")
def list_sensos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sensos = db.query(Senso).filter(Senso.is_active == True).order_by(Senso.start_date.desc()).all()
    return [{
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "start_date": s.start_date.isoformat() if s.start_date else None,
        "end_date": s.end_date.isoformat() if s.end_date else None,
        "status": s.status,
        "created_by_id": s.created_by_id,
        "creator_name": _user_name(s.creator),
        "error_count": len(s.internal_errors) if s.internal_errors else 0,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    } for s in sensos]


@router.post("/sensos", status_code=201)
def create_senso(
    body: SensoIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)
    senso = Senso(
        name=body.name,
        description=body.description,
        start_date=body.start_date,
        end_date=body.end_date,
        created_by_id=current_user.id,
    )
    db.add(senso)
    db.commit()
    db.refresh(senso)
    return {"id": senso.id, "name": senso.name}


@router.patch("/sensos/{senso_id}")
def update_senso(
    senso_id: int,
    body: SensoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)
    senso = db.get(Senso, senso_id)
    if not senso:
        raise HTTPException(404, "Censo não encontrado")
    for k, v in body.dict(exclude_unset=True).items():
        setattr(senso, k, v)
    db.commit()
    db.refresh(senso)
    return {"ok": True}


@router.delete("/sensos/{senso_id}", status_code=204)
def delete_senso(
    senso_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)
    senso = db.get(Senso, senso_id)
    if not senso:
        raise HTTPException(404, "Censo não encontrado")
    senso.is_active = False
    db.commit()


# ═══════════════════ INTERNAL ERRORS ══════════════════════════════════════════

@router.get("/errors")
def list_internal_errors(
    senso_id: Optional[int] = None,
    gravador_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(InternalError).filter(InternalError.is_active == True)
    if senso_id:
        q = q.filter(InternalError.senso_id == senso_id)
    if gravador_id:
        q = q.filter(InternalError.gravador_id == gravador_id)
    if status:
        q = q.filter(InternalError.status == status)

    # Non-admin/tutor users can only see their own errors (as gravador)
    if not _is_tutor_or_admin(current_user) and not _is_liberador(current_user):
        q = q.filter(InternalError.gravador_id == current_user.id)

    errors = q.order_by(InternalError.created_at.desc()).all()
    return [_internal_error_out(e) for e in errors]


@router.post("/errors", status_code=201)
def create_internal_error(
    body: InternalErrorIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_liberador(current_user)

    senso = db.get(Senso, body.senso_id)
    if not senso or not senso.is_active:
        raise HTTPException(404, "Censo não encontrado ou inativo")
    if senso.status != "ATIVO":
        raise HTTPException(400, "Censo está fechado")

    gravador = db.get(User, body.gravador_id)
    if not gravador:
        raise HTTPException(404, "Gravador não encontrado")

    error = InternalError(
        senso_id=body.senso_id,
        gravador_id=body.gravador_id,
        liberador_id=current_user.id,
        created_by_id=current_user.id,
        description=body.description,
        reference_code=body.reference_code,
        date_occurrence=body.date_occurrence,
        impact_id=body.impact_id,
        category_id=body.category_id,
        error_type_id=body.error_type_id,
        department_id=body.department_id,
        activity_id=body.activity_id,
        bank_id=body.bank_id,
        peso_liberador=body.peso_liberador,
        status="PENDENTE",
    )
    db.add(error)
    db.flush()

    if body.classifications:
        for c in body.classifications:
            db.add(InternalErrorClassification(
                internal_error_id=error.id,
                classification=c.classification,
                description=c.description,
            ))

    db.commit()
    db.refresh(error)
    return {"id": error.id}


@router.get("/errors/{error_id}")
def get_internal_error(
    error_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    error = db.get(InternalError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")

    # Gravador can only see own errors
    if not _is_tutor_or_admin(current_user) and not _is_liberador(current_user):
        if error.gravador_id != current_user.id:
            raise HTTPException(403, "Acesso negado")

    result = _internal_error_out(error)

    # Include action plan if exists
    if error.action_plan:
        plan = error.action_plan
        result["action_plan"] = {
            "id": plan.id,
            "description": plan.description,
            "status": plan.status,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "items": [{
                "id": item.id,
                "description": item.description,
                "type": item.type,
                "responsible_id": item.responsible_id,
                "responsible_name": _user_name(item.responsible),
                "due_date": item.due_date.isoformat() if item.due_date else None,
                "status": item.status,
            } for item in plan.items],
        }

    # Include learning sheet if exists
    if error.learning_sheet:
        ls = error.learning_sheet
        result["learning_sheet"] = {
            "id": ls.id,
            "error_summary": ls.error_summary,
            "impact_description": ls.impact_description,
            "actions_taken": ls.actions_taken,
            "error_weight": ls.error_weight,
            "tutor_evaluation": ls.tutor_evaluation,
            "lessons_learned": ls.lessons_learned,
            "recommendations": ls.recommendations,
            "is_read": ls.is_read,
            "read_at": ls.read_at.isoformat() if ls.read_at else None,
            "created_at": ls.created_at.isoformat() if ls.created_at else None,
        }

    return result


@router.patch("/errors/{error_id}")
def update_internal_error(
    error_id: int,
    body: InternalErrorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    error = db.get(InternalError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")

    data = body.dict(exclude_unset=True)
    classifications_data = data.pop("classifications", None)

    # Gravador can only update 5 whys and peso_gravador
    if not _is_tutor_or_admin(current_user) and not _is_liberador(current_user):
        if error.gravador_id != current_user.id:
            raise HTTPException(403, "Acesso negado")
        allowed = {"why_1", "why_2", "why_3", "why_4", "why_5", "peso_gravador"}
        data = {k: v for k, v in data.items() if k in allowed}
        classifications_data = None

    # Only tutor/admin can set tutor fields
    if "tutor_evaluation" in data or "peso_tutor" in data:
        _require_tutor_or_admin(current_user)
        if "tutor_evaluation" in data:
            error.tutor_evaluated_by_id = current_user.id

    for k, v in data.items():
        setattr(error, k, v)

    if classifications_data is not None:
        for old in error.classifications:
            db.delete(old)
        for c in classifications_data:
            db.add(InternalErrorClassification(
                internal_error_id=error.id,
                classification=c["classification"],
                description=c.get("description"),
            ))

    db.commit()
    return {"ok": True}


# ═══════════════════ ACTION PLANS (Internal Errors) ═══════════════════════════

@router.post("/errors/{error_id}/action-plan", status_code=201)
def create_action_plan(
    error_id: int,
    body: ActionPlanIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)

    error = db.get(InternalError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.action_plan:
        raise HTTPException(400, "Já existe um plano de ação para este erro")

    plan = InternalErrorActionPlan(
        internal_error_id=error_id,
        created_by_id=current_user.id,
        description=body.description,
    )
    db.add(plan)
    db.flush()

    for item_data in (body.items or []):
        item = InternalErrorActionItem(
            plan_id=plan.id,
            description=item_data.get("description", ""),
            type=item_data.get("type", "CORRETIVA"),
            responsible_id=item_data.get("responsible_id"),
            due_date=item_data.get("due_date"),
        )
        db.add(item)

    error.status = "PLANO_CRIADO"
    db.commit()
    return {"id": plan.id}


@router.post("/errors/{error_id}/action-plan/items", status_code=201)
def add_action_item(
    error_id: int,
    body: ActionItemIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)

    error = db.get(InternalError, error_id)
    if not error or not error.action_plan:
        raise HTTPException(404, "Plano não encontrado")

    item = InternalErrorActionItem(
        plan_id=error.action_plan.id,
        description=body.description,
        type=body.type,
        responsible_id=body.responsible_id,
        due_date=body.due_date,
    )
    db.add(item)
    db.commit()
    return {"id": item.id}


@router.patch("/action-items/{item_id}")
def update_action_item(
    item_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)
    item = db.get(InternalErrorActionItem, item_id)
    if not item:
        raise HTTPException(404, "Ação não encontrada")

    for k, v in body.items():
        if k in ("description", "type", "responsible_id", "due_date", "status"):
            setattr(item, k, v)
    db.commit()
    return {"ok": True}


# ═══════════════════ LEARNING SHEETS ══════════════════════════════════════════

@router.post("/errors/{error_id}/learning-sheet", status_code=201)
def create_learning_sheet(
    error_id: int,
    body: LearningSheetIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)

    error = db.get(InternalError, error_id)
    if not error or not error.is_active:
        raise HTTPException(404, "Erro não encontrado")
    if error.learning_sheet:
        raise HTTPException(400, "Ficha já existe para este erro")

    sheet = LearningSheet(
        internal_error_id=error_id,
        tutorado_id=error.gravador_id,
        created_by_id=current_user.id,
        error_summary=body.error_summary,
        impact_description=body.impact_description,
        actions_taken=body.actions_taken,
        error_weight=body.error_weight,
        tutor_evaluation=body.tutor_evaluation,
        lessons_learned=body.lessons_learned,
        recommendations=body.recommendations,
    )
    db.add(sheet)
    db.commit()
    return {"id": sheet.id}


@router.get("/my-learning-sheets")
def my_learning_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fichas de aprendizagem do utilizador autenticado (tutorado)"""
    sheets = (
        db.query(LearningSheet)
        .filter(LearningSheet.tutorado_id == current_user.id)
        .order_by(LearningSheet.created_at.desc())
        .all()
    )
    return [{
        "id": s.id,
        "internal_error_id": s.internal_error_id,
        "error_summary": s.error_summary,
        "impact_description": s.impact_description,
        "actions_taken": s.actions_taken,
        "error_weight": s.error_weight,
        "tutor_evaluation": s.tutor_evaluation,
        "lessons_learned": s.lessons_learned,
        "recommendations": s.recommendations,
        "is_read": s.is_read,
        "read_at": s.read_at.isoformat() if s.read_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    } for s in sheets]


@router.post("/learning-sheets/{sheet_id}/mark-read")
def mark_sheet_read(
    sheet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sheet = db.get(LearningSheet, sheet_id)
    if not sheet:
        raise HTTPException(404, "Ficha não encontrada")
    if sheet.tutorado_id != current_user.id:
        raise HTTPException(403, "Apenas o tutorado pode marcar como lida")
    sheet.is_read = True
    sheet.read_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


# ═══════════════════ DASHBOARD ════════════════════════════════════════════════

@router.get("/dashboard")
def internal_errors_dashboard(
    senso_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_tutor_or_admin(current_user)
    q = db.query(InternalError).filter(InternalError.is_active == True)
    if senso_id:
        q = q.filter(InternalError.senso_id == senso_id)

    errors = q.all()
    total = len(errors)
    pendente = sum(1 for e in errors if e.status == "PENDENTE")
    avaliado = sum(1 for e in errors if e.status == "AVALIADO")
    plano_criado = sum(1 for e in errors if e.status == "PLANO_CRIADO")
    concluido = sum(1 for e in errors if e.status == "CONCLUIDO")

    return {
        "total": total,
        "pendente": pendente,
        "avaliado": avaliado,
        "plano_criado": plano_criado,
        "concluido": concluido,
    }
