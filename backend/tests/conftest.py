"""
conftest.py — Session-scoped fixtures that ensure test users exist
before any test module runs. Idempotent (safe to re-run).
"""
import pytest
import warnings
from app.database import SessionLocal


def pytest_configure(config):
    """Suppress known false-positive warnings from Python 3.13 + httpx gzip handling."""
    config.addinivalue_line(
        "filterwarnings", "ignore::pytest.PytestUnraisableExceptionWarning"
    )
from app.models import User
from app.auth import get_password_hash

# All permission flags — reset to False before applying per-user overrides
_ALL_PERM_FLAGS = [
    "is_admin", "is_diretor", "is_gerente", "is_chefe_equipe",
    "is_formador", "is_tutor", "is_liberador", "is_referente",
    "is_trainer", "is_team_lead",  # deprecated aliases
]

TEST_USERS = [
    dict(email="manager_test@tradehub.com", full_name="Manager Test",
         role="CHEFE_EQUIPE", is_active=True, is_pending=False, is_chefe_equipe=True),
    dict(email="trainer_test@tradehub.com", full_name="Trainer Test",
         role="FORMADOR", is_active=True, is_pending=False, is_formador=True),
    dict(email="tutor_test@tradehub.com", full_name="Tutor Test",
         role="USUARIO", is_active=True, is_pending=False, is_tutor=True),
    dict(email="student_test@tradehub.com", full_name="Student Test",
         role="USUARIO", is_active=True, is_pending=False),
    dict(email="liberador_test@tradehub.com", full_name="Liberador Test",
         role="USUARIO", is_active=True, is_pending=False, is_liberador=True),
    dict(email="referente_test@tradehub.com", full_name="Referente Test",
         role="USUARIO", is_active=True, is_pending=False, is_referente=True),
    dict(email="chefe_test@tradehub.com", full_name="Chefe Test",
         role="CHEFE_EQUIPE", is_active=True, is_pending=False, is_chefe_equipe=True),
]


@pytest.fixture(scope="session", autouse=True)
def ensure_test_users():
    """Seed all test users before the test session starts (idempotent).

    When updating existing users, ALL permission flags are first reset to False
    to avoid residual flags from previous test runs interfering with access control.
    """
    db = SessionLocal()
    try:
        pw_hash = get_password_hash("Test1234!")
        for u in TEST_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                # Reset ALL permission flags to False first (clean slate)
                for flag in _ALL_PERM_FLAGS:
                    setattr(existing, flag, False)
                # Apply the user's specific attributes
                for k, v in u.items():
                    if k not in ("email", "full_name"):
                        setattr(existing, k, v)
                db.commit()
                continue
            user = User(hashed_password=pw_hash, **u)
            db.add(user)
            db.commit()
    finally:
        db.close()

