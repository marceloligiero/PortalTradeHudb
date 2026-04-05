from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from jwt.exceptions import PyJWTError as JWTError
import bcrypt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database import get_db
from app.models import User
from app.config import settings
import logging

logger = logging.getLogger(__name__)

import re

# Simple bcrypt hash validator (expects standard 60-char bcrypt hash)
BCRYPT_HASH_RE = re.compile(r"^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$")

def is_valid_bcrypt_hash(hash_str: str) -> bool:
    """Return True if `hash_str` looks like a valid bcrypt hash."""
    if not hash_str or not isinstance(hash_str, str):
        return False
    return bool(BCRYPT_HASH_RE.match(hash_str) and len(hash_str) == 60)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt"""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]  # Bcrypt max is 72 bytes
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    try:
        password_bytes = password.encode('utf-8')[:72]  # Bcrypt max is 72 bytes
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning(f"Authentication failed: user not found")
        return None
    
    password_ok = verify_password(password, user.hashed_password)
    if not password_ok:
        # Mask email to avoid exposing valid addresses in logs (M07)
        masked = email[:3] + "***@" + email.split("@")[-1] if "@" in email else "***"
        logger.warning(f"Authentication failed: invalid password for {masked}")
        return None
    
    logger.info(f"Authentication successful for {email}")
    return user

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(allowed_roles: list[str]):
    """Dependency que verifica se o utilizador tem pelo menos uma das flags requeridas.

    Mapeamento de nome de role → flag:
        ADMIN        → is_admin
        DIRETOR      → is_diretor
        GERENTE      → is_gerente
        CHEFE_EQUIPE → is_chefe_equipe
        FORMADOR     → is_formador
        TUTOR        → is_tutor
        LIBERADOR    → is_liberador
        REFERENTE    → is_referente
    """
    # flag map: role name → attribute on User model
    _FLAG_MAP = {
        "ADMIN":        "is_admin",
        "DIRETOR":      "is_diretor",
        "GERENTE":      "is_gerente",
        "CHEFE_EQUIPE": "is_chefe_equipe",
        "FORMADOR":     "is_formador",
        "TUTOR":        "is_tutor",
        "LIBERADOR":    "is_liberador",
        "REFERENTE":    "is_referente",
        # Legacy aliases kept so chamadas antigas não quebram imediatamente
        "TRAINER":   "is_formador",
        "MANAGER":   "is_gerente",
        "GESTOR":    "is_gerente",
        # TRAINEE/STUDENT/USUARIO — qualquer utilizador activo (is_active já verificado por get_current_active_user)
        "TRAINEE":   "is_active",
        "STUDENT":   "is_active",
        "USUARIO":   "is_active",
    }

    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.is_pending:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta pendente de validação pelo administrador"
            )
        has_access = any(
            getattr(current_user, _FLAG_MAP[r], False)
            for r in allowed_roles
            if r in _FLAG_MAP
        )
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


# ── Role-list constants (usados em require_role()) ────────────────────────
ADMIN_ROLES                  = ["ADMIN"]
ADMIN_MANAGER_ROLES          = ["ADMIN", "DIRETOR", "GERENTE", "CHEFE_EQUIPE"]
ADMIN_TRAINER_ROLES          = ["ADMIN", "FORMADOR"]
ADMIN_TRAINER_MANAGER_ROLES  = ["ADMIN", "DIRETOR", "GERENTE", "CHEFE_EQUIPE", "FORMADOR"]

# Tutoria-specific role lists (is_formador EXCLUÍDO — só roles de tutoria + gestão)
TUTORIA_MANAGER_ROLES        = ["ADMIN", "DIRETOR", "GERENTE", "CHEFE_EQUIPE", "TUTOR"]
TUTORIA_ALL_ROLES            = ["ADMIN", "DIRETOR", "GERENTE", "CHEFE_EQUIPE", "TUTOR", "LIBERADOR", "REFERENTE"]


# ── Flag-based permission helpers (usar em vez de role checks) ─────────────

def is_formador_user(user) -> bool:
    """True se o utilizador tem permissão de formador (não pendente)."""
    if user is None:
        return False
    return bool(getattr(user, "is_formador", False)) and not bool(user.is_pending)

# Alias de compatibilidade para código legado
def is_trainer_user(user) -> bool:
    return is_formador_user(user)


def get_visible_user_ids(db: Session, user: User):
    """Retorna a lista de IDs de utilizadores cujos dados o user pode ver.

    None  → vê todos (is_admin ou is_diretor).
    [ids] → lista restrita por role/flag:
              is_gerente / is_chefe_equipe → equipa(s) gerida(s)
              is_formador                  → formandos atribuídos (tutor_id)
              USUARIO sem flags             → só o próprio
    """
    from app.models import Team

    if user.is_admin or user.is_diretor:
        return None  # sem filtro

    if user.is_gerente or user.is_chefe_equipe:
        managed = db.query(Team).filter(Team.manager_id == user.id).all()
        team_ids = {t.id for t in managed}
        if user.is_chefe_equipe and user.team_id:
            team_ids.add(user.team_id)
        if team_ids:
            rows = db.query(User.id).filter(
                User.team_id.in_(team_ids), User.is_active == True
            ).all()
            return list({r.id for r in rows} | {user.id})
        return [user.id]

    if user.is_formador:
        students = db.query(User.id).filter(
            User.tutor_id == user.id, User.is_active == True
        ).all()
        return list({r.id for r in students} | {user.id})

    return [user.id]
