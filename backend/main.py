from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.routes import auth, admin, student, trainer, training_plans, advanced_reports, certificates, student_reports, ratings, password_reset, knowledge_matrix, public
from app.routers import challenges, stats, lessons, finalization

# Rate limiter (shared instance used by route modules)
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(title="Trade Data Hub API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
from app.config import settings

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

    allow_origin_regex = "(" + ")|(".join(regex_parts) + ")" if not settings.DEBUG else None

    # If DEBUG and no explicit origins provided, allow '*' for convenience
    if settings.DEBUG and not origins:
        return ["*"], None

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
    response.headers["X-XSS-Protection"] = "1; mode=block"
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
        # Otherwise serve index.html for SPA client-side routing
        return FileResponse(str(_frontend_dist / "index.html"))
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
