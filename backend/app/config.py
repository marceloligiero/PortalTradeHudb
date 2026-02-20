from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173, http://127.0.0.1:5173, http://192.168.1.1:5173, http://10.0.0.1:5173"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # Application
    APP_NAME: str = "TradeHub Formações"
    DEBUG: bool = False
    
    # Email (for password recovery)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "TradeHub Formações"
    SMTP_TLS: bool = True
    
    # Frontend URL for password reset links
    FRONTEND_URL: str = "https://srv1242193.hstgr.cloud"
    
    class Config:
        # Ensure we always load the backend .env regardless of cwd
        env_file = str(Path(__file__).resolve().parents[1] / ".env")
        case_sensitive = True
        extra = "ignore"  # Allow extra env vars not defined in Settings


settings = Settings()
