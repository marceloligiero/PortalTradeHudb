from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def seed_admin(email='admin@tradehub.com', password='admin123'):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print('Admin exists, updating password and flags')
            existing.hashed_password = get_password_hash(password)
            existing.role = 'ADMIN'
            existing.is_active = True
            existing.is_pending = False
            db.add(existing)
            db.commit()
            print('Admin updated')
            return
        admin = User(
            email=email,
            full_name='System Admin',
            hashed_password=get_password_hash(password),
            role='ADMIN',
            is_active=True,
            is_pending=False
        )
        db.add(admin)
        db.commit()
        print('Admin created, id=', admin.id)
    except Exception as e:
        db.rollback()
        print('Error seeding admin:', e)
    finally:
        db.close()

if __name__ == '__main__':
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else 'admin@tradehub.com'
    pwd = sys.argv[2] if len(sys.argv) > 2 else 'admin123'
    seed_admin(email, pwd)
