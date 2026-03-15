from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # TRAINEE, TRAINER, ADMIN, MANAGER
    is_active = Column(Boolean, default=True, nullable=False)
    is_pending = Column(Boolean, default=False, nullable=False)  # For TRAINER validation by ADMIN
    is_trainer = Column(Boolean, default=False, nullable=False)  # Can create/manage courses (Formador)
    is_tutor = Column(Boolean, default=False, nullable=False)    # Can mentor in Tutoria (Tutor)
    is_liberador = Column(Boolean, default=False, nullable=False) # Can release/approve operations (Liberador)
    is_team_lead = Column(Boolean, default=False, nullable=False) # Chefe de equipa
    is_referente = Column(Boolean, default=False, nullable=False) # Referente (representante do chefe)
    validated_at = Column(DateTime(timezone=True), nullable=True)  # When trainer was approved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Tutoria: FK para o tutor responsável (só para STUDENT/TRAINEE)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Equipa: FK para a equipa a que o utilizador pertence (exceto ADMIN)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    # Relationships
    enrollments = relationship("Enrollment", back_populates="user")
    created_courses = relationship("Course", back_populates="creator", foreign_keys="[Course.created_by]")
    training_plan_assignments = relationship("TrainingPlanAssignment", foreign_keys="[TrainingPlanAssignment.user_id]", back_populates="user")
    assigned_training_plans = relationship("TrainingPlanAssignment", foreign_keys="[TrainingPlanAssignment.assigned_by]", back_populates="assigner")
    certificates = relationship("Certificate", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")
    team = relationship("Team", foreign_keys=[team_id], back_populates="members")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")


class Team(Base):
    """Equipa de trabalho — liderada por um MANAGER, com múltiplos membros e serviços"""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # legacy
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", foreign_keys=[product_id])
    manager = relationship("User", foreign_keys=[manager_id])
    members = relationship("User", foreign_keys="[User.team_id]", back_populates="team")
    # M2M relationships
    team_members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    team_services = relationship("TeamService", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    """Associação M2M utilizador ↔ equipa (um utilizador pode pertencer a várias equipas)"""
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="team_members")
    user = relationship("User", back_populates="team_memberships")


class TeamService(Base):
    """Associação M2M equipa ↔ serviço/produto"""
    __tablename__ = "team_services"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="team_services")
    product = relationship("Product")


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
    is_active = Column(Boolean, default=True, nullable=False, server_default='1')
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
    is_active = Column(Boolean, default=True, nullable=False, server_default='1')
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


# =================== Tutoria v2 — Gestão de Erros e Planos de Ação ===================

class ErrorCategory(Base):
    """Categoria de erro configurável pelo Admin — Tipología Error"""
    __tablename__ = "tutoria_error_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("tutoria_error_categories.id"), nullable=True)
    origin_id = Column(Integer, ForeignKey("error_origins.id", ondelete="SET NULL"), nullable=True)  # Dependência: Tipología → Origen
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subcategories = relationship("ErrorCategory", backref="parent", remote_side="ErrorCategory.id")
    origin = relationship("ErrorOrigin", foreign_keys=[origin_id])
    errors = relationship("TutoriaError", back_populates="category")


# ── Novas tabelas de dados mestres para erros (espelho Access) ────────────────

class ErrorImpact(Base):
    """Tipo de impacto do erro — Dados Mestres"""
    __tablename__ = "error_impacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    level = Column(String(10), nullable=True)          # ALTO | BAIXO
    image_url = Column(String(500), nullable=True)     # URL ou Base64 da imagem ilustrativa
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ErrorOrigin(Base):
    """Origem do erro — Dados Mestres"""
    __tablename__ = "error_origins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ErrorDetectedBy(Base):
    """Quem detetou o erro — Dados Mestres"""
    __tablename__ = "error_detected_by"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Department(Base):
    """Departamento — Dados Mestres"""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Activity(Base):
    """Actividade / Evento — Dados Mestres. Depende de Banco + Depto."""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="SET NULL"), nullable=True)          # Dependência: Banco
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)  # Dependência: Depto
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bank = relationship("Bank", foreign_keys=[bank_id])
    department = relationship("Department", foreign_keys=[department_id])


class ErrorType(Base):
    """Tipo de Erro (código SWIFT / campo) — Dados Mestres. Depende de Actividad."""
    __tablename__ = "error_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)  # Dependência: Actividad
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    activity = relationship("Activity", foreign_keys=[activity_id])


class TutoriaError(Base):
    """Registo de um erro / incidência — espelho do formulário Access"""
    __tablename__ = "tutoria_errors"

    id = Column(Integer, primary_key=True, index=True)

    # ── Datas ──
    date_occurrence = Column(Date, nullable=False)                    # Fecha Error
    date_detection = Column(Date, nullable=True)                      # Fch Detección
    date_solution = Column(Date, nullable=True)                       # Fch Solución

    # ── Dados da transação ──
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="SET NULL"), nullable=True)    # Banco (Cliente)
    office = Column(String(100), nullable=True)                       # Oficina
    reference_code = Column(String(200), nullable=True)                    # Referencia
    currency = Column(String(10), nullable=True)                      # Div (Divisa)
    amount = Column(Float, nullable=True)                             # Importe
    final_client = Column(String(200), nullable=True)                 # Cliente Final

    # ── Classificação (Dados Mestres) ──
    impact_id = Column(Integer, ForeignKey("error_impacts.id", ondelete="SET NULL"), nullable=True)    # Impacto
    origin_id = Column(Integer, ForeignKey("error_origins.id", ondelete="SET NULL"), nullable=True)    # Origen
    category_id = Column(Integer, ForeignKey("tutoria_error_categories.id"), nullable=True)            # Tipología Error
    detected_by_id = Column(Integer, ForeignKey("error_detected_by.id", ondelete="SET NULL"), nullable=True)  # Detectado Por
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)  # Depto
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)     # Actividad
    error_type_id = Column(Integer, ForeignKey("error_types.id", ondelete="SET NULL"), nullable=True)  # Tipo Error

    # ── Pessoas ──
    tutorado_id = Column(Integer, ForeignKey("users.id"), nullable=False)             # Grabador
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)           # quem cria no sistema
    approver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Liberador

    # ── Pessoas adicionais ──
    grabador_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    liberador_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ── Descrição e solução ──
    description = Column(Text, nullable=False)                        # Descripción incidencia
    solution = Column(Text, nullable=True)                            # Solución
    action_plan_text = Column(Text, nullable=True)                    # Plan de Acción (texto livre)
    action_plan_summary = Column(Text, nullable=True)                 # Resumo para Excel

    # ── Report-only fields (filled later / in meetings) ──
    clasificacion = Column(String(50), nullable=True)                  # Clasificación: Externo / Interno
    escalado = Column(Text, nullable=True)                             # Escalado
    comentarios_reunion = Column(Text, nullable=True)                  # Comentarios vistos en la reunión

    # ── Análise ──
    impact_level = Column(String(20), nullable=True)                   # ALTO | BAIXO
    impact_detail = Column(String(100), nullable=True)                # Sub-detalhe do impacto
    origin_detail = Column(String(100), nullable=True)                # Sub-detalhe da origem
    solution_confirmed = Column(Boolean, default=False, nullable=False)
    pending_solution = Column(Boolean, default=False, nullable=False)
    excel_sent = Column(Boolean, default=False, nullable=False)
    cancelled_reason = Column(Text, nullable=True)
    cancelled_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ── Classificação legada ──
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    severity = Column(String(20), default="MEDIA", nullable=False)
    status = Column(String(30), default="REGISTERED", nullable=False)
    tags = Column(JSON, nullable=True)
    analysis_5_why = Column(Text, nullable=True)
    is_recurrent = Column(Boolean, default=False, nullable=False)
    recurrence_count = Column(Integer, default=0, nullable=False)
    recurrence_type = Column(String(30), nullable=True)               # Recurrencia: SI | NO | PERIODICA
    is_active = Column(Boolean, default=True, nullable=False)
    inactivation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──
    tutorado = relationship("User", foreign_keys=[tutorado_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    approver = relationship("User", foreign_keys=[approver_id])
    grabador = relationship("User", foreign_keys=[grabador_id])
    liberador = relationship("User", foreign_keys=[liberador_id])
    cancelled_by = relationship("User", foreign_keys=[cancelled_by_id])
    bank = relationship("Bank", foreign_keys=[bank_id])
    category = relationship("ErrorCategory", back_populates="errors")
    product = relationship("Product", foreign_keys=[product_id])
    impact = relationship("ErrorImpact", foreign_keys=[impact_id])
    origin = relationship("ErrorOrigin", foreign_keys=[origin_id])
    detected_by = relationship("ErrorDetectedBy", foreign_keys=[detected_by_id])
    department = relationship("Department", foreign_keys=[department_id])
    activity = relationship("Activity", foreign_keys=[activity_id])
    error_type = relationship("ErrorType", foreign_keys=[error_type_id])
    action_plans = relationship("TutoriaActionPlan", back_populates="error", cascade="all, delete-orphan")
    motivos = relationship("TutoriaErrorMotivo", back_populates="error", cascade="all, delete-orphan")
    refs = relationship("TutoriaErrorRef", back_populates="error", cascade="all, delete-orphan")
    comments = relationship(
        "TutoriaComment",
        primaryjoin="and_(TutoriaComment.ref_type=='ERROR', foreign(TutoriaComment.ref_id)==TutoriaError.id)",
        viewonly=True,
        overlaps="action_item_comments,plan_comments"
    )


class TutoriaErrorRef(Base):
    """Referências múltiplas por erro (Ref/Divisa/Importe/Cliente Final)"""
    __tablename__ = "tutoria_error_refs"

    id = Column(Integer, primary_key=True, index=True)
    error_id = Column(Integer, ForeignKey("tutoria_errors.id", ondelete="CASCADE"), nullable=False)
    referencia = Column(String(100), nullable=True)
    divisa = Column(String(20), nullable=True)
    importe = Column(Float, nullable=True)
    cliente_final = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    error = relationship("TutoriaError", back_populates="refs")


class TutoriaErrorMotivo(Base):
    """Motivos individuais de cada erro — múltiplos motivos por erro"""
    __tablename__ = "tutoria_error_motivos"

    id = Column(Integer, primary_key=True, index=True)
    error_id = Column(Integer, ForeignKey("tutoria_errors.id", ondelete="CASCADE"), nullable=False)
    typology = Column(String(50), nullable=False)  # METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    error = relationship("TutoriaError", back_populates="motivos")


class TutoriaActionPlan(Base):
    """Plano de ação 5W2H associado a um erro"""
    __tablename__ = "tutoria_action_plans"

    id = Column(Integer, primary_key=True, index=True)
    error_id = Column(Integer, ForeignKey("tutoria_errors.id", ondelete="CASCADE"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tutorado_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Análise de Causa Raiz
    analysis_5_why = Column(Text, nullable=True)

    # Ações principais
    immediate_correction = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)

    # 5W2H
    what = Column(Text, nullable=True)
    why = Column(Text, nullable=True)
    where_field = Column(Text, nullable=True)
    when_deadline = Column(Date, nullable=True)
    who = Column(Text, nullable=True)
    how = Column(Text, nullable=True)
    how_much = Column(Text, nullable=True)

    # Tipo e responsável do plano
    plan_type = Column(String(20), nullable=True)        # CORRECTIVO | PREVENTIVO | MELHORIA
    responsible_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expected_result = Column(Text, nullable=True)
    deadline = Column(Date, nullable=True)
    result_score = Column(Integer, nullable=True)         # 0-5
    result_comment = Column(String(160), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Fluxo de aprovação/validação
    status = Column(String(30), default="OPEN", nullable=False)
    # OPEN | IN_PROGRESS | DONE | RASCUNHO | AGUARDANDO_APROVACAO | APROVADO | EM_EXECUCAO | CONCLUIDO | DEVOLVIDO
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    validated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    error = relationship("TutoriaError", back_populates="action_plans")
    creator = relationship("User", foreign_keys=[created_by_id])
    tutorado = relationship("User", foreign_keys=[tutorado_id])
    responsible = relationship("User", foreign_keys=[responsible_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    validator = relationship("User", foreign_keys=[validated_by_id])
    items = relationship("TutoriaActionItem", back_populates="plan", cascade="all, delete-orphan")
    comments = relationship(
        "TutoriaComment",
        primaryjoin="and_(TutoriaComment.ref_type=='PLAN', foreign(TutoriaComment.ref_id)==TutoriaActionPlan.id)",
        viewonly=True,
        overlaps="action_item_comments,error_comments"
    )


class TutoriaActionItem(Base):
    """Ação individual dentro de um plano de ação"""
    __tablename__ = "tutoria_action_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("tutoria_action_plans.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(20), default="CORRETIVA", nullable=False)
    # IMEDIATA | CORRETIVA | PREVENTIVA
    description = Column(Text, nullable=False)
    responsible_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="PENDENTE", nullable=False)
    # PENDENTE | EM_ANDAMENTO | CONCLUIDO | DEVOLVIDO
    evidence_text = Column(Text, nullable=True)
    reviewer_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    plan = relationship("TutoriaActionPlan", back_populates="items")
    responsible = relationship("User", foreign_keys=[responsible_id])


class TutoriaComment(Base):
    """Comentário/feedback num erro, plano ou ação"""
    __tablename__ = "tutoria_comments"

    id = Column(Integer, primary_key=True, index=True)
    ref_type = Column(String(20), nullable=False)   # ERROR | PLAN | ACTION_ITEM
    ref_id = Column(Integer, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", foreign_keys=[author_id])


class ChatFAQ(Base):
    """Perguntas e respostas personalizadas para o chatbot, com material de apoio"""
    __tablename__ = "chat_faqs"

    id = Column(Integer, primary_key=True, index=True)
    # Palavras-chave para deteção (uma por linha ou separadas por vírgula)
    keywords_pt = Column(Text, nullable=False)   # pt-PT
    keywords_es = Column(Text, nullable=True)    # espanhol
    keywords_en = Column(Text, nullable=True)    # inglês
    # Respostas por idioma
    answer_pt = Column(Text, nullable=False)
    answer_es = Column(Text, nullable=True)
    answer_en = Column(Text, nullable=True)
    # Material de apoio
    support_url = Column(String(500), nullable=True)
    support_label = Column(String(200), nullable=True)  # texto do link
    # Filtro por role (NULL = todos; ex: "ADMIN,TRAINER")
    role_filter = Column(String(100), nullable=True)
    # Ordenação (menor = maior prioridade)
    priority = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by = relationship("User", foreign_keys=[created_by_id])


# =================== Erros Internos — Sensos e Fichas de Aprendizagem ===================

class Senso(Base):
    """Período de censo para registo de erros internos"""
    __tablename__ = "sensos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="ATIVO", nullable=False)  # ATIVO | FECHADO
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by_id])
    internal_errors = relationship("InternalError", back_populates="senso", cascade="all, delete-orphan")


class InternalError(Base):
    """Erro interno identificado pelo liberador após gravação"""
    __tablename__ = "internal_errors"

    id = Column(Integer, primary_key=True, index=True)
    senso_id = Column(Integer, ForeignKey("sensos.id", ondelete="CASCADE"), nullable=False)

    # Pessoas
    gravador_id = Column(Integer, ForeignKey("users.id"), nullable=False)      # Quem gravou (cometeu o erro)
    liberador_id = Column(Integer, ForeignKey("users.id"), nullable=False)     # Quem identificou o erro
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)    # Quem registou no sistema

    # Classificação
    impact_id = Column(Integer, ForeignKey("error_impacts.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("tutoria_error_categories.id", ondelete="SET NULL"), nullable=True)
    error_type_id = Column(Integer, ForeignKey("error_types.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="SET NULL"), nullable=True)

    # Detalhes
    description = Column(Text, nullable=False)
    reference_code = Column(String(200), nullable=True)
    date_occurrence = Column(Date, nullable=False)

    # Pesos / avaliação
    peso_liberador = Column(Integer, nullable=True)    # Peso atribuído pelo liberador (1-10)
    peso_gravador = Column(Integer, nullable=True)     # Peso atribuído pelo gravador (1-10)
    peso_tutor = Column(Integer, nullable=True)        # Peso final atribuído pelo tutor/admin

    # 5 Porquês — preenchido pelo gravador
    why_1 = Column(Text, nullable=True)
    why_2 = Column(Text, nullable=True)
    why_3 = Column(Text, nullable=True)
    why_4 = Column(Text, nullable=True)
    why_5 = Column(Text, nullable=True)

    # Avaliação do tutor
    tutor_evaluation = Column(Text, nullable=True)
    tutor_evaluated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Status
    status = Column(String(30), default="PENDENTE", nullable=False)
    # PENDENTE | AGUARDANDO_GRAVADOR | AVALIADO | PLANO_CRIADO | CONCLUIDO
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    senso = relationship("Senso", back_populates="internal_errors")
    gravador = relationship("User", foreign_keys=[gravador_id])
    liberador = relationship("User", foreign_keys=[liberador_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    tutor_evaluator = relationship("User", foreign_keys=[tutor_evaluated_by_id])
    impact = relationship("ErrorImpact", foreign_keys=[impact_id])
    category = relationship("ErrorCategory", foreign_keys=[category_id])
    error_type = relationship("ErrorType", foreign_keys=[error_type_id])
    department = relationship("Department", foreign_keys=[department_id])
    activity = relationship("Activity", foreign_keys=[activity_id])
    bank = relationship("Bank", foreign_keys=[bank_id])
    learning_sheet = relationship("LearningSheet", back_populates="internal_error", uselist=False)
    action_plan = relationship("InternalErrorActionPlan", back_populates="internal_error", uselist=False)
    classifications = relationship("InternalErrorClassification", back_populates="internal_error", cascade="all, delete-orphan")


class InternalErrorClassification(Base):
    """Classificação individual de um erro interno (1 operação pode ter N erros)"""
    __tablename__ = "internal_error_classifications"

    id = Column(Integer, primary_key=True, index=True)
    internal_error_id = Column(Integer, ForeignKey("internal_errors.id", ondelete="CASCADE"), nullable=False)
    classification = Column(String(50), nullable=False)  # METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    internal_error = relationship("InternalError", back_populates="classifications")


class InternalErrorActionPlan(Base):
    """Plano de ação para um erro interno — criado pelo tutor/admin"""
    __tablename__ = "internal_error_action_plans"

    id = Column(Integer, primary_key=True, index=True)
    internal_error_id = Column(Integer, ForeignKey("internal_errors.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="PENDENTE", nullable=False)  # PENDENTE | EM_EXECUCAO | CONCLUIDO
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    internal_error = relationship("InternalError", back_populates="action_plan")
    creator = relationship("User", foreign_keys=[created_by_id])
    items = relationship("InternalErrorActionItem", back_populates="plan", cascade="all, delete-orphan")


class InternalErrorActionItem(Base):
    """Ação dentro do plano de erros internos"""
    __tablename__ = "internal_error_action_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("internal_error_action_plans.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String(20), default="CORRETIVA", nullable=False)  # IMEDIATA | CORRETIVA | PREVENTIVA
    responsible_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="PENDENTE", nullable=False)  # PENDENTE | EM_ANDAMENTO | CONCLUIDO
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    plan = relationship("InternalErrorActionPlan", back_populates="items")
    responsible = relationship("User", foreign_keys=[responsible_id])


class LearningSheet(Base):
    """Ficha de aprendizagem do erro — visível apenas ao tutorado"""
    __tablename__ = "learning_sheets"

    id = Column(Integer, primary_key=True, index=True)
    internal_error_id = Column(Integer, ForeignKey("internal_errors.id", ondelete="CASCADE"), nullable=False, unique=True)
    tutorado_id = Column(Integer, ForeignKey("users.id"), nullable=False)        # O gravador
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)      # Tutor/admin que criou

    # Conteúdo da ficha
    error_summary = Column(Text, nullable=False)           # Resumo do erro
    impact_description = Column(Text, nullable=True)       # Onde e como impacta a operação
    actions_taken = Column(Text, nullable=True)            # Ações realizadas
    error_weight = Column(Integer, nullable=True)          # Peso do erro
    tutor_evaluation = Column(Text, nullable=True)         # Avaliação do tutor
    lessons_learned = Column(Text, nullable=True)          # Lições aprendidas
    recommendations = Column(Text, nullable=True)          # Recomendações para evitar recorrência

    is_read = Column(Boolean, default=False, nullable=False)  # Se o tutorado já leu
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    internal_error = relationship("InternalError", back_populates="learning_sheet")
    tutorado = relationship("User", foreign_keys=[tutorado_id])
    creator = relationship("User", foreign_keys=[created_by_id])


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


# ── Portal de Chamados (Support Tickets / Kanban) ──────────────
class Chamado(Base):
    """Chamado de suporte — bug ou melhoria nos portais"""
    __tablename__ = "chamados"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String(20), nullable=False, default="BUG")           # BUG | MELHORIA
    priority = Column(String(20), nullable=False, default="MEDIA")     # BAIXA | MEDIA | ALTA | CRITICA
    status = Column(String(30), nullable=False, default="ABERTO")      # ABERTO | EM_ANDAMENTO | EM_REVISAO | CONCLUIDO
    portal = Column(String(30), nullable=False, default="GERAL")       # FORMACOES | TUTORIA | RELATORIOS | DADOS_MESTRES | GERAL
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # List of base64-encoded screenshot strings
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by_id])
    assignee = relationship("User", foreign_keys=[assigned_to_id])
    comments = relationship("ChamadoComment", back_populates="chamado", cascade="all, delete-orphan", order_by="ChamadoComment.created_at")


class ChamadoComment(Base):
    """Comentário num chamado"""
    __tablename__ = "chamado_comments"

    id = Column(Integer, primary_key=True, index=True)
    chamado_id = Column(Integer, ForeignKey("chamados.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chamado = relationship("Chamado", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


# =================== Ficha de Aprendizagem ===================

class TutoriaLearningSheet(Base):
    """Ficha de aprendizagem gerada para o tutorado após um erro"""
    __tablename__ = "tutoria_learning_sheets"

    id = Column(Integer, primary_key=True, index=True)
    error_id = Column(Integer, ForeignKey("tutoria_errors.id", ondelete="CASCADE"), nullable=False)
    tutorado_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Conteúdo
    title = Column(String(300), nullable=False)
    error_summary = Column(Text, nullable=False)          # Resumo do erro cometido
    root_cause = Column(Text, nullable=True)               # Causa raiz identificada (dos 5 porquês)
    correct_procedure = Column(Text, nullable=True)        # Procedimento correto
    key_learnings = Column(Text, nullable=True)            # Pontos-chave de aprendizagem
    reference_material = Column(Text, nullable=True)       # Material de referência / links
    acknowledgment_note = Column(Text, nullable=True)      # Nota de reconhecimento pelo tutorado

    # Status
    status = Column(String(20), default="PENDENTE", nullable=False)
    # PENDENTE | SUBMITTED | REVIEWED | LIDA | RECONHECIDA
    read_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    is_mandatory = Column(Boolean, default=False, nullable=False)

    # Reflexão do participante
    reflection = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Revisão pelo Tutor
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tutor_outcome = Column(String(30), nullable=True)  # SEM_ACAO | FEEDBACK_DIRETO | TUTORIA_INDIVIDUAL | TUTORIA_GRUPAL
    tutor_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    error = relationship("TutoriaError", foreign_keys=[error_id])
    tutorado = relationship("User", foreign_keys=[tutorado_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    tutor = relationship("User", foreign_keys=[tutor_id])


# =================== Notificações Tutoria ===================

class TutoriaNotification(Base):
    """Notificação/alerta in-app para o sistema de tutoria"""
    __tablename__ = "tutoria_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    error_id = Column(Integer, ForeignKey("tutoria_errors.id", ondelete="SET NULL"), nullable=True)
    plan_id = Column(Integer, ForeignKey("tutoria_action_plans.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(50), nullable=False)
    # NEW_ERROR | CANCELLED_ERROR | PENDING_REVIEW | PLAN_APPROVED | PLAN_RETURNED | SOLUTION_NEEDED | LEARNING_SHEET
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    error = relationship("TutoriaError", foreign_keys=[error_id])
    plan = relationship("TutoriaActionPlan", foreign_keys=[plan_id])
