"""Public endpoints for the landing page — no authentication required."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from pydantic import BaseModel
from typing import List, Optional

from app import models
from app.database import get_db

router = APIRouter(prefix="/api/public", tags=["public"])


# ============ Schemas ============

class LandingStats(BaseModel):
    total_products: int
    total_courses: int
    total_students: int
    total_lessons: int
    avg_satisfaction: float  # 0-100 scale


class PublicRating(BaseModel):
    user_name: str
    stars: int
    comment: Optional[str] = None
    rating_type: str
    item_name: Optional[str] = None
    created_at: Optional[str] = None


class LandingDataResponse(BaseModel):
    stats: LandingStats
    ratings: List[PublicRating]


# ============ Endpoints ============

@router.get("/landing", response_model=LandingDataResponse)
async def get_landing_data(db: Session = Depends(get_db)):
    """Public endpoint — returns stats and ratings for the landing page."""

    # --- Stats ---
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    total_courses = db.query(func.count(models.Course.id)).scalar() or 0
    total_students = db.query(func.count(models.User.id)).filter(
        models.User.role.in_(["formando", "TRAINEE", "trainee"])
    ).scalar() or 0
    total_lessons = db.query(func.count(models.Lesson.id)).scalar() or 0

    # Average satisfaction from all ratings (stars 0-5 → percentage 0-100)
    avg_stars = db.query(func.avg(models.Rating.stars)).scalar()
    avg_satisfaction = round((avg_stars / 5) * 100) if avg_stars else 0

    stats = LandingStats(
        total_products=total_products,
        total_courses=total_courses,
        total_students=total_students,
        total_lessons=total_lessons,
        avg_satisfaction=avg_satisfaction,
    )

    # --- Recent ratings with comments (for the carousel) ---
    ratings_query = (
        db.query(models.Rating)
        .filter(
            models.Rating.comment.isnot(None),
            models.Rating.comment != "",
            models.Rating.stars >= 3,  # only show positive-ish ratings publicly
        )
        .order_by(models.Rating.created_at.desc())
        .limit(20)
        .all()
    )

    ratings: List[PublicRating] = []
    for r in ratings_query:
        # Resolve item name
        item_name = None
        if r.course and r.course.title:
            item_name = r.course.title
        elif r.training_plan and r.training_plan.title:
            item_name = r.training_plan.title
        elif r.lesson and r.lesson.title:
            item_name = r.lesson.title
        elif r.challenge and r.challenge.title:
            item_name = r.challenge.title

        # Resolve user name (first name only for privacy)
        user_name = "Formando"
        if r.user:
            full = r.user.full_name or r.user.username
            user_name = full.split()[0] if full else "Formando"

        ratings.append(PublicRating(
            user_name=user_name,
            stars=r.stars,
            comment=r.comment,
            rating_type=r.rating_type,
            item_name=item_name,
            created_at=r.created_at.isoformat() if r.created_at else None,
        ))

    return LandingDataResponse(stats=stats, ratings=ratings)
