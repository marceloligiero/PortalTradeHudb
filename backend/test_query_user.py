from app.database import SessionLocal
from app import models

try:
    db = SessionLocal()
    user = db.query(models.User).first()
    print('Found user:', user)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    try:
        db.close()
    except:
        pass
