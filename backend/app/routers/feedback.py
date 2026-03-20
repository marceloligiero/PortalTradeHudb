"""
Feedback dos Liberadores — Router
B.1  Questionário semanal por liberador sobre gravadores
B.2  Identificar necessidade de intervenção do tutor
B.3  Separar: Opinião / Sentimento / Situações concretas
B.4  Construído com tutores (design)
B.5  Gerar outputs acionáveis
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ReleaserSurvey, ReleaserSurveyResponse, ReleaserSurveyAction, User
from app.auth import get_current_user

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _is_tutor_or_admin(u: User) -> bool:
    return u.role == "ADMIN" or getattr(u, 'is_tutor', False)

def _survey_out(s: ReleaserSurvey) -> dict:
    return {
        "id": s.id,
        "title": s.title,
        "week_start": s.week_start,
        "week_end": s.week_end,
        "status": s.status,
        "created_by_id": s.created_by_id,
        "created_by_name": s.creator.full_name if s.creator else None,
        "response_count": len(s.responses) if s.responses else 0,
        "created_at": s.created_at,
    }

def _response_out(r: ReleaserSurveyResponse) -> dict:
    return {
        "id": r.id,
        "survey_id": r.survey_id,
        "liberador_id": r.liberador_id,
        "liberador_name": r.liberador.full_name if r.liberador else None,
        "grabador_id": r.grabador_id,
        "grabador_name": r.grabador.full_name if r.grabador else None,
        "opinion": r.opinion,
        "sentiment": r.sentiment,
        "concrete_situations": r.concrete_situations,
        "needs_tutor_intervention": r.needs_tutor_intervention,
        "submitted_at": r.submitted_at,
        "actions": [
            {
                "id": a.id,
                "action_type": a.action_type,
                "description": a.description,
                "created_by_id": a.created_by_id,
                "created_at": a.created_at,
            }
            for a in (r.actions or [])
        ],
    }


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class SurveyIn(BaseModel):
    title: str
    week_start: str   # ISO date string YYYY-MM-DD
    week_end: str


class ResponseIn(BaseModel):
    survey_id: int
    grabador_id: int
    opinion: Optional[str] = None
    sentiment: Optional[str] = None       # POSITIVE | NEUTRAL | NEGATIVE
    concrete_situations: Optional[str] = None
    needs_tutor_intervention: bool = False


class ActionIn(BaseModel):
    response_id: int
    action_type: Optional[str] = None     # FEEDBACK_DIRETO | TUTORIA | SEGUIMENTO | OUTRO
    description: Optional[str] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/surveys")
def list_surveys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor/Admin lists all weekly surveys."""
    if not _is_tutor_or_admin(current_user):
        raise HTTPException(403, "Apenas Tutor/Admin pode ver surveys")
    surveys = db.query(ReleaserSurvey).order_by(ReleaserSurvey.week_start.desc()).all()
    return [_survey_out(s) for s in surveys]


@router.post("/surveys", status_code=201)
def create_survey(
    body: SurveyIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor/Admin creates a weekly survey (B.1)."""
    if not _is_tutor_or_admin(current_user):
        raise HTTPException(403, "Apenas Tutor/Admin pode criar surveys")
    from datetime import date
    s = ReleaserSurvey(
        title=body.title,
        week_start=date.fromisoformat(body.week_start),
        week_end=date.fromisoformat(body.week_end),
        created_by_id=current_user.id,
        status="OPEN",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _survey_out(s)


@router.get("/surveys/{survey_id}")
def get_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor/Admin or Liberador: get survey details."""
    s = db.get(ReleaserSurvey, survey_id)
    if not s:
        raise HTTPException(404, "Survey não encontrada")
    out = _survey_out(s)
    if _is_tutor_or_admin(current_user):
        out["responses"] = [_response_out(r) for r in s.responses]
    return out


@router.post("/surveys/{survey_id}/close")
def close_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor/Admin closes a weekly survey."""
    if not _is_tutor_or_admin(current_user):
        raise HTTPException(403, "Apenas Tutor/Admin pode fechar surveys")
    s = db.get(ReleaserSurvey, survey_id)
    if not s:
        raise HTTPException(404, "Survey não encontrada")
    if s.status == "CLOSED":
        raise HTTPException(400, "Survey já está fechada")
    s.status = "CLOSED"
    db.commit()
    return _survey_out(s)


@router.get("/my-pending")
def my_pending_surveys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liberador: list open surveys where they haven't yet responded for all grabadors."""
    open_surveys = db.query(ReleaserSurvey).filter(ReleaserSurvey.status == "OPEN").all()
    result = []
    for s in open_surveys:
        # Any OPEN survey is returned — liberador can add responses
        existing = [r.grabador_id for r in s.responses if r.liberador_id == current_user.id]
        result.append({**_survey_out(s), "responded_grabadors": existing})
    return result


@router.post("/responses", status_code=201)
def submit_response(
    body: ResponseIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liberador submits feedback about a grabador (B.1-B.3)."""
    s = db.get(ReleaserSurvey, body.survey_id)
    if not s:
        raise HTTPException(404, "Survey não encontrada")
    if s.status != "OPEN":
        raise HTTPException(400, "Survey está fechada")
    if body.sentiment and body.sentiment not in ("POSITIVE", "NEUTRAL", "NEGATIVE"):
        raise HTTPException(400, "sentiment deve ser POSITIVE, NEUTRAL ou NEGATIVE")
    # Upsert — replace existing response for same (survey, liberador, grabador)
    existing = db.query(ReleaserSurveyResponse).filter(
        ReleaserSurveyResponse.survey_id == body.survey_id,
        ReleaserSurveyResponse.liberador_id == current_user.id,
        ReleaserSurveyResponse.grabador_id == body.grabador_id,
    ).first()
    if existing:
        existing.opinion = body.opinion
        existing.sentiment = body.sentiment
        existing.concrete_situations = body.concrete_situations
        existing.needs_tutor_intervention = body.needs_tutor_intervention
        existing.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return _response_out(existing)
    r = ReleaserSurveyResponse(
        survey_id=body.survey_id,
        liberador_id=current_user.id,
        grabador_id=body.grabador_id,
        opinion=body.opinion,
        sentiment=body.sentiment,
        concrete_situations=body.concrete_situations,
        needs_tutor_intervention=body.needs_tutor_intervention,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _response_out(r)


@router.post("/actions", status_code=201)
def create_action(
    body: ActionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor/Admin creates an actionable output from a survey response (B.5)."""
    if not _is_tutor_or_admin(current_user):
        raise HTTPException(403, "Apenas Tutor/Admin pode criar acções")
    resp = db.get(ReleaserSurveyResponse, body.response_id)
    if not resp:
        raise HTTPException(404, "Resposta não encontrada")
    a = ReleaserSurveyAction(
        response_id=body.response_id,
        action_type=body.action_type,
        description=body.description,
        created_by_id=current_user.id,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id,
        "response_id": a.response_id,
        "action_type": a.action_type,
        "description": a.description,
        "created_by_id": a.created_by_id,
        "created_at": a.created_at,
    }


@router.get("/dashboard")
def feedback_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tutor/Admin: aggregated dashboard with sentiment trends and intervention alerts (B.5)."""
    if not _is_tutor_or_admin(current_user):
        raise HTTPException(403, "Apenas Tutor/Admin pode ver o dashboard")

    responses = db.query(ReleaserSurveyResponse).all()

    # Count by sentiment
    sentiment_counts = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0, "UNKNOWN": 0}
    intervention_needed = []
    grabador_scores: dict = {}

    for r in responses:
        s = r.sentiment or "UNKNOWN"
        sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
        if r.needs_tutor_intervention:
            intervention_needed.append({
                "response_id": r.id,
                "liberador_id": r.liberador_id,
                "liberador_name": r.liberador.full_name if r.liberador else None,
                "grabador_id": r.grabador_id,
                "grabador_name": r.grabador.full_name if r.grabador else None,
                "survey_id": r.survey_id,
            })
        gid = r.grabador_id
        if gid not in grabador_scores:
            grabador_scores[gid] = {"positive": 0, "neutral": 0, "negative": 0, "name": r.grabador.full_name if r.grabador else str(gid)}
        if r.sentiment == "POSITIVE":
            grabador_scores[gid]["positive"] += 1
        elif r.sentiment == "NEGATIVE":
            grabador_scores[gid]["negative"] += 1
        else:
            grabador_scores[gid]["neutral"] += 1

    return {
        "total_responses": len(responses),
        "sentiment_counts": sentiment_counts,
        "intervention_alerts": intervention_needed,
        "grabador_scores": list(grabador_scores.values()),
    }
