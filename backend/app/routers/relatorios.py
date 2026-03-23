"""
Portal de Relatórios — analytics cross-portal filtrados por role.
ADMIN=todos | MANAGER=equipa | TRAINER=tutorados | STUDENT/TRAINEE=próprios
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, text
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.auth import get_current_user, is_trainer_user
from app.models import (
    User, Team,
    TutoriaError, TutoriaActionPlan,
    TrainingPlan, TrainingPlanAssignment,
    ChallengeSubmission, Enrollment, LessonProgress,
    Certificate,
    ErrorImpact, ErrorOrigin, ErrorDetectedBy, Department, Activity,
    Bank, ErrorCategory, Product,
)

router = APIRouter()


# ── Scope helpers ─────────────────────────────────────────────────────────────

def _team_user_ids(user: User, db: Session) -> Optional[list]:
    """Returns list of user IDs in scope, or None for 'all'."""
    if user.role in ("ADMIN", "GESTOR"):
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
    if is_trainer_user(user):
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
    total_teams = db.query(Team).filter(Team.is_active == True).count() if current_user.role in ("ADMIN", "GESTOR") else (
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
    if current_user.role not in ("ADMIN", "MANAGER", "GESTOR"):
        raise HTTPException(status_code=403, detail="Acesso restrito")

    q = db.query(Team).filter(Team.is_active == True)
    if current_user.role == "MANAGER":
        q = q.filter(Team.manager_id == current_user.id)
    teams = q.all()
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
            "team_id": team.id,
            "team_name": team.name,
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
    if current_user.role not in ("ADMIN", "MANAGER", "GESTOR"):
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


# ── Incidents Report ──────────────────────────────────────────────────────────

@router.get("/relatorios/incidents")
def incidents_report(
    # Filters
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    impact_id: Optional[int] = Query(None),
    origin_id: Optional[int] = Query(None),
    bank_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    detected_by_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    product_id: Optional[int] = Query(None),
    recurrence_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns incidents list for the report with optional filters, scoped by role."""
    if current_user.role not in ("ADMIN", "MANAGER", "GESTOR"):
        raise HTTPException(403, "Acesso restrito")

    q = (
        db.query(TutoriaError)
        .options(
            joinedload(TutoriaError.tutorado),
            joinedload(TutoriaError.creator),
            joinedload(TutoriaError.approver),
            joinedload(TutoriaError.bank),
            joinedload(TutoriaError.impact),
            joinedload(TutoriaError.origin),
            joinedload(TutoriaError.detected_by),
            joinedload(TutoriaError.department),
            joinedload(TutoriaError.activity),
            joinedload(TutoriaError.category),
            joinedload(TutoriaError.product),
        )
    )

    # Scope by role
    scope_ids = _team_user_ids(current_user, db)
    if scope_ids is not None:
        q = q.filter(TutoriaError.tutorado_id.in_(scope_ids))

    # Apply filters
    if date_from:
        q = q.filter(TutoriaError.date_occurrence >= date_from)
    if date_to:
        q = q.filter(TutoriaError.date_occurrence <= date_to)
    if impact_id:
        q = q.filter(TutoriaError.impact_id == impact_id)
    if origin_id:
        q = q.filter(TutoriaError.origin_id == origin_id)
    if bank_id:
        q = q.filter(TutoriaError.bank_id == bank_id)
    if department_id:
        q = q.filter(TutoriaError.department_id == department_id)
    if detected_by_id:
        q = q.filter(TutoriaError.detected_by_id == detected_by_id)
    if category_id:
        q = q.filter(TutoriaError.category_id == category_id)
    if product_id:
        q = q.filter(TutoriaError.product_id == product_id)
    if recurrence_type:
        q = q.filter(TutoriaError.recurrence_type == recurrence_type)
    if severity:
        q = q.filter(TutoriaError.severity == severity)

    errors = q.order_by(TutoriaError.date_occurrence.desc()).all()

    def _safe_name(obj):
        return obj.name if obj else None

    return [
        {
            "id": e.id,
            "date_occurrence": str(e.date_occurrence) if e.date_occurrence else None,
            "date_detection": str(e.date_detection) if getattr(e, 'date_detection', None) else None,
            "date_solution": str(e.date_solution) if getattr(e, 'date_solution', None) else None,
            "office": getattr(e, 'office', None),
            "bank_name": _safe_name(getattr(e, 'bank', None)),
            "product_name": _safe_name(getattr(e, 'product', None)),
            "category_name": _safe_name(e.category) if e.category else None,
            "reference_code": getattr(e, 'reference_code', None),
            "final_client": getattr(e, 'final_client', None),
            "amount": getattr(e, 'amount', None),
            "currency": getattr(e, 'currency', None),
            "impact_name": _safe_name(getattr(e, 'impact', None)),
            "origin_name": _safe_name(getattr(e, 'origin', None)),
            "clasificacion": getattr(e, 'clasificacion', None),
            "severity": e.severity,
            "recurrence_type": getattr(e, 'recurrence_type', None),
            "detected_by_name": _safe_name(getattr(e, 'detected_by', None)),
            "department_name": _safe_name(getattr(e, 'department', None)),
            "activity_name": _safe_name(getattr(e, 'activity', None)),
            "description": e.description,
            "solution": getattr(e, 'solution', None),
            "action_plan_text": getattr(e, 'action_plan_text', None),
            "escalado": getattr(e, 'escalado', None),
            "comentarios_reunion": getattr(e, 'comentarios_reunion', None),
            "tutorado_name": e.tutorado.full_name if e.tutorado else None,
            "created_by_name": e.creator.full_name if e.creator else None,
            "approver_name": e.approver.full_name if getattr(e, 'approver', None) else None,
            "status": e.status,
        }
        for e in errors
    ]


@router.get("/relatorios/incidents/filters")
def incidents_filters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns available filter options for the incidents report."""
    if current_user.role not in ("ADMIN", "MANAGER", "GESTOR"):
        raise HTTPException(403, "Acesso restrito")
    return {
        "impacts": [{"id": i.id, "name": i.name} for i in db.query(ErrorImpact).filter(ErrorImpact.is_active == True).all()],
        "origins": [{"id": i.id, "name": i.name} for i in db.query(ErrorOrigin).filter(ErrorOrigin.is_active == True).all()],
        "banks": [{"id": b.id, "name": b.name} for b in db.query(Bank).filter(Bank.is_active == True).all()],
        "departments": [{"id": d.id, "name": d.name} for d in db.query(Department).filter(Department.is_active == True).all()],
        "detected_by": [{"id": d.id, "name": d.name} for d in db.query(ErrorDetectedBy).filter(ErrorDetectedBy.is_active == True).all()],
        "categories": [{"id": c.id, "name": c.name} for c in db.query(ErrorCategory).all()],
        "products": [{"id": p.id, "name": p.name} for p in db.query(Product).filter(Product.is_active == True).all()],
    }


# ── Tutoria Analytics ─────────────────────────────────────────────────────────

@router.get("/relatorios/tutoria/analytics")
def tutoria_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deep analytics for the Tutoria dashboard — 10 dimensions."""
    scope = _team_user_ids(current_user, db)
    if scope is not None and len(scope) == 0:
        return {
            "financial": {"total_amount": 0, "with_amount": 0, "total": 0, "max_amount": 0, "by_severity": []},
            "pending_solution": 0,
            "escalated": 0,
            "by_origin": [],
            "by_impact": [],
            "resolution_time_by_severity": [],
            "monthly": [],
            "action_items": {"total": 0, "completed": 0, "overdue": 0},
            "avg_weights": {"liberador": 0, "gravador": 0, "tutor": 0},
            "recurrence": {"recurrent": 0, "non_recurrent": 0, "by_type": []},
        }

    scope_filter = (
        f"AND te.tutorado_id IN ({','.join(str(i) for i in scope)})"
        if scope is not None else ""
    )

    # 1 — Financial impact
    fin_rows = db.execute(text(f"""
        SELECT
            te.severity,
            COUNT(*) AS cnt,
            COALESCE(SUM(te.amount), 0) AS total_amount,
            COUNT(te.amount) AS with_amount,
            COALESCE(MAX(te.amount), 0) AS max_amount
        FROM tutoria_errors te
        WHERE te.is_active = 1 {scope_filter}
        GROUP BY te.severity
    """)).fetchall()
    total_amount = sum(r.total_amount for r in fin_rows)
    total_with_amount = sum(r.with_amount for r in fin_rows)
    total_count = sum(r.cnt for r in fin_rows)
    max_amount = max((r.max_amount for r in fin_rows), default=0)
    financial = {
        "total_amount": float(total_amount),
        "with_amount": int(total_with_amount),
        "total": int(total_count),
        "max_amount": float(max_amount),
        "by_severity": [
            {"severity": r.severity, "count": r.cnt, "amount": float(r.total_amount)}
            for r in fin_rows
        ],
    }

    # 2 — Pending solution
    pending_solution = db.execute(text(f"""
        SELECT COUNT(*) FROM tutoria_errors te
        WHERE te.is_active = 1 AND te.pending_solution = 1 {scope_filter}
    """)).scalar() or 0

    # 3 — Escalated
    escalated = db.execute(text(f"""
        SELECT COUNT(*) FROM tutoria_errors te
        WHERE te.is_active = 1
          AND te.escalado IS NOT NULL AND te.escalado != '' {scope_filter}
    """)).scalar() or 0

    # 4 — By origin
    origin_rows = db.execute(text(f"""
        SELECT eo.name, COUNT(*) AS cnt
        FROM tutoria_errors te
        LEFT JOIN error_origins eo ON eo.id = te.origin_id
        WHERE te.is_active = 1 {scope_filter}
        GROUP BY eo.name
        ORDER BY cnt DESC
    """)).fetchall()
    by_origin = [{"name": r.name or "N/A", "count": r.cnt} for r in origin_rows]

    # 5 — By impact
    impact_rows = db.execute(text(f"""
        SELECT ei.name, COUNT(*) AS cnt
        FROM tutoria_errors te
        LEFT JOIN error_impacts ei ON ei.id = te.impact_id
        WHERE te.is_active = 1 {scope_filter}
        GROUP BY ei.name
        ORDER BY cnt DESC
    """)).fetchall()
    by_impact = [{"name": r.name or "N/A", "count": r.cnt} for r in impact_rows]

    # 6 — Resolution time by severity
    res_rows = db.execute(text(f"""
        SELECT te.severity,
               AVG(DATEDIFF(te.date_solution, te.date_occurrence)) AS avg_days,
               MIN(DATEDIFF(te.date_solution, te.date_occurrence)) AS min_days,
               MAX(DATEDIFF(te.date_solution, te.date_occurrence)) AS max_days
        FROM tutoria_errors te
        WHERE te.is_active = 1
          AND te.date_solution IS NOT NULL
          AND te.date_occurrence IS NOT NULL {scope_filter}
        GROUP BY te.severity
    """)).fetchall()
    resolution_time_by_severity = [
        {
            "severity": r.severity,
            "avg_days": round(float(r.avg_days), 1) if r.avg_days else 0,
            "min_days": int(r.min_days) if r.min_days else 0,
            "max_days": int(r.max_days) if r.max_days else 0,
        }
        for r in res_rows
    ]

    # 7 — Monthly distribution (last 12 months)
    monthly_rows = db.execute(text(f"""
        SELECT YEAR(te.date_occurrence) AS yr, MONTH(te.date_occurrence) AS mo, COUNT(*) AS cnt,
               SUM(CASE WHEN te.status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END) AS resolved,
               COALESCE(SUM(te.amount), 0) AS amount
        FROM tutoria_errors te
        WHERE te.is_active = 1
          AND te.date_occurrence >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) {scope_filter}
        GROUP BY yr, mo
        ORDER BY yr, mo
    """)).fetchall()
    monthly = [
        {"year": r.yr, "month": r.mo, "count": r.cnt, "resolved": r.resolved, "amount": float(r.amount)}
        for r in monthly_rows
    ]

    # 8 — Action items summary
    ai_rows = db.execute(text(f"""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN tai.status = 'CONCLUIDO' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN tai.due_date < CURDATE() AND tai.status != 'CONCLUIDO' THEN 1 ELSE 0 END) AS overdue
        FROM tutoria_action_items tai
        JOIN tutoria_action_plans tap ON tap.id = tai.plan_id
        JOIN tutoria_errors te ON te.id = tap.error_id
        WHERE te.is_active = 1 {scope_filter}
    """)).fetchone()
    action_items = {
        "total": int(ai_rows.total or 0),
        "completed": int(ai_rows.completed or 0),
        "overdue": int(ai_rows.overdue or 0),
    }

    # 9 — Average weights
    wt_row = db.execute(text(f"""
        SELECT
            AVG(te.peso_liberador) AS wl,
            AVG(te.peso_gravador) AS wg,
            AVG(te.peso_tutor) AS wt
        FROM tutoria_errors te
        WHERE te.is_active = 1 {scope_filter}
    """)).fetchone()
    avg_weights = {
        "liberador": round(float(wt_row.wl), 2) if wt_row.wl else 0,
        "gravador": round(float(wt_row.wg), 2) if wt_row.wg else 0,
        "tutor": round(float(wt_row.wt), 2) if wt_row.wt else 0,
    }

    # 10 — Recurrence
    rec_rows = db.execute(text(f"""
        SELECT te.is_recurrent, te.recurrence_type, COUNT(*) AS cnt
        FROM tutoria_errors te
        WHERE te.is_active = 1 {scope_filter}
        GROUP BY te.is_recurrent, te.recurrence_type
    """)).fetchall()
    recurrent = sum(r.cnt for r in rec_rows if r.is_recurrent)
    non_recurrent = sum(r.cnt for r in rec_rows if not r.is_recurrent)
    by_type = [
        {"type": r.recurrence_type or "N/A", "count": r.cnt}
        for r in rec_rows if r.is_recurrent and r.recurrence_type
    ]
    recurrence = {"recurrent": recurrent, "non_recurrent": non_recurrent, "by_type": by_type}

    return {
        "financial": financial,
        "pending_solution": int(pending_solution),
        "escalated": int(escalated),
        "by_origin": by_origin,
        "by_impact": by_impact,
        "resolution_time_by_severity": resolution_time_by_severity,
        "monthly": monthly,
        "action_items": action_items,
        "avg_weights": avg_weights,
        "recurrence": recurrence,
    }
