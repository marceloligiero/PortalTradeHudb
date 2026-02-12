from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database import get_db
from app import models, schemas, auth
from app.pagination import paginate, PaginatedResponse
from app.routers.challenges import reopen_completed_training_plans
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


# All courses available on platform (for trainers to view catalog)
@router.get("/courses/all")
async def list_all_courses(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all courses available on platform for trainer viewing"""
    courses = db.query(models.Course).all()
    
    courses_list = []
    for course in courses:
        # Get trainer info
        trainer = db.query(models.User).filter(models.User.id == course.created_by).first()
        
        # Count students enrolled
        total_students = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id
        ).count()
        
        # Get associated banks (many-to-many)
        bank_associations = db.query(models.CourseBank).filter(
            models.CourseBank.course_id == course.id
        ).all()
        banks = []
        for ba in bank_associations:
            bank = db.query(models.Bank).filter(models.Bank.id == ba.bank_id).first()
            if bank:
                banks.append({"id": bank.id, "code": bank.code, "name": bank.name})
        if not banks and course.bank:
            banks.append({"id": course.bank.id, "code": course.bank.code, "name": course.bank.name})
        
        # Get associated products (many-to-many)
        product_associations = db.query(models.CourseProduct).filter(
            models.CourseProduct.course_id == course.id
        ).all()
        products = []
        for pa in product_associations:
            product = db.query(models.Product).filter(models.Product.id == pa.product_id).first()
            if product:
                products.append({"id": product.id, "code": product.code, "name": product.name})
        if not products and course.product:
            products.append({"id": course.product.id, "code": course.product.code, "name": course.product.name})
        
        courses_list.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bank_id": course.bank_id,
            "product_id": course.product_id,
            "bank_ids": [b["id"] for b in banks],
            "product_ids": [p["id"] for p in products],
            "banks": banks,
            "products": products,
            "bank_code": banks[0]["code"] if banks else "N/A",
            "trainer_id": course.created_by,
            "trainer_name": trainer.full_name if trainer else "N/A",
            "total_students": total_students,
            "created_at": course.created_at.isoformat() if course.created_at else None
        })
    
    return courses_list


# Course details (any course, for trainer viewing catalog)
@router.get("/courses/details/{course_id}")
async def get_course_details(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get course details with lessons and challenges (read-only for trainers)"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get creator/trainer info
    trainer = db.query(models.User).filter(models.User.id == course.created_by).first() if course.created_by else None
    
    # Get associated banks (from N:N table)
    bank_associations = db.query(models.CourseBank).filter(
        models.CourseBank.course_id == course.id
    ).all()
    banks = []
    for ba in bank_associations:
        bank = db.query(models.Bank).filter(models.Bank.id == ba.bank_id).first()
        if bank:
            banks.append({"id": bank.id, "code": bank.code, "name": bank.name})
    
    # Fallback to legacy single bank if no associations
    if not banks and course.bank:
        banks.append({"id": course.bank.id, "code": course.bank.code, "name": course.bank.name})
    
    # Get associated products (from N:N table)
    product_associations = db.query(models.CourseProduct).filter(
        models.CourseProduct.course_id == course.id
    ).all()
    products = []
    for pa in product_associations:
        product = db.query(models.Product).filter(models.Product.id == pa.product_id).first()
        if product:
            products.append({"id": product.id, "code": product.code, "name": product.name})
    
    # Fallback to legacy single product if no associations
    if not products and course.product:
        products.append({"id": course.product.id, "code": course.product.code, "name": course.product.name})
    
    # Get lessons
    lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course_id).order_by(models.Lesson.order_index).all()
    
    # Get challenges
    challenges = db.query(models.Challenge).filter(models.Challenge.course_id == course_id).all()
    
    # Count enrolled students
    total_students = db.query(models.Enrollment).filter(models.Enrollment.course_id == course_id).count()
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "bank_id": course.bank_id,
        "product_id": course.product_id,
        "bank_ids": [b["id"] for b in banks],
        "product_ids": [p["id"] for p in products],
        "banks": banks,
        "products": products,
        "bank_code": banks[0]["code"] if banks else None,
        "bank_name": banks[0]["name"] if banks else None,
        "product_code": products[0]["code"] if products else None,
        "product_name": products[0]["name"] if products else None,
        "trainer_id": course.created_by,
        "trainer_name": trainer.full_name if trainer else None,
        "total_students": total_students,
        "total_lessons": len(lessons),
        "total_challenges": len(challenges),
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "updated_at": course.updated_at.isoformat() if course.updated_at else None,
        "lessons": [
            {
                "id": l.id,
                "title": l.title,
                "description": l.description,
                "content_type": l.lesson_type,
                "duration_minutes": l.estimated_minutes,
                "order_index": l.order_index
            } for l in lessons
        ],
        "challenges": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "challenge_type": c.challenge_type,
                "difficulty": "medium",
                "max_score": c.operations_required,
                "time_limit_minutes": c.time_limit_minutes
            } for c in challenges
        ]
    }


# Challenge details (for trainer viewing catalog)
@router.get("/courses/{course_id}/challenges/{challenge_id}")
async def get_challenge_details(
    course_id: int,
    challenge_id: int,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get challenge details with stats (read-only for trainers)"""
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id,
        models.Challenge.course_id == course_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    # Get submission stats
    total_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id
    ).count()
    
    from sqlalchemy import func as sql_func
    avg_score_result = db.query(sql_func.avg(models.ChallengeSubmission.calculated_mpu)).filter(
        models.ChallengeSubmission.challenge_id == challenge_id
    ).scalar()
    
    passed_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.is_approved == True
    ).count()
    
    completion_rate = (passed_submissions / total_submissions * 100) if total_submissions > 0 else 0
    
    return {
        "id": challenge.id,
        "course_id": challenge.course_id,
        "course_title": course.title if course else None,
        "title": challenge.title,
        "description": challenge.description,
        "challenge_type": challenge.challenge_type,
        "operations_required": challenge.operations_required,
        "time_limit_minutes": challenge.time_limit_minutes,
        "target_mpu": challenge.target_mpu,
        "max_errors": challenge.max_errors,
        "is_active": challenge.is_active,
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
        "updated_at": challenge.updated_at.isoformat() if challenge.updated_at else None,
        "total_submissions": total_submissions,
        "avg_score": avg_score_result or 0,
        "completion_rate": completion_rate
    }


# Lesson details (for trainer viewing catalog)
@router.get("/courses/{course_id}/lessons/{lesson_id}")
async def get_lesson_details(
    course_id: int,
    lesson_id: int,
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get lesson details (read-only for trainers)"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.course_id == course_id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    return {
        "id": lesson.id,
        "course_id": lesson.course_id,
        "course_title": course.title if course else None,
        "title": lesson.title,
        "description": lesson.description,
        "content": lesson.content,
        "lesson_type": lesson.lesson_type,
        "order_index": lesson.order_index,
        "estimated_minutes": lesson.estimated_minutes,
        "video_url": lesson.video_url,
        "materials_url": lesson.materials_url,
        "created_at": lesson.created_at.isoformat() if lesson.created_at else None,
        "updated_at": lesson.updated_at.isoformat() if lesson.updated_at else None
    }


# Courses (trainer's own courses)
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
    
    # Reabrir planos de formação concluídos que contêm este curso
    reopened_count = reopen_completed_training_plans(db, lesson.course_id, "new_lesson")
    if reopened_count > 0:
        print(f"[INFO] {reopened_count} plano(s) de formação reaberto(s) devido a nova aula no curso {lesson.course_id}")
    
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
                
                # Sum actual time from lesson progress (filter by plan to avoid cross-plan counting)
                for enrollment in enrollments:
                    progress_records = db.query(models.LessonProgress).filter(
                        models.LessonProgress.enrollment_id == enrollment.id,
                        models.LessonProgress.completed_at.isnot(None),
                        models.LessonProgress.training_plan_id == plan.id
                    ).all()
                    # Fallback: if no records with training_plan_id, try without it (legacy data)
                    if not progress_records:
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


# ==================== STUDENTS ENDPOINTS ====================

@router.get("/students")
async def list_trainer_students(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all students assigned to trainer's training plans"""
    
    if current_user.role == "TRAINER":
        # Get plans where trainer is responsible (created_by, trainer_id, or assigned via TrainingPlanTrainer)
        created_plan_ids = {p.id for p in db.query(models.TrainingPlan.id).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()}
        
        trainer_plan_ids = {p.id for p in db.query(models.TrainingPlan.id).filter(
            models.TrainingPlan.trainer_id == current_user.id
        ).all()}
        
        assigned_plan_ids = {t.training_plan_id for t in db.query(models.TrainingPlanTrainer.training_plan_id).filter(
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).all()}
        
        plan_ids = list(created_plan_ids | trainer_plan_ids | assigned_plan_ids)
    else:
        plan_ids = [p.id for p in db.query(models.TrainingPlan.id).all()]
    
    if not plan_ids:
        return []
    
    # Get unique students from assignments
    assignments = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.training_plan_id.in_(plan_ids)
    ).all()
    
    # Also get students from student_id in plans
    direct_students = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id.in_(plan_ids),
        models.TrainingPlan.student_id.isnot(None)
    ).all()
    
    # Collect all unique student IDs
    student_ids = set()
    student_plan_map = {}  # user_id -> list of plan info
    
    for assignment in assignments:
        student_ids.add(assignment.user_id)
        if assignment.user_id not in student_plan_map:
            student_plan_map[assignment.user_id] = []
        plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == assignment.training_plan_id).first()
        if plan:
            student_plan_map[assignment.user_id].append({
                "plan_id": plan.id,
                "plan_title": plan.title,
                "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None
            })
    
    for plan in direct_students:
        student_ids.add(plan.student_id)
        if plan.student_id not in student_plan_map:
            student_plan_map[plan.student_id] = []
        student_plan_map[plan.student_id].append({
            "plan_id": plan.id,
            "plan_title": plan.title,
            "assigned_at": plan.created_at.isoformat() if plan.created_at else None
        })
    
    if not student_ids:
        return []
    
    # Get user details
    users = db.query(models.User).filter(models.User.id.in_(student_ids)).all()
    
    result = []
    for user in users:
        plans_info_raw = student_plan_map.get(user.id, [])
        # Deduplicate plans (same plan can come from assignments + direct student_id)
        seen_plan_ids = set()
        plans_info = []
        for p in plans_info_raw:
            if p["plan_id"] not in seen_plan_ids:
                seen_plan_ids.add(p["plan_id"])
                plans_info.append(p)
        
        # Calculate progress per plan
        plan_progresses = []
        for plan_info in plans_info:
            plan_courses = db.query(models.TrainingPlanCourse).filter(
                models.TrainingPlanCourse.training_plan_id == plan_info["plan_id"]
            ).all()
            plan_total_lessons = 0
            plan_completed_lessons = 0
            for pc in plan_courses:
                total_lessons = db.query(models.Lesson).filter(
                    models.Lesson.course_id == pc.course_id
                ).count()
                plan_total_lessons += total_lessons
                enrollment = db.query(models.Enrollment).filter(
                    models.Enrollment.user_id == user.id,
                    models.Enrollment.course_id == pc.course_id
                ).first()
                if enrollment:
                    completed_lessons = db.query(models.LessonProgress).filter(
                        models.LessonProgress.enrollment_id == enrollment.id,
                        models.LessonProgress.status == "COMPLETED",
                        models.LessonProgress.student_confirmed == True
                    ).count()
                    plan_completed_lessons += completed_lessons
            
            plan_progress = round(plan_completed_lessons / plan_total_lessons * 100, 1) if plan_total_lessons > 0 else 0
            plan_info["progress"] = plan_progress
            plan_progresses.append(plan_progress)
        
        avg_progress = round(sum(plan_progresses) / len(plan_progresses), 1) if plan_progresses else 0
        
        result.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_active": user.is_active,
            "plans_count": len(plans_info),
            "plans": plans_info,
            "avg_progress": avg_progress,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return result


@router.get("/students/list")
async def list_students_for_dropdown(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all available students for trainer dropdowns (TRAINEE + TRAINER users)"""
    students = db.query(models.User).filter(
        models.User.role.in_(["TRAINEE", "TRAINER"]),
        models.User.is_active == True
    ).all()
    return [
        {
            "id": s.id,
            "email": s.email,
            "full_name": s.full_name,
            "role": s.role
        }
        for s in students
    ]


# ==================== REPORTS ENDPOINTS ====================

@router.get("/reports/overview")
async def get_trainer_overview(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get trainer overview statistics"""
    
    # Total courses (created + from assigned plans)
    if current_user.role == "TRAINER":
        created_course_ids = [c.id for c in db.query(models.Course.id).filter(
            models.Course.created_by == current_user.id
        ).all()]
        
        # Courses from assigned plans
        plan_ids_for_courses = [p.id for p in db.query(models.TrainingPlan.id).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()]
        assigned_plan_ids_for_courses = [t.training_plan_id for t in db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).all()]
        all_plan_ids = list(set(plan_ids_for_courses + assigned_plan_ids_for_courses))
        plan_course_ids = [pc.course_id for pc in db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id.in_(all_plan_ids)
        ).all()] if all_plan_ids else []
        
        course_ids = list(set(created_course_ids + plan_course_ids))
        total_courses = len(course_ids)
    else:  # ADMIN
        total_courses = db.query(models.Course).count()
        course_ids = [c.id for c in db.query(models.Course.id).all()]
    
    # Total students (unique enrollments)
    total_students = db.query(models.Enrollment.user_id).filter(
        models.Enrollment.course_id.in_(course_ids) if course_ids else False
    ).distinct().count() if course_ids else 0
    
    # Total training plans (created or assigned)
    if current_user.role == "TRAINER":
        created_count = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.created_by == current_user.id
        ).count()
        assigned_ids = [t.training_plan_id for t in db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).all()]
        assigned_count = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.id.in_(assigned_ids),
            models.TrainingPlan.created_by != current_user.id
        ).count() if assigned_ids else 0
        total_plans = created_count + assigned_count
    else:
        total_plans = db.query(models.TrainingPlan).count()
    
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
        # Plans created by trainer OR where trainer is assigned
        created_plans = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()
        assigned_plan_ids = [t.training_plan_id for t in db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).all()]
        assigned_plans = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.id.in_(assigned_plan_ids)
        ).all() if assigned_plan_ids else []
        # Merge without duplicates
        plan_ids_seen = set()
        plans = []
        for p in created_plans + assigned_plans:
            if p.id not in plan_ids_seen:
                plan_ids_seen.add(p.id)
                plans.append(p)
    else:
        plans = db.query(models.TrainingPlan).all()
    
    plans_report = []
    for plan in plans:
        # Count assignments
        assignments = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan.id
        ).count()
        
        # Get bank name via association table
        bank_name = None
        plan_bank = db.query(models.TrainingPlanBank).filter(
            models.TrainingPlanBank.training_plan_id == plan.id
        ).first()
        if plan_bank:
            bank = db.query(models.Bank).filter(models.Bank.id == plan_bank.bank_id).first()
            if bank:
                bank_name = bank.code or bank.name
        elif plan.bank_id:
            bank = db.query(models.Bank).filter(models.Bank.id == plan.bank_id).first()
            if bank:
                bank_name = bank.code or bank.name
        
        # Determine status based on dates
        now = datetime.utcnow()
        if plan.end_date and now > plan.end_date:
            status = "completed"
        elif plan.start_date and now >= plan.start_date:
            status = "active"
        else:
            status = "upcoming"
        
        plans_report.append({
            "id": plan.id,
            "title": plan.title,
            "description": plan.description or "",
            "bank_code": bank_name or "",
            "students_assigned": assignments,
            "start_date": plan.start_date.isoformat() if plan.start_date else None,
            "end_date": plan.end_date.isoformat() if plan.end_date else None,
            "status": status
        })
    
    return plans_report


@router.get("/reports/students")
async def get_trainer_students_report(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of students"""
    
    # Get training plans for this trainer
    if current_user.role == "TRAINER":
        # Plans created by or assigned to trainer
        plan_ids_created = [p.id for p in db.query(models.TrainingPlan.id).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()]
        plan_ids_assigned = [t.training_plan_id for t in db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).all()]
        plan_ids = list(set(plan_ids_created + plan_ids_assigned))
    else:
        plan_ids = [p.id for p in db.query(models.TrainingPlan.id).all()]
    
    if not plan_ids:
        return []
    
    # Get student assignments from plans
    assignments = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.training_plan_id.in_(plan_ids)
    ).all()
    
    # Group by student
    students_dict: Dict[int, Dict[str, Any]] = {}
    for assignment in assignments:
        user_id = assignment.user_id
        if user_id not in students_dict:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            students_dict[user_id] = {
                "id": user_id,
                "name": user.full_name if user else "Unknown",
                "email": user.email if user else "",
                "courses_enrolled": 0,
                "total_plans": 0,
                "completed_lessons": 0,
                "total_lessons": 0
            }
        
        students_dict[user_id]["total_plans"] += 1
        
        # Count lessons in plan
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == assignment.training_plan_id
        ).all()
        for pc in plan_courses:
            lesson_count = db.query(models.Lesson).filter(
                models.Lesson.course_id == pc.course_id
            ).count()
            students_dict[user_id]["total_lessons"] += lesson_count
            
            # Completed lessons (confirmed by student)
            completed = db.query(models.LessonProgress).filter(
                models.LessonProgress.user_id == user_id,
                models.LessonProgress.training_plan_id == assignment.training_plan_id,
                models.LessonProgress.status == "COMPLETED",
                models.LessonProgress.student_confirmed == True
            ).count()
            students_dict[user_id]["completed_lessons"] += completed
        
        students_dict[user_id]["courses_enrolled"] += len(plan_courses)
    
    # Calculate average progress
    students_list = []
    for student in students_dict.values():
        if student["total_lessons"] > 0:
            student["average_progress"] = round((student["completed_lessons"] / student["total_lessons"]) * 100, 1)
        else:
            student["average_progress"] = 0
        del student["total_lessons"]
        del student["completed_lessons"]
        del student["total_plans"]
        students_list.append(student)
    
    return students_list


@router.get("/reports/lessons")
async def get_trainer_lessons_report(
    current_user: models.User = Depends(auth.require_role(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get report of lessons from trainer's plans"""
    
    # Get courses from trainer's plans (not just created_by)
    if current_user.role == "TRAINER":
        plan_ids_created = [p.id for p in db.query(models.TrainingPlan.id).filter(
            models.TrainingPlan.created_by == current_user.id
        ).all()]
        plan_ids_assigned = [t.training_plan_id for t in db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).all()]
        plan_ids = list(set(plan_ids_created + plan_ids_assigned))
        
        # Get course IDs from plans
        plan_course_ids = [pc.course_id for pc in db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id.in_(plan_ids)
        ).all()] if plan_ids else []
        
        # Also include courses created by trainer
        created_course_ids = [c.id for c in db.query(models.Course.id).filter(
            models.Course.created_by == current_user.id
        ).all()]
        
        course_ids = list(set(plan_course_ids + created_course_ids))
    else:
        course_ids = [c.id for c in db.query(models.Course.id).all()]
    
    if not course_ids:
        return {"total_lessons": 0, "total_duration_minutes": 0, "lessons_per_course": 0}
    
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
