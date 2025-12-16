from sqlalchemy import create_engine, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import warnings
from sqlalchemy import exc as sa_exc

# Suppress SQLAlchemy warnings about SQL Server version
warnings.filterwarnings('ignore', category=sa_exc.SAWarning, message='.*Unrecognized server version info.*')

# Create engine with pyodbc - pass the connection string directly
engine = create_engine(settings.DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        raise Exception(f"Database connection failed: {str(e)}")
