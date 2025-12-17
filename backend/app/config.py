from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173, http://127.0.0.1:5173, http://192.168.1.1:5173, http://10.0.0.1:5173"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Application
    APP_NAME: str = "TradeHub Formações"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
