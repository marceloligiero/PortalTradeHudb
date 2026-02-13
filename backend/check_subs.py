import sys
sys.path.insert(0, '.')
from app.database import SessionLocal
from app import models

db = SessionLocal()
subs = db.query(models.ChallengeSubmission).all()
for s in subs:
    print(f"id={s.id} user={s.user_id} status={s.status} approved={s.is_approved} mpu={s.calculated_mpu} ops={s.total_operations} errors={s.errors_count} completed={s.completed_at}")
db.close()
