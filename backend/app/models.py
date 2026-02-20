from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # STUDENT, TRAINER, ADMIN
    is_active = Column(Boolean, default=True, nullable=False)
    is_pending = Column(Boolean, default=False, nullable=False)  # For TRAINER validation by ADMIN
    validated_at = Column(DateTime(timezone=True), nullable=True)  # When trainer was approved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="user")
    created_courses = relationship("Course", back_populates="creator", foreign_keys="[Course.created_by]")
    training_plan_assignments = relationship("TrainingPlanAssignment", foreign_keys="[TrainingPlanAssignment.user_id]", back_populates="user")
    assigned_training_plans = relationship("TrainingPlanAssignment", foreign_keys="[TrainingPlanAssignment.assigned_by]", back_populates="assigner")
    certificates = relationship("Certificate", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")


class PasswordResetToken(Base):
    """Token para recuperação de senha"""
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="password_reset_tokens")


class Bank(Base):
    __tablename__ = "banks"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    country = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Legacy relationship (for backward compatibility)
    courses = relationship("Course", back_populates="bank")
    # Many-to-many relationships
    course_associations = relationship("CourseBank", back_populates="bank")
    training_plan_associations = relationship("TrainingPlanBank", back_populates="bank")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Legacy relationship (for backward compatibility)
    courses = relationship("Course", back_populates="product")
    # Many-to-many relationships
    course_associations = relationship("CourseProduct", back_populates="product")
    training_plan_associations = relationship("TrainingPlanProduct", back_populates="product")


# ============== MANY-TO-MANY ASSOCIATION TABLES ==============

class CourseBank(Base):
    """Associação de múltiplos bancos a um curso"""
    __tablename__ = "course_banks"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    course = relationship("Course", back_populates="bank_associations")
    bank = relationship("Bank", back_populates="course_associations")


class CourseProduct(Base):
    """Associação de múltiplos produtos/serviços a um curso"""
    __tablename__ = "course_products"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    course = relationship("Course", back_populates="product_associations")
    product = relationship("Product", back_populates="course_associations")


class TrainingPlanBank(Base):
    """Associação de múltiplos bancos a um plano de formação"""
    __tablename__ = "training_plan_banks"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id", ondelete="CASCADE"), nullable=False)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    training_plan = relationship("TrainingPlan", back_populates="bank_associations")
    bank = relationship("Bank", back_populates="training_plan_associations")


class TrainingPlanProduct(Base):
    """Associação de múltiplos produtos/serviços a um plano de formação"""
    __tablename__ = "training_plan_products"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    training_plan = relationship("TrainingPlan", back_populates="product_associations")
    product = relationship("Product", back_populates="training_plan_associations")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    level = Column(String(20), nullable=True)  # BEGINNER, INTERMEDIATE, EXPERT
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=True)  # Legacy - nullable for new multi-bank courses
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # Legacy - nullable for new multi-product courses
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bank = relationship("Bank", back_populates="courses")  # Legacy single bank
    product = relationship("Product", back_populates="courses")  # Legacy single product
    # Many-to-many relationships
    bank_associations = relationship("CourseBank", back_populates="course", cascade="all, delete-orphan")
    product_associations = relationship("CourseProduct", back_populates="course", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="created_courses", foreign_keys=[created_by])
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")
    challenges = relationship("Challenge", back_populates="course")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text)
    lesson_type = Column(String(50), default="THEORETICAL")  # THEORETICAL ou PRACTICAL
    started_by = Column(String(50), default="TRAINER")  # TRAINER ou TRAINEE - quem pode iniciar a aula
    order_index = Column(Integer, default=0)
    estimated_minutes = Column(Integer, default=30, nullable=False)  # Tempo que o formando tem para fazer
    video_url = Column(String(500))
    materials_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="lessons")
    progress_records = relationship("LessonProgress", back_populates="lesson")

class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    lesson_progress = relationship("LessonProgress", back_populates="enrollment")

class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=True)  # Plano associado
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Aluno direto (alternativo a enrollment)
    
    # Liberação pelo formador
    is_released = Column(Boolean, default=False)  # Formador liberou a aula
    released_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Quem liberou
    released_at = Column(DateTime(timezone=True))  # Quando foi liberada
    
    started_at = Column(DateTime(timezone=True))  # Quando o formando iniciou (não mais server_default)
    completed_at = Column(DateTime(timezone=True))
    paused_at = Column(DateTime(timezone=True))  # Quando foi pausado (se está pausado)
    accumulated_seconds = Column(Integer, default=0)  # Tempo acumulado em segundos (pausas múltiplas)
    actual_time_minutes = Column(Integer)
    estimated_minutes = Column(Integer, default=30)
    mpu = Column(Float)
    mpu_percentage = Column(Float)
    is_approved = Column(Boolean, default=False)
    is_paused = Column(Boolean, default=False)  # Se está atualmente pausado
    status = Column(String(50), default="NOT_STARTED")  # NOT_STARTED, RELEASED, IN_PROGRESS, PAUSED, COMPLETED
    finished_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Formador que finalizou
    
    # Confirmação pelo formando
    student_confirmed = Column(Boolean, default=False)  # Formando confirmou que fez a aula
    student_confirmed_at = Column(DateTime(timezone=True))  # Quando confirmou
    
    enrollment = relationship("Enrollment", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress_records")
    training_plan = relationship("TrainingPlan")
    user = relationship("User", foreign_keys=[user_id])
    releaser = relationship("User", foreign_keys=[released_by])
    finisher = relationship("User", foreign_keys=[finished_by])
    pauses = relationship("LessonPause", back_populates="lesson_progress", cascade="all, delete-orphan")


class LessonPause(Base):
    """Histórico de pausas de uma lição - permite múltiplas pausas em dias diferentes"""
    __tablename__ = "lesson_pauses"
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_progress_id = Column(Integer, ForeignKey("lesson_progress.id"), nullable=False)
    paused_at = Column(DateTime(timezone=True), nullable=False)
    resumed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)  # Calculado quando retoma
    pause_reason = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    lesson_progress = relationship("LessonProgress", back_populates="pauses")


class TrainingPlan(Base):
    __tablename__ = "training_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Formador responsável (opcional na criação)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Aluno (1 por plano)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=True)  # Legacy - nullable for new multi-bank plans
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # Legacy - nullable for new multi-product plans
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    is_permanent = Column(Boolean, default=False)  # Plano de formação permanente (end_date = 31/12 do ano corrente, renova automaticamente)
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED, DELAYED
    completed_at = Column(DateTime(timezone=True))  # Quando o plano foi finalizado
    finalized_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Quem finalizou
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    courses = relationship("TrainingPlanCourse", back_populates="training_plan")
    assignments = relationship("TrainingPlanAssignment", back_populates="training_plan")
    trainers = relationship("TrainingPlanTrainer", back_populates="training_plan", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="training_plan")
    trainer = relationship("User", foreign_keys=[trainer_id])  # Formador principal (retrocompatibilidade)
    student = relationship("User", foreign_keys=[student_id])
    finalizer = relationship("User", foreign_keys=[finalized_by])
    bank = relationship("Bank")  # Legacy single bank
    product = relationship("Product")  # Legacy single product
    # Many-to-many relationships
    bank_associations = relationship("TrainingPlanBank", back_populates="training_plan", cascade="all, delete-orphan")
    product_associations = relationship("TrainingPlanProduct", back_populates="training_plan", cascade="all, delete-orphan")

class TrainingPlanCourse(Base):
    __tablename__ = "training_plan_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index = Column(Integer, default=0)
    use_custom = Column(Boolean, default=False)
    custom_title = Column(String(255))
    custom_description = Column(Text)
    status = Column(String(50), default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED
    completed_at = Column(DateTime(timezone=True))  # Quando o curso foi finalizado no plano
    finalized_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Formador que finalizou
    
    training_plan = relationship("TrainingPlan", back_populates="courses")
    course = relationship("Course")
    finalizer = relationship("User", foreign_keys=[finalized_by])

class TrainingPlanAssignment(Base):
    """Enrollment of a student in a training plan (catalog model).
    Each student gets their own start/end dates, status, and progress."""
    __tablename__ = "training_plan_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    # Individual enrollment dates (override plan dates per student)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED, DELAYED
    progress_percentage = Column(Float, default=0)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True))
    
    training_plan = relationship("TrainingPlan", back_populates="assignments")
    user = relationship("User", foreign_keys=[user_id], back_populates="training_plan_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by], back_populates="assigned_training_plans")


class TrainingPlanTrainer(Base):
    """Associação de múltiplos formadores a um plano de formação"""
    __tablename__ = "training_plan_trainers"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_primary = Column(Boolean, default=False)  # Formador principal/responsável
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    training_plan = relationship("TrainingPlan", back_populates="trainers")
    trainer = relationship("User", foreign_keys=[trainer_id])
    assigner = relationship("User", foreign_keys=[assigned_by])


class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    challenge_type = Column(String(50), default="COMPLETE")  # COMPLETE or SUMMARY
    operations_required = Column(Integer, default=100, nullable=False)  # Meta de operações
    time_limit_minutes = Column(Integer, default=60, nullable=False)  # Meta de tempo
    target_mpu = Column(Float, nullable=False)  # Meta de MPU para aprovação
    max_errors = Column(Integer, default=0, nullable=False)  # Max de operações com erro permitidas
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # KPIs selecionáveis - quais critérios são decisivos para aprovação
    use_volume_kpi = Column(Boolean, default=True)  # Nr de operações é critério
    use_mpu_kpi = Column(Boolean, default=True)  # MPU é critério
    use_errors_kpi = Column(Boolean, default=True)  # Nr de operações com erro é critério
    
    # Modo de avaliação KPI: AUTO (automático) ou MANUAL (formador decide)
    kpi_mode = Column(String(20), default="AUTO")  # AUTO ou MANUAL
    
    # Permitir nova tentativa após reprovação
    allow_retry = Column(Boolean, default=False)
    
    # Liberação do desafio para formandos
    is_released = Column(Boolean, default=False)  # Se desafio está liberado
    released_at = Column(DateTime(timezone=True))  # Quando foi liberado
    released_by = Column(Integer, ForeignKey("users.id"))  # Quem liberou
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="challenges")
    submissions = relationship("ChallengeSubmission", back_populates="challenge")
    parts = relationship("ChallengePart", back_populates="challenge", cascade="all, delete-orphan")
    releaser = relationship("User", foreign_keys=[released_by])

class ChallengePart(Base):
    """Para desafios do tipo COMPLETE - cada parte registrada individualmente"""
    __tablename__ = "challenge_parts"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    submission_id = Column(Integer, ForeignKey("challenge_submissions.id"), nullable=False)
    part_number = Column(Integer, nullable=False)
    operations_count = Column(Integer, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Float)  # Calculado automaticamente
    mpu = Column(Float)  # Operações / tempo em minutos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    challenge = relationship("Challenge", back_populates="parts")
    submission = relationship("ChallengeSubmission", back_populates="parts")

class ChallengeSubmission(Base):
    __tablename__ = "challenge_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=True)  # Plano associado
    submission_type = Column(String(50), nullable=False)  # COMPLETE or SUMMARY
    
    # Status do desafio: IN_PROGRESS, PENDING_REVIEW, REVIEWED, APPROVED, REJECTED
    status = Column(String(50), default="IN_PROGRESS")
    
    # Para tipo SUMMARY (resumido)
    total_operations = Column(Integer)  # Total de operações inseridas
    total_time_minutes = Column(Integer)  # Tempo total inserido
    errors_count = Column(Integer, default=0)  # Número de OPERAÇÕES com erro (não erros totais)
    
    # Erros por conceito (totalizadores para relatório)
    error_methodology = Column(Integer, default=0)  # Total erros de Metodologia
    error_knowledge = Column(Integer, default=0)  # Total erros de Conhecimento
    error_detail = Column(Integer, default=0)  # Total erros de Detalhe
    error_procedure = Column(Integer, default=0)  # Total erros de Procedimento
    
    # Referência da operação realizada pelo formando (para SUMMARY)
    operation_reference = Column(String(255), nullable=True)
    
    # Campos comuns
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    calculated_mpu = Column(Float)  # MPU calculado (tempo / operações = minutos por unidade)
    mpu_vs_target = Column(Float)  # Percentual vs meta (target_mpu / calculado_mpu * 100) - quanto maior, melhor
    is_approved = Column(Boolean, nullable=True, default=None)  # None = pendente/manual, True = aprovado, False = reprovado
    score = Column(Float)  # Nota calculada
    feedback = Column(Text)
    submitted_by = Column(Integer, ForeignKey("users.id"))  # Formador que aplicou
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Formador que corrigiu/reviu
    
    # Controle de novas tentativas
    retry_count = Column(Integer, default=0)  # Número de tentativas realizadas
    is_retry_allowed = Column(Boolean, default=False)  # Se formador habilitou nova tentativa
    trainer_notes = Column(Text)  # Notas do formador sobre a decisão
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    challenge = relationship("Challenge", back_populates="submissions")
    user = relationship("User", foreign_keys=[user_id])
    training_plan = relationship("TrainingPlan")
    submitter = relationship("User", foreign_keys=[submitted_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    parts = relationship("ChallengePart", back_populates="submission", cascade="all, delete-orphan")
    operations = relationship("ChallengeOperation", back_populates="submission", cascade="all, delete-orphan")
    submission_errors = relationship("SubmissionError", back_populates="submission", cascade="all, delete-orphan")


class SubmissionError(Base):
    """Erros para desafios SUMMARY - ligados diretamente à submission"""
    __tablename__ = "submission_errors"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("challenge_submissions.id"), nullable=False)
    error_type = Column(String(50), nullable=False)  # METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE
    description = Column(String(500))  # Descrição do erro
    operation_reference = Column(String(255), nullable=True)  # Referência da operação onde ocorreu o erro
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    submission = relationship("ChallengeSubmission", back_populates="submission_errors")


class ChallengeRelease(Base):
    """Controle de liberação de desafios para estudantes"""
    __tablename__ = "challenge_releases"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=True)
    released_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    released_at = Column(DateTime(timezone=True), server_default=func.now())
    
    challenge = relationship("Challenge", foreign_keys=[challenge_id])
    student = relationship("User", foreign_keys=[student_id])
    releaser = relationship("User", foreign_keys=[released_by])


class ChallengeOperation(Base):
    """Para desafios COMPLETE - cada operação individual com referência e status de erro"""
    __tablename__ = "challenge_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("challenge_submissions.id"), nullable=False)
    operation_number = Column(Integer, nullable=False)  # Número da operação (1, 2, 3...)
    operation_reference = Column(String(255), nullable=True)  # Ref: 4060ILC0001111
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)  # Tempo da operação em segundos
    has_error = Column(Boolean, default=False)  # Se esta operação tem erro
    is_approved = Column(Boolean, nullable=True, default=None)  # None = pendente classificação, True = aprovada, False = reprovada
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    submission = relationship("ChallengeSubmission", back_populates="operations")
    errors = relationship("OperationError", back_populates="operation", cascade="all, delete-orphan")


class OperationError(Base):
    """Erros individuais de cada operação - múltiplos erros por operação"""
    __tablename__ = "operation_errors"
    
    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(Integer, ForeignKey("challenge_operations.id"), nullable=False)
    error_type = Column(String(50), nullable=False)  # METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE
    description = Column(String(160))  # Descrição do erro (max 160 chars)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    operation = relationship("ChallengeOperation", back_populates="errors")

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    certificate_number = Column(String(50), unique=True, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    student_name = Column(String(255), nullable=False)
    student_email = Column(String(255), nullable=False)
    training_plan_title = Column(String(255), nullable=False)
    total_hours = Column(Float, nullable=False)
    courses_completed = Column(Integer, default=0)
    average_mpu = Column(Float, default=0)
    average_approval_rate = Column(Float, default=0)
    is_valid = Column(Boolean, default=True)
    revoked_at = Column(DateTime(timezone=True))
    revocation_reason = Column(Text)
    
    user = relationship("User", back_populates="certificates")
    training_plan = relationship("TrainingPlan", back_populates="certificates")


class Rating(Base):
    """Sistema de avaliação com estrelas (0-5) para cursos, aulas, desafios, formadores e planos"""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Formando que avaliou
    
    # Tipo de item avaliado
    rating_type = Column(String(50), nullable=False)  # COURSE, LESSON, CHALLENGE, TRAINER, TRAINING_PLAN
    
    # IDs dos itens avaliados (apenas um será preenchido)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Formador avaliado
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=True)
    
    # Avaliação
    stars = Column(Integer, nullable=False)  # 0 a 5 estrelas
    comment = Column(Text, nullable=True)  # Comentário opcional
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", foreign_keys=[course_id])
    lesson = relationship("Lesson", foreign_keys=[lesson_id])
    challenge = relationship("Challenge", foreign_keys=[challenge_id])
    trainer = relationship("User", foreign_keys=[trainer_id])
    training_plan = relationship("TrainingPlan", foreign_keys=[training_plan_id])
