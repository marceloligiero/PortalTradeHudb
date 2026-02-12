from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()


def calculate_plan_status(db: Session, plan: models.TrainingPlan) -> dict:
    """Calcula o status de um plano baseado no progresso"""
    now = datetime.now()
    
    # Buscar cursos do plano
    plan_courses = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == plan.id
    ).all()
    
    total_courses = len(plan_courses)
    completed_courses = len([pc for pc in plan_courses if pc.status == "COMPLETED"])
    
    # Calcular progresso de lições se houver aluno
    total_lessons = 0
    completed_lessons = 0
    
    if plan.student_id:
        for pc in plan_courses:
            lessons = db.query(models.Lesson).filter(
                models.Lesson.course_id == pc.course_id
            ).all()
            total_lessons += len(lessons)
            
            lesson_ids = [l.id for l in lessons]
            if lesson_ids:
                completed = db.query(models.LessonProgress).filter(
                    models.LessonProgress.lesson_id.in_(lesson_ids),
                    models.LessonProgress.user_id == plan.student_id,
                    models.LessonProgress.status == "COMPLETED"
                ).count()
                completed_lessons += completed
    
    # Determinar status
    status = plan.status or "PENDING"
    
    if plan.completed_at:
        status = "COMPLETED"
    elif completed_lessons > 0 or completed_courses > 0:
        status = "IN_PROGRESS"
        # Verificar atraso
        if plan.end_date and now > plan.end_date:
            status = "DELAYED"
    else:
        if plan.start_date and now > plan.start_date:
            # Deveria ter começado mas não tem progresso
            status = "DELAYED"
        else:
            status = "PENDING"
    
    # Calcular dias
    days_total = None
    days_remaining = None
    days_delayed = 0
    
    if plan.start_date and plan.end_date:
        days_total = (plan.end_date - plan.start_date).days
        if now < plan.end_date:
            days_remaining = (plan.end_date - now).days
        else:
            days_remaining = 0
            days_delayed = (now - plan.end_date).days
    
    # Progresso percentual
    progress = 0
    if total_lessons > 0:
        progress = (completed_lessons / total_lessons) * 100
    elif total_courses > 0:
        progress = (completed_courses / total_courses) * 100
    
    return {
        "status": status,
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "progress_percentage": round(progress, 1),
        "days_total": days_total,
        "days_remaining": days_remaining,
        "days_delayed": days_delayed,
        "is_delayed": days_delayed > 0
    }


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
            # Buscar planos onde é formador primário OU secundário
            trainer_assignments = db.query(models.TrainingPlanTrainer).filter(
                models.TrainingPlanTrainer.trainer_id == current_user.id
            ).all()
            plan_ids_from_trainer = [ta.training_plan_id for ta in trainer_assignments]
            
            # Também incluir planos pelo campo legado trainer_id
            plans_by_trainer_id = db.query(models.TrainingPlan).filter(
                models.TrainingPlan.trainer_id == current_user.id
            ).all()
            plan_ids_legacy = [p.id for p in plans_by_trainer_id]
            
            all_trainer_plan_ids = list(set(plan_ids_from_trainer + plan_ids_legacy))
            if all_trainer_plan_ids:
                plans = db.query(models.TrainingPlan).filter(
                    models.TrainingPlan.id.in_(all_trainer_plan_ids)
                ).all()
            else:
                plans = []
        else:  # STUDENT/TRAINEE
            # Buscar planos: por assignment OU por student_id direto
            assignments = db.query(models.TrainingPlanAssignment).filter(
                models.TrainingPlanAssignment.user_id == current_user.id
            ).all()
            plan_ids_from_assignments = [a.training_plan_id for a in assignments]
            
            # Também buscar planos onde o user é o student_id
            plans_by_student_id = db.query(models.TrainingPlan).filter(
                models.TrainingPlan.student_id == current_user.id
            ).all()
            plan_ids_from_student = [p.id for p in plans_by_student_id]
            
            # Combinar ambos (sem duplicados)
            all_plan_ids = list(set(plan_ids_from_assignments + plan_ids_from_student))
            
            if all_plan_ids:
                plans = db.query(models.TrainingPlan).filter(
                    models.TrainingPlan.id.in_(all_plan_ids)
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
            
            # Calcular status do plano
            plan_status = calculate_plan_status(db, plan)

            # Buscar todos os formadores do plano
            plan_trainers = db.query(models.TrainingPlanTrainer).filter(
                models.TrainingPlanTrainer.training_plan_id == plan.id
            ).all()
            trainers_list = []
            for pt in plan_trainers:
                trainer = db.query(models.User).filter(models.User.id == pt.trainer_id).first()
                if trainer:
                    trainers_list.append({
                        "id": trainer.id,
                        "full_name": trainer.full_name,
                        "email": trainer.email,
                        "is_primary": pt.is_primary
                    })
            
            # Se não houver na nova tabela, usar formador legado
            if not trainers_list and plan.trainer:
                trainers_list.append({
                    "id": plan.trainer.id,
                    "full_name": plan.trainer.full_name,
                    "email": plan.trainer.email if hasattr(plan.trainer, 'email') else None,
                    "is_primary": True
                })
            
            # Buscar bancos associados (N:N)
            plan_banks = db.query(models.TrainingPlanBank).filter(
                models.TrainingPlanBank.training_plan_id == plan.id
            ).all()
            banks_list = []
            for pb in plan_banks:
                bank = db.query(models.Bank).filter(models.Bank.id == pb.bank_id).first()
                if bank:
                    banks_list.append({"id": bank.id, "code": bank.code, "name": bank.name})
            
            # Fallback para banco legado
            if not banks_list and plan.bank:
                banks_list.append({"id": plan.bank.id, "code": plan.bank.code, "name": plan.bank.name})
            
            # Buscar produtos associados (N:N)
            plan_products = db.query(models.TrainingPlanProduct).filter(
                models.TrainingPlanProduct.training_plan_id == plan.id
            ).all()
            products_list = []
            for pp in plan_products:
                product = db.query(models.Product).filter(models.Product.id == pp.product_id).first()
                if product:
                    products_list.append({"id": product.id, "code": product.code, "name": product.name})
            
            # Fallback para produto legado
            if not products_list and plan.product:
                products_list.append({"id": plan.product.id, "code": plan.product.code, "name": plan.product.name})

            result.append({
                "id": plan.id,
                "title": plan.title,
                "description": plan.description,
                "trainer_id": plan.trainer_id,
                "trainer": {
                    "id": plan.trainer.id if plan.trainer else None,
                    "full_name": plan.trainer.full_name if plan.trainer else None
                } if hasattr(plan, 'trainer') else None,
                "trainers": trainers_list,
                "total_courses": total_courses,
                "student": student_info,
                "total_duration_hours": total_hours,
                "start_date": plan.start_date.isoformat() if plan.start_date else None,
                "end_date": plan.end_date.isoformat() if plan.end_date else None,
                "created_at": plan.created_at.isoformat() if plan.created_at else None,
                # Bank and Product info (legacy single)
                "bank_id": plan.bank_id,
                "bank_code": banks_list[0]["code"] if banks_list else None,
                "bank_name": banks_list[0]["name"] if banks_list else None,
                "product_id": plan.product_id,
                "product_name": products_list[0]["name"] if products_list else None,
                "product_code": products_list[0]["code"] if products_list else None,
                # Multiple banks and products
                "bank_ids": [b["id"] for b in banks_list],
                "product_ids": [p["id"] for p in products_list],
                "banks": banks_list,
                "products": products_list,
                "is_active": plan.is_active,
                # Novos campos de status
                "status": plan_status["status"],
                "progress_percentage": plan_status["progress_percentage"],
                "days_remaining": plan_status["days_remaining"],
                "days_delayed": plan_status["days_delayed"],
                "is_delayed": plan_status["is_delayed"],
                "completed_courses": plan_status["completed_courses"],
                "completed_lessons": plan_status["completed_lessons"]
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
    
    # Determinar lista de formadores
    trainer_ids = plan.trainer_ids if plan.trainer_ids else []
    if plan.trainer_id and plan.trainer_id not in trainer_ids:
        trainer_ids.insert(0, plan.trainer_id)  # trainer_id principal sempre primeiro
    
    if not trainer_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one trainer is required"
        )
    
    # Validar se todos os formadores existem e têm role TRAINER
    primary_trainer_id = trainer_ids[0]  # Primeiro é o principal
    validated_trainers = []
    
    for tid in trainer_ids:
        trainer = db.query(models.User).filter(
            models.User.id == tid,
            models.User.role == "TRAINER",
            models.User.is_pending == False
        ).first()
        
        if not trainer:
            raise HTTPException(
                status_code=400, 
                detail=f"Trainer with ID {tid} not found or not validated."
            )
        validated_trainers.append(trainer)
    
    # Validar que o aluno não seja um dos formadores
    if plan.student_id and plan.student_id in trainer_ids:
        raise HTTPException(
            status_code=400,
            detail="O aluno não pode ser também formador do mesmo plano de formação."
        )
    
    # Validar bancos (suporte a múltiplos)
    bank_ids = plan.bank_ids if hasattr(plan, 'bank_ids') and plan.bank_ids else []
    if plan.bank_id and plan.bank_id not in bank_ids:
        bank_ids.append(plan.bank_id)
    
    for bid in bank_ids:
        bank = db.query(models.Bank).filter(models.Bank.id == bid).first()
        if not bank:
            raise HTTPException(status_code=400, detail=f"Bank with ID {bid} not found")
    
    # Validar produtos (suporte a múltiplos)
    product_ids = plan.product_ids if hasattr(plan, 'product_ids') and plan.product_ids else []
    if plan.product_id and plan.product_id not in product_ids:
        product_ids.append(plan.product_id)
    
    for pid in product_ids:
        product = db.query(models.Product).filter(models.Product.id == pid).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product with ID {pid} not found")
    
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
            trainer_id=primary_trainer_id,  # Formador principal para retrocompatibilidade
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
        
        # Adicionar todos os formadores à tabela de associação
        for idx, tid in enumerate(trainer_ids):
            plan_trainer = models.TrainingPlanTrainer(
                training_plan_id=db_plan.id,
                trainer_id=tid,
                is_primary=(idx == 0),  # Primeiro é o principal
                assigned_by=current_user.id
            )
            db.add(plan_trainer)
        
        # Adicionar bancos à tabela de associação N:N
        for bid in bank_ids:
            plan_bank = models.TrainingPlanBank(
                training_plan_id=db_plan.id,
                bank_id=bid
            )
            db.add(plan_bank)
        
        # Adicionar produtos à tabela de associação N:N
        for pid in product_ids:
            plan_product = models.TrainingPlanProduct(
                training_plan_id=db_plan.id,
                product_id=pid
            )
            db.add(plan_product)
        
        db.commit()
        
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
            "bank_ids": bank_ids,
            "product_ids": product_ids,
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
    if current_user.role == "TRAINEE":
        # Verificar se o formando está atribuído (por assignment OU por student_id)
        assignment = db.query(models.TrainingPlanAssignment).filter(
            models.TrainingPlanAssignment.training_plan_id == plan_id,
            models.TrainingPlanAssignment.user_id == current_user.id
        ).first()
        is_student = plan.student_id == current_user.id
        if not assignment and not is_student:
            raise HTTPException(status_code=403, detail="Not authorized to access this training plan")
    elif current_user.role == "TRAINER":
        # Verificar se é formador (primário ou secundário) deste plano
        is_primary_trainer = plan.trainer_id == current_user.id
        trainer_assignment = db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.training_plan_id == plan_id,
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).first()
        if not is_primary_trainer and not trainer_assignment:
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
                        "materials_url": l.materials_url,
                        "started_by": l.started_by  # TRAINER ou TRAINEE - quem pode iniciar a aula
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
        status_str = plan.status  # Start with the actual plan status from database
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

                # Only override status if it's not already COMPLETED (from finalization)
                if plan.status != "COMPLETED" and plan.completed_at is None:
                    if today.date() < start.date():
                        status_str = "UPCOMING"
                    elif today.date() > end.date():
                        status_str = "DELAYED"
                    else:
                        status_str = "ONGOING"
            except Exception:
                days_total = None
                days_remaining = None
                if not status_str:
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

        # Buscar todos os formadores do plano
        plan_trainers = db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.training_plan_id == plan.id
        ).all()
        trainers_list = []
        for pt in plan_trainers:
            trainer = db.query(models.User).filter(models.User.id == pt.trainer_id).first()
            if trainer:
                trainers_list.append({
                    "id": trainer.id,
                    "full_name": trainer.full_name,
                    "email": trainer.email,
                    "is_primary": pt.is_primary,
                    "assigned_at": pt.assigned_at.isoformat() if pt.assigned_at else None
                })
        
        # Se não houver na nova tabela, usar formador legado
        if not trainers_list and plan.trainer:
            trainers_list.append({
                "id": plan.trainer.id,
                "full_name": plan.trainer.full_name,
                "email": plan.trainer.email if hasattr(plan.trainer, 'email') else None,
                "is_primary": True,
                "assigned_at": None
            })

        resp = {
            "id": plan.id,
            "title": plan.title,
            "description": plan.description,
            "trainer_id": plan.trainer_id,
            "trainers": trainers_list,
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
            "TRAINEE": student_info,
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
    
    # Verificar permissões - TRAINER só pode atualizar se for formador do plano
    if current_user.role == "TRAINER":
        is_primary_trainer = db_plan.trainer_id == current_user.id
        trainer_assignment = db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.training_plan_id == plan_id,
            models.TrainingPlanTrainer.trainer_id == current_user.id
        ).first()
        if not is_primary_trainer and not trainer_assignment:
            raise HTTPException(
                status_code=403, 
                detail="Not authorized to update this training plan"
            )
    
    # Atualizar campos
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key not in ["course_ids", "trainer_ids"]:
            setattr(db_plan, key, value)
    
    # Determinar student_id efetivo (pode vir do update ou já existir no plano)
    effective_student_id = plan_update.student_id if hasattr(plan_update, 'student_id') and plan_update.student_id is not None else db_plan.student_id
    
    # Atualizar trainers se fornecidos
    if plan_update.trainer_ids is not None and len(plan_update.trainer_ids) > 0:
        # Validar que o aluno não seja um dos formadores
        if effective_student_id and effective_student_id in plan_update.trainer_ids:
            raise HTTPException(
                status_code=400,
                detail="O aluno não pode ser também formador do mesmo plano de formação."
            )
        
        # Remover trainers antigos
        db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.training_plan_id == plan_id
        ).delete()
        
        # Adicionar novos trainers
        for idx, trainer_id in enumerate(plan_update.trainer_ids):
            trainer = db.query(models.User).filter(
                models.User.id == trainer_id,
                models.User.role == "TRAINER"
            ).first()
            if trainer:
                plan_trainer = models.TrainingPlanTrainer(
                    training_plan_id=plan_id,
                    trainer_id=trainer_id,
                    is_primary=(idx == 0),  # Primeiro é o primário
                    assigned_by=current_user.id
                )
                db.add(plan_trainer)
        
        # Atualizar trainer_id legado com o primeiro trainer
        if plan_update.trainer_ids:
            db_plan.trainer_id = plan_update.trainer_ids[0]
    
    # Validar que se o student_id está sendo atualizado, não conflita com formadores existentes
    if hasattr(plan_update, 'student_id') and plan_update.student_id is not None:
        existing_trainer_ids = [pt.trainer_id for pt in db.query(models.TrainingPlanTrainer).filter(
            models.TrainingPlanTrainer.training_plan_id == plan_id
        ).all()]
        if not existing_trainer_ids:
            existing_trainer_ids = [db_plan.trainer_id] if db_plan.trainer_id else []
        
        if plan_update.student_id in existing_trainer_ids:
            raise HTTPException(
                status_code=400,
                detail="O aluno não pode ser também formador do mesmo plano de formação."
            )
    
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
    
    # Atualizar bancos se fornecidos (N:N)
    if hasattr(plan_update, 'bank_ids') and plan_update.bank_ids is not None:
        # Remover associações antigas
        db.query(models.TrainingPlanBank).filter(
            models.TrainingPlanBank.training_plan_id == plan_id
        ).delete()
        
        # Adicionar novas associações
        for bank_id in plan_update.bank_ids:
            bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
            if bank:
                plan_bank = models.TrainingPlanBank(
                    training_plan_id=plan_id,
                    bank_id=bank_id
                )
                db.add(plan_bank)
    
    # Atualizar produtos se fornecidos (N:N)
    if hasattr(plan_update, 'product_ids') and plan_update.product_ids is not None:
        # Remover associações antigas
        db.query(models.TrainingPlanProduct).filter(
            models.TrainingPlanProduct.training_plan_id == plan_id
        ).delete()
        
        # Adicionar novas associações
        for product_id in plan_update.product_ids:
            product = db.query(models.Product).filter(models.Product.id == product_id).first()
            if product:
                plan_product = models.TrainingPlanProduct(
                    training_plan_id=plan_id,
                    product_id=product_id
                )
                db.add(plan_product)
    
    db.commit()
    db.refresh(db_plan)
    
    # Get updated associations
    bank_ids = [pb.bank_id for pb in db.query(models.TrainingPlanBank).filter(
        models.TrainingPlanBank.training_plan_id == plan_id
    ).all()]
    product_ids = [pp.product_id for pp in db.query(models.TrainingPlanProduct).filter(
        models.TrainingPlanProduct.training_plan_id == plan_id
    ).all()]

    # Return serialized dict to avoid ResponseValidationError on datetime fields
    return {
        "id": db_plan.id,
        "title": db_plan.title,
        "description": db_plan.description,
        "trainer_id": db_plan.trainer_id,
        "bank_id": db_plan.bank_id,
        "product_id": db_plan.product_id,
        "bank_ids": bank_ids,
        "product_ids": product_ids,
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
    
    # Verificar se o formando existe (pode ser TRAINEE ou TRAINER que é aluno neste plano)
    student = db.query(models.User).filter(
        models.User.id == assignment.student_id,
        models.User.role.in_(["TRAINEE", "TRAINER"])
    ).first()
    
    if not student:
        raise HTTPException(status_code=400, detail="Student not found or invalid role")
    
    # Verificar se o aluno é formador deste plano (não pode ser aluno e formador ao mesmo tempo)
    trainer_ids = [pt.trainer_id for pt in db.query(models.TrainingPlanTrainer).filter(
        models.TrainingPlanTrainer.training_plan_id == plan_id
    ).all()]
    if not trainer_ids and plan.trainer_id:
        trainer_ids = [plan.trainer_id]
    
    if assignment.student_id in trainer_ids:
        raise HTTPException(
            status_code=400, 
            detail="O aluno não pode ser também formador do mesmo plano de formação."
        )
    
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
    
    # Converter para incluir dados do utilizador
    result = []
    for assignment in assignments:
        result.append({
            "id": assignment.id,
            "user_id": assignment.user_id,
            "assigned_at": assignment.assigned_at,
            "completed_at": assignment.completed_at,
            "name": assignment.user.full_name if assignment.user else None,
            "email": assignment.user.email if assignment.user else None
        })
    
    return result

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


# ============== PLAN COMPLETION CHECK ==============

def check_course_completion(db: Session, plan_id: int, course_id: int, student_id: int) -> dict:
    """
    Verifica se um curso está completo:
    - Todas as aulas confirmadas pelo formando (student_confirmed=True)
    - Todos os desafios aprovados (is_approved=True)
    """
    # Buscar todas as aulas do curso
    lessons = db.query(models.Lesson).filter(
        models.Lesson.course_id == course_id
    ).all()
    
    lesson_ids = [l.id for l in lessons]
    total_lessons = len(lesson_ids)
    confirmed_lessons = 0
    
    if lesson_ids:
        confirmed_lessons = db.query(models.LessonProgress).filter(
            models.LessonProgress.lesson_id.in_(lesson_ids),
            models.LessonProgress.user_id == student_id,
            models.LessonProgress.training_plan_id == plan_id,
            models.LessonProgress.student_confirmed == True
        ).count()
    
    # Buscar todos os desafios do curso
    challenges = db.query(models.Challenge).filter(
        models.Challenge.course_id == course_id,
        models.Challenge.is_active == True
    ).all()
    
    challenge_ids = [c.id for c in challenges]
    total_challenges = len(challenge_ids)
    approved_challenges = 0
    
    if challenge_ids:
        # Para cada desafio, verifica se tem ao menos uma submission aprovada
        for challenge_id in challenge_ids:
            approved = db.query(models.ChallengeSubmission).filter(
                models.ChallengeSubmission.challenge_id == challenge_id,
                models.ChallengeSubmission.user_id == student_id,
                models.ChallengeSubmission.training_plan_id == plan_id,
                models.ChallengeSubmission.is_approved == True
            ).first()
            if approved:
                approved_challenges += 1
    
    lessons_complete = total_lessons == 0 or confirmed_lessons >= total_lessons
    challenges_complete = total_challenges == 0 or approved_challenges >= total_challenges
    is_complete = lessons_complete and challenges_complete
    
    return {
        "course_id": course_id,
        "is_complete": is_complete,
        "total_lessons": total_lessons,
        "confirmed_lessons": confirmed_lessons,
        "lessons_complete": lessons_complete,
        "total_challenges": total_challenges,
        "approved_challenges": approved_challenges,
        "challenges_complete": challenges_complete
    }


def check_plan_completion(db: Session, plan: models.TrainingPlan) -> dict:
    """
    Verifica se o plano pode ser finalizado:
    - Todos os cursos do plano devem estar completos
    """
    if not plan.student_id:
        return {
            "can_finalize": False,
            "reason": "Plano não tem formando atribuído",
            "courses_status": []
        }
    
    plan_courses = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == plan.id
    ).all()
    
    if not plan_courses:
        return {
            "can_finalize": False,
            "reason": "Plano não tem cursos",
            "courses_status": []
        }
    
    courses_status = []
    all_complete = True
    
    for pc in plan_courses:
        course_status = check_course_completion(db, plan.id, pc.course_id, plan.student_id)
        
        # Buscar info do curso
        course = db.query(models.Course).filter(models.Course.id == pc.course_id).first()
        course_status["course_title"] = course.title if course else f"Curso {pc.course_id}"
        
        courses_status.append(course_status)
        
        if not course_status["is_complete"]:
            all_complete = False
    
    return {
        "can_finalize": all_complete,
        "reason": None if all_complete else "Nem todos os cursos foram concluídos",
        "total_courses": len(plan_courses),
        "completed_courses": len([c for c in courses_status if c["is_complete"]]),
        "courses_status": courses_status
    }


@router.get("/{plan_id}/completion-status")
async def get_plan_completion_status(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verificar status de conclusão do plano
    Retorna se pode ser finalizado e detalhes de cada curso
    """
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Verificar permissões
    if current_user.role not in ["ADMIN", "TRAINER"] and current_user.id != plan.student_id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    completion_status = check_plan_completion(db, plan)
    completion_status["is_finalized"] = plan.completed_at is not None
    
    if plan.completed_at:
        completion_status["finalized_at"] = plan.completed_at.isoformat()
        
        # Verificar se já tem certificado
        certificate = db.query(models.Certificate).filter(
            models.Certificate.training_plan_id == plan_id
        ).first()
        if certificate:
            completion_status["certificate_id"] = certificate.id
            completion_status["certificate_number"] = certificate.certificate_number
    
    return completion_status


@router.post("/{plan_id}/finalize")
async def finalize_training_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.require_role(["ADMIN", "TRAINER"])),
    db: Session = Depends(get_db)
):
    """
    Finalizar plano de formação e gerar certificado
    Apenas se todos os cursos estiverem completos (aulas confirmadas + desafios aprovados)
    """
    import logging
    import uuid
    logger = logging.getLogger(__name__)
    
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Verificar se formador é responsável pelo plano
    if current_user.role == "TRAINER" and plan.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado a finalizar este plano")
    
    # Verificar se já foi finalizado
    if plan.completed_at:
        raise HTTPException(status_code=400, detail="Plano já foi finalizado")
    
    # Verificar se pode ser finalizado
    completion_status = check_plan_completion(db, plan)
    if not completion_status["can_finalize"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível finalizar: {completion_status['reason']}"
        )
    
    # Buscar dados do aluno
    student = db.query(models.User).filter(models.User.id == plan.student_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Formando não encontrado")
    
    # Calcular estatísticas para o certificado
    total_hours = 0
    total_mpu = 0
    mpu_count = 0
    
    plan_courses = db.query(models.TrainingPlanCourse).filter(
        models.TrainingPlanCourse.training_plan_id == plan_id
    ).all()
    
    for pc in plan_courses:
        # Somar tempo das aulas
        lessons = db.query(models.Lesson).filter(
            models.Lesson.course_id == pc.course_id
        ).all()
        for lesson in lessons:
            total_hours += (lesson.estimated_minutes or 0) / 60
        
        # Calcular MPU médio dos desafios aprovados
        submissions = db.query(models.ChallengeSubmission).join(
            models.Challenge
        ).filter(
            models.Challenge.course_id == pc.course_id,
            models.ChallengeSubmission.user_id == plan.student_id,
            models.ChallengeSubmission.training_plan_id == plan_id,
            models.ChallengeSubmission.is_approved == True
        ).all()
        
        for sub in submissions:
            if sub.calculated_mpu:
                total_mpu += sub.calculated_mpu
                mpu_count += 1
        
        # Marcar curso como completo
        pc.status = "COMPLETED"
        pc.completed_at = datetime.now()
        pc.finalized_by = current_user.id
    
    avg_mpu = total_mpu / mpu_count if mpu_count > 0 else 0
    
    # Gerar número único do certificado
    cert_number = f"CERT-{plan_id}-{student.id}-{uuid.uuid4().hex[:8].upper()}"
    
    # Criar certificado
    certificate = models.Certificate(
        user_id=student.id,
        training_plan_id=plan_id,
        certificate_number=cert_number,
        student_name=student.full_name,
        student_email=student.email,
        training_plan_title=plan.title,
        total_hours=round(total_hours, 1),
        courses_completed=len(plan_courses),
        average_mpu=round(avg_mpu, 2),
        average_approval_rate=100.0,  # Todos aprovados = 100%
        is_valid=True
    )
    db.add(certificate)
    
    # Finalizar plano
    plan.status = "COMPLETED"
    plan.completed_at = datetime.now()
    plan.finalized_by = current_user.id
    
    db.commit()
    db.refresh(certificate)
    
    logger.info(f"Training plan {plan_id} finalized by user {current_user.email}. Certificate {cert_number} issued.")
    
    return {
        "success": True,
        "message": "Plano de formação finalizado com sucesso!",
        "certificate": {
            "id": certificate.id,
            "certificate_number": certificate.certificate_number,
            "student_name": certificate.student_name,
            "training_plan_title": certificate.training_plan_title,
            "total_hours": certificate.total_hours,
            "courses_completed": certificate.courses_completed,
            "average_mpu": certificate.average_mpu,
            "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None
        }
    }
