from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, admin, student, trainer, training_plans

app = FastAPI(title="Trade Data Hub API", version="1.0.0")

# CORS middleware
from app.config import settings

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
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
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(trainer.router, prefix="/api/trainer", tags=["trainer"])
app.include_router(training_plans.router, prefix="/api", tags=["training-plans"])

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
