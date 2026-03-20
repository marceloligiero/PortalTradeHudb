"""
conftest.py — Session-scoped fixtures that ensure test users exist
before any test module runs. Idempotent (safe to re-run).
"""
import pytest
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash


TEST_USERS = [
    dict(email="manager_test@tradehub.com", full_name="Manager Test",
         role="MANAGER", is_active=True, is_pending=False, is_team_lead=True),
    dict(email="trainer_test@tradehub.com", full_name="Trainer Test",
         role="TRAINER", is_active=True, is_pending=False, is_trainer=True),
    dict(email="tutor_test@tradehub.com", full_name="Tutor Test",
         role="TRAINEE", is_active=True, is_pending=False, is_tutor=True),
    dict(email="student_test@tradehub.com", full_name="Student Test",
         role="TRAINEE", is_active=True, is_pending=False),
    dict(email="liberador_test@tradehub.com", full_name="Liberador Test",
         role="TRAINEE", is_active=True, is_pending=False, is_liberador=True),
    dict(email="referente_test@tradehub.com", full_name="Referente Test",
         role="TRAINEE", is_active=True, is_pending=False, is_referente=True),
    dict(email="chefe_test@tradehub.com", full_name="Chefe Test",
         role="MANAGER", is_active=True, is_pending=False, is_team_lead=True),
]


@pytest.fixture(scope="session", autouse=True)
def ensure_test_users():
    """Seed all test users before the test session starts (idempotent)."""
    db = SessionLocal()
    try:
        pw_hash = get_password_hash("Test1234!")
        for u in TEST_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                # Update flags to ensure correct state
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
