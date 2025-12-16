import logging
logging.basicConfig(level=logging.INFO)

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import auth

# Test login directly
db = SessionLocal()
try:
    user = auth.authenticate_user(db, "admin@tradehub.com", "admin123")
    if user:
        print(f"✅ Login successful: {user.email}, role: {user.role}")
    else:
        print("❌ Login failed")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()