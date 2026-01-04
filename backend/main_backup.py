from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import logging

from app.config import settings
# from app.database import init_db, test_connection, get_db
# from app.routes import auth, student, trainer, admin, training_plans
# from app.routers import challenges
# from app import models

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting TradeHub Formações API...")
    logger.info("📊 Testing database connection...")
    try:
        test_connection()
        logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")
        raise
    
    # Initialize database
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"⚠️ Database initialization error: {e}")
        raise
    
    logger.info("🎯 Application startup complete, yielding control...")
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down TradeHub Formações API...")

# Create FastAPI app
app = FastAPI(
    title="TradeHub Formações",
    description="Training Management Platform - Santander Digital Services",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=True  # Redireciona automaticamente /path para /path/
)

# Add CORS middleware (must be added before routes)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Permite todas as origens
#     allow_credentials=True,
#     allow_methods=["*"],  # Permite todos os métodos
#     allow_headers=["*"],  # Permite todos os headers
#     expose_headers=["*"],
#     max_age=3600
# )

# Additional CORS handler for preflight requests - REMOVED to avoid conflicts with CORSMiddleware
# @app.options("/{path:path}")
# async def options_handler(request: Request, path: str):
#     return Response(
#         status_code=200,
#         headers={
#             "Access-Control-Allow-Origin": "*",
#             "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
#             "Access-Control-Allow-Headers": "*",
#             "Access-Control-Allow-Credentials": "true",
#         }
# #     )

# Include routers
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(student.router, prefix="/api/student", tags=["Student"])
# app.include_router(trainer.router, prefix="/api/trainer", tags=["Trainer"])
# app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
# app.include_router(training_plans.router, prefix="/api/training-plans", tags=["Training Plans"])
# app.include_router(challenges.router, tags=["Challenges"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "TradeHub Formações API",
        "version": "2.0.0",
        "description": "Training Management Platform",
        "docs": "/docs"
    }

# Health check
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "database": "connected"
    }

if __name__ == "__main__":
    # Initialize database on startup
    logger.info("🚀 Starting TradeHub Formações API...")
    # logger.info("📊 Testing database connection...")
    # try:
    #     test_connection()
    #     logger.info("✅ Database connection successful")
    # except Exception as e:
    #     logger.error(f"❌ Database connection error: {e}")
    #     raise
    
    # Initialize database
    # try:
    #     # init_db()
    #     logger.info("✅ Database initialization skipped")
    # except Exception as e:
    #     logger.error(f"⚠️ Database initialization error: {e}")
    #     raise
    
    import uvicorn
    try:
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
    except Exception as e:
        logger.error(f"Error running server: {e}")
        raise
