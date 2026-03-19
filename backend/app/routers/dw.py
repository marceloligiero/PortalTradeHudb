"""Data Warehouse API — endpoints that serve pre-aggregated DW data for dashboards."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app import auth
from app.auth import get_current_active_user, require_role
from app.etl.etl_runner import run_full_etl

router = APIRouter()

# ---------- helpers ----------

def _build_response(data: list, summary: dict | None = None):
    resp = {"data": data}
    if summary:
        resp["summary"] = summary
    return resp


def _trend(current: float, previous: float) -> dict:
    if previous == 0:
        return {"trend": "+0%", "trend_direction": "neutral"}
    pct = round((current - previous) / previous * 100, 1)
    direction = "up" if pct > 0 else ("down" if pct < 0 else "neutral")
    return {"trend": f"{'+' if pct >= 0 else ''}{pct}%", "trend_direction": direction}


# ---------- ETL trigger ----------

@router.post("/etl/run")
async def trigger_etl(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN"])),
):
    """Run the full ETL pipeline manually (admin only)."""
    try:
        result = run_full_etl(db)
        return {"status": "ok", "result": result}
    except Exception as e:
        import logging
        logging.getLogger("app.dw").error("ETL failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno de processamento ETL")


# ---------- KPIs snapshot ----------

@router.get("/snapshot/latest")
async def snapshot_latest(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
):
    """Latest daily snapshot with trend vs previous day."""
    rows = db.execute(text("""
        SELECT * FROM dw_fact_daily_snapshot
        ORDER BY date_key DESC LIMIT 2
    """)).mappings().all()
    if not rows:
        return _build_response([], {"total": 0})
    latest = dict(rows[0])
    prev = dict(rows[1]) if len(rows) > 1 else {}
    summary = {
        "date_key": latest["date_key"],
        **_trend(latest.get("active_users", 0), prev.get("active_users", 0)),
    }
    return _build_response([latest], summary)


# ---------- Training ----------

@router.get("/training/by-month")
async def training_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    year: int = Query(default=None),
):
    """Certificates issued grouped by month."""
    year_filter = "WHERE `year` = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT * FROM dw_view_training_monthly
        {year_filter}
        ORDER BY `year`, `month`
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/training/by-course")
async def training_by_course(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    limit: int = Query(default=10, le=50),
):
    """Top courses by certificates issued."""
    rows = db.execute(text("""
        SELECT * FROM dw_view_training_by_course
        ORDER BY certificates DESC
        LIMIT :lim
    """), {"lim": limit}).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Tutoria ----------

@router.get("/tutoria/by-category")
async def tutoria_by_category(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
):
    """Tutoring errors grouped by error category."""
    rows = db.execute(text("""
        SELECT * FROM dw_view_tutoria_by_category
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/tutoria/by-month")
async def tutoria_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    year: int = Query(default=None),
):
    year_filter = "WHERE `year` = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT * FROM dw_view_tutoria_monthly
        {year_filter}
        ORDER BY `year`, `month`
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/tutoria/by-trainer")
async def tutoria_by_trainer(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    limit: int = Query(default=10, le=50),
):
    rows = db.execute(text("""
        SELECT * FROM dw_view_tutoria_by_trainer
        ORDER BY total DESC
        LIMIT :lim
    """), {"lim": limit}).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Chamados ----------

@router.get("/chamados/by-status")
async def chamados_by_status(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
):
    rows = db.execute(text("""
        SELECT * FROM dw_view_chamados_by_status
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/chamados/by-month")
async def chamados_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    year: int = Query(default=None),
):
    year_filter = "WHERE `year` = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT * FROM dw_view_chamados_monthly
        {year_filter}
        ORDER BY `year`, `month`
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/chamados/by-type")
async def chamados_by_type(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
):
    rows = db.execute(text("""
        SELECT * FROM dw_view_chamados_by_type
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Internal Errors ----------

@router.get("/internal-errors/by-month")
async def internal_errors_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    year: int = Query(default=None),
):
    year_filter = "WHERE `year` = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT * FROM dw_view_internal_errors_monthly
        {year_filter}
        ORDER BY `year`, `month`
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/internal-errors/by-team")
async def internal_errors_by_team(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
):
    rows = db.execute(text("""
        SELECT * FROM dw_view_internal_errors_by_team
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Trend over time (for line charts) ----------

@router.get("/snapshot/trend")
async def snapshot_trend(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
    days: int = Query(default=30, le=365),
):
    """Daily snapshot trend for the last N days."""
    rows = db.execute(text("""
        SELECT * FROM dw_view_snapshot_with_date
        ORDER BY date_key DESC
        LIMIT :days
    """), {"days": days}).mappings().all()
    data = [dict(r) for r in reversed(rows)]
    return _build_response(data)


# ---------- Teams overview ----------

@router.get("/teams/overview")
async def teams_overview(
    db: Session = Depends(get_db),
    _user=Depends(require_role(auth.ADMIN_MANAGER_ROLES)),
):
    rows = db.execute(text("""
        SELECT * FROM dw_view_teams_overview
        ORDER BY member_count DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])
