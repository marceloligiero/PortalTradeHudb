"""
Rotas para Dashboard e Estatísticas
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, TrainingPlan, TrainingPlanAssignment, Course, Challenge, ChallengeSubmission

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/kpis")
async def get_kpis(db: Session = Depends(get_db)):
    """Retorna KPIs principais da plataforma"""
    
    # Total de usuários por role
    total_students = db.query(func.count(User.id)).filter(User.role == 'TRAINEE').scalar() or 0
    total_trainers = db.query(func.count(User.id)).filter(User.role == 'TRAINER').scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.role == 'ADMIN').scalar() or 0
    
    # Total de conteúdo
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_training_plans = db.query(func.count(TrainingPlan.id)).scalar() or 0
    total_challenges = db.query(func.count(Challenge.id)).scalar() or 0
    
    # Taxa de conclusão
    total_submissions = db.query(func.count(ChallengeSubmission.id)).scalar() or 0
    completed_submissions = db.query(func.count(ChallengeSubmission.id)).filter(
        ChallengeSubmission.completed_at.isnot(None)
    ).scalar() or 0
    
    completion_rate = (
        (completed_submissions / total_submissions * 100) 
        if total_submissions > 0 
        else 0
    )
    
    return {
        "users": {
            "students": int(total_students),
            "trainers": int(total_trainers),
            "admins": int(total_admins),
            "total": int(total_students + total_trainers + total_admins)
        },
        "content": {
            "courses": int(total_courses),
            "training_plans": int(total_training_plans),
            "challenges": int(total_challenges)
        },
        "engagement": {
            "total_submissions": int(total_submissions),
            "completed": int(completed_submissions),
            "completion_rate": round(completion_rate, 1)
        }
    }


@router.get("/courses/featured")
async def get_featured_courses(db: Session = Depends(get_db), limit: int = 4):
    """Retorna os cursos mais populares"""
    
    courses = db.query(
        Course.id,
        Course.title,
        Course.description,
        func.count(ChallengeSubmission.id).label('submissions')
    ).outerjoin(
        Challenge, Course.id == Challenge.course_id
    ).outerjoin(
        ChallengeSubmission, Challenge.id == ChallengeSubmission.challenge_id
    ).group_by(
        Course.id,
        Course.title,
        Course.description
    ).order_by(
        func.count(ChallengeSubmission.id).desc()
    ).limit(limit).all()
    
    return [
        {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "submissions": course.submissions
        }
        for course in courses
    ]


@router.get("/training-plans/featured")
async def get_featured_training_plans(db: Session = Depends(get_db), limit: int = 4):
    """Retorna os planos de treinamento mais populares"""
    
    plans = db.query(
        TrainingPlan.id,
        TrainingPlan.title,
        TrainingPlan.description,
        func.count(TrainingPlanAssignment.id).label('enrolled_users')
    ).outerjoin(
        TrainingPlanAssignment, TrainingPlan.id == TrainingPlanAssignment.training_plan_id
    ).group_by(
        TrainingPlan.id,
        TrainingPlan.title,
        TrainingPlan.description
    ).order_by(
        TrainingPlan.created_at.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "enrolled_users": plan.enrolled_users
        }
        for plan in plans
    ]
