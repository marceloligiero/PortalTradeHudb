from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import json

from app import models, auth
from app.database import get_db

router = APIRouter(prefix="/api/ratings", tags=["ratings"])


# ============ Schemas ============

class RatingCreate(BaseModel):
    rating_type: str = Field(..., description="COURSE, LESSON, CHALLENGE, TRAINER, TRAINING_PLAN")
    course_id: Optional[int] = None
    lesson_id: Optional[int] = None
    challenge_id: Optional[int] = None
    trainer_id: Optional[int] = None
    training_plan_id: Optional[int] = None
    stars: int = Field(..., ge=0, le=5, description="Avaliação de 0 a 5 estrelas")
    comment: Optional[str] = None


class RatingResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    rating_type: str
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    lesson_id: Optional[int] = None
    lesson_title: Optional[str] = None
    challenge_id: Optional[int] = None
    challenge_title: Optional[str] = None
    trainer_id: Optional[int] = None
    trainer_name: Optional[str] = None
    training_plan_id: Optional[int] = None
    training_plan_title: Optional[str] = None
    stars: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RatingSummary(BaseModel):
    rating_type: str
    item_id: int
    item_title: str
    avg_stars: float
    total_ratings: int
    star_distribution: dict  # {1: count, 2: count, etc.}


class RatingsListResponse(BaseModel):
    ratings: List[RatingResponse]
    total: int


class RatingsSummaryResponse(BaseModel):
    summaries: List[RatingSummary]


# ============ Endpoints para Formandos ============

@router.post("/submit-debug")
async def submit_rating_debug(
    request: Request,
    current_user: models.User = Depends(auth.require_role(["TRAINEE"])),
):
    """Debug endpoint to see raw body"""
    body = await request.body()
    print(f"Raw body: {body}")
    try:
        data = json.loads(body)
        print(f"Parsed JSON: {data}")
        return {"received": data}
    except Exception as e:
        print(f"JSON parse error: {e}")
        return {"error": str(e), "raw": body.decode('utf-8')}

@router.post("/submit", response_model=RatingResponse)
async def submit_rating(
    rating_data: RatingCreate,
    current_user: models.User = Depends(auth.require_role(["TRAINEE"])),
    db: Session = Depends(get_db)
):
    """Formando submete uma avaliação após finalização"""
    
    # Debug log
    print(f"Rating submit: type={rating_data.rating_type}, stars={rating_data.stars}, challenge_id={rating_data.challenge_id}, user={current_user.id}")
    
    # Validar tipo de avaliação
    valid_types = ["COURSE", "LESSON", "CHALLENGE", "TRAINER", "TRAINING_PLAN"]
    if rating_data.rating_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Tipo de avaliação inválido. Use: {', '.join(valid_types)}")
    
    # Todas as avaliações (exceto TRAINING_PLAN) devem estar vinculadas a um plano de formação
    if rating_data.rating_type != "TRAINING_PLAN" and not rating_data.training_plan_id:
        raise HTTPException(status_code=400, detail="training_plan_id é obrigatório - avaliações devem estar vinculadas a um plano de formação")
    
    # Validar que o ID correspondente foi fornecido
    if rating_data.rating_type == "COURSE" and not rating_data.course_id:
        raise HTTPException(status_code=400, detail="course_id é obrigatório para avaliar cursos")
    elif rating_data.rating_type == "LESSON" and not rating_data.lesson_id:
        raise HTTPException(status_code=400, detail="lesson_id é obrigatório para avaliar aulas")
    elif rating_data.rating_type == "CHALLENGE" and not rating_data.challenge_id:
        raise HTTPException(status_code=400, detail="challenge_id é obrigatório para avaliar desafios")
    elif rating_data.rating_type == "TRAINER" and not rating_data.trainer_id:
        raise HTTPException(status_code=400, detail="trainer_id é obrigatório para avaliar formadores")
    elif rating_data.rating_type == "TRAINING_PLAN" and not rating_data.training_plan_id:
        raise HTTPException(status_code=400, detail="training_plan_id é obrigatório para avaliar planos de formação")
    
    # Verificar se já existe uma avaliação do mesmo usuário para o mesmo item + plano de formação
    existing_query = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id,
        models.Rating.rating_type == rating_data.rating_type
    )
    
    # Sempre filtrar por training_plan_id para garantir unicidade por plano
    if rating_data.training_plan_id:
        existing_query = existing_query.filter(models.Rating.training_plan_id == rating_data.training_plan_id)
    
    if rating_data.course_id:
        existing_query = existing_query.filter(models.Rating.course_id == rating_data.course_id)
    if rating_data.lesson_id:
        existing_query = existing_query.filter(models.Rating.lesson_id == rating_data.lesson_id)
    if rating_data.challenge_id:
        existing_query = existing_query.filter(models.Rating.challenge_id == rating_data.challenge_id)
    if rating_data.trainer_id:
        existing_query = existing_query.filter(models.Rating.trainer_id == rating_data.trainer_id)
    
    existing = existing_query.first()
    if existing:
        # Atualizar avaliação existente
        existing.stars = rating_data.stars
        existing.comment = rating_data.comment
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        rating = existing
    else:
        # Criar nova avaliação
        rating = models.Rating(
            user_id=current_user.id,
            rating_type=rating_data.rating_type,
            course_id=rating_data.course_id,
            lesson_id=rating_data.lesson_id,
            challenge_id=rating_data.challenge_id,
            trainer_id=rating_data.trainer_id,
            training_plan_id=rating_data.training_plan_id,
            stars=rating_data.stars,
            comment=rating_data.comment
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
    
    return _build_rating_response(rating, db)


@router.get("/check")
async def check_rating_exists(
    rating_type: str = Query(..., description="COURSE, LESSON, CHALLENGE, TRAINER, TRAINING_PLAN"),
    course_id: Optional[int] = Query(None),
    lesson_id: Optional[int] = Query(None),
    challenge_id: Optional[int] = Query(None),
    trainer_id: Optional[int] = Query(None),
    training_plan_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Verifica se o usuário já fez uma avaliação para o item especificado no contexto do plano de formação"""
    query = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id,
        models.Rating.rating_type == rating_type.upper()
    )
    
    # Sempre filtrar por training_plan_id para verificar unicidade por plano
    if training_plan_id:
        query = query.filter(models.Rating.training_plan_id == training_plan_id)
    
    if rating_type.upper() == "COURSE" and course_id:
        query = query.filter(models.Rating.course_id == course_id)
    elif rating_type.upper() == "LESSON" and lesson_id:
        query = query.filter(models.Rating.lesson_id == lesson_id)
    elif rating_type.upper() == "CHALLENGE" and challenge_id:
        query = query.filter(models.Rating.challenge_id == challenge_id)
    elif rating_type.upper() == "TRAINER" and trainer_id:
        query = query.filter(models.Rating.trainer_id == trainer_id)
    elif rating_type.upper() == "TRAINING_PLAN" and training_plan_id:
        query = query.filter(models.Rating.training_plan_id == training_plan_id)
    
    existing = query.first()
    return {"exists": existing is not None, "rating_id": existing.id if existing else None}


@router.get("/my-ratings", response_model=RatingsListResponse)
async def get_my_ratings(
    current_user: models.User = Depends(auth.require_role(["TRAINEE"])),
    db: Session = Depends(get_db)
):
    """Formando visualiza suas próprias avaliações"""
    
    ratings = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id
    ).order_by(models.Rating.created_at.desc()).all()
    
    return RatingsListResponse(
        ratings=[_build_rating_response(r, db) for r in ratings],
        total=len(ratings)
    )


@router.get("/check/{rating_type}/{item_id}")
async def check_rating_exists(
    rating_type: str,
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["TRAINEE"])),
    db: Session = Depends(get_db)
):
    """Verificar se o formando já avaliou um item específico"""
    
    query = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id,
        models.Rating.rating_type == rating_type
    )
    
    if rating_type == "COURSE":
        query = query.filter(models.Rating.course_id == item_id)
    elif rating_type == "LESSON":
        query = query.filter(models.Rating.lesson_id == item_id)
    elif rating_type == "CHALLENGE":
        query = query.filter(models.Rating.challenge_id == item_id)
    elif rating_type == "TRAINER":
        query = query.filter(models.Rating.trainer_id == item_id)
    elif rating_type == "TRAINING_PLAN":
        query = query.filter(models.Rating.training_plan_id == item_id)
    
    existing = query.first()
    
    return {
        "exists": existing is not None,
        "rating": _build_rating_response(existing, db) if existing else None
    }


# ============ Endpoints para Admin ============

@router.get("/admin/all", response_model=RatingsListResponse)
async def get_all_ratings(
    rating_type: Optional[str] = Query(None, description="Filtrar por tipo"),
    min_stars: Optional[int] = Query(None, ge=0, le=5),
    max_stars: Optional[int] = Query(None, ge=0, le=5),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Admin visualiza todas as avaliações"""
    
    query = db.query(models.Rating)
    
    if rating_type:
        query = query.filter(models.Rating.rating_type == rating_type)
    if min_stars is not None:
        query = query.filter(models.Rating.stars >= min_stars)
    if max_stars is not None:
        query = query.filter(models.Rating.stars <= max_stars)
    
    ratings = query.order_by(models.Rating.created_at.desc()).all()
    
    return RatingsListResponse(
        ratings=[_build_rating_response(r, db) for r in ratings],
        total=len(ratings)
    )


@router.get("/admin/summary", response_model=RatingsSummaryResponse)
async def get_ratings_summary(
    rating_type: Optional[str] = Query(None, description="Filtrar por tipo"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Admin visualiza resumo das avaliações por item"""
    
    summaries = []
    
    types_to_process = [rating_type] if rating_type else ["COURSE", "LESSON", "CHALLENGE", "TRAINER", "TRAINING_PLAN"]
    
    for rtype in types_to_process:
        if rtype == "COURSE":
            courses = db.query(models.Course).all()
            for course in courses:
                summary = _build_summary(db, rtype, course.id, course.title)
                if summary.total_ratings > 0:
                    summaries.append(summary)
                    
        elif rtype == "LESSON":
            lessons = db.query(models.Lesson).all()
            for lesson in lessons:
                summary = _build_summary(db, rtype, lesson.id, lesson.title)
                if summary.total_ratings > 0:
                    summaries.append(summary)
                    
        elif rtype == "CHALLENGE":
            challenges = db.query(models.Challenge).all()
            for challenge in challenges:
                summary = _build_summary(db, rtype, challenge.id, challenge.title)
                if summary.total_ratings > 0:
                    summaries.append(summary)
                    
        elif rtype == "TRAINER":
            trainers = db.query(models.User).filter(models.User.role == "TRAINER").all()
            for trainer in trainers:
                summary = _build_summary(db, rtype, trainer.id, trainer.full_name)
                if summary.total_ratings > 0:
                    summaries.append(summary)
                    
        elif rtype == "TRAINING_PLAN":
            plans = db.query(models.TrainingPlan).all()
            for plan in plans:
                summary = _build_summary(db, rtype, plan.id, plan.title)
                if summary.total_ratings > 0:
                    summaries.append(summary)
    
    # Ordenar por média de estrelas (decrescente)
    summaries.sort(key=lambda x: x.avg_stars, reverse=True)
    
    return RatingsSummaryResponse(summaries=summaries)


@router.get("/admin/item/{rating_type}/{item_id}", response_model=RatingsListResponse)
async def get_ratings_for_item(
    rating_type: str,
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Admin visualiza todas as avaliações de um item específico"""
    
    query = db.query(models.Rating).filter(models.Rating.rating_type == rating_type)
    
    if rating_type == "COURSE":
        query = query.filter(models.Rating.course_id == item_id)
    elif rating_type == "LESSON":
        query = query.filter(models.Rating.lesson_id == item_id)
    elif rating_type == "CHALLENGE":
        query = query.filter(models.Rating.challenge_id == item_id)
    elif rating_type == "TRAINER":
        query = query.filter(models.Rating.trainer_id == item_id)
    elif rating_type == "TRAINING_PLAN":
        query = query.filter(models.Rating.training_plan_id == item_id)
    
    ratings = query.order_by(models.Rating.created_at.desc()).all()
    
    return RatingsListResponse(
        ratings=[_build_rating_response(r, db) for r in ratings],
        total=len(ratings)
    )


@router.get("/admin/dashboard")
async def get_ratings_dashboard(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Dashboard com estatísticas gerais das avaliações"""
    
    total_ratings = db.query(models.Rating).count()
    
    # Média geral por tipo
    averages_by_type = {}
    for rtype in ["COURSE", "LESSON", "CHALLENGE", "TRAINER", "TRAINING_PLAN"]:
        avg = db.query(func.avg(models.Rating.stars)).filter(
            models.Rating.rating_type == rtype
        ).scalar()
        count = db.query(models.Rating).filter(models.Rating.rating_type == rtype).count()
        averages_by_type[rtype] = {
            "avg_stars": round(avg or 0, 2),
            "total_count": count
        }
    
    # Distribuição geral de estrelas
    star_distribution = {}
    for stars in range(6):
        count = db.query(models.Rating).filter(models.Rating.stars == stars).count()
        star_distribution[str(stars)] = count
    
    # Top 5 melhores avaliados (formadores)
    top_trainers = []
    trainer_ratings = db.query(
        models.Rating.trainer_id,
        func.avg(models.Rating.stars).label('avg_stars'),
        func.count(models.Rating.id).label('count')
    ).filter(
        models.Rating.rating_type == "TRAINER",
        models.Rating.trainer_id.isnot(None)
    ).group_by(models.Rating.trainer_id).order_by(func.avg(models.Rating.stars).desc()).limit(5).all()
    
    for tr in trainer_ratings:
        trainer = db.query(models.User).filter(models.User.id == tr.trainer_id).first()
        if trainer:
            top_trainers.append({
                "trainer_id": tr.trainer_id,
                "trainer_name": trainer.full_name,
                "avg_stars": round(tr.avg_stars, 2),
                "total_ratings": tr.count
            })
    
    # Top 5 melhores cursos
    top_courses = []
    course_ratings = db.query(
        models.Rating.course_id,
        func.avg(models.Rating.stars).label('avg_stars'),
        func.count(models.Rating.id).label('count')
    ).filter(
        models.Rating.rating_type == "COURSE",
        models.Rating.course_id.isnot(None)
    ).group_by(models.Rating.course_id).order_by(func.avg(models.Rating.stars).desc()).limit(5).all()
    
    for cr in course_ratings:
        course = db.query(models.Course).filter(models.Course.id == cr.course_id).first()
        if course:
            top_courses.append({
                "course_id": cr.course_id,
                "course_title": course.title,
                "avg_stars": round(cr.avg_stars, 2),
                "total_ratings": cr.count
            })
    
    # Avaliações recentes (últimas 10)
    recent_ratings = db.query(models.Rating).order_by(
        models.Rating.created_at.desc()
    ).limit(10).all()
    
    return {
        "total_ratings": total_ratings,
        "averages_by_type": averages_by_type,
        "star_distribution": star_distribution,
        "top_trainers": top_trainers,
        "top_courses": top_courses,
        "recent_ratings": [_build_rating_response(r, db) for r in recent_ratings]
    }


# ============ Helper Functions ============

def _build_rating_response(rating: models.Rating, db: Session) -> RatingResponse:
    """Constrói resposta de avaliação com informações completas"""
    
    user = db.query(models.User).filter(models.User.id == rating.user_id).first()
    
    course_title = None
    lesson_title = None
    challenge_title = None
    trainer_name = None
    training_plan_title = None
    
    if rating.course_id:
        course = db.query(models.Course).filter(models.Course.id == rating.course_id).first()
        course_title = course.title if course else None
    
    if rating.lesson_id:
        lesson = db.query(models.Lesson).filter(models.Lesson.id == rating.lesson_id).first()
        lesson_title = lesson.title if lesson else None
    
    if rating.challenge_id:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == rating.challenge_id).first()
        challenge_title = challenge.title if challenge else None
    
    if rating.trainer_id:
        trainer = db.query(models.User).filter(models.User.id == rating.trainer_id).first()
        trainer_name = trainer.full_name if trainer else None
    
    if rating.training_plan_id:
        plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == rating.training_plan_id).first()
        training_plan_title = plan.title if plan else None
    
    return RatingResponse(
        id=rating.id,
        user_id=rating.user_id,
        user_name=user.full_name if user else "Desconhecido",
        user_email=user.email if user else "",
        rating_type=rating.rating_type,
        course_id=rating.course_id,
        course_title=course_title,
        lesson_id=rating.lesson_id,
        lesson_title=lesson_title,
        challenge_id=rating.challenge_id,
        challenge_title=challenge_title,
        trainer_id=rating.trainer_id,
        trainer_name=trainer_name,
        training_plan_id=rating.training_plan_id,
        training_plan_title=training_plan_title,
        stars=rating.stars,
        comment=rating.comment,
        created_at=rating.created_at
    )


def _build_summary(db: Session, rating_type: str, item_id: int, item_title: str) -> RatingSummary:
    """Constrói resumo de avaliações para um item"""
    
    query = db.query(models.Rating).filter(models.Rating.rating_type == rating_type)
    
    if rating_type == "COURSE":
        query = query.filter(models.Rating.course_id == item_id)
    elif rating_type == "LESSON":
        query = query.filter(models.Rating.lesson_id == item_id)
    elif rating_type == "CHALLENGE":
        query = query.filter(models.Rating.challenge_id == item_id)
    elif rating_type == "TRAINER":
        query = query.filter(models.Rating.trainer_id == item_id)
    elif rating_type == "TRAINING_PLAN":
        query = query.filter(models.Rating.training_plan_id == item_id)
    
    ratings = query.all()
    total = len(ratings)
    
    if total == 0:
        return RatingSummary(
            rating_type=rating_type,
            item_id=item_id,
            item_title=item_title,
            avg_stars=0,
            total_ratings=0,
            star_distribution={"0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        )
    
    avg_stars = sum(r.stars for r in ratings) / total
    
    star_distribution = {}
    for stars in range(6):
        star_distribution[str(stars)] = len([r for r in ratings if r.stars == stars])
    
    return RatingSummary(
        rating_type=rating_type,
        item_id=item_id,
        item_title=item_title,
        avg_stars=round(avg_stars, 2),
        total_ratings=total,
        star_distribution=star_distribution
    )
