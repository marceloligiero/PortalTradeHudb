from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash, verify_password

EMAIL = 'admin@tradehub.com'
NEW_PW = 'admin123'

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == EMAIL).first()
        hashed = get_password_hash(NEW_PW)
        if user is None:
            print(f"User {EMAIL} not found. Creating new admin user.")
            user = User(
                email=EMAIL,
                full_name='Admin',
                hashed_password=hashed,
                role='ADMIN',
                is_active=True,
                is_pending=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user {EMAIL} with id={user.id}")
        else:
            print(f"Updating password for existing user {EMAIL} (id={user.id})")
            user.hashed_password = hashed
            user.is_active = True
            db.add(user)
            db.commit()
            print("Password updated.")

        # Verify
        ok = verify_password(NEW_PW, user.hashed_password)
        print(f"Password verify result: {ok}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
