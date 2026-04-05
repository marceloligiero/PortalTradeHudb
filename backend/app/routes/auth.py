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
            "is_pending": user.is_pending,
            # Flags de permissão
            "is_admin":        getattr(user, 'is_admin', False),
            "is_diretor":      getattr(user, 'is_diretor', False),
            "is_gerente":      getattr(user, 'is_gerente', False),
            "is_chefe_equipe": getattr(user, 'is_chefe_equipe', False),
            "is_formador":     getattr(user, 'is_formador', False),
            "is_tutor":        getattr(user, 'is_tutor', False),
            "is_liberador":    getattr(user, 'is_liberador', False),
            "is_referente":    getattr(user, 'is_referente', False),
        }
    }

@router.post("/register", response_model=schemas.UserWithPendingStatus, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    
    - Every user is a Formando (trainee) by default and can access all portals.
    - Additional capabilities: is_trainer (Formador), is_tutor (Tutor).
    - MANAGER role = Chefe de Equipa (team leader with approval powers).
    - TRAINER/MANAGER accounts are marked as pending for admin validation.
    """
    try:
        # Normalizar role legado para novo sistema
        _ROLE_NORM = {
            "TRAINEE": "USUARIO", "STUDENT": "USUARIO",
            "TRAINER": "FORMADOR",
            "MANAGER": "GERENTE", "GESTOR": "GERENTE",
        }
        user_in.role = _ROLE_NORM.get(user_in.role, user_in.role)

        VALID_ROLES = {"USUARIO", "FORMADOR", "GERENTE", "CHEFE_EQUIPE", "DIRETOR", "ADMIN"}
        if user_in.role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role inválido. Aceites: USUARIO, FORMADOR, GERENTE, CHEFE_EQUIPE, DIRETOR"
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
        if not auth.is_valid_bcrypt_hash(hashed_password):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

        # Definir flags conforme o role e as flags pedidas
        is_admin        = user_in.role == "ADMIN"
        is_diretor      = user_in.role == "DIRETOR"     or getattr(user_in, 'is_diretor', False)
        is_gerente      = user_in.role == "GERENTE"     or getattr(user_in, 'is_gerente', False)
        is_chefe_equipe = user_in.role == "CHEFE_EQUIPE" or getattr(user_in, 'is_chefe_equipe', False)
        is_formador     = user_in.role == "FORMADOR"    or getattr(user_in, 'is_formador', False) or getattr(user_in, 'is_trainer', False)
        is_tutor        = getattr(user_in, 'is_tutor', False)
        is_liberador    = getattr(user_in, 'is_liberador', False)
        is_referente    = getattr(user_in, 'is_referente', False)

        # Requer validação do ADMIN se tiver acesso acima de USUARIO básico
        is_pending = any([is_diretor, is_gerente, is_chefe_equipe, is_formador, is_tutor, is_liberador])

        db_user = models.User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hashed_password,
            role=user_in.role,
            is_admin=is_admin,
            is_diretor=is_diretor,
            is_gerente=is_gerente,
            is_chefe_equipe=is_chefe_equipe,
            is_formador=is_formador,
            is_tutor=is_tutor,
            is_liberador=is_liberador,
            is_referente=is_referente,
            # Deprecated — manter para compatibilidade com código legado ainda não migrado
            is_trainer=is_formador,
            is_team_lead=is_chefe_equipe,
            is_active=True,
            is_pending=is_pending,
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
