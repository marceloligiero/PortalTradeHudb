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
    # Legacy single bank/product (for backward compatibility)
    bank_id: Optional[int] = None
    product_id: Optional[int] = None
    # New multi-bank/product support
    bank_ids: Optional[list[int]] = []
    product_ids: Optional[list[int]] = []

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    bank_id: Optional[int] = None
    product_id: Optional[int] = None
    bank_ids: Optional[list[int]] = None
    product_ids: Optional[list[int]] = None
    is_active: Optional[bool] = None

class Course(CourseBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    # Lista de bancos e produtos associados
    banks: Optional[list] = []
    products: Optional[list] = []
    
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
    code: Optional[str] = None
    name: str
    country: str

class BankCreate(BankBase):
    pass

class BankUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    is_active: Optional[bool] = None

class Bank(BankBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Product Schemas
class ProductBase(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Product(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Training Plan Schemas
class TrainingPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    trainer_id: Optional[int] = None  # Formador principal (retrocompatibilidade)
    trainer_ids: Optional[list[int]] = []  # Lista de formadores
    student_id: Optional[int] = None  # Legacy: 1 aluno por plano (backward compat)
    student_ids: Optional[list[int]] = []  # Catalog model: múltiplos alunos
    # Legacy single bank/product (for backward compatibility)
    bank_id: Optional[int] = None
    product_id: Optional[int] = None
    # New multi-bank/product support
    bank_ids: Optional[list[int]] = []
    product_ids: Optional[list[int]] = []
    # Use string dates (ISO) for API responses to match frontend expectations
    # Routes currently return ISO strings via .isoformat(), so keep schema as str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class TrainingPlanCreate(TrainingPlanBase):
    course_ids: Optional[list[int]] = []

class TrainingPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    trainer_id: Optional[int] = None  # Formador principal
    trainer_ids: Optional[list[int]] = None  # Lista de formadores
    student_id: Optional[int] = None
    bank_id: Optional[int] = None
    product_id: Optional[int] = None
    bank_ids: Optional[list[int]] = None
    product_ids: Optional[list[int]] = None
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
    # Lista de bancos e produtos associados
    banks: Optional[list] = []
    products: Optional[list] = []
    
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
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None

class AssignMultipleStudentsToPlan(BaseModel):
    student_ids: list[int]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None

class TrainingPlanAssignment(BaseModel):
    id: int
    training_plan_id: int
    user_id: int
    assigned_by: int
    assigned_at: datetime
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = "PENDING"
    progress_percentage: Optional[float] = 0
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class EnrollmentUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TrainingPlanTrainerInfo(BaseModel):
    """Informação de um formador associado a um plano"""
    id: int
    trainer_id: int
    trainer_name: str
    trainer_email: str
    is_primary: bool
    assigned_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class StudentAssignment(BaseModel):
    id: int
    user_id: int
    assigned_at: datetime
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = "PENDING"
    progress_percentage: Optional[float] = 0
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    # Campos do utilizador
    name: Optional[str] = None
    email: Optional[str] = None
    # Computed fields
    days_remaining: Optional[int] = None
    is_delayed: Optional[bool] = False
    
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
    difficulty: str = "medium"  # easy, medium, hard
    challenge_type: str = "COMPLETE"  # COMPLETE or SUMMARY
    operations_required: int  # Meta de operações
    time_limit_minutes: int  # Meta de tempo em minutos
    target_mpu: float  # Meta de MPU para aprovação
    max_errors: int = 0  # Máximo de operações com erro permitidas
    # KPIs selecionáveis
    use_volume_kpi: bool = True  # Nr de operações é critério
    use_mpu_kpi: bool = True  # MPU é critério
    use_errors_kpi: bool = True  # Nr de operações com erro é critério
    # Modo de avaliação: AUTO (automático por KPI) ou MANUAL (formador decide)
    kpi_mode: str = "AUTO"  # AUTO ou MANUAL
    # Permitir nova tentativa após reprovação
    allow_retry: bool = False

class ChallengeCreate(ChallengeBase):
    course_id: int

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    challenge_type: Optional[str] = None
    operations_required: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    target_mpu: Optional[float] = None
    max_errors: Optional[int] = None
    is_active: Optional[bool] = None
    use_volume_kpi: Optional[bool] = None
    use_mpu_kpi: Optional[bool] = None
    use_errors_kpi: Optional[bool] = None
    kpi_mode: Optional[str] = None
    allow_retry: Optional[bool] = None

class Challenge(ChallengeBase):
    id: int
    course_id: int
    course_name: Optional[str] = None
    created_by: int
    is_active: bool
    is_released: bool = False
    released_at: Optional[datetime] = None
    released_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class ChallengeBasic(BaseModel):
    """Schema simplificado de Challenge para listagens"""
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    challenge_type: str
    operations_required: int
    time_limit_minutes: int
    target_mpu: Optional[float] = None
    max_errors: Optional[int] = None
    use_volume_kpi: Optional[bool] = True
    use_mpu_kpi: Optional[bool] = True
    use_errors_kpi: Optional[bool] = True
    kpi_mode: Optional[str] = "AUTO"
    allow_retry: Optional[bool] = False
    is_released: Optional[bool] = False
    created_by: Optional[int] = None
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class ChallengeRelease(BaseModel):
    """Schema para liberar desafio"""
    is_released: bool = True


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
    total_time_minutes: float
    errors_count: int = 0
    training_plan_id: Optional[int] = None
    # Erros por conceito
    error_methodology: int = 0
    error_knowledge: int = 0
    error_detail: int = 0
    error_procedure: int = 0
    # Referência da operação
    operation_reference: Optional[str] = None
    # Detalhes dos erros individuais
    error_details: Optional[list[dict]] = []  # [{error_type, description, operation_reference}]

class ChallengeSubmissionCreate(ChallengeSubmissionBase):
    # Para ambos os tipos
    total_operations: Optional[int] = None
    total_time_minutes: Optional[float] = None
    errors_count: Optional[int] = 0
    parts: Optional[list[ChallengePartCreate]] = []

class ChallengeSubmission(ChallengeSubmissionBase):
    id: int
    status: Optional[str] = "IN_PROGRESS"  # IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
    total_operations: Optional[int] = None
    total_time_minutes: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    calculated_mpu: Optional[float] = None
    mpu_vs_target: Optional[float] = None  # Percentual vs meta
    is_approved: Optional[bool] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_by: Optional[int] = None
    # Erros por conceito
    errors_count: Optional[int] = 0
    error_methodology: Optional[int] = 0
    error_knowledge: Optional[int] = 0
    error_detail: Optional[int] = 0
    error_procedure: Optional[int] = 0
    # Referência da operação
    operation_reference: Optional[str] = None
    # Controle de novas tentativas
    retry_count: Optional[int] = 0
    is_retry_allowed: Optional[bool] = False
    trainer_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Schemas para Operações Individuais (COMPLETE)
class OperationErrorBase(BaseModel):
    error_type: str  # METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE
    description: Optional[str] = None  # Max 160 chars

class OperationErrorCreate(OperationErrorBase):
    pass

class OperationError(OperationErrorBase):
    id: int
    operation_id: Optional[int] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class ChallengeOperationBase(BaseModel):
    operation_number: int
    operation_reference: Optional[str] = None  # Ex: 4060ILC0001111

class ChallengeOperationCreate(ChallengeOperationBase):
    errors: Optional[list[OperationErrorCreate]] = []

class ChallengeOperationStart(BaseModel):
    """Para iniciar uma operação"""
    operation_reference: Optional[str] = None

class ChallengeOperationFinish(BaseModel):
    """Para finalizar uma operação com classificação de erros"""
    has_error: bool = False
    errors: Optional[list[OperationErrorCreate]] = []

class ChallengeOperation(ChallengeOperationBase):
    id: int
    submission_id: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    has_error: bool = False
    is_approved: Optional[bool] = None  # None = pendente de revisão
    errors: list[OperationError] = []
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class ErrorsSummary(BaseModel):
    """Resumo de erros por tipo para exibição ao formando"""
    operations_with_errors: int = 0
    max_errors_allowed: int = 0
    error_methodology: int = 0
    error_knowledge: int = 0
    error_detail: int = 0
    error_procedure: int = 0
    total_individual_errors: int = 0


class SubmissionErrorDetail(BaseModel):
    """Erro individual de uma submission SUMMARY"""
    id: int
    error_type: str
    description: Optional[str] = None
    operation_reference: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class ChallengeSubmissionDetail(ChallengeSubmission):
    """Submission com detalhes completos incluindo partes e operações"""
    parts: list[ChallengePart] = []
    operations: list[ChallengeOperation] = []  # Para desafios COMPLETE
    submission_errors: list[SubmissionErrorDetail] = []  # Para desafios SUMMARY
    challenge: Optional[ChallengeBasic] = None
    user: Optional[UserBasic] = None
    submitter: Optional[UserBasic] = None
    errors_summary: Optional[ErrorsSummary] = None


# Schema para confirmação de aula pelo formando
class LessonConfirmation(BaseModel):
    confirmed: bool = True

# Lesson Extended
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: str = "THEORETICAL"
    started_by: str = "TRAINER"  # TRAINER ou TRAINEE - quem pode iniciar a aula
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
    started_by: Optional[str] = None
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
    # Erros por conceito
    error_methodology: Optional[int] = 0
    error_knowledge: Optional[int] = 0
    error_detail: Optional[int] = 0
    error_procedure: Optional[int] = 0

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

# =====================================================
# LESSON PROGRESS SCHEMAS (pause/resume/finish)
# =====================================================

class LessonPauseBase(BaseModel):
    pause_reason: Optional[str] = None

class LessonPause(LessonPauseBase):
    id: int
    lesson_progress_id: int
    paused_at: datetime
    resumed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}

class LessonProgressBase(BaseModel):
    lesson_id: int
    training_plan_id: Optional[int] = None
    user_id: Optional[int] = None

class LessonProgressCreate(LessonProgressBase):
    enrollment_id: Optional[int] = None

class LessonProgressUpdate(BaseModel):
    status: Optional[str] = None
    is_approved: Optional[bool] = None
    actual_time_minutes: Optional[int] = None

class LessonProgress(LessonProgressBase):
    id: int
    enrollment_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    accumulated_seconds: int = 0
    actual_time_minutes: Optional[int] = None
    estimated_minutes: int = 30
    is_paused: bool = False
    status: str = "NOT_STARTED"
    is_approved: bool = False
    finished_by: Optional[int] = None
    
    model_config = {"from_attributes": True}

class LessonProgressDetail(LessonProgress):
    """Progresso com histórico de pausas"""
    pauses: list[LessonPause] = []
    lesson: Optional[Lesson] = None
    remaining_seconds: Optional[int] = None  # Tempo restante calculado
    elapsed_seconds: Optional[int] = None  # Tempo decorrido
    is_delayed: bool = False  # Se está atrasado


# =====================================================
# TRAINING PLAN STATUS SCHEMAS
# =====================================================

class TrainingPlanStatus(BaseModel):
    """Status calculado de um plano de formação"""
    status: str  # PENDING, IN_PROGRESS, COMPLETED, DELAYED
    total_courses: int
    completed_courses: int
    total_lessons: int
    completed_lessons: int
    total_challenges: int
    completed_challenges: int
    progress_percentage: float
    days_total: Optional[int] = None
    days_remaining: Optional[int] = None
    days_delayed: Optional[int] = None  # Dias de atraso (se > 0)
    estimated_hours: float
    actual_hours: float
    can_finalize: bool  # Se pode ser finalizado


class TrainingPlanCourseStatus(BaseModel):
    """Status de um curso dentro de um plano"""
    id: int
    course_id: int
    course_title: str
    order_index: int
    status: str  # PENDING, IN_PROGRESS, COMPLETED
    total_lessons: int
    completed_lessons: int
    total_challenges: int
    completed_challenges: int
    progress_percentage: float
    can_finalize: bool
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# =====================================================
# FINALIZATION SCHEMAS
# =====================================================

class FinalizeLessonRequest(BaseModel):
    """Request para finalizar uma lição"""
    is_approved: bool = True
    notes: Optional[str] = None

class FinalizeCourseRequest(BaseModel):
    """Request para finalizar um curso no plano"""
    notes: Optional[str] = None

class FinalizePlanRequest(BaseModel):
    """Request para finalizar um plano de formação"""
    notes: Optional[str] = None
    generate_certificate: bool = True

class FinalizationResponse(BaseModel):
    """Response de finalização"""
    success: bool
    message: str
    finalized_at: Optional[datetime] = None
    certificate_id: Optional[int] = None