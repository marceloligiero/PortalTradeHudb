from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, admin, student, trainer, training_plans
from app.routers import challenges

app = FastAPI(title="Trade Data Hub API", version="1.0.0")

# CORS middleware
from app.config import settings

def get_allowed_origins():
    origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    if settings.DEBUG:
        # In debug mode, allow any origin ending with :5173
        return ["*"]  # For simplicity, allow all in debug
    return origins

origins = get_allowed_origins()

if "*" in origins:
    # If wildcard is present, do not allow credentials
    allow_credentials = False
else:
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
