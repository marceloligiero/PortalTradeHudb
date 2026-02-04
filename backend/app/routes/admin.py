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
    # Gerar código automaticamente se não fornecido
    if not bank.code:
        # Gerar código único baseado no país + número sequencial
        prefix = bank.country
        existing_count = db.query(models.Bank).filter(
            models.Bank.code.like(f"{prefix}%")
        ).count()
        bank_code = f"{prefix}{str(existing_count + 1).zfill(3)}"
        bank_dict = bank.dict()
        bank_dict['code'] = bank_code
        db_bank = models.Bank(**bank_dict)
    else:
        db_bank = models.Bank(**bank.dict())
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    return db_bank

@router.put("/banks/{bank_id}", response_model=schemas.Bank)
async def update_bank(
    bank_id: int,
    bank_update: schemas.BankUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Atualizar banco (exceto código)"""
    db_bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not db_bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    update_data = bank_update.dict(exclude_unset=True)
    # Não permitir alterar o código
    if 'code' in update_data:
        del update_data['code']
    
    for key, value in update_data.items():
        setattr(db_bank, key, value)
    
    db.commit()
    db.refresh(db_bank)
    return db_bank

@router.delete("/banks/{bank_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank(
    bank_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Excluir banco"""
    db_bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not db_bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    # Verificar se há cursos associados
    courses_count = db.query(models.Course).filter(models.Course.bank_id == bank_id).count()
    if courses_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível excluir. Existem {courses_count} cursos associados a este banco."
        )
    
    db.delete(db_bank)
    db.commit()
    return None

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
    # Se código fornecido, verificar se já existe
    if product.code:
        existing = db.query(models.Product).filter(models.Product.code == product.code).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Já existe um produto com o código '{product.code}'"
            )
        db_product = models.Product(**product.dict())
    else:
        # Gerar código único PROD + número sequencial
        existing_count = db.query(models.Product).count()
        product_code = f"PROD{str(existing_count + 1).zfill(3)}"
        # Garantir que o código gerado não existe
        while db.query(models.Product).filter(models.Product.code == product_code).first():
            existing_count += 1
            product_code = f"PROD{str(existing_count + 1).zfill(3)}"
        product_dict = product.dict()
        product_dict['code'] = product_code
        db_product = models.Product(**product_dict)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
async def update_product(
    product_id: int,
    product_data: schemas.ProductUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Atualizar produto existente (exceto código)"""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Atualizar apenas campos fornecidos
    update_data = product_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Excluir produto (apenas se não estiver em uso)"""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Verificar se o produto está associado a cursos ou planos de formação
    courses_count = db.query(models.Course).filter(models.Course.product_id == product_id).count()
    if courses_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível excluir. Este produto está associado a {courses_count} curso(s)."
        )
    
    plans_count = db.query(models.TrainingPlan).filter(models.TrainingPlan.product_id == product_id).count()
    if plans_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível excluir. Este produto está associado a {plans_count} plano(s) de formação."
        )
    
    db.delete(db_product)
    db.commit()
    return None

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
        
        # Get associated banks (from new N:N table)
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
        
        # Get associated products (from new N:N table)
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
        
        courses_list.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bank_id": course.bank_id,  # Legacy
            "product_id": course.product_id,  # Legacy
            "bank_ids": [b["id"] for b in banks],
            "product_ids": [p["id"] for p in products],
            "banks": banks,
            "products": products,
            "bank_code": banks[0]["code"] if banks else "N/A",
            "bank_name": banks[0]["name"] if banks else "N/A",
            "product_name": products[0]["name"] if products else "N/A",
            "trainer_id": course.created_by,
            "trainer_name": trainer.full_name if trainer else "Unknown",
            "total_students": total_students,
            "created_at": course.created_at.isoformat() if course.created_at else None
        })
    
    return courses_list

@router.get("/courses/{course_id}")
async def get_admin_course(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Get course details with lessons and challenges"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get creator/trainer info (created_by is the trainer)
    trainer = db.query(models.User).filter(models.User.id == course.created_by).first() if course.created_by else None
    
    # Get associated banks (from new N:N table)
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
    
    # Get associated products (from new N:N table)
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
        "bank_id": course.bank_id,  # Legacy
        "product_id": course.product_id,  # Legacy
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
                "difficulty": "medium",  # Not in model, using default
                "max_score": c.operations_required,
                "time_limit_minutes": c.time_limit_minutes
            } for c in challenges
        ]
    }

@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_course(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Delete a course"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(course)
    db.commit()
    return None

# Lesson Detail endpoint
@router.get("/courses/{course_id}/lessons/{lesson_id}")
async def get_admin_lesson(
    course_id: int,
    lesson_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Get lesson details"""
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

@router.delete("/courses/{course_id}/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_lesson(
    course_id: int,
    lesson_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Delete a lesson"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.course_id == course_id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    db.delete(lesson)
    db.commit()
    return None

# Challenge Detail endpoint
@router.get("/courses/{course_id}/challenges/{challenge_id}")
async def get_admin_challenge(
    course_id: int,
    challenge_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Get challenge details with stats"""
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

@router.put("/courses/{course_id}/challenges/{challenge_id}")
async def update_admin_challenge(
    course_id: int,
    challenge_id: int,
    challenge_data: schemas.ChallengeUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Update a challenge"""
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id,
        models.Challenge.course_id == course_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Update only provided fields
    update_data = challenge_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(challenge, field, value)
    
    db.commit()
    db.refresh(challenge)
    
    return {
        "id": challenge.id,
        "course_id": challenge.course_id,
        "title": challenge.title,
        "description": challenge.description,
        "challenge_type": challenge.challenge_type,
        "operations_required": challenge.operations_required,
        "time_limit_minutes": challenge.time_limit_minutes,
        "target_mpu": challenge.target_mpu,
        "max_errors": challenge.max_errors,
        "is_active": challenge.is_active,
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
        "updated_at": challenge.updated_at.isoformat() if challenge.updated_at else None
    }

@router.delete("/courses/{course_id}/challenges/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_challenge(
    course_id: int,
    challenge_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Delete a challenge"""
    challenge = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id,
        models.Challenge.course_id == course_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    db.delete(challenge)
    db.commit()
    return None

@router.post("/courses", status_code=status.HTTP_201_CREATED)
async def create_admin_course(
    course: schemas.CourseCreate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Create a new course as admin with multiple banks and products support"""
    # Extract bank_ids and product_ids from request
    bank_ids = course.bank_ids or []
    product_ids = course.product_ids or []
    
    # For backward compatibility, include legacy bank_id/product_id if provided
    if course.bank_id and course.bank_id not in bank_ids:
        bank_ids.append(course.bank_id)
    if course.product_id and course.product_id not in product_ids:
        product_ids.append(course.product_id)
    
    # Create course without bank_ids and product_ids
    course_data = course.dict(exclude={'bank_ids', 'product_ids'})
    db_course = models.Course(
        **course_data,
        created_by=current_user.id
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    # Create bank associations
    for bank_id in bank_ids:
        bank_assoc = models.CourseBank(course_id=db_course.id, bank_id=bank_id)
        db.add(bank_assoc)
    
    # Create product associations
    for product_id in product_ids:
        product_assoc = models.CourseProduct(course_id=db_course.id, product_id=product_id)
        db.add(product_assoc)
    
    db.commit()
    
    # Return course with banks and products
    return {
        "id": db_course.id,
        "title": db_course.title,
        "description": db_course.description,
        "bank_id": db_course.bank_id,
        "product_id": db_course.product_id,
        "bank_ids": bank_ids,
        "product_ids": product_ids,
        "created_by": db_course.created_by,
        "is_active": db_course.is_active,
        "created_at": db_course.created_at.isoformat() if db_course.created_at else None
    }


@router.put("/courses/{course_id}")
async def update_admin_course(
    course_id: int,
    course_update: schemas.CourseUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Update a course with multiple banks and products support"""
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Update basic fields
    update_data = course_update.dict(exclude={'bank_ids', 'product_ids'}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    # Update bank associations if provided
    if course_update.bank_ids is not None:
        # Clear existing associations
        db.query(models.CourseBank).filter(models.CourseBank.course_id == course_id).delete()
        # Create new associations
        for bank_id in course_update.bank_ids:
            bank_assoc = models.CourseBank(course_id=course_id, bank_id=bank_id)
            db.add(bank_assoc)
    
    # Update product associations if provided
    if course_update.product_ids is not None:
        # Clear existing associations
        db.query(models.CourseProduct).filter(models.CourseProduct.course_id == course_id).delete()
        # Create new associations
        for product_id in course_update.product_ids:
            product_assoc = models.CourseProduct(course_id=course_id, product_id=product_id)
            db.add(product_assoc)
    
    db.commit()
    db.refresh(db_course)
    
    # Get updated associations
    bank_ids = [ba.bank_id for ba in db.query(models.CourseBank).filter(models.CourseBank.course_id == course_id).all()]
    product_ids = [pa.product_id for pa in db.query(models.CourseProduct).filter(models.CourseProduct.course_id == course_id).all()]
    
    return {
        "id": db_course.id,
        "title": db_course.title,
        "description": db_course.description,
        "bank_id": db_course.bank_id,
        "product_id": db_course.product_id,
        "bank_ids": bank_ids,
        "product_ids": product_ids,
        "created_by": db_course.created_by,
        "is_active": db_course.is_active,
        "created_at": db_course.created_at.isoformat() if db_course.created_at else None
    }

# Students List (for dropdowns) - includes TRAINEE and TRAINER users
# TRAINERs can be students in training plans where they are not trainers
@router.get("/students")
async def list_all_students(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all active students for dropdowns (includes TRAINERs as they can be students in other plans)"""
    students = db.query(models.User).filter(
        models.User.role.in_(["TRAINEE", "TRAINER"]),
        models.User.is_active == True
    ).all()
    return [
        {
            "id": s.id, 
            "email": s.email, 
            "full_name": s.full_name,
            "role": s.role  # Include role so frontend can show/filter
        } 
        for s in students
    ]

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
    
    # Challenge statistics
    total_challenges = db.query(models.Challenge).count()
    total_submissions = db.query(models.ChallengeSubmission).count()
    approved_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.is_approved == True
    ).count()
    approval_rate = (approved_submissions / total_submissions * 100) if total_submissions > 0 else 0
    
    # Average MPU across all submissions
    avg_mpu = db.query(func.avg(models.ChallengeSubmission.calculated_mpu)).filter(
        models.ChallengeSubmission.calculated_mpu.isnot(None)
    ).scalar() or 0
    
    # Submissions this month
    submissions_this_month = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.created_at >= month_ago
    ).count()
    
    # Banks and Products counts
    total_banks = db.query(models.Bank).filter(models.Bank.is_active == True).count()
    total_products = db.query(models.Product).filter(models.Product.is_active == True).count()
    
    # Lessons count
    total_lessons = db.query(models.Lesson).count()
    
    # Recent submissions (last 5)
    recent_submissions = db.query(models.ChallengeSubmission).order_by(
        models.ChallengeSubmission.created_at.desc()
    ).limit(5).all()
    
    recent_submissions_data = []
    for sub in recent_submissions:
        student = db.query(models.User).filter(models.User.id == sub.user_id).first()
        challenge = db.query(models.Challenge).filter(models.Challenge.id == sub.challenge_id).first()
        recent_submissions_data.append({
            "id": sub.id,
            "challenge_title": challenge.title if challenge else "N/A",
            "student_name": student.full_name if student else "N/A",
            "is_approved": sub.is_approved,
            "calculated_mpu": sub.calculated_mpu,
            "submitted_at": sub.created_at.isoformat() if sub.created_at else None
        })
    
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
        "certificates_issued": total_certificates,
        # New fields
        "total_challenges": total_challenges,
        "total_submissions": total_submissions,
        "approved_submissions": approved_submissions,
        "approval_rate": round(approval_rate, 2),
        "avg_mpu": round(float(avg_mpu), 2),
        "submissions_this_month": submissions_this_month,
        "total_banks": total_banks,
        "total_products": total_products,
        "total_lessons": total_lessons,
        "recent_submissions": recent_submissions_data
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
