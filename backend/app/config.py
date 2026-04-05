from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost, http://127.0.0.1, http://portaltradedatahub, http://localhost:5173, http://127.0.0.1:5173"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 min (H01 — was 480/8h)
    
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

    # Resend email service
    RESEND_API_URL: str = "https://api.resend.com/emails"
    RESEND_FROM_EMAIL: str = ""

    # Frontend URL for password reset links
    FRONTEND_URL: str = "http://localhost"

    # ── SSO Microsoft (Entra ID) — opcionais; SSO desactivado se vazios ───
    MICROSOFT_CLIENT_ID:     str = ""
    MICROSOFT_TENANT_ID:     str = "common"
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_REDIRECT_URI:  str = ""
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
