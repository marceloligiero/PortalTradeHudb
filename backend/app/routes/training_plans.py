from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

# ============== TRAINING PLANS CRUD ==============

@router.get("/test")
async def test_get_endpoint():
    """Endpoint GET de teste sem autenticação"""
    return {"message": "GET Training plans endpoint is working!"}

@router.post("/test")
async def test_post_endpoint():
    """Endpoint POST de teste sem autenticação"""
    return {"message": "POST Training plans endpoint is working!"}

# LIST - GET /
@router.get("/")
async def list_training_plans(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar planos de formação:
    - ADMIN: Vê todos
    - TRAINER: Vê apenas os que ele é formador
    - STUDENT: Vê apenas os que foi atribuído
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Load plans according to role
        if current_user.role == "ADMIN":
            plans = db.query(models.TrainingPlan).all()
        elif current_user.role == "TRAINER":
            plans = db.query(models.TrainingPlan).filter(
                models.TrainingPlan.trainer_id == current_user.id
            ).all()
        else:  # STUDENT
            # Buscar planos atribuídos ao formando
            assignments = db.query(models.TrainingPlanAssignment).filter(
                models.TrainingPlanAssignment.user_id == current_user.id
            ).all()
            plan_ids = [a.training_plan_id for a in assignments]
            if plan_ids:
                plans = db.query(models.TrainingPlan).filter(
                    models.TrainingPlan.id.in_(plan_ids)
                ).all()
            else:
                plans = []

        result = []
        for plan in plans:
            # count courses in plan
            plan_courses = db.query(models.TrainingPlanCourse).filter(
                models.TrainingPlanCourse.training_plan_id == plan.id
            ).all()
            total_courses = len(plan_courses)

            # Get student info (1 student per plan)
            student_info = None
            if plan.student_id:
                student = db.query(models.User).filter(models.User.id == plan.student_id).first()
                if student:
                    student_info = {
                        "id": student.id,
                        "full_name": student.full_name,
                        "email": student.email
                    }

            # calculate total duration in minutes from lessons
            total_minutes = 0
            for pc in plan_courses:
                lessons = db.query(models.Lesson).filter(models.Lesson.course_id == pc.course_id).all()
                total_minutes += sum((l.estimated_minutes or 0) for l in lessons)

            total_hours = round(total_minutes / 60)

            result.append({
                "id": plan.id,
                "title": plan.title,
                "description": plan.description,
                "trainer_id": plan.trainer_id,
                "trainer": {
                    "id": plan.trainer.id if plan.trainer else None,
                    "full_name": plan.trainer.full_name if plan.trainer else None
                } if hasattr(plan, 'trainer') else None,
                "total_courses": total_courses,
                "student": student_info,
                "total_duration_hours": total_hours,
                "start_date": plan.start_date.isoformat() if plan.start_date else None,
                "end_date": plan.end_date.isoformat() if plan.end_date else None,
                "created_at": plan.created_at.isoformat() if plan.created_at else None
            })

        logger.info(f"User {current_user.email} fetched {len(result)} training plans")
        return result
    
    except Exception as e:
        logger.error(f"Error listing training plans: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing training plans: {str(e)}"
        )

# CREATE - POST /
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_training_plan(
    plan: schemas.TrainingPlanCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar novo plano de formação
    ADMIN e TRAINER podem criar
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Creating training plan - User: {current_user.email}, Role: {current_user.role}")
    
    # Verificar role manualmente
    if current_user.role not in ["ADMIN", "TRAINER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    # Validar se o formador existe e tem role TRAINER
    trainer = db.query(models.User).filter(
        models.User.id == plan.trainer_id,
        models.User.role == "TRAINER",
        models.User.is_pending == False
    ).first()
    
    if not trainer:
        raise HTTPException(
            status_code=400, 
            detail="Trainer not found or not validated. Please select a valid trainer."
        )
    
    # Validar banco se fornecido
    if plan.bank_id:
        bank = db.query(models.Bank).filter(models.Bank.id == plan.bank_id).first()
        if not bank:
            raise HTTPException(status_code=400, detail="Bank not found")
    
    # Validar produto se fornecido
    if plan.product_id:
        product = db.query(models.Product).filter(models.Product.id == plan.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail="Product not found")
    
    # Converter datas para datetime se fornecidas. Accept both str and datetime inputs.
    from datetime import datetime
    start_date_dt = None
    end_date_dt = None

    if plan.start_date:
        # If schema already provided a datetime, use it directly
        if isinstance(plan.start_date, datetime):
            start_date_dt = plan.start_date
        else:
            try:
                start_date_dt = datetime.fromisoformat(plan.start_date.replace('Z', '+00:00'))
            except Exception:
                start_date_dt = datetime.strptime(plan.start_date, '%Y-%m-%d')

    if plan.end_date:
        if isinstance(plan.end_date, datetime):
            end_date_dt = plan.end_date
        else:
            try:
                end_date_dt = datetime.fromisoformat(plan.end_date.replace('Z', '+00:00'))
            except Exception:
                end_date_dt = datetime.strptime(plan.end_date, '%Y-%m-%d')
    
    # Criar plano de formação
    try:
        db_plan = models.TrainingPlan(
            title=plan.title,
            description=plan.description,
            trainer_id=plan.trainer_id,
            student_id=plan.student_id,  # 1 aluno por plano
            bank_id=plan.bank_id,
            product_id=plan.product_id,
            start_date=start_date_dt,
            end_date=end_date_dt,
            created_by=current_user.id,
            is_active=True
        )
        
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
    except Exception as e:
        logger.error(f"Error creating training plan: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating training plan: {str(e)}"
        )
    
    # Adicionar cursos ao plano se fornecidos
    if plan.course_ids:
        for idx, course_id in enumerate(plan.course_ids):
            course = db.query(models.Course).filter(models.Course.id == course_id).first()
            if course:
                plan_course = models.TrainingPlanCourse(
                    training_plan_id=db_plan.id,
                    course_id=course_id,
                    order_index=idx
                )
                db.add(plan_course)
        db.commit()
    
    # Refresh para carregar relationships
    try:
        db.refresh(db_plan)
        logger.info(f"Training plan created successfully: ID={db_plan.id}")
        # Manually serialize into a JSON-friendly dict to avoid FastAPI
        # response_model validation mismatches between pydantic versions.
        resp = {
            "id": db_plan.id,
            "title": db_plan.title,
            "description": db_plan.description,
            "trainer_id": db_plan.trainer_id,
            "student_id": db_plan.student_id,
            "bank_id": db_plan.bank_id,
            "product_id": db_plan.product_id,
            "start_date": db_plan.start_date.isoformat() if db_plan.start_date else None,
            "end_date": db_plan.end_date.isoformat() if db_plan.end_date else None,
            "created_by": db_plan.created_by,
            "is_active": db_plan.is_active,
            "created_at": db_plan.created_at.isoformat() if db_plan.created_at else None,
            "total_duration_minutes": None,
            "completed_minutes": None,
            "remaining_minutes": None,
            "progress_percentage": None,
        }
        return resp
    except Exception as e:
        logger.error(f"Error refreshing training plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error refreshing training plan: {str(e)}"
        )

# GET ONE - GET /{plan_id}
@router.get("/{plan_id}")
async def get_training_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de um plano de formação
    Verifica permissões de acesso
    """
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_id
    ).options(
        joinedload(models.TrainingPlan.trainer),
        joinedload(models.TrainingPlan.courses),
        joinedload(models.TrainingPlan.assignments)
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    # Verificar permissões
    if current_user.role == "STUDENT":
        # Verificar se o formando está atribuído
        assignment = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan_id,
            models.TrainingPlanAssignment.user_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Not authorized to access this training plan")
    elif current_user.role == "TRAINER":
        # Verificar se é o formador responsável
        if plan.trainer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this training plan")
    
    # Serialize plan to a JSON-friendly dict (ensure dates are ISO strings)
    # Include courses list and student count to support frontend details view
    try:
        # Query training_plan_courses and eager-load the related Course, Lessons and Challenges
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan.id
        ).options(
            joinedload(models.TrainingPlanCourse.course).joinedload(models.Course.lessons),
            joinedload(models.TrainingPlanCourse.course).joinedload(models.Course.challenges)
        ).all()

        courses_data = []
        for pc in plan_courses:
            course = pc.course
            if course:
                # Lessons
                lessons = sorted(course.lessons, key=lambda l: l.order_index or 0) if course.lessons else []
                lessons_data = [
                    {
                        "id": l.id,
                        "title": l.title,
                        "description": l.description,
                        "order_index": l.order_index,
                        "estimated_minutes": l.estimated_minutes,
                        "lesson_type": l.lesson_type,
                        "video_url": l.video_url,
                        "materials_url": l.materials_url
                    }
                    for l in lessons
                ]

                # Challenges
                challenges = course.challenges or []
                challenges_data = [
                    {
                        "id": ch.id,
                        "title": ch.title,
                        "description": ch.description,
                        "challenge_type": ch.challenge_type,
                        "time_limit_minutes": ch.time_limit_minutes,
                        "target_mpu": ch.target_mpu,
                        "is_active": ch.is_active,
                    }
                    for ch in challenges
                ]

                courses_data.append({
                    "id": course.id,
                    "title": course.title,
                    "description": course.description,
                    "order_index": pc.order_index,
                    "use_custom": pc.use_custom,
                    "custom_title": pc.custom_title,
                    "custom_description": pc.custom_description,
                    "lessons": lessons_data,
                    "challenges": challenges_data,
                })

        # Calculate days and status
        from datetime import datetime, timezone
        days_total = None
        days_remaining = None
        status_str = None
        if plan.start_date and plan.end_date:
            try:
                today = datetime.now(timezone.utc)
                # normalize to dates for day calculations
                start = plan.start_date
                end = plan.end_date
                delta_total = (end.date() - start.date()).days + 1
                delta_remaining = (end.date() - today.date()).days
                days_total = delta_total if delta_total >= 0 else 0
                days_remaining = delta_remaining if delta_remaining >= 0 else 0

                if today.date() < start.date():
                    status_str = "UPCOMING"
                elif today.date() > end.date():
                    status_str = "COMPLETED"
                else:
                    status_str = "ONGOING"
            except Exception:
                days_total = None
                days_remaining = None
                status_str = None

        # Get student info (1 student per plan)
        student_info = None
        if plan.student_id:
            student = db.query(models.User).filter(models.User.id == plan.student_id).first()
            if student:
                student_info = {
                    "id": student.id,
                    "full_name": student.full_name,
                    "email": student.email
                }

        resp = {
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "trainer_id": plan.trainer_id,
            "bank_id": plan.bank_id,
            "product_id": plan.product_id,
            "start_date": plan.start_date.isoformat() if plan.start_date else None,
            "end_date": plan.end_date.isoformat() if plan.end_date else None,
            "created_by": plan.created_by,
            "is_active": plan.is_active,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "total_duration_minutes": None,
            "completed_minutes": None,
            "remaining_minutes": None,
            "progress_percentage": None,
            "courses": courses_data,
            "days_total": days_total,
            "days_remaining": days_remaining,
            "status": status_str,
            "student_id": plan.student_id,
            "student": student_info,
        }
        return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serializing training plan: {str(e)}")

# UPDATE - PUT /{plan_id}
@router.put("/{plan_id}", response_model=schemas.TrainingPlan)
async def update_training_plan(
    plan_id: int,
    plan_update: schemas.TrainingPlanUpdate,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Atualizar plano de formação
    ADMIN pode atualizar qualquer plano
    TRAINER só pode atualizar se for o formador responsável
    """
    db_plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_id
    ).first()
    
    if not db_plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    
    # Verificar permissões
    if current_user.role == "TRAINER" and db_plan.trainer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to update this training plan"
        )
    
    # Atualizar campos
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key != "course_ids":
            setattr(db_plan, key, value)
    
    # Atualizar cursos se fornecidos
    if plan_update.course_ids is not None:
        # Remover cursos antigos
        db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan_id
        ).delete()
        
        # Adicionar novos cursos
        for idx, course_id in enumerate(plan_update.course_ids):
            course = db.query(models.Course).filter(models.Course.id == course_id).first()
            if course:
                plan_course = models.TrainingPlanCourse(
                    training_plan_id=plan_id,
                    course_id=course_id,
                    order_index=idx
                )
                db.add(plan_course)
    
    db.commit()
    db.refresh(db_plan)

    # Return serialized dict to avoid ResponseValidationError on datetime fields
    return {
        "id": db_plan.id,
        "title": db_plan.title,
        "description": db_plan.description,
        "trainer_id": db_plan.trainer_id,
        "bank_id": db_plan.bank_id,
        "product_id": db_plan.product_id,
        "start_date": db_plan.start_date.isoformat() if db_plan.start_date else None,
        "end_date": db_plan.end_date.isoformat() if db_plan.end_date else None,
        "created_by": db_plan.created_by,
        "is_active": db_plan.is_active,
        "created_at": db_plan.created_at.isoformat() if db_plan.created_at else None,
        "total_duration_minutes": None,
        "completed_minutes": None,
        "remaining_minutes": None,
        "progress_percentage": None,
    }

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_training_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Deletar plano de formação
    ADMIN pode deletar qualquer plano
    TRAINER só pode deletar se for o formador responsável
    """
    db_plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_id
    ).first()
    
    if not db_plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    
    # Verificar permissões
    if current_user.role == "TRAINER" and db_plan.trainer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to delete this training plan"
        )
    
    db.delete(db_plan)
    db.commit()
    
    return None

# ============== STUDENT ASSIGNMENTS ==============

@router.post("/{plan_id}/assign", response_model=schemas.TrainingPlanAssignment)
async def assign_student_to_plan(
    plan_id: int,
    assignment: schemas.AssignStudentToPlan,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Atribuir formando a um plano de formação
    """
    # Verificar se o plano existe
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    
    # Verificar permissões do TRAINER
    if current_user.role == "TRAINER" and plan.trainer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to assign students to this training plan"
        )
    
    # Verificar se o formando existe e tem role STUDENT
    student = db.query(models.User).filter(
        models.User.id == assignment.student_id,
        models.User.role == "STUDENT"
    ).first()
    
    if not student:
        raise HTTPException(status_code=400, detail="Student not found or invalid role")
    
    # Verificar se já está atribuído
    existing = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.training_plan_id == plan_id,
        models.TrainingPlanAssignment.user_id == assignment.student_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already assigned to this training plan")
    
    # Criar atribuição e inscrever o formando em todos os cursos do plano
    import logging
    logger = logging.getLogger(__name__)

    try:
        db_assignment = models.TrainingPlanAssignment(
            training_plan_id=plan_id,
            user_id=assignment.student_id,
            assigned_by=current_user.id
        )

        db.add(db_assignment)

        # Buscar cursos associados ao plano
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan_id
        ).all()

        # Para cada curso, criar uma Enrollment se ainda não existir
        for pc in plan_courses:
            course_id = pc.course_id
            exists = db.query(models.Enrollment).filter(
                models.Enrollment.user_id == assignment.student_id,
                models.Enrollment.course_id == course_id
            ).first()
            if not exists:
                enrollment = models.Enrollment(
                    user_id=assignment.student_id,
                    course_id=course_id
                )
                db.add(enrollment)

        db.commit()
        db.refresh(db_assignment)
        logger.info(f"Assigned student {assignment.student_id} to plan {plan_id} and enrolled in {len(plan_courses)} courses")
        return db_assignment
    except Exception as e:
        logger.error(f"Error assigning student to plan {plan_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error assigning student to plan: {str(e)}")

@router.delete("/{plan_id}/unassign/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_student_from_plan(
    plan_id: int,
    student_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Remover formando de um plano de formação
    """
    # Verificar permissões
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    
    if current_user.role == "TRAINER" and plan.trainer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to unassign students from this training plan"
        )
    
    # Buscar e deletar atribuição
    assignment = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.training_plan_id == plan_id,
        models.TrainingPlanAssignment.user_id == student_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    
    return None

@router.get("/{plan_id}/students", response_model=List[schemas.StudentAssignment])
async def list_plan_students(
    plan_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Listar formandos atribuídos a um plano de formação
    """
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    
    # Verificar permissões do TRAINER
    if current_user.role == "TRAINER" and plan.trainer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to view students of this training plan"
        )
    
    assignments = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.training_plan_id == plan_id
    ).options(joinedload(models.TrainingPlanAssignment.user)).all()
    
    return assignments

# ============== TRAINERS LIST ==============

@router.get("/trainers", response_model=List[schemas.UserBasic])
async def list_trainers(
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Listar formadores validados disponíveis para atribuição
    """
    trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_pending == False,
        models.User.is_active == True
    ).all()
    
    return trainers
