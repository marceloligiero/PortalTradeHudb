from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, desc
from datetime import datetime, timedelta
from typing import List, Optional
from .. import models
from ..database import get_db
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/student/reports", tags=["student-reports"])


@router.get("/dashboard")
async def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["TRAINEE"]))
):
    """
    Retorna dados completos do dashboard de relatórios do formando
    """
    user_id = current_user.id
    
    # 1. RESUMO GERAL
    # Planos atribuídos (via student_id no TrainingPlan ou via TrainingPlanAssignment)
    plans_direct = db.query(
        func.count(models.TrainingPlan.id).label('total'),
        func.sum(case((models.TrainingPlan.completed_at != None, 1), else_=0)).label('completed')
    ).filter(models.TrainingPlan.student_id == user_id).first()
    
    plans_assigned = db.query(
        func.count(models.TrainingPlanAssignment.id).label('total'),
        func.sum(case((models.TrainingPlanAssignment.completed_at != None, 1), else_=0)).label('completed')
    ).filter(models.TrainingPlanAssignment.user_id == user_id).first()
    
    total_plans = (plans_direct.total or 0) + (plans_assigned.total or 0)
    completed_plans = int(plans_direct.completed or 0) + int(plans_assigned.completed or 0)
    
    # Certificados
    certificates_count = db.query(func.count(models.Certificate.id)).filter(
        models.Certificate.user_id == user_id
    ).scalar() or 0
    
    # 2. ESTATÍSTICAS DE DESAFIOS
    challenge_stats = db.query(
        func.count(models.ChallengeSubmission.id).label('total'),
        func.sum(case((models.ChallengeSubmission.is_approved == True, 1), else_=0)).label('approved'),
        func.sum(case((models.ChallengeSubmission.is_approved == False, 1), else_=0)).label('rejected'),
        func.avg(models.ChallengeSubmission.calculated_mpu).label('avg_mpu'),
        func.sum(models.ChallengeSubmission.errors_count).label('total_errors'),
        func.sum(models.ChallengeSubmission.total_operations).label('total_operations'),
        func.sum(models.ChallengeSubmission.error_methodology).label('errors_methodology'),
        func.sum(models.ChallengeSubmission.error_knowledge).label('errors_knowledge'),
        func.sum(models.ChallengeSubmission.error_detail).label('errors_detail'),
        func.sum(models.ChallengeSubmission.error_procedure).label('errors_procedure'),
    ).filter(
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.status.in_(['REVIEWED', 'APPROVED', 'REJECTED'])
    ).first()
    
    total_submissions = challenge_stats.total or 0
    approved_submissions = int(challenge_stats.approved or 0)
    rejected_submissions = int(challenge_stats.rejected or 0)
    avg_mpu = float(challenge_stats.avg_mpu or 0)
    total_errors = int(challenge_stats.total_errors or 0)
    total_operations = int(challenge_stats.total_operations or 0)
    
    # Taxa de aprovação
    approval_rate = (approved_submissions / total_submissions * 100) if total_submissions > 0 else 0
    
    # Erros por tipo
    errors_by_type = {
        'methodology': int(challenge_stats.errors_methodology or 0),
        'knowledge': int(challenge_stats.errors_knowledge or 0),
        'detail': int(challenge_stats.errors_detail or 0),
        'procedure': int(challenge_stats.errors_procedure or 0),
    }
    
    # 3. EVOLUÇÃO TEMPORAL (últimos 30 dias)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    daily_stats = db.query(
        func.date(models.ChallengeSubmission.completed_at).label('date'),
        func.count(models.ChallengeSubmission.id).label('submissions'),
        func.sum(case((models.ChallengeSubmission.is_approved == True, 1), else_=0)).label('approved'),
        func.avg(models.ChallengeSubmission.calculated_mpu).label('avg_mpu'),
    ).filter(
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.completed_at >= thirty_days_ago,
        models.ChallengeSubmission.completed_at != None
    ).group_by(
        func.date(models.ChallengeSubmission.completed_at)
    ).order_by(
        func.date(models.ChallengeSubmission.completed_at)
    ).all()
    
    evolution = [
        {
            'date': str(stat.date),
            'submissions': stat.submissions,
            'approved': int(stat.approved or 0),
            'avg_mpu': round(float(stat.avg_mpu or 0), 2)
        }
        for stat in daily_stats
    ]
    
    # 4. PERFORMANCE POR DESAFIO
    challenge_performance = db.query(
        models.Challenge.id,
        models.Challenge.title,
        models.Challenge.target_mpu,
        func.count(models.ChallengeSubmission.id).label('attempts'),
        func.sum(case((models.ChallengeSubmission.is_approved == True, 1), else_=0)).label('approvals'),
        func.avg(models.ChallengeSubmission.calculated_mpu).label('avg_mpu'),
        func.min(models.ChallengeSubmission.calculated_mpu).label('best_mpu'),
    ).join(
        models.ChallengeSubmission, models.Challenge.id == models.ChallengeSubmission.challenge_id
    ).filter(
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.status.in_(['REVIEWED', 'APPROVED', 'REJECTED'])
    ).group_by(
        models.Challenge.id, models.Challenge.title, models.Challenge.target_mpu
    ).all()
    
    challenges = [
        {
            'id': cp.id,
            'title': cp.title,
            'target_mpu': float(cp.target_mpu or 0),
            'attempts': cp.attempts,
            'approvals': int(cp.approvals or 0),
            'approval_rate': round((int(cp.approvals or 0) / cp.attempts * 100) if cp.attempts > 0 else 0, 1),
            'avg_mpu': round(float(cp.avg_mpu or 0), 2),
            'best_mpu': round(float(cp.best_mpu or 0), 2),
        }
        for cp in challenge_performance
    ]
    
    # 5. AULAS COMPLETADAS
    lessons_stats = db.query(
        func.count(models.LessonProgress.id).label('total'),
        func.sum(case((models.LessonProgress.status == 'COMPLETED', 1), else_=0)).label('completed'),
        func.sum(case((models.LessonProgress.is_approved == True, 1), else_=0)).label('approved'),
    ).filter(
        models.LessonProgress.user_id == user_id
    ).first()
    
    total_lessons = lessons_stats.total or 0
    completed_lessons = int(lessons_stats.completed or 0)
    approved_lessons = int(lessons_stats.approved or 0)
    
    # Calcular tempo médio das lições (usando completed_at - started_at quando actual_time_minutes for nulo)
    completed_lesson_records = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == user_id,
        models.LessonProgress.status == 'COMPLETED',
        models.LessonProgress.completed_at != None,
        models.LessonProgress.started_at != None
    ).all()
    
    total_time_minutes = 0
    count_with_time = 0
    for lp in completed_lesson_records:
        if lp.actual_time_minutes and lp.actual_time_minutes > 0:
            total_time_minutes += lp.actual_time_minutes
            count_with_time += 1
        elif lp.completed_at and lp.started_at:
            diff = (lp.completed_at - lp.started_at).total_seconds() / 60
            if diff > 0:
                total_time_minutes += diff
                count_with_time += 1
    
    avg_lesson_time = round(total_time_minutes / count_with_time, 1) if count_with_time > 0 else 0
    
    # 6. ÚLTIMAS ATIVIDADES
    recent_submissions = db.query(
        models.ChallengeSubmission,
        models.Challenge.title.label('challenge_title')
    ).join(
        models.Challenge, models.ChallengeSubmission.challenge_id == models.Challenge.id
    ).filter(
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.completed_at != None
    ).order_by(
        desc(models.ChallengeSubmission.completed_at)
    ).limit(10).all()
    
    recent_activity = [
        {
            'id': sub.ChallengeSubmission.id,
            'challenge_title': sub.challenge_title,
            'is_approved': sub.ChallengeSubmission.is_approved,
            'calculated_mpu': float(sub.ChallengeSubmission.calculated_mpu or 0),
            'errors_count': sub.ChallengeSubmission.errors_count or 0,
            'completed_at': sub.ChallengeSubmission.completed_at.isoformat() if sub.ChallengeSubmission.completed_at else None,
        }
        for sub in recent_submissions
    ]
    
    # 7. MELHOR PERFORMANCE
    best_submission = db.query(
        models.ChallengeSubmission,
        models.Challenge.title.label('challenge_title')
    ).join(
        models.Challenge, models.ChallengeSubmission.challenge_id == models.Challenge.id
    ).filter(
        models.ChallengeSubmission.user_id == user_id,
        models.ChallengeSubmission.is_approved == True
    ).order_by(
        models.ChallengeSubmission.calculated_mpu.asc()  # Menor MPU é melhor
    ).first()
    
    best_performance = None
    if best_submission:
        best_performance = {
            'challenge_title': best_submission.challenge_title,
            'mpu': float(best_submission.ChallengeSubmission.calculated_mpu or 0),
            'date': best_submission.ChallengeSubmission.completed_at.isoformat() if best_submission.ChallengeSubmission.completed_at else None,
        }
    
    return {
        'summary': {
            'total_plans': total_plans,
            'completed_plans': completed_plans,
            'certificates': certificates_count,
            'total_submissions': total_submissions,
            'approved_submissions': approved_submissions,
            'rejected_submissions': rejected_submissions,
            'approval_rate': round(approval_rate, 1),
            'avg_mpu': round(avg_mpu, 2),
            'total_errors': total_errors,
            'total_operations': total_operations,
            'total_lessons': total_lessons,
            'completed_lessons': completed_lessons,
            'approved_lessons': approved_lessons,
            'avg_lesson_time': round(avg_lesson_time, 1),
        },
        'errors_by_type': errors_by_type,
        'evolution': evolution,
        'challenges': challenges,
        'recent_activity': recent_activity,
        'best_performance': best_performance,
    }
