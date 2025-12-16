import sys
import os
# Ensure project root is on sys.path when running the script directly
root = os.path.dirname(os.path.dirname(__file__))
if root not in sys.path:
    sys.path.insert(0, root)

from app.database import SessionLocal
from app.models import User
from app import auth


def scan():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        bad = []
        for u in users:
            if not auth.is_valid_bcrypt_hash(u.hashed_password):
                bad.append((u.id, u.email, u.hashed_password))
        if not bad:
            print("No invalid bcrypt hashes found.")
            return 0
        print("Invalid hashes found:")
        for id_, email, h in bad:
            print(f" - id={id_}, email={email}, hash={h[:30]}...")
        return 1
    finally:
        db.close()

if __name__ == '__main__':
    sys.exit(scan())