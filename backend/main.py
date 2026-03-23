from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routes import auth, admin, student, trainer, training_plans, advanced_reports, certificates, student_reports, ratings, password_reset, knowledge_matrix, public
from app.routers import challenges, stats, lessons, finalization
from app.routers import tutoria
from app.routers import chat
from app.routers import teams
from app.routers import relatorios
from app.routers import chamados
from app.routers import internal_errors
from app.routers import dw
from app.routers import feedback
from app.routers import org_hierarchy
from app.database import init_db
from app.migrate import run_migrations
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger("app.startup")

# Rate limiter (shared instance used by route modules)
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

async def _etl_scheduler():
    """Background task that re-runs ETL every hour."""
    import asyncio
    while True:
        await asyncio.sleep(3600)
        try:
            from app.database import SessionLocal
            from app.etl.etl_runner import run_full_etl
            db = SessionLocal()
            try:
                run_full_etl(db)
                logger.info("Scheduled ETL completed.")
            finally:
                db.close()
        except Exception as e:
            logger.warning("Scheduled ETL failed (non-fatal): %s", e)


async def _deadline_scheduler():
    """Daily task: notify responsible parties about overdue errors (A.6.1)."""
    import asyncio
    from datetime import date
    while True:
        await asyncio.sleep(86400)  # 24 hours
        try:
            from app.database import SessionLocal
            from app.models import TutoriaError, TutoriaNotification
            from app.routers.tutoria import _get_error_deadline, create_notification
            db = SessionLocal()
            try:
                today = date.today()
                errors = db.query(TutoriaError).filter(
                    TutoriaError.status.notin_(['RESOLVED', 'CANCELLED'])
                ).all()
                count = 0
                for e in errors:
                    dl = _get_error_deadline(e.date_occurrence)
                    if dl and today > dl:
                        # Check if notification already sent today
                        existing = db.query(TutoriaNotification).filter(
                            TutoriaNotification.error_id == e.id,
                            TutoriaNotification.ntype == 'OVERDUE_ALERT',
                        ).first()
                        if not existing and e.responsible_id:
                            create_notification(db, e.responsible_id, 'OVERDUE_ALERT',
                                f'Erro #{e.id} ultrapassou o prazo de fecho mensal.', error_id=e.id)
                            count += 1
                logger.info("Deadline check: %d overdue notifications sent.", count)
            finally:
                db.close()
        except Exception as exc:
            logger.warning("Deadline scheduler failed (non-fatal): %s", exc)


@asynccontextmanager
async def lifespan(app):
    import asyncio
    init_db()
    # Run pending SQL migrations automatically
    try:
        count = run_migrations()
        if count > 0:
            logger.info("Applied %d pending migration(s).", count)
    except Exception as e:
        logger.error("Migration failed: %s", e)

    # Run ETL on startup (populates DW tables after migrations)
    try:
        from app.database import SessionLocal
        from app.etl.etl_runner import run_full_etl
        db = SessionLocal()
        try:
            result = run_full_etl(db)
            logger.info("ETL initial run completed: %s", result)
        finally:
            db.close()
    except Exception as e:
        logger.warning("ETL startup run failed (non-fatal): %s", e)

    # Start hourly ETL scheduler
    scheduler_task = asyncio.create_task(_etl_scheduler())
    # Start daily deadline enforcement scheduler (A.6.1)
    deadline_task = asyncio.create_task(_deadline_scheduler())

    yield

    # Cleanup
    scheduler_task.cancel()
    deadline_task.cancel()

app = FastAPI(
    title="Trade Data Hub API",
    version="1.0.0",
    lifespan=lifespan,
    # Swagger/OpenAPI apenas em desenvolvimento (H02)
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
def get_allowed_origins_and_regex():
    """Return a tuple (origins_list, origin_regex) where origins_list is
    the explicit allow_origins list parsed from settings and origin_regex
    is a regex string that matches dynamic tunnel domains (trycloudflare,
    loca.lt) and local IP ranges. We prefer explicit origins when set,
    but also provide a permissive regex to accept ephemeral cloudflared
    or localtunnel subdomains commonly used in demos.
    """
    origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

    # Build a conservative regex that matches the typical dynamic tunnels
    # and local addresses. This allows patterns like <subdomain>.trycloudflare.com
    # and <subdomain>.loca.lt as well as local IP addresses and localhost.
    # Only allow localhost and local network IPs (no third-party tunnel domains)
    regex_parts = [
        r"^https?://localhost(:\d+)?$",
        r"^https?://127\.0\.0\.1(:\d+)?$",
        r"^https?://192\.168\.\d+\.\d+(:\d+)?$",
        r"^https?://10\.\d+\.\d+\.\d+(:\d+)?$",
    ]

    allow_origin_regex = "(" + ")|(".join(regex_parts) + ")"

    # If DEBUG and no explicit origins provided, use localhost only (H06 — never use wildcard)
    if not origins:
        return [], allow_origin_regex

    return origins, allow_origin_regex


origins, allow_origin_regex = get_allowed_origins_and_regex()

# If wildcard '*' is present in explicit origins, do not allow credentials
allow_credentials = False if "*" in origins else True

# GZip compression - compresses responses > 500 bytes (critical for 2MB+ JS bundle)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Accept-Language", "X-Requested-With"],
)

# Request logging + exception middleware
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback
import logging

logger = logging.getLogger("app.middleware")

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "object-src 'none'; "
        "frame-ancestors 'none';"
    )
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled exception during request: {e}")
        tb = traceback.format_exc()
        logger.error(tb)
        return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(password_reset.router, prefix="/api", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(trainer.router, prefix="/api/trainer", tags=["trainer"])
# Mount training_plans at /api/training-plans to match frontend expectations
app.include_router(training_plans.router, prefix="/api/training-plans", tags=["training-plans"])
# Mount challenges router (frontend uses /api/challenges)
app.include_router(challenges.router)
# Mount stats router for KPIs
app.include_router(stats.router, tags=["stats"])
# Mount advanced reports router
app.include_router(advanced_reports.router, tags=["advanced_reports"])
# Mount lessons router for pause/resume/start/finish
app.include_router(lessons.router, tags=["lessons"])
# Mount finalization router for course/plan finalization
app.include_router(finalization.router, tags=["finalization"])
# Tutoria (tutoring portal) API
app.include_router(tutoria.router, prefix="/api/tutoria", tags=["tutoria"])
# Feedback dos Liberadores
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
# Internal Errors (sensos, erros internos, fichas de aprendizagem)
app.include_router(internal_errors.router, tags=["internal-errors"])
# Chatbot (rule-based + custom FAQ)
app.include_router(chat.router, prefix="/api", tags=["chat"])
# Teams
app.include_router(teams.router, prefix="/api", tags=["teams"])
# Portal de Relatórios
app.include_router(relatorios.router, prefix="/api", tags=["relatorios"])
# Portal de Chamados (Support Tickets / Kanban)
app.include_router(chamados.router, prefix="/api", tags=["chamados"])
# Mount certificates router for certificate management and PDF download
app.include_router(certificates.router, prefix="/api/certificates", tags=["certificates"])
# Mount student reports router
app.include_router(student_reports.router, tags=["student-reports"])
# Mount ratings router for evaluations
app.include_router(ratings.router, tags=["ratings"])
# Mount knowledge matrix router
app.include_router(knowledge_matrix.router, tags=["knowledge_matrix"])
# Mount public routes (landing page stats — no auth)
app.include_router(public.router, tags=["public"])
# Data Warehouse aggregated data for dashboards
app.include_router(dw.router, prefix="/api/dw", tags=["data-warehouse"])
# Org Hierarchy — gestão de hierarquia organizacional
app.include_router(org_hierarchy.router)

@app.get("/api")
async def api_root():
    return {"message": "Trade Data Hub API"}

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# ---------------------------------------------------------------------------
# Serve the React SPA (production build) from <project>/frontend/dist
# This MUST come after all /api routes so they take priority.
# ---------------------------------------------------------------------------
import os
from pathlib import Path as _Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.responses import Response

_frontend_dist = _Path(__file__).resolve().parents[1] / "frontend" / "dist"
if _frontend_dist.is_dir():
    # Serve static assets (JS/CSS/images) with long cache (files are hashed by Vite)
    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")), name="static-assets")

    # Add cache headers middleware for /assets (hashed filenames = safe to cache forever)
    @app.middleware("http")
    async def add_cache_headers(request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path.startswith("/assets/"):
            # Vite hashes filenames, safe to cache 1 year
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif path.startswith("/locales/"):
            response.headers["Cache-Control"] = "public, max-age=3600"
        return response

    # Serve locale files
    _locales = _frontend_dist / "locales"
    if _locales.is_dir():
        app.mount("/locales", StaticFiles(directory=str(_locales)), name="static-locales")
    # Catch-all for SPA routing - serve index.html for any non-API, non-asset path
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If the path matches a real file in dist, serve it
        file_path = _frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise serve index.html for SPA client-side routing (no-cache so new builds load immediately)
        return FileResponse(str(_frontend_dist / "index.html"), headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
else:
    @app.get("/")
    async def root():
        return {"message": "Trade Data Hub API - Frontend not built. Run 'npm run build' in frontend/"}

if __name__ == "__main__":
    import uvicorn
    import signal

    def _log_signal(sig, frame):
        logger = logging.getLogger("app.signal")
        logger.info(f"Received signal: {sig}")

    signal.signal(signal.SIGINT, _log_signal)
    signal.signal(signal.SIGTERM, _log_signal)

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
