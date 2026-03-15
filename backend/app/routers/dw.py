"""Data Warehouse API — endpoints that serve pre-aggregated DW data for dashboards."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
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
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
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
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    year: int = Query(default=None),
):
    """Certificates issued grouped by month for Recharts."""
    year_filter = "AND dd.year = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT dd.year, dd.month, dd.month_name_short,
               COUNT(*) AS certificates,
               ROUND(AVG(ft.total_hours), 1) AS avg_hours,
               ROUND(AVG(ft.average_mpu), 1) AS avg_mpu
        FROM dw_fact_training ft
        JOIN dw_dim_date dd ON dd.date_key = ft.date_key
        WHERE 1=1 {year_filter}
        GROUP BY dd.year, dd.month, dd.month_name_short
        ORDER BY dd.year, dd.month
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/training/by-course")
async def training_by_course(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    limit: int = Query(default=10, le=50),
):
    """Top courses by certificates issued."""
    rows = db.execute(text("""
        SELECT dc.course_name, dc.course_code,
               COUNT(*) AS certificates,
               ROUND(AVG(ft.average_approval_rate), 1) AS avg_approval
        FROM dw_fact_training ft
        JOIN dw_dim_course dc ON dc.course_key = ft.course_key
        GROUP BY dc.course_key, dc.course_name, dc.course_code
        ORDER BY certificates DESC
        LIMIT :lim
    """), {"lim": limit}).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Tutoria ----------

@router.get("/tutoria/by-category")
async def tutoria_by_category(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
):
    """Tutoring errors grouped by error category."""
    rows = db.execute(text("""
        SELECT dec2.category_name,
               COUNT(*) AS total,
               SUM(ft.is_resolved) AS resolved,
               ROUND(AVG(ft.days_to_resolve), 1) AS avg_days
        FROM dw_fact_tutoria ft
        JOIN dw_dim_error_category dec2 ON dec2.category_key = ft.category_key
        GROUP BY dec2.category_key, dec2.category_name
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/tutoria/by-month")
async def tutoria_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    year: int = Query(default=None),
):
    year_filter = "AND dd.year = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT dd.year, dd.month, dd.month_name_short,
               COUNT(*) AS total,
               SUM(ft.is_resolved) AS resolved,
               ROUND(AVG(ft.days_to_resolve), 1) AS avg_days
        FROM dw_fact_tutoria ft
        JOIN dw_dim_date dd ON dd.date_key = ft.date_key
        WHERE 1=1 {year_filter}
        GROUP BY dd.year, dd.month, dd.month_name_short
        ORDER BY dd.year, dd.month
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/tutoria/by-trainer")
async def tutoria_by_trainer(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    limit: int = Query(default=10, le=50),
):
    rows = db.execute(text("""
        SELECT du.full_name AS trainer_name, du.team_name,
               COUNT(*) AS total,
               SUM(ft.is_resolved) AS resolved,
               ROUND(AVG(ft.days_to_resolve), 1) AS avg_days
        FROM dw_fact_tutoria ft
        JOIN dw_dim_user du ON du.user_key = ft.trainer_key
        GROUP BY du.user_key, du.full_name, du.team_name
        ORDER BY total DESC
        LIMIT :lim
    """), {"lim": limit}).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Chamados ----------

@router.get("/chamados/by-status")
async def chamados_by_status(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
):
    rows = db.execute(text("""
        SELECT ds.status_label, ds.status_code,
               COUNT(*) AS total,
               ROUND(AVG(fc.days_to_resolve), 1) AS avg_days
        FROM dw_fact_chamados fc
        JOIN dw_dim_status ds ON ds.status_key = fc.status_key
        GROUP BY ds.status_key, ds.status_label, ds.status_code
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/chamados/by-month")
async def chamados_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    year: int = Query(default=None),
):
    year_filter = "AND dd.year = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT dd.year, dd.month, dd.month_name_short,
               COUNT(*) AS total,
               SUM(fc.is_resolved) AS resolved,
               ROUND(AVG(fc.days_to_resolve), 1) AS avg_days
        FROM dw_fact_chamados fc
        JOIN dw_dim_date dd ON dd.date_key = fc.date_key
        WHERE 1=1 {year_filter}
        GROUP BY dd.year, dd.month, dd.month_name_short
        ORDER BY dd.year, dd.month
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/chamados/by-type")
async def chamados_by_type(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
):
    rows = db.execute(text("""
        SELECT fc.type, fc.priority,
               COUNT(*) AS total,
               SUM(fc.is_resolved) AS resolved
        FROM dw_fact_chamados fc
        GROUP BY fc.type, fc.priority
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Internal Errors ----------

@router.get("/internal-errors/by-month")
async def internal_errors_by_month(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    year: int = Query(default=None),
):
    year_filter = "AND dd.year = :year" if year else ""
    params = {"year": year} if year else {}
    rows = db.execute(text(f"""
        SELECT dd.year, dd.month, dd.month_name_short,
               COUNT(*) AS total,
               SUM(fie.has_learning_sheet) AS with_learning_sheet,
               SUM(fie.has_action_plan) AS with_action_plan
        FROM dw_fact_internal_errors fie
        JOIN dw_dim_date dd ON dd.date_key = fie.date_key
        WHERE 1=1 {year_filter}
        GROUP BY dd.year, dd.month, dd.month_name_short
        ORDER BY dd.year, dd.month
    """), params).mappings().all()
    return _build_response([dict(r) for r in rows])


@router.get("/internal-errors/by-team")
async def internal_errors_by_team(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
):
    rows = db.execute(text("""
        SELECT dt.team_name,
               COUNT(*) AS total,
               SUM(fie.has_learning_sheet) AS with_learning_sheet
        FROM dw_fact_internal_errors fie
        JOIN dw_dim_user du ON du.user_key = fie.reporter_key
        JOIN dw_dim_team dt ON dt.team_name = du.team_name
        GROUP BY dt.team_name
        ORDER BY total DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])


# ---------- Trend over time (for line charts) ----------

@router.get("/snapshot/trend")
async def snapshot_trend(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
    days: int = Query(default=30, le=365),
):
    """Daily snapshot trend for the last N days."""
    rows = db.execute(text("""
        SELECT s.*, dd.full_date
        FROM dw_fact_daily_snapshot s
        JOIN dw_dim_date dd ON dd.date_key = s.date_key
        ORDER BY s.date_key DESC
        LIMIT :days
    """), {"days": days}).mappings().all()
    data = [dict(r) for r in reversed(rows)]
    return _build_response(data)


# ---------- Teams overview ----------

@router.get("/teams/overview")
async def teams_overview(
    db: Session = Depends(get_db),
    _user=Depends(require_role(["ADMIN", "MANAGER"])),
):
    rows = db.execute(text("""
        SELECT dt.team_name, dt.manager_name, dt.member_count,
               (SELECT COUNT(*) FROM dw_fact_tutoria ft
                JOIN dw_dim_user du ON du.user_key = ft.student_key
                WHERE du.team_name = dt.team_name) AS tutoria_errors,
               (SELECT COUNT(*) FROM dw_fact_internal_errors fie
                JOIN dw_dim_user du ON du.user_key = fie.reporter_key
                WHERE du.team_name = dt.team_name) AS internal_errors
        FROM dw_dim_team dt
        ORDER BY dt.member_count DESC
    """)).mappings().all()
    return _build_response([dict(r) for r in rows])
