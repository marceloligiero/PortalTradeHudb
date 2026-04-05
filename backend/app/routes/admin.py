from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app import models, schemas, auth
from app.pagination import paginate, PaginatedResponse

router = APIRouter()

# Users Management
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
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
                "is_admin": getattr(u, 'is_admin', False),
                "is_formador": getattr(u, 'is_formador', False),
                "is_tutor": getattr(u, 'is_tutor', False),
                "is_liberador": getattr(u, 'is_liberador', False),
                "is_chefe_equipe": getattr(u, 'is_chefe_equipe', False),
                "is_referente": getattr(u, 'is_referente', False),
                "is_gerente": getattr(u, 'is_gerente', False),
                "is_diretor": getattr(u, 'is_diretor', False),
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
        return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})

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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_ROLES)),
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
    ).scalar_subquery()
    
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
        "is_admin": getattr(db_user, 'is_admin', False),
        "is_formador": getattr(db_user, 'is_formador', False),
        "is_tutor": getattr(db_user, 'is_tutor', False),
        "is_liberador": getattr(db_user, 'is_liberador', False),
        "is_chefe_equipe": getattr(db_user, 'is_chefe_equipe', False),
        "is_referente": getattr(db_user, 'is_referente', False),
        "is_gerente": getattr(db_user, 'is_gerente', False),
        "is_diretor": getattr(db_user, 'is_diretor', False),
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
    
    update_data = user_update.model_dump(exclude_unset=True)

    # Apply all updates first
    for key, value in update_data.items():
        setattr(db_user, key, value)

    # Auto-derive role column from flags (flags are the source of truth)
    if db_user.is_admin:
        db_user.role = "ADMIN"
    elif db_user.is_diretor:
        db_user.role = "DIRETOR"
    elif db_user.is_gerente:
        db_user.role = "GERENTE"
    elif db_user.is_chefe_equipe:
        db_user.role = "CHEFE_EQUIPE"
    elif db_user.is_formador:
        db_user.role = "FORMADOR"
    else:
        db_user.role = "USUARIO"

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

# Trainer (Formador) & Manager Validation Management
@router.get("/pending-trainers", response_model=List[schemas.UserWithPendingStatus])
async def list_pending_trainers(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Get all users pending validation.
    Any user with is_pending=True is returned (formador, tutor, liberador, chefe de equipa).
    """
    pending_trainers = db.query(models.User).filter(
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
    Approve a trainer (Formador) or manager registration.
    Sets is_pending=False, allowing them to access their role features.
    """
    trainer = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_pending == True
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="User not found")
    
    trainer.is_pending = False
    trainer.validated_at = datetime.now(timezone.utc)
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
    Reject a pending user registration.
    Deletes the account permanently.
    """
    trainer = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_pending == True
    ).first()
    
    if not trainer:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not trainer.is_pending:
        raise HTTPException(status_code=400, detail="Cannot reject already validated user")
    
    db.delete(trainer)
    db.commit()
    
    return None

# Banks Management
@router.get("/banks", response_model=List[schemas.Bank])
async def list_banks(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
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
        bank_dict = bank.model_dump()
        bank_dict['code'] = bank_code
        db_bank = models.Bank(**bank_dict)
    else:
        db_bank = models.Bank(**bank.model_dump())
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
    
    update_data = bank_update.model_dump(exclude_unset=True)
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

    # Verificar se há cursos associados (legacy FK)
    courses_count = db.query(models.Course).filter(models.Course.bank_id == bank_id).count()
    if courses_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível excluir. Existem {courses_count} cursos associados a este banco."
        )

    # Remover associações many-to-many antes de excluir
    from sqlalchemy.exc import IntegrityError as SAIntegrityError
    try:
        db.query(models.CourseBank).filter(models.CourseBank.bank_id == bank_id).delete()
        db.query(models.TrainingPlanBank).filter(models.TrainingPlanBank.bank_id == bank_id).delete()
        db.delete(db_bank)
        db.commit()
    except SAIntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir este banco. Existem registos associados."
        )
    return None

# Products Management
@router.get("/products", response_model=List[schemas.Product])
async def list_products(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
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
        db_product = models.Product(**product.model_dump())
    else:
        # Gerar código único PROD + número sequencial
        existing_count = db.query(models.Product).count()
        product_code = f"PROD{str(existing_count + 1).zfill(3)}"
        # Garantir que o código gerado não existe
        while db.query(models.Product).filter(models.Product.code == product_code).first():
            existing_count += 1
            product_code = f"PROD{str(existing_count + 1).zfill(3)}"
        product_dict = product.model_dump()
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
    update_data = product_data.model_dump(exclude_unset=True)
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
    
    # Verificar se o produto está associado a cursos ou planos de formação (legacy FK)
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

    # Remover associações many-to-many antes de excluir
    from sqlalchemy.exc import IntegrityError as SAIntegrityError
    try:
        db.query(models.CourseProduct).filter(models.CourseProduct.product_id == product_id).delete()
        db.query(models.TrainingPlanProduct).filter(models.TrainingPlanProduct.product_id == product_id).delete()
        db.query(models.TeamService).filter(models.TeamService.product_id == product_id).delete()
        db.delete(db_product)
        db.commit()
    except SAIntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir este produto. Existem registos associados."
        )
    return None

# Courses Management (Admin)
@router.get("/courses")
async def list_admin_courses(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
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
            "level": course.level,
            "course_type": getattr(course, 'course_type', 'CURSO'),
            "managed_by_tutor": getattr(course, 'managed_by_tutor', False),
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
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
        "level": course.level,
        "course_type": getattr(course, 'course_type', 'CURSO'),
        "managed_by_tutor": getattr(course, 'managed_by_tutor', False),
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
                "difficulty": c.difficulty or "medium",
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
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

@router.put("/courses/{course_id}/lessons/{lesson_id}")
async def update_admin_lesson(
    course_id: int,
    lesson_id: int,
    lesson_update: schemas.LessonUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "FORMADOR"])),
    db: Session = Depends(get_db)
):
    """Update a lesson"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.course_id == course_id
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    update_data = lesson_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lesson, key, value)

    db.commit()
    db.refresh(lesson)

    return {
        "id": lesson.id,
        "course_id": lesson.course_id,
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
    current_user: models.User = Depends(auth.require_role(["ADMIN", "FORMADOR"])),
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
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
        "difficulty": challenge.difficulty,
        "challenge_type": challenge.challenge_type,
        "operations_required": challenge.operations_required,
        "time_limit_minutes": challenge.time_limit_minutes,
        "target_mpu": challenge.target_mpu,
        "max_errors": challenge.max_errors,
        "is_active": challenge.is_active,
        "use_volume_kpi": challenge.use_volume_kpi,
        "use_mpu_kpi": challenge.use_mpu_kpi,
        "use_errors_kpi": challenge.use_errors_kpi,
        "kpi_mode": challenge.kpi_mode,
        "allow_retry": challenge.allow_retry,
        "is_released": challenge.is_released,
        "released_at": challenge.released_at.isoformat() if challenge.released_at else None,
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
    current_user: models.User = Depends(auth.require_role(["ADMIN", "FORMADOR"])),
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
        "difficulty": challenge.difficulty,
        "challenge_type": challenge.challenge_type,
        "operations_required": challenge.operations_required,
        "time_limit_minutes": challenge.time_limit_minutes,
        "target_mpu": challenge.target_mpu,
        "max_errors": challenge.max_errors,
        "is_active": challenge.is_active,
        "use_volume_kpi": challenge.use_volume_kpi,
        "use_mpu_kpi": challenge.use_mpu_kpi,
        "use_errors_kpi": challenge.use_errors_kpi,
        "kpi_mode": challenge.kpi_mode,
        "allow_retry": challenge.allow_retry,
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
        "updated_at": challenge.updated_at.isoformat() if challenge.updated_at else None
    }

@router.delete("/courses/{course_id}/challenges/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_challenge(
    course_id: int,
    challenge_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "FORMADOR"])),
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
    current_user: models.User = Depends(auth.require_role(["ADMIN", "FORMADOR"])),
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
    course_data = course.model_dump(exclude={'bank_ids', 'product_ids'})
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
        "level": db_course.level,
        "course_type": getattr(db_course, 'course_type', 'CURSO'),
        "managed_by_tutor": getattr(db_course, 'managed_by_tutor', False),
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
    current_user: models.User = Depends(auth.require_role(["ADMIN", "FORMADOR"])),
    db: Session = Depends(get_db)
):
    """Update a course with multiple banks and products support"""
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Update basic fields
    update_data = course_update.model_dump(exclude={'bank_ids', 'product_ids'}, exclude_unset=True)
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
        "level": db_course.level,
        "course_type": getattr(db_course, 'course_type', 'CURSO'),
        "managed_by_tutor": getattr(db_course, 'managed_by_tutor', False),
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_ROLES)),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all active non-admin users for dropdowns (any active user can be a student in a plan)"""
    students = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.is_admin == False,
        models.User.is_pending == False,
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_ROLES)),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all active formadores for dropdowns"""
    trainers = db.query(models.User).filter(
        models.User.is_formador == True,
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get overall platform statistics"""
    
    # Count users by role
    total_students = db.query(models.User).filter(models.User.role == "TRAINEE").count()
    total_trainers = db.query(models.User).filter(
        or_(models.User.role == "TRAINER", models.User.is_trainer == True),
        models.User.is_pending == False
    ).count()
    pending_trainers = db.query(models.User).filter(
        models.User.role.in_(["TRAINER", "MANAGER"]),
        models.User.is_pending == True
    ).count()

    # Trainers approved this month
    now = datetime.now(timezone.utc)
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    approved_this_month = db.query(models.User).filter(
        or_(models.User.role == "TRAINER", models.User.is_trainer == True),
        models.User.is_pending == False,
        models.User.validated_at >= first_day_of_month
    ).count()
    
    # Count courses and training plans
    total_courses = db.query(models.Course).count()
    active_courses = db.query(models.Course).filter(models.Course.is_active == True).count()
    total_training_plans = db.query(models.TrainingPlan).count()
    active_training_plans = db.query(models.TrainingPlan).filter(models.TrainingPlan.is_active == True).count()
    
    # Count enrollments and certificates
    total_enrollments = db.query(models.Enrollment).count()
    total_certificates = db.query(models.Certificate).count()
    
    # Calculate completion rate (based on lesson progress)
    completed_enrollment_count = 0
    if total_enrollments > 0:
        all_enrs = db.query(models.Enrollment).all()
        for enr in all_enrs:
            course_lesson_count = db.query(models.Lesson).filter(models.Lesson.course_id == enr.course_id).count()
            if course_lesson_count == 0:
                continue
            done_count = db.query(models.LessonProgress).filter(
                models.LessonProgress.enrollment_id == enr.id,
                models.LessonProgress.status == "COMPLETED"
            ).count()
            if done_count >= course_lesson_count:
                completed_enrollment_count += 1
    avg_completion_rate = (completed_enrollment_count / total_enrollments * 100) if total_enrollments > 0 else 0
    
    # Calculate total study hours (from accumulated_seconds in lesson_progress + challenge submissions)
    total_study_seconds = db.query(func.sum(models.LessonProgress.accumulated_seconds)).scalar() or 0
    # Also add challenge submission time
    challenge_time_minutes = db.query(func.sum(models.ChallengeSubmission.total_time_minutes)).filter(
        models.ChallengeSubmission.total_time_minutes.isnot(None),
        models.ChallengeSubmission.total_time_minutes > 0
    ).scalar() or 0
    total_study_hours = (float(total_study_seconds) / 3600.0) + (float(challenge_time_minutes) / 60.0)
    
    # Active students (enrolled in last 30 days)
    month_ago = datetime.now(timezone.utc) - timedelta(days=30)
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
        "approved_this_month": approved_this_month,
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of all trainers"""
    trainers = db.query(models.User).filter(
        or_(models.User.role == "TRAINER", models.User.is_trainer == True),
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
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
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

@router.get("/reports/insights")
async def get_admin_insights(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Comprehensive insights dashboard for admin.
    Returns deep analytics across all platform dimensions.
    """
    now = datetime.now(timezone.utc)
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # ═══════════════ 1. OVERVIEW KPIs ═══════════════
    total_students = db.query(models.User).filter(models.User.role == "TRAINEE", models.User.is_active == True).count()
    total_trainers = db.query(models.User).filter(or_(models.User.role == "TRAINER", models.User.is_trainer == True), models.User.is_pending == False, models.User.is_active == True).count()
    pending_trainers = db.query(models.User).filter(models.User.role.in_(["TRAINER", "MANAGER"]), models.User.is_pending == True).count()
    total_courses = db.query(models.Course).filter(models.Course.is_active == True).count()
    total_lessons = db.query(models.Lesson).count()
    total_plans = db.query(models.TrainingPlan).count()
    active_plans = db.query(models.TrainingPlan).filter(models.TrainingPlan.is_active == True).count()
    total_enrollments = db.query(models.Enrollment).count()
    total_certificates = db.query(models.Certificate).filter(models.Certificate.is_valid == True).count()
    total_challenges = db.query(models.Challenge).filter(models.Challenge.is_active == True).count()
    total_banks = db.query(models.Bank).filter(models.Bank.is_active == True).count()
    total_products = db.query(models.Product).filter(models.Product.is_active == True).count()
    
    # Study hours (from accumulated_seconds + challenge submission time)
    total_study_seconds = db.query(func.sum(models.LessonProgress.accumulated_seconds)).scalar() or 0
    challenge_time_min = db.query(func.sum(models.ChallengeSubmission.total_time_minutes)).filter(
        models.ChallengeSubmission.total_time_minutes.isnot(None),
        models.ChallengeSubmission.total_time_minutes > 0
    ).scalar() or 0
    total_study_hours = round((float(total_study_seconds) / 3600.0) + (float(challenge_time_min) / 60.0), 1)
    
    # Completion rate (based on lesson progress, not enrollment.completed_at)
    completed_enrollments_count = 0
    if total_enrollments > 0:
        all_enrollments = db.query(models.Enrollment).all()
        for enr in all_enrollments:
            course_lessons_count = db.query(models.Lesson).filter(models.Lesson.course_id == enr.course_id).count()
            if course_lessons_count == 0:
                continue
            completed_count = db.query(models.LessonProgress).filter(
                models.LessonProgress.enrollment_id == enr.id,
                models.LessonProgress.status == "COMPLETED"
            ).count()
            if completed_count >= course_lessons_count:
                completed_enrollments_count += 1
    completion_rate = round((completed_enrollments_count / total_enrollments * 100), 1) if total_enrollments > 0 else 0
    
    # ═══════════════ 2. CHALLENGE / SUBMISSION ANALYTICS ═══════════════
    total_submissions = db.query(models.ChallengeSubmission).count()
    approved_submissions = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.is_approved == True).count()
    rejected_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.is_approved == False,
        models.ChallengeSubmission.status.in_(["REVIEWED", "REJECTED"])
    ).count()
    pending_review = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.status == "PENDING_REVIEW").count()
    in_progress = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.status == "IN_PROGRESS").count()
    approval_rate = round((approved_submissions / total_submissions * 100), 1) if total_submissions > 0 else 0
    
    avg_mpu = db.query(func.avg(models.ChallengeSubmission.calculated_mpu)).filter(
        models.ChallengeSubmission.calculated_mpu.isnot(None),
        models.ChallengeSubmission.calculated_mpu > 0
    ).scalar()
    avg_mpu = round(float(avg_mpu), 2) if avg_mpu else 0
    
    avg_score = db.query(func.avg(models.ChallengeSubmission.score)).filter(
        models.ChallengeSubmission.score.isnot(None)
    ).scalar()
    avg_score = round(float(avg_score), 1) if avg_score else 0
    
    # Error breakdown
    total_errors_methodology = db.query(func.sum(models.ChallengeSubmission.error_methodology)).scalar() or 0
    total_errors_knowledge = db.query(func.sum(models.ChallengeSubmission.error_knowledge)).scalar() or 0
    total_errors_detail = db.query(func.sum(models.ChallengeSubmission.error_detail)).scalar() or 0
    total_errors_procedure = db.query(func.sum(models.ChallengeSubmission.error_procedure)).scalar() or 0
    total_errors_all = int(total_errors_methodology) + int(total_errors_knowledge) + int(total_errors_detail) + int(total_errors_procedure)
    
    error_breakdown = [
        {"type": "methodology", "count": int(total_errors_methodology), "percentage": round(int(total_errors_methodology) / total_errors_all * 100, 1) if total_errors_all > 0 else 0},
        {"type": "knowledge", "count": int(total_errors_knowledge), "percentage": round(int(total_errors_knowledge) / total_errors_all * 100, 1) if total_errors_all > 0 else 0},
        {"type": "detail", "count": int(total_errors_detail), "percentage": round(int(total_errors_detail) / total_errors_all * 100, 1) if total_errors_all > 0 else 0},
        {"type": "procedure", "count": int(total_errors_procedure), "percentage": round(int(total_errors_procedure) / total_errors_all * 100, 1) if total_errors_all > 0 else 0},
    ]
    
    # ═══════════════ 3. PER-PRODUCT (SERVICE) ANALYTICS ═══════════════
    products = db.query(models.Product).filter(models.Product.is_active == True).all()
    products_analytics = []
    for product in products:
        p_courses = db.query(models.CourseProduct).filter(models.CourseProduct.product_id == product.id).count()
        p_plans = db.query(models.TrainingPlanProduct).filter(models.TrainingPlanProduct.product_id == product.id).count()
        # Legacy counts
        p_courses += db.query(models.Course).filter(models.Course.product_id == product.id).count()
        p_plans += db.query(models.TrainingPlan).filter(models.TrainingPlan.product_id == product.id).count()
        products_analytics.append({
            "id": product.id,
            "code": product.code,
            "name": product.name,
            "total_courses": p_courses,
            "total_plans": p_plans,
        })
    
    # ═══════════════ 4. PER-BANK ANALYTICS ═══════════════
    banks = db.query(models.Bank).filter(models.Bank.is_active == True).all()
    banks_analytics = []
    for bank in banks:
        b_courses = db.query(models.CourseBank).filter(models.CourseBank.bank_id == bank.id).count()
        b_plans = db.query(models.TrainingPlanBank).filter(models.TrainingPlanBank.bank_id == bank.id).count()
        b_courses += db.query(models.Course).filter(models.Course.bank_id == bank.id).count()
        b_plans += db.query(models.TrainingPlan).filter(models.TrainingPlan.bank_id == bank.id).count()
        banks_analytics.append({
            "id": bank.id,
            "code": bank.code,
            "name": bank.name,
            "country": bank.country,
            "total_courses": b_courses,
            "total_plans": b_plans,
        })
    
    # ═══════════════ 5. TRAINING PLAN STATUS DISTRIBUTION ═══════════════
    plans_all = db.query(models.TrainingPlan).all()
    plan_status_counts = {"PENDING": 0, "IN_PROGRESS": 0, "COMPLETED": 0, "DELAYED": 0}
    for plan in plans_all:
        s = plan.status or "PENDING"
        if plan.completed_at:
            s = "COMPLETED"
        elif plan.end_date and now > plan.end_date and not plan.completed_at:
            s = "DELAYED"
        if s in plan_status_counts:
            plan_status_counts[s] += 1
        else:
            plan_status_counts[s] = 1
    
    # ═══════════════ 6. LESSON PROGRESS ANALYTICS ═══════════════
    lesson_progress_all = db.query(models.LessonProgress).all()
    lp_status_counts = {"NOT_STARTED": 0, "RELEASED": 0, "IN_PROGRESS": 0, "PAUSED": 0, "COMPLETED": 0}
    total_lp_mpu = []
    for lp in lesson_progress_all:
        s = lp.status or "NOT_STARTED"
        if s in lp_status_counts:
            lp_status_counts[s] += 1
        if lp.mpu and lp.mpu > 0:
            total_lp_mpu.append(lp.mpu)
    
    avg_lesson_mpu = round(sum(total_lp_mpu) / len(total_lp_mpu), 2) if total_lp_mpu else 0
    
    # ═══════════════ 7. TOP PERFORMERS ═══════════════
    # Top students by completed lessons
    top_students_query = db.query(
        models.User.id,
        models.User.full_name,
        models.User.email,
        func.count(models.LessonProgress.id).label("completed_lessons")
    ).join(
        models.LessonProgress, models.LessonProgress.user_id == models.User.id
    ).filter(
        models.LessonProgress.status == "COMPLETED",
        models.User.role == "TRAINEE"
    ).group_by(models.User.id, models.User.full_name, models.User.email
    ).order_by(func.count(models.LessonProgress.id).desc()
    ).limit(5).all()
    
    top_students = [
        {"id": s.id, "name": s.full_name, "email": s.email, "completed_lessons": s.completed_lessons}
        for s in top_students_query
    ]
    
    # Top trainers by activity (lessons finished + challenges applied/reviewed)
    # Include both TRAINER and ADMIN roles since admins also train
    trainer_users = db.query(models.User).filter(
        models.User.role.in_(["TRAINER", "ADMIN"]),
        models.User.is_active == True
    ).all()
    
    top_trainers = []
    for u in trainer_users:
        lessons_given = db.query(models.LessonProgress).filter(
            models.LessonProgress.finished_by == u.id
        ).count()
        challenges_applied = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.submitted_by == u.id
        ).count()
        challenges_reviewed = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.reviewed_by == u.id
        ).count()
        total_activity = lessons_given + challenges_applied + challenges_reviewed
        if total_activity > 0:
            top_trainers.append({
                "id": u.id,
                "name": u.full_name,
                "email": u.email,
                "lessons_given": lessons_given,
                "challenges_applied": challenges_applied,
                "challenges_reviewed": challenges_reviewed,
                "total_activity": total_activity
            })
    
    top_trainers.sort(key=lambda x: x["total_activity"], reverse=True)
    top_trainers = top_trainers[:5]
    
    # ═══════════════ 8. MONTHLY TRENDS (last 6 months) ═══════════════
    monthly_trends = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        
        m_enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.enrolled_at >= month_start,
            models.Enrollment.enrolled_at < month_end
        ).count()
        m_submissions = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.created_at >= month_start,
            models.ChallengeSubmission.created_at < month_end
        ).count()
        m_completions = db.query(models.LessonProgress).filter(
            models.LessonProgress.completed_at >= month_start,
            models.LessonProgress.completed_at < month_end,
            models.LessonProgress.status == "COMPLETED"
        ).count()
        m_new_students = db.query(models.User).filter(
            models.User.role == "TRAINEE",
            models.User.created_at >= month_start,
            models.User.created_at < month_end
        ).count()
        m_certificates = db.query(models.Certificate).filter(
            models.Certificate.issued_at >= month_start,
            models.Certificate.issued_at < month_end
        ).count()
        
        monthly_trends.append({
            "month": month_start.strftime("%Y-%m"),
            "month_label": month_start.strftime("%b %Y"),
            "enrollments": m_enrollments,
            "submissions": m_submissions,
            "completions": m_completions,
            "new_students": m_new_students,
            "certificates": m_certificates,
        })
    
    # ═══════════════ 9. RATINGS SUMMARY ═══════════════
    avg_rating = db.query(func.avg(models.Rating.stars)).scalar()
    avg_rating = round(float(avg_rating), 1) if avg_rating else 0
    total_ratings = db.query(models.Rating).count()
    
    ratings_by_type = {}
    for rt in ["COURSE", "LESSON", "CHALLENGE", "TRAINER", "TRAINING_PLAN"]:
        rt_avg = db.query(func.avg(models.Rating.stars)).filter(models.Rating.rating_type == rt).scalar()
        rt_count = db.query(models.Rating).filter(models.Rating.rating_type == rt).count()
        ratings_by_type[rt.lower()] = {
            "average": round(float(rt_avg), 1) if rt_avg else 0,
            "count": rt_count
        }
    
    # ═══════════════ 10. CHALLENGE DIFFICULTY DISTRIBUTION ═══════════════
    difficulty_dist = {}
    for diff in ["easy", "medium", "hard"]:
        difficulty_dist[diff] = db.query(models.Challenge).filter(
            models.Challenge.difficulty == diff,
            models.Challenge.is_active == True
        ).count()
    
    # ═══════════════ FINAL RESPONSE ═══════════════
    return {
        "generated_at": now.isoformat(),
        "overview": {
            "total_students": total_students,
            "total_trainers": total_trainers,
            "pending_trainers": pending_trainers,
            "total_courses": total_courses,
            "total_lessons": total_lessons,
            "total_plans": total_plans,
            "active_plans": active_plans,
            "total_enrollments": total_enrollments,
            "total_certificates": total_certificates,
            "total_challenges": total_challenges,
            "total_banks": total_banks,
            "total_products": total_products,
            "total_study_hours": total_study_hours,
            "completion_rate": completion_rate,
        },
        "challenges": {
            "total_submissions": total_submissions,
            "approved": approved_submissions,
            "rejected": rejected_submissions,
            "pending_review": pending_review,
            "in_progress": in_progress,
            "approval_rate": approval_rate,
            "avg_mpu": avg_mpu,
            "avg_score": avg_score,
            "error_breakdown": error_breakdown,
            "difficulty_distribution": difficulty_dist,
        },
        "products": products_analytics,
        "banks": banks_analytics,
        "plan_status": plan_status_counts,
        "lesson_progress": {
            "status_distribution": lp_status_counts,
            "avg_mpu": avg_lesson_mpu,
        },
        "top_students": top_students,
        "top_trainers": top_trainers,
        "monthly_trends": monthly_trends,
        "ratings": {
            "average": avg_rating,
            "total": total_ratings,
            "by_type": ratings_by_type,
        },
    }


# ============================================================================
# Dados Mestres — Tabelas de lookup para Erros (Incidências)
# ============================================================================

_LOOKUP_MODELS = {
    "impacts":      models.ErrorImpact,
    "origins":      models.ErrorOrigin,
    "detected_by":  models.ErrorDetectedBy,
    "departments":  models.Department,
    "activities":   models.Activity,
    "error_types":  models.ErrorType,
}


def _generic_list(table_key: str, db: Session):
    Model = _LOOKUP_MODELS[table_key]
    rows = db.query(Model).order_by(Model.name).all()
    result = []
    for r in rows:
        item = {"id": r.id, "name": r.name, "description": r.description, "is_active": r.is_active}
        # Include dependency fields if they exist
        if hasattr(r, 'bank_id'):
            item["bank_id"] = r.bank_id
            if r.bank_id:
                bank = db.query(models.Bank).filter(models.Bank.id == r.bank_id).first()
                item["bank_name"] = bank.name if bank else None
        if hasattr(r, 'department_id'):
            item["department_id"] = r.department_id
            if r.department_id:
                dept = db.query(models.Department).filter(models.Department.id == r.department_id).first()
                item["department_name"] = dept.name if dept else None
        if hasattr(r, 'activity_id'):
            item["activity_id"] = r.activity_id
            if r.activity_id:
                act = db.query(models.Activity).filter(models.Activity.id == r.activity_id).first()
                item["activity_name"] = act.name if act else None
        if hasattr(r, 'origin_id'):
            item["origin_id"] = r.origin_id
            if r.origin_id:
                org = db.query(models.ErrorOrigin).filter(models.ErrorOrigin.id == r.origin_id).first()
                item["origin_name"] = org.name if org else None
        if hasattr(r, 'level'):
            item["level"] = r.level
        if hasattr(r, 'image_url'):
            item["image_url"] = r.image_url
        result.append(item)
    return result


def _generic_create(table_key: str, data: dict, db: Session):
    Model = _LOOKUP_MODELS[table_key]
    kwargs = {"name": data["name"], "description": data.get("description")}
    # Pass dependency fields if present
    for fk in ("bank_id", "department_id", "activity_id", "origin_id"):
        if fk in data and data[fk] is not None:
            kwargs[fk] = data[fk]
    for extra in ("level", "image_url", "is_active"):
        if extra in data and data[extra] is not None:
            kwargs[extra] = data[extra]
    obj = Model(**kwargs)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    item = {"id": obj.id, "name": obj.name, "description": obj.description, "is_active": obj.is_active}
    for fk in ("bank_id", "department_id", "activity_id", "origin_id"):
        if hasattr(obj, fk):
            item[fk] = getattr(obj, fk)
    if hasattr(obj, 'level'):
        item["level"] = obj.level
    if hasattr(obj, 'image_url'):
        item["image_url"] = obj.image_url
    return item


def _generic_update(table_key: str, item_id: int, data: dict, db: Session):
    Model = _LOOKUP_MODELS[table_key]
    obj = db.query(Model).filter(Model.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Registo não encontrado")
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    item = {"id": obj.id, "name": obj.name, "description": obj.description, "is_active": obj.is_active}
    for fk in ("bank_id", "department_id", "activity_id", "origin_id"):
        if hasattr(obj, fk):
            item[fk] = getattr(obj, fk)
    if hasattr(obj, 'level'):
        item["level"] = obj.level
    if hasattr(obj, 'image_url'):
        item["image_url"] = obj.image_url
    return item


def _generic_delete(table_key: str, item_id: int, db: Session):
    Model = _LOOKUP_MODELS[table_key]
    obj = db.query(Model).filter(Model.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Registo não encontrado")
    db.delete(obj)
    db.commit()


# ── Impactos ────────────────────────────────────────────────────

@router.get("/master/impacts")
async def list_impacts(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return _generic_list("impacts", db)


@router.post("/master/impacts", status_code=201)
async def create_impact(
    data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_create("impacts", data, db)


@router.put("/master/impacts/{item_id}")
async def update_impact(
    item_id: int, data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_update("impacts", item_id, data, db)


@router.delete("/master/impacts/{item_id}", status_code=204)
async def delete_impact(
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    _generic_delete("impacts", item_id, db)


# ── Origens ─────────────────────────────────────────────────────

@router.get("/master/origins")
async def list_origins(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return _generic_list("origins", db)


@router.post("/master/origins", status_code=201)
async def create_origin(
    data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_create("origins", data, db)


@router.put("/master/origins/{item_id}")
async def update_origin(
    item_id: int, data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_update("origins", item_id, data, db)


@router.delete("/master/origins/{item_id}", status_code=204)
async def delete_origin(
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    _generic_delete("origins", item_id, db)


# ── Detectado Por ───────────────────────────────────────────────

@router.get("/master/detected-by")
async def list_detected_by(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return _generic_list("detected_by", db)


@router.post("/master/detected-by", status_code=201)
async def create_detected_by(
    data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_create("detected_by", data, db)


@router.put("/master/detected-by/{item_id}")
async def update_detected_by(
    item_id: int, data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_update("detected_by", item_id, data, db)


@router.delete("/master/detected-by/{item_id}", status_code=204)
async def delete_detected_by(
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    _generic_delete("detected_by", item_id, db)


# ── Departamentos ───────────────────────────────────────────────

@router.get("/master/departments")
async def list_departments(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return _generic_list("departments", db)


@router.post("/master/departments", status_code=201)
async def create_department(
    data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_create("departments", data, db)


@router.put("/master/departments/{item_id}")
async def update_department(
    item_id: int, data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_update("departments", item_id, data, db)


@router.delete("/master/departments/{item_id}", status_code=204)
async def delete_department(
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    _generic_delete("departments", item_id, db)


# ── Actividades ─────────────────────────────────────────────────

@router.get("/master/activities")
async def list_activities(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return _generic_list("activities", db)


@router.post("/master/activities", status_code=201)
async def create_activity(
    data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_create("activities", data, db)


@router.put("/master/activities/{item_id}")
async def update_activity(
    item_id: int, data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_update("activities", item_id, data, db)


@router.delete("/master/activities/{item_id}", status_code=204)
async def delete_activity(
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    _generic_delete("activities", item_id, db)


# ── Tipos de Erro ───────────────────────────────────────────────

@router.get("/master/error-types")
async def list_error_types(
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return _generic_list("error_types", db)


@router.post("/master/error-types", status_code=201)
async def create_error_type(
    data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_create("error_types", data, db)


@router.put("/master/error-types/{item_id}")
async def update_error_type(
    item_id: int, data: dict,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    return _generic_update("error_types", item_id, data, db)


@router.delete("/master/error-types/{item_id}", status_code=204)
async def delete_error_type(
    item_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db),
):
    _generic_delete("error_types", item_id, db)


# ════════════════════════════════════════════════════════════════════════
# Filtered endpoints for cascading dependencies
# ════════════════════════════════════════════════════════════════════════

@router.get("/master/activities/filter")
async def list_activities_filtered(
    bank_id: int = None,
    department_id: int = None,
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    """Activities filtered by bank + department (cascading dependency)."""
    q = db.query(models.Activity).filter(models.Activity.is_active == True)
    if bank_id:
        q = q.filter(models.Activity.bank_id == bank_id)
    if department_id:
        q = q.filter(models.Activity.department_id == department_id)
    return [
        {"id": r.id, "name": r.name, "bank_id": r.bank_id, "department_id": r.department_id}
        for r in q.order_by(models.Activity.name).all()
    ]


@router.get("/master/error-types/filter")
async def list_error_types_filtered(
    activity_id: int = None,
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    """Error types filtered by activity (cascading dependency)."""
    q = db.query(models.ErrorType).filter(models.ErrorType.is_active == True)
    if activity_id:
        q = q.filter(models.ErrorType.activity_id == activity_id)
    return [
        {"id": r.id, "name": r.name, "activity_id": r.activity_id}
        for r in q.order_by(models.ErrorType.name).all()
    ]


@router.get("/master/categories/filter")
async def list_categories_filtered(
    origin_id: int = None,
    current_user: models.User = Depends(auth.require_role(auth.ADMIN_TRAINER_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    """Categories (Tipología Error) filtered by origin (cascading dependency)."""
    q = db.query(models.ErrorCategory).filter(models.ErrorCategory.is_active == True)
    if origin_id:
        q = q.filter(models.ErrorCategory.origin_id == origin_id)
    return [
        {"id": r.id, "name": r.name, "origin_id": r.origin_id}
        for r in q.order_by(models.ErrorCategory.name).all()
    ]