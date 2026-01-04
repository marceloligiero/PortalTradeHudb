from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas, auth
from app.pagination import paginate, PaginatedResponse

router = APIRouter()

# Users Management
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """List users with simple dict response to avoid pydantic ORM serialization issues.
    This endpoint wraps processing in a try/except and returns traceback in the
    response for easier debugging while developing. Remove detailed trace before
    production use.
    """
    import traceback
    from fastapi.responses import JSONResponse
    try:
        query = db.query(models.User)
        items, total = paginate(query, page, page_size)
        total_pages = (total + page_size - 1) // page_size

        users_list = []
        for u in items:
            users_list.append({
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "is_pending": u.is_pending,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            })

        return {
            "items": users_list,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    except Exception as e:
        tb = traceback.format_exc()
        logger = __import__('logging').getLogger('admin.routes')
        logger.error(f"Error in list_users: {e}\n{tb}")
        try:
            with open("backend/error_trace.txt", "w", encoding="utf-8") as _f:
                _f.write(tb)
        except Exception:
            # best-effort file logging for local debugging
            pass
        return JSONResponse(status_code=500, content={"detail": str(e), "trace": tb})

@router.post("/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = auth.get_password_hash(user.password)
    # Validate generated hash
    if not auth.is_valid_bcrypt_hash(hashed_password):
        raise HTTPException(status_code=500, detail="Generated password hash is invalid")
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    from app.audit import log_audit
    log_audit(
        action="USER_CREATED_BY_ADMIN",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="User",
        resource_id=db_user.id,
        details=f"Created user: {db_user.email}, Role: {db_user.role}"
    )
    
    return db_user

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific user"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get enrollments count
    enrollments_count = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == user_id
    ).count()
    
    # Get certificates count
    certificates_count = db.query(models.Certificate).filter(
        models.Certificate.user_id == user_id
    ).count()
    
    # Get user's enrollment IDs
    user_enrollment_ids = db.query(models.Enrollment.id).filter(
        models.Enrollment.user_id == user_id
    ).subquery()
    
    # Get lesson progress through enrollments
    completed_lessons = db.query(models.LessonProgress).filter(
        models.LessonProgress.enrollment_id.in_(user_enrollment_ids),
        models.LessonProgress.status == "COMPLETED"
    ).count()
    
    total_lessons = db.query(models.LessonProgress).filter(
        models.LessonProgress.enrollment_id.in_(user_enrollment_ids)
    ).count()
    
    # Get total study time (actual_time_minutes)
    total_study_time = db.query(func.sum(models.LessonProgress.actual_time_minutes)).filter(
        models.LessonProgress.enrollment_id.in_(user_enrollment_ids)
    ).scalar() or 0
    
    return {
        "id": db_user.id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role,
        "is_active": db_user.is_active,
        "is_pending": db_user.is_pending,
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
        "stats": {
            "enrollments_count": enrollments_count,
            "certificates_count": certificates_count,
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons,
            "total_study_time_minutes": total_study_time,
            "completion_rate": round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1)
        }
    }

@router.put("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from app.audit import log_audit
    log_audit(
        action="USER_DELETED",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="User",
        resource_id=db_user.id,
        details=f"Deleted user: {db_user.email}"
    )
    
    # Delete related records first (cascade delete)
    # Get user's enrollments
    user_enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).all()
    enrollment_ids = [e.id for e in user_enrollments]
    
    # Delete lesson progress for user's enrollments
    if enrollment_ids:
        db.query(models.LessonProgress).filter(models.LessonProgress.enrollment_id.in_(enrollment_ids)).delete(synchronize_session=False)
    
    # Delete enrollments
    db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).delete(synchronize_session=False)
    
    # Delete certificates
    db.query(models.Certificate).filter(models.Certificate.user_id == user_id).delete(synchronize_session=False)
    
    # Delete challenge submissions
    db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.submitted_by == user_id).delete(synchronize_session=False)
    
    # Delete training plan assignments
    db.query(models.TrainingPlanAssignment).filter(models.TrainingPlanAssignment.user_id == user_id).delete(synchronize_session=False)
    
    # Now delete the user
    db.delete(db_user)
    db.commit()
    
    return None

# Trainer (Formador) Validation Management
@router.get("/pending-trainers", response_model=List[schemas.UserWithPendingStatus])
async def list_pending_trainers(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Get all trainers (Formadores) pending validation.
    Only trainers with is_pending=True and role='TRAINER' are returned.
    """
    pending_trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_pending == True
    ).all()
    return pending_trainers

@router.post("/validate-trainer/{user_id}", response_model=schemas.UserWithPendingStatus)
async def validate_trainer(
    user_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Approve a trainer (Formador) registration.
    Sets is_pending=False, allowing the trainer to create courses.
    """
    trainer = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "TRAINER"
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    if not trainer.is_pending:
        raise HTTPException(status_code=400, detail="Trainer is already validated")
    
    trainer.is_pending = False
    db.commit()
    db.refresh(trainer)
    
    return trainer

@router.post("/reject-trainer/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def reject_trainer(
    user_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Reject a trainer (Formador) registration.
    Deletes the trainer account permanently.
    """
    trainer = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "TRAINER"
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    if not trainer.is_pending:
        raise HTTPException(status_code=400, detail="Cannot reject already validated trainer")
    
    db.delete(trainer)
    db.commit()
    
    return None

# Banks Management
@router.get("/banks", response_model=List[schemas.Bank])
async def list_banks(
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    banks = db.query(models.Bank).all()
    return banks

@router.post("/banks", response_model=schemas.Bank, status_code=status.HTTP_201_CREATED)
async def create_bank(
    bank: schemas.BankCreate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    db_bank = models.Bank(**bank.dict())
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    return db_bank

# Products Management
@router.get("/products", response_model=List[schemas.Product])
async def list_products(
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    products = db.query(models.Product).all()
    return products

@router.post("/products", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: schemas.ProductCreate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# Courses Management (Admin)
@router.get("/courses")
async def list_admin_courses(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all courses with trainer and student information"""
    courses = db.query(models.Course).all()
    
    courses_list = []
    for course in courses:
        # Get trainer info
        trainer = db.query(models.User).filter(models.User.id == course.created_by).first()
        
        # Count students enrolled
        total_students = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id
        ).count()
        
        courses_list.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bank_id": course.bank_id,
            "product_id": course.product_id,
            "bank_code": course.bank.code if course.bank else "N/A",
            "bank_name": course.bank.name if course.bank else "N/A",
            "product_name": course.product.name if course.product else "N/A",
            "trainer_id": course.created_by,
            "trainer_name": trainer.full_name if trainer else "Unknown",
            "total_students": total_students,
            "created_at": course.created_at.isoformat() if course.created_at else None
        })
    
    return courses_list

@router.post("/courses", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_admin_course(
    course: schemas.CourseCreate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Create a new course as admin"""
    db_course = models.Course(
        **course.dict(),
        created_by=current_user.id
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    return db_course

# Students List (for dropdowns)
@router.get("/students")
async def list_all_students(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all active students for dropdowns"""
    students = db.query(models.User).filter(
        models.User.role == "TRAINEE",
        models.User.is_active == True
    ).all()
    return [{"id": s.id, "email": s.email, "full_name": s.full_name} for s in students]

# Trainers List (for dropdowns)
@router.get("/trainers")
async def list_trainers(
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all active trainers"""
    trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_active == True,
        models.User.is_pending == False
    ).all()
    
    return [
        {
            "id": trainer.id,
            "email": trainer.email,
            "full_name": trainer.full_name,
            "role": trainer.role
        }
        for trainer in trainers
    ]

# Reports
@router.get("/reports/stats")
async def get_admin_stats(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get overall platform statistics"""
    
    # Count users by role
    total_students = db.query(models.User).filter(models.User.role == "TRAINEE").count()
    total_trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_pending == False
    ).count()
    pending_trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_pending == True
    ).count()
    
    # Count courses and training plans
    total_courses = db.query(models.Course).count()
    active_courses = db.query(models.Course).filter(models.Course.is_active == True).count()
    total_training_plans = db.query(models.TrainingPlan).count()
    active_training_plans = db.query(models.TrainingPlan).filter(models.TrainingPlan.is_active == True).count()
    
    # Count enrollments and certificates
    total_enrollments = db.query(models.Enrollment).count()
    total_certificates = db.query(models.Certificate).count()
    
    # Calculate completion rate
    completed_enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.completed_at.isnot(None)
    ).count()
    avg_completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    
    # Calculate total study hours
    total_study_hours = db.query(func.sum(models.LessonProgress.actual_time_minutes)).scalar() or 0
    total_study_hours = float(total_study_hours) / 60.0
    
    # Active students (enrolled in last 30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    active_students = db.query(models.Enrollment.user_id).filter(
        models.Enrollment.enrolled_at >= month_ago
    ).distinct().count()
    
    return {
        "total_users": total_students + total_trainers,
        "total_students": total_students,
        "total_trainers": total_trainers,
        "pending_trainers": pending_trainers,
        "total_courses": total_courses,
        "active_courses": active_courses,
        "total_training_plans": total_training_plans,
        "active_training_plans": active_training_plans,
        "total_enrollments": total_enrollments,
        "total_certificates": total_certificates,
        "avg_completion_rate": round(avg_completion_rate, 2),
        "total_study_hours": round(total_study_hours, 2),
        "active_students": active_students,
        "certificates_issued": total_certificates
    }

@router.get("/reports/courses")
async def get_admin_courses_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of all courses"""
    courses = db.query(models.Course).all()
    
    courses_report = []
    for course in courses:
        # Get trainer info
        trainer = db.query(models.User).filter(models.User.id == course.created_by).first()
        
        # Count students and lessons
        total_students = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id
        ).count()
        
        total_lessons = db.query(models.Lesson).filter(
            models.Lesson.course_id == course.id
        ).count()
        
        courses_report.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bank_code": course.bank.code if course.bank else "N/A",
            "trainer_name": trainer.full_name if trainer else "Unknown",
            "total_students": total_students,
            "total_lessons": total_lessons,
            "created_at": course.created_at.isoformat() if course.created_at else None
        })
    
    return courses_report

@router.get("/reports/trainers")
async def get_admin_trainers_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of all trainers"""
    trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_pending == False
    ).all()
    
    trainers_report = []
    for trainer in trainers:
        # Count courses created
        courses_created = db.query(models.Course).filter(
            models.Course.created_by == trainer.id
        ).count()
        
        # Count total students across all courses
        course_ids = [c.id for c in db.query(models.Course.id).filter(
            models.Course.created_by == trainer.id
        ).all()]
        
        total_students = db.query(models.Enrollment.user_id).filter(
            models.Enrollment.course_id.in_(course_ids) if course_ids else False
        ).distinct().count() if course_ids else 0
        
        trainers_report.append({
            "id": trainer.id,
            "full_name": trainer.full_name,
            "email": trainer.email,
            "bank_code": "PT",  # TODO: link trainers to banks
            "courses_created": courses_created,
            "total_students": total_students,
            "created_at": trainer.created_at.isoformat() if trainer.created_at else None
        })
    
    return trainers_report

@router.get("/reports/training-plans")
async def get_admin_training_plans_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of all training plans"""
    plans = db.query(models.TrainingPlan).all()
    
    plans_report = []
    for plan in plans:
        # Get trainer info
        trainer = db.query(models.User).filter(models.User.id == plan.trainer_id).first()
        
        # Count assignments
        assignments = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan.id
        ).count()
        
        plans_report.append({
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "bank_code": (plan.bank.code if getattr(plan, 'bank', None) else (getattr(plan, 'bank_code', None) or getattr(plan, 'bank_id', None))),
            "trainer_name": trainer.full_name if trainer else "Unknown",
            "students_assigned": assignments,
            "start_date": plan.start_date.isoformat() if plan.start_date else None,
            "end_date": plan.end_date.isoformat() if plan.end_date else None,
            "status": "active" if plan.is_active else "inactive"
        })
    
    return plans_report
