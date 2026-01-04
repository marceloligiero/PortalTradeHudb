from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserRegister(BaseModel):
    """Schema for user registration (email, password, role selection)"""
    email: EmailStr
    password: str
    full_name: str
    role: str  # TRAINER or STUDENT

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    is_pending: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

class UserWithPendingStatus(User):
    """Extended user schema that includes pending status"""
    is_pending: bool

# Auth Schemas
class LoginRequest(BaseModel):
    """Schema for JSON login request"""
    username: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    bank_id: int
    product_id: int

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    order_index: int = 0
    estimated_minutes: int = 30

class LessonCreate(LessonBase):
    course_id: int

class Lesson(LessonBase):
    id: int
    course_id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Bank Schemas
class BankBase(BaseModel):
    code: str
    name: str
    country: str

class BankCreate(BankBase):
    pass

class Bank(BankBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Product Schemas
class ProductBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Training Plan Schemas
class TrainingPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    trainer_id: int
    student_id: Optional[int] = None  # 1 aluno por plano
    bank_id: Optional[int] = None
    product_id: Optional[int] = None
    # Use string dates (ISO) for API responses to match frontend expectations
    # Routes currently return ISO strings via .isoformat(), so keep schema as str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class TrainingPlanCreate(TrainingPlanBase):
    course_ids: Optional[list[int]] = []

class TrainingPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    trainer_id: Optional[int] = None
    student_id: Optional[int] = None
    is_active: Optional[bool] = None
    course_ids: Optional[list[int]] = None

class TrainingPlan(TrainingPlanBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    total_duration_minutes: Optional[int] = None  # Tempo total dos cursos
    completed_minutes: Optional[int] = None  # Tempo completado
    remaining_minutes: Optional[int] = None  # Tempo restante
    progress_percentage: Optional[float] = None  # Percentual de conclusão
    
    model_config = {"from_attributes": True}

class TrainingPlanDetail(TrainingPlan):
    """Training plan with full details including courses and assignments"""
    courses: list[Course] = []
    days_total: Optional[int] = None
    days_remaining: Optional[int] = None
    status: Optional[str] = None

# Training Plan Assignment Schemas
class AssignStudentToPlan(BaseModel):
    student_id: int

class TrainingPlanAssignment(BaseModel):
    id: int
    training_plan_id: int
    user_id: int
    assigned_by: int
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class StudentAssignment(BaseModel):
    id: int
    user_id: int
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# User Basic (for trainer listing)
class UserBasic(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    
    model_config = {"from_attributes": True}

# Challenge Schemas
class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    challenge_type: str = "COMPLETE"  # COMPLETE or SUMMARY
    operations_required: int  # Meta de operações
    time_limit_minutes: int  # Meta de tempo em minutos
    target_mpu: float  # Meta de MPU para aprovação
    max_errors: int = 0  # Máximo de erros permitidos para aprovação

class ChallengeCreate(ChallengeBase):
    course_id: int

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    challenge_type: Optional[str] = None
    operations_required: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    target_mpu: Optional[float] = None
    max_errors: Optional[int] = None
    is_active: Optional[bool] = None

class Challenge(ChallengeBase):
    id: int
    course_id: int
    created_by: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Detailed Course with lessons and challenges (placed after Challenge definition to avoid forward refs)
class CourseDetail(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    order_index: Optional[int] = 0
    use_custom: Optional[bool] = False
    custom_title: Optional[str] = None
    custom_description: Optional[str] = None
    lessons: list[Lesson] = []
    challenges: list[Challenge] = []
    
    model_config = {"from_attributes": True}


# Challenge Part (para desafios tipo COMPLETE)
class ChallengePartBase(BaseModel):
    part_number: int
    operations_count: int
    started_at: datetime
    completed_at: datetime

class ChallengePartCreate(ChallengePartBase):
    pass

class ChallengePart(ChallengePartBase):
    id: int
    challenge_id: int
    submission_id: int
    duration_minutes: Optional[float] = None
    mpu: Optional[float] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Challenge Submission Schemas
class ChallengeSubmissionBase(BaseModel):
    challenge_id: int
    user_id: int
    submission_type: str  # COMPLETE or SUMMARY

class ChallengeSubmissionComplete(ChallengeSubmissionBase):
    """Para desafios tipo COMPLETE - com partes individuais"""
    parts: list[ChallengePartCreate]

class ChallengeSubmissionSummary(ChallengeSubmissionBase):
    """Para desafios tipo SUMMARY - apenas totais"""
    total_operations: int
    total_time_minutes: int
    errors_count: int = 0

class ChallengeSubmissionCreate(ChallengeSubmissionBase):
    # Para ambos os tipos
    total_operations: Optional[int] = None
    total_time_minutes: Optional[int] = None
    errors_count: Optional[int] = 0
    parts: Optional[list[ChallengePartCreate]] = []

class ChallengeSubmission(ChallengeSubmissionBase):
    id: int
    total_operations: Optional[int] = None
    total_time_minutes: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    calculated_mpu: Optional[float] = None
    mpu_vs_target: Optional[float] = None  # Percentual vs meta
    is_approved: bool
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class ChallengeSubmissionDetail(ChallengeSubmission):
    """Submission com detalhes completos incluindo partes"""
    parts: list[ChallengePart] = []
    challenge: Optional[Challenge] = None
    user: Optional[UserBasic] = None
    submitter: Optional[UserBasic] = None

# Lesson Extended
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: str = "THEORETICAL"
    order_index: int = 0
    estimated_minutes: int = 30
    video_url: Optional[str] = None
    materials_url: Optional[str] = None

class LessonCreate(LessonBase):
    course_id: int

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: Optional[str] = None
    order_index: Optional[int] = None
    estimated_minutes: Optional[int] = None
    video_url: Optional[str] = None
    materials_url: Optional[str] = None

class Lesson(LessonBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# Input used to finish a COMPLETE submission (allow passing errors count)
class ChallengeFinishInput(BaseModel):
    errors_count: Optional[int] = 0

# Course with total hours calculation
class CourseWithHours(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    total_lesson_hours: float  # Soma das aulas
    total_challenge_hours: float  # Soma dos desafios
    total_hours: float  # Total geral
    lesson_count: int
    challenge_count: int
    
    model_config = {"from_attributes": True}
