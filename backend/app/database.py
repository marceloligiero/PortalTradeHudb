from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.constants import DB_POOL_SIZE, DB_MAX_OVERFLOW, DB_POOL_RECYCLE_SECONDS
import warnings
from sqlalchemy import exc as sa_exc

# Suppress SQLAlchemy warnings about SQL Server version
warnings.filterwarnings('ignore', category=sa_exc.SAWarning, message='.*Unrecognized server version info.*')

# Create engine with connection pool optimized for performance
_engine_kwargs = {
    "echo": False,
    "pool_size": DB_POOL_SIZE,
    "max_overflow": DB_MAX_OVERFLOW,
    "pool_pre_ping": True,
    "pool_recycle": DB_POOL_RECYCLE_SECONDS,
}

_is_mysql = settings.DATABASE_URL.startswith("mysql")

if _is_mysql:
    _engine_kwargs["connect_args"] = {
        "connect_timeout": 5,
        "read_timeout": 10,
        "write_timeout": 10,
        "charset": "utf8mb4",
    }

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

if _is_mysql:
    # Forçar collation consistente em todas as sessões — resolve conflito
    # utf8mb4_0900_ai_ci (HP MySQL 8.0 default) vs utf8mb4_unicode_ci (Docker)
    @event.listens_for(engine, "connect", insert=True)
    def _set_collation(dbapi_conn, _rec):
        with dbapi_conn.cursor() as cur:
            cur.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")

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
