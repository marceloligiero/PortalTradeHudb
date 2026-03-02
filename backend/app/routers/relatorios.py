"""
Portal de Relatórios — analytics cross-portal filtrados por role.
ADMIN=todos | MANAGER=equipa | TRAINER=tutorados | STUDENT/TRAINEE=próprios
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Team,
    TutoriaError, TutoriaActionPlan,
    TrainingPlan, TrainingPlanAssignment,
    ChallengeSubmission, Enrollment, LessonProgress,
    Certificate,
)

router = APIRouter()


# ── Scope helpers ─────────────────────────────────────────────────────────────

def _team_user_ids(user: User, db: Session) -> Optional[list]:
    """Returns list of user IDs in scope, or None for 'all'."""
    if user.role == "ADMIN":
        return None  # no filter
    if user.role == "MANAGER":
        # manager's team members
        if not user.team_id:
            # find team where manager_id = user.id
            team = db.query(Team).filter(Team.manager_id == user.id).first()
            if not team:
                return []
        else:
            team = db.query(Team).filter(Team.id == user.team_id).first()
        if not team:
            return []
        ids = [m.id for m in db.query(User).filter(User.team_id == team.id).all()]
        ids.append(team.manager_id or user.id)
        return ids
    if user.role == "TRAINER":
        # trainer's students (via tutor_id)
        students = db.query(User).filter(User.tutor_id == user.id).all()
        return [s.id for s in students] + [user.id]
    # STUDENT / TRAINEE
    return [user.id]


def _filter_users(q, model_col, scope_ids):
    if scope_ids is not None:
        return q.filter(model_col.in_(scope_ids))
    return q


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/relatorios/overview")
def overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = _team_user_ids(current_user, db)

    # Users in scope
    uq = db.query(User).filter(User.is_active == True)
    if scope is not None:
        uq = uq.filter(User.id.in_(scope))
    total_users = uq.count()

    # Teams
    total_teams = db.query(Team).filter(Team.is_active == True).count() if current_user.role == "ADMIN" else (
        1 if current_user.role == "MANAGER" else 0
    )

    # Formações: training plans
    pq = db.query(TrainingPlan)
    if scope is not None:
        pq = pq.filter(TrainingPlan.student_id.in_(scope))
    total_plans = pq.count()
    active_plans = pq.filter(TrainingPlan.status == "IN_PROGRESS").count()

    # Tutoria: erros
    eq = db.query(TutoriaError).filter(TutoriaError.is_active == True)
    if scope is not None:
        eq = eq.filter(TutoriaError.tutorado_id.in_(scope))
    total_errors = eq.count()
    critical_errors = eq.filter(TutoriaError.severity == "CRITICA").count()

    # Tutoria: planos de ação pendentes
    aq = db.query(TutoriaActionPlan).filter(
        TutoriaActionPlan.status.in_(["RASCUNHO", "AGUARDANDO_APROVACAO", "DEVOLVIDO"])
    )
    if scope is not None:
        aq = aq.filter(TutoriaActionPlan.tutorado_id.in_(scope))
    pending_action_plans = aq.count()

    # Certificados
    cq = db.query(Certificate)
    if scope is not None:
        cq = cq.filter(Certificate.user_id.in_(scope))
    total_certificates = cq.count()

    # Avg MPU from challenge submissions
    mpu_q = db.query(func.avg(ChallengeSubmission.calculated_mpu)).filter(
        ChallengeSubmission.is_approved == True,
        ChallengeSubmission.calculated_mpu != None,
    )
    if scope is not None:
        mpu_q = mpu_q.filter(ChallengeSubmission.user_id.in_(scope))
    avg_mpu = round(float(mpu_q.scalar() or 0), 2)

    return {
        "total_users": total_users,
        "total_teams": total_teams,
        "total_plans": total_plans,
        "active_plans": active_plans,
        "total_errors": total_errors,
        "critical_errors": critical_errors,
        "pending_action_plans": pending_action_plans,
        "total_certificates": total_certificates,
        "avg_mpu": avg_mpu,
    }


@router.get("/relatorios/formacoes")
def formacoes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = _team_user_ids(current_user, db)

    # Enrollments
    enq = db.query(Enrollment)
    if scope is not None:
        enq = enq.filter(Enrollment.user_id.in_(scope))
    total_enrollments = enq.count()
    completed_enrollments = enq.filter(Enrollment.completed_at != None).count()

    # Training plans
    pq = db.query(TrainingPlan)
    if scope is not None:
        pq = pq.filter(TrainingPlan.student_id.in_(scope))
    plan_status = {}
    for status in ["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"]:
        plan_status[status] = pq.filter(TrainingPlan.status == status).count()

    # Challenge submissions
    sq = db.query(ChallengeSubmission)
    if scope is not None:
        sq = sq.filter(ChallengeSubmission.user_id.in_(scope))
    total_submissions = sq.count()
    approved_submissions = sq.filter(ChallengeSubmission.is_approved == True).count()
    approval_rate = round(approved_submissions / total_submissions * 100, 1) if total_submissions else 0

    avg_mpu = round(float(
        db.query(func.avg(ChallengeSubmission.calculated_mpu))
        .filter(ChallengeSubmission.is_approved == True, ChallengeSubmission.calculated_mpu != None,
                *([ChallengeSubmission.user_id.in_(scope)] if scope is not None else []))
        .scalar() or 0
    ), 2)

    # Lesson progress hours
    lq = db.query(func.sum(LessonProgress.actual_time_minutes))
    if scope is not None:
        lq = lq.filter(LessonProgress.user_id.in_(scope))
    total_minutes = float(lq.scalar() or 0)
    total_hours = round(total_minutes / 60, 1)

    # Certificates
    cq = db.query(Certificate)
    if scope is not None:
        cq = cq.filter(Certificate.user_id.in_(scope))
    total_certificates = cq.count()

    # Error breakdown from challenge submissions
    err_types = ["error_methodology", "error_knowledge", "error_detail", "error_procedure"]
    error_breakdown = {}
    for col_name in err_types:
        col = getattr(ChallengeSubmission, col_name)
        val = db.query(func.sum(col)).filter(
            *([ChallengeSubmission.user_id.in_(scope)] if scope is not None else [])
        ).scalar()
        error_breakdown[col_name.replace("error_", "")] = int(val or 0)

    return {
        "total_enrollments": total_enrollments,
        "completed_enrollments": completed_enrollments,
        "completion_rate": round(completed_enrollments / total_enrollments * 100, 1) if total_enrollments else 0,
        "plan_status": plan_status,
        "total_submissions": total_submissions,
        "approved_submissions": approved_submissions,
        "approval_rate": approval_rate,
        "avg_mpu": avg_mpu,
        "total_study_hours": total_hours,
        "total_certificates": total_certificates,
        "error_breakdown": error_breakdown,
    }


@router.get("/relatorios/tutoria")
def tutoria_relatorio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = _team_user_ids(current_user, db)

    eq = db.query(TutoriaError).filter(TutoriaError.is_active == True)
    if scope is not None:
        eq = eq.filter(TutoriaError.tutorado_id.in_(scope))

    total_errors = eq.count()
    recurrent = eq.filter(TutoriaError.is_recurrent == True).count()
    resolved = eq.filter(TutoriaError.status.in_(["CONCLUIDO", "VERIFICADO"])).count()

    by_severity = {}
    for sev in ["BAIXA", "MEDIA", "ALTA", "CRITICA"]:
        by_severity[sev] = eq.filter(TutoriaError.severity == sev).count()

    by_status = {}
    for st in ["ABERTO", "EM_ANALISE", "PLANO_CRIADO", "EM_EXECUCAO", "CONCLUIDO", "VERIFICADO"]:
        by_status[st] = eq.filter(TutoriaError.status == st).count()

    # Plans
    pq = db.query(TutoriaActionPlan)
    if scope is not None:
        pq = pq.filter(TutoriaActionPlan.tutorado_id.in_(scope))
    plans_by_status = {}
    for st in ["RASCUNHO", "AGUARDANDO_APROVACAO", "APROVADO", "EM_EXECUCAO", "CONCLUIDO", "DEVOLVIDO"]:
        plans_by_status[st] = pq.filter(TutoriaActionPlan.status == st).count()

    return {
        "total_errors": total_errors,
        "recurrent_errors": recurrent,
        "recurrent_rate": round(recurrent / total_errors * 100, 1) if total_errors else 0,
        "resolved_errors": resolved,
        "resolved_rate": round(resolved / total_errors * 100, 1) if total_errors else 0,
        "by_severity": by_severity,
        "by_status": by_status,
        "plans_by_status": plans_by_status,
    }


@router.get("/relatorios/teams")
def teams_relatorio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Apenas administradores")

    teams = db.query(Team).filter(Team.is_active == True).all()
    result = []
    for team in teams:
        member_ids = [m.id for m in db.query(User).filter(User.team_id == team.id).all()]
        members_count = len(member_ids)

        errors_count = db.query(TutoriaError).filter(
            TutoriaError.tutorado_id.in_(member_ids), TutoriaError.is_active == True
        ).count() if member_ids else 0

        plans_completed = db.query(TrainingPlan).filter(
            TrainingPlan.student_id.in_(member_ids), TrainingPlan.status == "COMPLETED"
        ).count() if member_ids else 0

        plans_total = db.query(TrainingPlan).filter(
            TrainingPlan.student_id.in_(member_ids)
        ).count() if member_ids else 0

        avg_mpu = float(db.query(func.avg(ChallengeSubmission.calculated_mpu)).filter(
            ChallengeSubmission.user_id.in_(member_ids),
            ChallengeSubmission.is_approved == True,
            ChallengeSubmission.calculated_mpu != None,
        ).scalar() or 0) if member_ids else 0

        result.append({
            "id": team.id,
            "name": team.name,
            "product_name": team.product.name if team.product else None,
            "manager_name": team.manager.full_name if team.manager else None,
            "members_count": members_count,
            "errors_count": errors_count,
            "plans_total": plans_total,
            "plans_completed": plans_completed,
            "completion_rate": round(plans_completed / plans_total * 100, 1) if plans_total else 0,
            "avg_mpu": round(avg_mpu, 2),
        })

    return result


@router.get("/relatorios/members")
def members_relatorio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("ADMIN", "MANAGER"):
        raise HTTPException(status_code=403, detail="Acesso restrito")

    scope = _team_user_ids(current_user, db)
    if not scope:
        return []

    users = db.query(User).filter(User.id.in_(scope), User.is_active == True).all()
    result = []
    for u in users:
        errors_count = db.query(TutoriaError).filter(
            TutoriaError.tutorado_id == u.id, TutoriaError.is_active == True
        ).count()
        plans_total = db.query(TrainingPlan).filter(TrainingPlan.student_id == u.id).count()
        plans_done = db.query(TrainingPlan).filter(
            TrainingPlan.student_id == u.id, TrainingPlan.status == "COMPLETED"
        ).count()
        avg_mpu = float(db.query(func.avg(ChallengeSubmission.calculated_mpu)).filter(
            ChallengeSubmission.user_id == u.id,
            ChallengeSubmission.is_approved == True,
            ChallengeSubmission.calculated_mpu != None,
        ).scalar() or 0)
        certs = db.query(Certificate).filter(Certificate.user_id == u.id).count()

        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "errors_count": errors_count,
            "plans_total": plans_total,
            "plans_completed": plans_done,
            "completion_rate": round(plans_done / plans_total * 100, 1) if plans_total else 0,
            "avg_mpu": round(avg_mpu, 2),
            "certificates": certs,
        })

    return sorted(result, key=lambda x: x["full_name"])
