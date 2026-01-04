from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database import get_db
from app import models, schemas, auth
from app.pagination import paginate, PaginatedResponse
from datetime import datetime, timedelta

router = APIRouter()


# Dashboard Stats
@router.get("/stats")
async def get_trainer_stats(
    current_user: models.User = Depends(auth.require_role(["TRAINER"])),
    db: Session = Depends(get_db)
):
    """Get trainer dashboard statistics"""
    trainer_id = current_user.id
    
    # Courses created by trainer
    total_courses = db.query(models.Course).filter(
        models.Course.created_by == trainer_id
    ).count()
    
    # Training plans where trainer is responsible
    training_plans = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.trainer_id == trainer_id
    ).all()
    
    total_training_plans = len(training_plans)
    active_training_plans = len([p for p in training_plans if p.is_active])
    
    # Students assigned to trainer's plans
    plan_ids = [p.id for p in training_plans]
    total_students = 0
    if plan_ids:
        # Count unique students assigned to trainer's plans
        total_students = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.trainer_id == trainer_id,
            models.TrainingPlan.student_id.isnot(None)
        ).count()
    
    # Challenges created by trainer
    total_challenges = db.query(models.Challenge).filter(
        models.Challenge.created_by == trainer_id
    ).count()
    
    # Challenge submissions for trainer's challenges
    trainer_challenge_ids = db.query(models.Challenge.id).filter(
        models.Challenge.created_by == trainer_id
    ).subquery()
    
    total_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id.in_(trainer_challenge_ids)
    ).count()
    
    approved_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id.in_(trainer_challenge_ids),
        models.ChallengeSubmission.is_approved == True
    ).count()
    
    # Average MPU from submissions
    avg_mpu_result = db.query(func.avg(models.ChallengeSubmission.calculated_mpu)).filter(
        models.ChallengeSubmission.challenge_id.in_(trainer_challenge_ids),
        models.ChallengeSubmission.calculated_mpu.isnot(None)
    ).scalar()
    avg_mpu = round(avg_mpu_result, 2) if avg_mpu_result else 0
    
    # Certificates issued for trainer's plans
    certificates_issued = 0
    if plan_ids:
        certificates_issued = db.query(models.Certificate).filter(
            models.Certificate.training_plan_id.in_(plan_ids)
        ).count()
    
    # Lessons count from trainer's courses
    trainer_course_ids = db.query(models.Course.id).filter(
        models.Course.created_by == trainer_id
    ).subquery()
    
    total_lessons = db.query(models.Lesson).filter(
        models.Lesson.course_id.in_(trainer_course_ids)
    ).count()
    
    # Recent activity - last 7 days submissions
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id.in_(trainer_challenge_ids),
        models.ChallengeSubmission.created_at >= seven_days_ago
    ).count()
    
    return {
        "total_courses": total_courses,
        "total_lessons": total_lessons,
        "total_training_plans": total_training_plans,
        "active_training_plans": active_training_plans,
        "total_students": total_students,
        "total_challenges": total_challenges,
        "total_submissions": total_submissions,
        "approved_submissions": approved_submissions,
        "approval_rate": round((approved_submissions / total_submissions * 100) if total_submissions > 0 else 0, 1),
        "avg_mpu": avg_mpu,
        "certificates_issued": certificates_issued,
        "recent_submissions": recent_submissions
    }


# Courses
@router.get("/courses", response_model=PaginatedResponse[schemas.Course])
async def list_courses(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    if current_user.role == "TRAINER":
        query = db.query(models.Course).filter(
            models.Course.created_by == current_user.id
        )
    else:  # ADMIN
        query = db.query(models.Course)
    
    items, total = paginate(query, page, page_size)
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/courses", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: schemas.CourseCreate,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    db_course = models.Course(
        **course.dict(),
        created_by=current_user.id
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    return db_course

@router.get("/courses/{course_id}", response_model=schemas.Course)
async def get_course(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role == "TRAINER" and course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this course")
    
    return course

@router.put("/courses/{course_id}", response_model=schemas.Course)
async def update_course(
    course_id: int,
    course_update: schemas.CourseCreate,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role == "TRAINER" and db_course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this course")
    
    for key, value in course_update.dict().items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    
    return db_course

@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role == "TRAINER" and db_course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")
    
    db.delete(db_course)
    db.commit()
    
    return None

# Lessons
@router.post("/lessons", response_model=schemas.Lesson, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson: schemas.LessonCreate,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    # Verify course exists and user has permission
    course = db.query(models.Course).filter(models.Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role == "TRAINER" and course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create lessons for this course")
    
    db_lesson = models.Lesson(**lesson.dict())
    
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    
    return db_lesson


# ==================== TRAINING PLANS ENDPOINTS ====================

@router.get("/training-plans")
async def list_training_plans(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all training plans for trainer"""
    
    if current_user.role == "TRAINER":
        plans = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()
    else:  # ADMIN
        plans = db.query(models.TrainingPlan).all()

    plans_list = []
    for plan in plans:
        # Get trainer info
        trainer = db.query(models.User).filter(models.User.id == plan.trainer_id).first()
        
        # Count students assigned to plan
        assignments_count = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan.id
        ).count()
        
        # Get all courses in the plan
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan.id
        ).all()
        
        # Calculate total duration (sum of all lessons in all courses)
        total_duration_minutes = 0
        for plan_course in plan_courses:
            course_lessons = db.query(models.Lesson).filter(
                models.Lesson.course_id == plan_course.course_id
            ).all()
            total_duration_minutes += sum(lesson.estimated_minutes for lesson in course_lessons)
        
        # Calculate completed time for this plan (average across all students)
        completed_minutes = 0
        if assignments_count > 0:
            # Get all students assigned to this plan
            assignments = db.query(models.TrainingPlanAssignment).filter(
                models.TrainingPlanAssignment.training_plan_id == plan.id
            ).all()
            
            total_completed = 0
            for assignment in assignments:
                # Get all enrollments for this student in courses of this plan
                course_ids = [pc.course_id for pc in plan_courses]
                enrollments = db.query(models.Enrollment).filter(
                    models.Enrollment.user_id == assignment.user_id,
                    models.Enrollment.course_id.in_(course_ids)
                ).all()
                
                # Sum actual time from lesson progress
                for enrollment in enrollments:
                    progress_records = db.query(models.LessonProgress).filter(
                        models.LessonProgress.enrollment_id == enrollment.id,
                        models.LessonProgress.completed_at.isnot(None)
                    ).all()
                    total_completed += sum(p.actual_time_minutes or 0 for p in progress_records)
            
            completed_minutes = total_completed // assignments_count if assignments_count > 0 else 0
        
        remaining_minutes = max(0, total_duration_minutes - completed_minutes)
        progress_percentage = (completed_minutes / total_duration_minutes * 100) if total_duration_minutes > 0 else 0

        plans_list.append({
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "trainer_id": plan.trainer_id,
            "trainer_name": trainer.full_name if trainer else "N/A",
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "students_count": assignments_count,
            "total_duration_minutes": total_duration_minutes,
            "completed_minutes": completed_minutes,
            "remaining_minutes": remaining_minutes,
            "progress_percentage": round(progress_percentage, 1)
        })

    return plans_list


@router.post("/training-plans", status_code=status.HTTP_201_CREATED)
async def create_training_plan(
    plan_data: Dict[str, Any],
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new training plan"""
    
    print(f"📥 Received plan data: {plan_data}")
    print(f"👤 Current user: {current_user.id} ({current_user.role})")
    
    # Create training plan
    trainer_id = plan_data.get("trainer_id") if current_user.role == "ADMIN" else current_user.id
    if not trainer_id:
        raise HTTPException(status_code=400, detail="trainer_id is required")
    
    # Verify trainer exists and is active
    trainer = db.query(models.User).filter(
        models.User.id == trainer_id,
        models.User.role == "TRAINER",
        models.User.is_active == True
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found or inactive")

    db_plan = models.TrainingPlan(
        title=plan_data.get("title"),
        description=plan_data.get("description"),
        created_by=current_user.id,
        trainer_id=trainer_id,
        bank_id=plan_data.get("bank_id"),
        product_id=plan_data.get("product_id"),
        start_date=plan_data.get("start_date"),
        end_date=plan_data.get("end_date")
    )
    
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    
    # Add courses to plan if provided
    course_ids = plan_data.get("course_ids", [])
    if course_ids:
        for idx, course_id in enumerate(course_ids):
            course = db.query(models.Course).filter(models.Course.id == course_id).first()
            if course:
                plan_course = models.TrainingPlanCourse(
                    training_plan_id=db_plan.id,
                    course_id=course_id,
                    order_index=idx
                )
                db.add(plan_course)
        db.commit()
    
    # Add student assignments if provided
    student_ids = plan_data.get("student_ids", [])
    if student_ids:
        for student_id in student_ids:
            assignment = models.TrainingPlanAssignment(
                training_plan_id=db_plan.id,
                user_id=student_id,
                assigned_by=current_user.id
            )
            db.add(assignment)
        db.commit()
    
    return {
        "id": db_plan.id,
        "title": db_plan.title,
        "description": db_plan.description,
        "trainer_id": db_plan.trainer_id,
        "message": "Training plan created successfully"
    }


# ==================== REPORTS ENDPOINTS ====================

@router.get("/reports/overview")
async def get_trainer_overview(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get trainer overview statistics"""
    
    # Total courses created
    if current_user.role == "TRAINER":
        total_courses = db.query(models.Course).filter(
            models.Course.created_by == current_user.id
        ).count()
        
        # Get course IDs
        course_ids = [c.id for c in db.query(models.Course.id).filter(
            models.Course.created_by == current_user.id
        ).all()]
    else:  # ADMIN
        total_courses = db.query(models.Course).count()
        course_ids = [c.id for c in db.query(models.Course.id).all()]
    
    # Total students (unique enrollments)
    total_students = db.query(models.Enrollment.user_id).filter(
        models.Enrollment.course_id.in_(course_ids) if course_ids else False
    ).distinct().count() if course_ids else 0
    
    # Total training plans
    total_plans = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.created_by == current_user.id
    ).count() if current_user.role == "TRAINER" else db.query(models.TrainingPlan).count()
    
    # Active students (enrolled in last 30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    active_students = db.query(models.Enrollment.user_id).filter(
        models.Enrollment.course_id.in_(course_ids) if course_ids else False,
        models.Enrollment.enrolled_at >= month_ago
    ).distinct().count() if course_ids else 0
    
    return {
        "total_courses": total_courses,
        "total_students": total_students,
        "total_plans": total_plans,
        "active_students": active_students,
        "certificates_issued": 0  # TODO: implement when certificates are linked to trainers
    }


@router.get("/reports/plans")
async def get_trainer_plans_report(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of training plans"""
    
    if current_user.role == "TRAINER":
        plans = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()
    else:
        plans = db.query(models.TrainingPlan).all()
    
    plans_report = []
    for plan in plans:
        # Count assignments
        assignments = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan.id
        ).count()
        
        plans_report.append({
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "bank_code": plan.bank_code,
            "students_assigned": assignments,
            "start_date": plan.start_date.isoformat() if plan.start_date else None,
            "end_date": plan.end_date.isoformat() if plan.end_date else None,
            "status": "active" if plan.end_date and plan.end_date > datetime.utcnow() else "completed"
        })
    
    return plans_report


@router.get("/reports/students")
async def get_trainer_students_report(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of students"""
    
    # Get courses
    if current_user.role == "TRAINER":
        course_ids = [c.id for c in db.query(models.Course.id).filter(
            models.Course.created_by == current_user.id
        ).all()]
    else:
        course_ids = [c.id for c in db.query(models.Course.id).all()]
    
    if not course_ids:
        return []
    
    # Get enrollments
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id.in_(course_ids)
    ).all()
    
    # Group by student
    students_dict = {}
    for enrollment in enrollments:
        user_id = enrollment.user_id
        if user_id not in students_dict:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            students_dict[user_id] = {
                "id": user_id,
                "name": user.full_name if user else "Unknown",
                "email": user.email if user else "",
                "courses_enrolled": 0,
                "total_progress": 0
            }
        
        students_dict[user_id]["courses_enrolled"] += 1
        students_dict[user_id]["total_progress"] += enrollment.progress
    
    # Calculate average progress
    students_list = []
    for student in students_dict.values():
        if student["courses_enrolled"] > 0:
            student["average_progress"] = round(student["total_progress"] / student["courses_enrolled"], 1)
        else:
            student["average_progress"] = 0
        del student["total_progress"]
        students_list.append(student)
    
    return students_list


@router.get("/reports/lessons")
async def get_trainer_lessons_report(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get report of lessons created"""
    
    # Get courses
    if current_user.role == "TRAINER":
        course_ids = [c.id for c in db.query(models.Course.id).filter(
            models.Course.created_by == current_user.id
        ).all()]
    else:
        course_ids = [c.id for c in db.query(models.Course.id).all()]
    
    if not course_ids:
        return {"total_lessons": 0, "total_duration": 0, "lessons_per_course": 0}
    
    # Count lessons
    total_lessons = db.query(models.Lesson).filter(
        models.Lesson.course_id.in_(course_ids)
    ).count()
    
    # Sum duration
    total_duration = db.query(func.sum(models.Lesson.estimated_minutes)).filter(
        models.Lesson.course_id.in_(course_ids)
    ).scalar() or 0
    
    return {
        "total_lessons": total_lessons,
        "total_duration_minutes": int(total_duration),
        "lessons_per_course": round(total_lessons / len(course_ids), 1) if course_ids else 0
    }
