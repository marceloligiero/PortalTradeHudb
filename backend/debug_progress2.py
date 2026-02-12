#!/usr/bin/env python3
"""Debug: check lesson progress for all students in plans 17 and 18"""
import sys
sys.path.insert(0, '.')
from app.database import SessionLocal
from app import models

db = SessionLocal()

# Get users
users = {u.id: u.full_name for u in db.query(models.User).all()}

# Get lesson progress
print("=== LESSON PROGRESS ===")
records = db.query(models.LessonProgress).order_by(models.LessonProgress.user_id).all()
for r in records:
    print(f"  LP id={r.id} lesson={r.lesson_id} user={r.user_id}({users.get(r.user_id,'?')}) plan_id={r.training_plan_id} status={r.status}")

# Get training plan assignments
print("\n=== TRAINING PLAN ASSIGNMENTS ===")
assignments = db.query(models.TrainingPlanAssignment).all()
for a in assignments:
    print(f"  Assignment: plan={a.training_plan_id} user={a.user_id}({users.get(a.user_id,'?')}) completed_at={a.completed_at}")

# Get plan_courses status
print("\n=== PLAN COURSES ===")
pcs = db.query(models.TrainingPlanCourse).filter(models.TrainingPlanCourse.training_plan_id.in_([17,18])).all()
for pc in pcs:
    print(f"  PlanCourse: plan={pc.training_plan_id} course={pc.course_id} status={pc.status}")

# Get plans
print("\n=== PLANS 17,18 ===")
for pid in [17, 18]:
    p = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == pid).first()
    if p:
        print(f"  Plan {p.id}: student_id={p.student_id} status={p.status} completed_at={p.completed_at}")

# Calculate status for formando2 on plan 18
print("\n=== CALCULATE STATUS for plan 18 ===")
plan18 = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == 18).first()
if plan18:
    from app.routes.training_plans import calculate_plan_status
    # Get all enrolled students 
    enrollments = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.training_plan_id == 18
    ).all()
    for e in enrollments:
        status = calculate_plan_status(db, plan18, student_id=e.user_id)
        print(f"  Student {e.user_id}({users.get(e.user_id,'?')}): {status}")

db.close()
