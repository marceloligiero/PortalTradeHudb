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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="user")
    created_courses = relationship("Course", back_populates="creator", foreign_keys="[Course.created_by]")
    training_plan_assignments = relationship("TrainingPlanAssignment", foreign_keys="[TrainingPlanAssignment.user_id]", back_populates="user")
    assigned_training_plans = relationship("TrainingPlanAssignment", foreign_keys="[TrainingPlanAssignment.assigned_by]", back_populates="assigner")
    certificates = relationship("Certificate", back_populates="user")

class Bank(Base):
    __tablename__ = "banks"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    country = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    courses = relationship("Course", back_populates="bank")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    courses = relationship("Course", back_populates="product")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bank = relationship("Bank", back_populates="courses")
    product = relationship("Product", back_populates="courses")
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
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    actual_time_minutes = Column(Integer)
    estimated_minutes = Column(Integer, default=30)
    mpu = Column(Float)
    mpu_percentage = Column(Float)
    is_approved = Column(Boolean, default=False)
    status = Column(String(50), default="IN_PROGRESS")
    
    enrollment = relationship("Enrollment", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress_records")

class TrainingPlan(Base):
    __tablename__ = "training_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Formador responsável
    bank_id = Column(Integer, ForeignKey("banks.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    courses = relationship("TrainingPlanCourse", back_populates="training_plan")
    assignments = relationship("TrainingPlanAssignment", back_populates="training_plan")
    certificates = relationship("Certificate", back_populates="training_plan")
    trainer = relationship("User", foreign_keys=[trainer_id])
    bank = relationship("Bank")
    product = relationship("Product")

class TrainingPlanCourse(Base):
    __tablename__ = "training_plan_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index = Column(Integer, default=0)
    use_custom = Column(Boolean, default=False)
    custom_title = Column(String(255))
    custom_description = Column(Text)
    
    training_plan = relationship("TrainingPlan", back_populates="courses")
    course = relationship("Course")

class TrainingPlanAssignment(Base):
    __tablename__ = "training_plan_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    training_plan = relationship("TrainingPlan", back_populates="assignments")
    user = relationship("User", foreign_keys=[user_id], back_populates="training_plan_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by], back_populates="assigned_training_plans")

class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    challenge_type = Column(String(50), default="COMPLETE")  # COMPLETE or SUMMARY
    operations_required = Column(Integer, default=100, nullable=False)  # Meta de operações
    time_limit_minutes = Column(Integer, default=60, nullable=False)  # Meta de tempo
    target_mpu = Column(Float, nullable=False)  # Meta de MPU para aprovação
    max_errors = Column(Integer, default=0, nullable=False)  # Max de erros permitidos (0 = nenhum)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="challenges")
    submissions = relationship("ChallengeSubmission", back_populates="challenge")
    parts = relationship("ChallengePart", back_populates="challenge", cascade="all, delete-orphan")

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
    submission_type = Column(String(50), nullable=False)  # COMPLETE or SUMMARY
    
    # Para tipo SUMMARY (resumido)
    total_operations = Column(Integer)  # Total de operações inseridas
    total_time_minutes = Column(Integer)  # Tempo total inserido
    errors_count = Column(Integer, default=0)  # Número de erros cometidos pelo aluno
    
    # Campos comuns
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    calculated_mpu = Column(Float)  # MPU calculado (operações / tempo)
    mpu_vs_target = Column(Float)  # Percentual vs meta (calculado_mpu / target_mpu * 100)
    is_approved = Column(Boolean, default=False)  # True se MPU >= target_mpu
    score = Column(Float)  # Nota calculada
    feedback = Column(Text)
    submitted_by = Column(Integer, ForeignKey("users.id"))  # Formador que aplicou
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    challenge = relationship("Challenge", back_populates="submissions")
    user = relationship("User", foreign_keys=[user_id])
    submitter = relationship("User", foreign_keys=[submitted_by])
    parts = relationship("ChallengePart", back_populates="submission", cascade="all, delete-orphan")

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
