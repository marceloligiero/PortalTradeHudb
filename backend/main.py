from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, admin, student, trainer, training_plans, advanced_reports, certificates, student_reports
from app.routers import challenges, stats, lessons, finalization

app = FastAPI(title="Trade Data Hub API", version="1.0.0")

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
    regex_parts = [
        r"^https?://([a-z0-9-]+\.)*trycloudflare\.com(:\d+)?$",
        r"^https?://([a-z0-9-]+\.)*loca\.lt(:\d+)?$",
        r"^https?://localhost(:\d+)?$",
        r"^https?://127\.0\.0\.1(:\d+)?$",
        r"^https?://192\.168\.\d+\.\d+(:\d+)?$",
        r"^https?://10\.\d+\.\d+\.\d+(:\d+)?$",
        r"^https?://172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$",
    ]

    allow_origin_regex = "(" + ")|(".join(regex_parts) + ")"

    # If DEBUG and no explicit origins provided, allow '*' for convenience
    if settings.DEBUG and not origins:
        return ["*"], None

    return origins, allow_origin_regex


origins, allow_origin_regex = get_allowed_origins_and_regex()

# If wildcard '*' is present in explicit origins, do not allow credentials
allow_credentials = False if "*" in origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging + exception middleware
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback
import logging

logger = logging.getLogger("app.middleware")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code} for {request.method} {request.url}")
        return response
    except Exception as e:
        logger.error(f"Unhandled exception during request: {e}")
        tb = traceback.format_exc()
        logger.error(tb)
        # Persist traceback to file for local debugging
        try:
            with open("backend/exception_trace.txt", "w", encoding="utf-8") as f:
                f.write(tb)
        except Exception:
            pass
        # RETURN TRACEBACK FOR DEBUGGING (temporary)
        return JSONResponse(status_code=500, content={"detail": str(e), "trace": tb})

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
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

@app.get("/")
async def root():
    return {"message": "Trade Data Hub API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import signal

    def _log_signal(sig, frame):
        logger = logging.getLogger("app.signal")
        logger.info(f"Received signal: {sig}")

    signal.signal(signal.SIGINT, _log_signal)
    signal.signal(signal.SIGTERM, _log_signal)

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
