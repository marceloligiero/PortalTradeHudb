"""Debug: Check why progress is showing 200% for student in plan 18"""
import sys
sys.path.insert(0, '.')
from app.database import SessionLocal
from app import models
from sqlalchemy import func

db = SessionLocal()

# Find all duplicate lesson_progress records
dupes = db.query(
    models.LessonProgress.user_id,
    models.LessonProgress.lesson_id,
    func.count(models.LessonProgress.id).label('cnt')
).group_by(
    models.LessonProgress.user_id,
    models.LessonProgress.lesson_id
).having(func.count(models.LessonProgress.id) > 1).all()

print(f'Duplicate lesson_progress groups: {len(dupes)}')
for d in dupes:
    print(f'  user_id={d.user_id}, lesson_id={d.lesson_id}, count={d.cnt}')
    records = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == d.user_id,
        models.LessonProgress.lesson_id == d.lesson_id
    ).all()
    for r in records:
        print(f'    id={r.id}, enrollment_id={r.enrollment_id}, status={r.status}, completed_at={r.completed_at}, training_plan_id={r.training_plan_id}')

db.close()
