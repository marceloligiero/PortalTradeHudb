"""
Seed script for CI — creates admin@tradehub.com (id=1) if not exists.
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

with Session(engine) as db:
    admin = db.query(User).filter(User.email == "admin@tradehub.com").first()
    if admin:
        print("Admin already exists — skipping seed.")
        sys.exit(0)

    admin = User(
        email="admin@tradehub.com",
        full_name="Admin CI",
        hashed_password=get_password_hash("AdminCI2026!"),
        role="ADMIN",
        is_active=True,
        is_pending=False,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Admin created: id={admin.id} email={admin.email}")
