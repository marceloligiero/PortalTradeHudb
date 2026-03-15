"""
Seed script for CI — creates all users needed by the test suite.
Only used in ephemeral CI environments with a fresh database.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, init_db
from app.migrate import run_migrations
from app.models import User
from app.auth import get_password_hash
from sqlalchemy.orm import Session

# Ensure tables exist
init_db()
run_migrations()

USERS = [
    # Admin — password used in test_login_admin
    dict(email="admin@tradehub.com", full_name="Admin CI",
         hashed_password=get_password_hash("admin123"),
         role="ADMIN", is_active=True, is_pending=False),
    # test_all_portals.py users
    dict(email="manager_test@tradehub.com", full_name="Manager Test",
         hashed_password=get_password_hash("Test1234!"),
         role="MANAGER", is_active=True, is_pending=False, is_team_lead=True),
    dict(email="trainer_test@tradehub.com", full_name="Trainer Test",
         hashed_password=get_password_hash("Test1234!"),
         role="TRAINER", is_active=True, is_pending=False, is_trainer=True),
    dict(email="tutor_test@tradehub.com", full_name="Tutor Test",
         hashed_password=get_password_hash("Test1234!"),
         role="TRAINEE", is_active=True, is_pending=False, is_tutor=True),
    dict(email="student_test@tradehub.com", full_name="Student Test",
         hashed_password=get_password_hash("Test1234!"),
         role="TRAINEE", is_active=True, is_pending=False),
    dict(email="liberador_test@tradehub.com", full_name="Liberador Test",
         hashed_password=get_password_hash("Test1234!"),
         role="TRAINEE", is_active=True, is_pending=False, is_liberador=True),
    dict(email="referente_test@tradehub.com", full_name="Referente Test",
         hashed_password=get_password_hash("Test1234!"),
         role="TRAINEE", is_active=True, is_pending=False, is_referente=True),
    # test_tutoria_v4.py — chefe_test (MANAGER + is_team_lead)
    dict(email="chefe_test@tradehub.com", full_name="Chefe Test",
         hashed_password=get_password_hash("Test1234!"),
         role="MANAGER", is_active=True, is_pending=False, is_team_lead=True),
]

with Session(engine) as db:
    for u in USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            print(f"Already exists — skipping: {u['email']}")
            continue
        user = User(**u)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created: id={user.id} email={user.email}")
