from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db
from app import models, schemas, auth
from app.audit import log_audit
from slowapi import Limiter
from slowapi.util import get_remote_address
import re

router = APIRouter()

# Rate limiter for auth endpoints
limiter = Limiter(key_func=get_remote_address)


PASSWORD_MIN_LENGTH = 8
PASSWORD_POLICY_MSG = "A password deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número"
_PASSWORD_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$')

def validate_password_strength(password: str):
    """Validate password meets minimum security requirements."""
    if not _PASSWORD_RE.match(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=PASSWORD_POLICY_MSG
        )


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, db: Session = Depends(get_db)):
    """Simple login endpoint that accepts either JSON or form (for tests)."""
    import logging
    logger = logging.getLogger(__name__)

    # Support both JSON body and form-encoded body (tests use form data)
    username = None
    password = None
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
    else:
        body = {}
        try:
            body = await request.json()
        except Exception:
            body = {}
        username = body.get("username")
        password = body.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="username and password are required"
        )

    logger.info(f"Login attempt - username: '{username}'")

    try:
        user = auth.authenticate_user(db, username, password)
    except SQLAlchemyError as exc:
        logger.error(f"Database error during login for '{username}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço temporariamente indisponível"
        )

    if not user:
        logger.warning(f"Authentication failed for user: {username}")
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_pending": user.is_pending
        }
    }

@router.post("/register", response_model=schemas.UserWithPendingStatus, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user (Formador or Formando).
    
    - **Formando (Student)**: Can immediately access the platform
    - **Formador (Trainer)**: Marked as pending and must be validated by Admin
      - Formadores are also created as Formando (they need to take courses)
      - Their is_pending flag must be set to False by Admin before they can create courses
    """
    try:
        # Validate role
        if user_in.role not in ["TRAINER", "TRAINEE"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'TRAINER' or 'TRAINEE'"
            )
        
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate password strength
        validate_password_strength(user_in.password)
        
        # Create new user
        hashed_password = auth.get_password_hash(user_in.password)
        # Validate generated hash to avoid storing invalid hashes
        if not auth.is_valid_bcrypt_hash(hashed_password):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        
        # If TRAINER, mark as pending for admin validation
        is_pending = user_in.role == "TRAINER"
        
        db_user = models.User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hashed_password,
            role=user_in.role,
            is_active=True,
            is_pending=is_pending
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        from app.audit import log_audit
        log_audit(
            action="USER_REGISTERED",
            user_id=db_user.id,
            user_email=db_user.email,
            resource_type="User",
            resource_id=db_user.id,
            details=f"Role: {db_user.role}, Pending: {db_user.is_pending}"
        )
        
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import logging as _log
        _log.getLogger(__name__).error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao registar utilizador"
        )

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user
