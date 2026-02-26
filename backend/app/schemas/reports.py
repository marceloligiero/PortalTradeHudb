from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Base report filters
class ReportFilters(BaseModel):
    bank_id: Optional[int] = None
    product_id: Optional[int] = None
    trainer_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

# Performance Analytics
class PerformanceReport(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    bank_code: str
    total_courses_enrolled: int
    courses_completed: int
    completion_rate: float
    total_lessons: int
    lessons_completed: int
    avg_mpu: Optional[float]
    avg_time_per_lesson: Optional[float]
    total_study_hours: float
    certificates_earned: int
    last_activity: Optional[datetime]
    performance_rating: str  # Excellent, Good, Needs Improvement

class TrainerProductivityReport(BaseModel):
    trainer_id: int
    trainer_name: str
    trainer_email: str
    bank_code: str
    courses_created: int
    students_trained: int
    avg_student_completion_rate: float
    training_plans_created: int
    avg_mpu_students: Optional[float]
    total_hours_content: float
    productivity_score: float
    last_course_created: Optional[datetime]

class CourseAnalyticsReport(BaseModel):
    course_id: int
    course_title: str
    bank_code: str
    product_code: str
    trainer_name: str
    total_students: int
    completed_students: int
    completion_rate: float
    avg_completion_time_hours: Optional[float]
    avg_mpu: Optional[float]
    dropout_rate: float
    total_lessons: int
    avg_lesson_time: Optional[float]
    difficulty_rating: str
    created_at: datetime

class LearningProgressReport(BaseModel):
    student_id: int
    student_name: str
    course_title: str
    progress_percentage: float
    lessons_completed: int
    total_lessons: int
    current_mpu: Optional[float]
    time_spent_hours: float
    estimated_completion_date: Optional[datetime]
    last_activity: Optional[datetime]
    status: str  # On Track, Behind, At Risk

class CertificationReport(BaseModel):
    certificate_id: int
    certificate_number: str
    student_name: str
    student_email: str
    bank_code: str
    training_plan_title: str
    issued_date: datetime
    total_hours: float
    courses_completed: int
    avg_mpu: float
    performance_rating: str
    is_valid: bool

class EngagementReport(BaseModel):
    metric: str
    period: str
    total_users: int
    active_users: int
    engagement_rate: float
    new_enrollments: int
    completions: int
    avg_session_duration: Optional[float]
    bounce_rate: float

class MPUAnalyticsReport(BaseModel):
    bank_code: str
    product_code: str
    avg_mpu: float
    median_mpu: float
    min_mpu: float
    max_mpu: float
    std_dev_mpu: float
    total_samples: int
    excellent_performers: int  # MPU > 80th percentile
    poor_performers: int       # MPU < 20th percentile

class FinancialReport(BaseModel):
    period: str
    bank_code: str
    total_students: int
    total_courses: int
    certificates_issued: int
    training_hours_delivered: float
    estimated_training_cost: float
    cost_per_student: float
    roi_estimate: float

class ComplianceReport(BaseModel):
    bank_code: str
    product_code: str
    total_required_training: int
    students_compliant: int
    students_non_compliant: int
    compliance_rate: float
    overdue_trainings: int
    certifications_expiring_soon: int
    risk_level: str

class DashboardSummary(BaseModel):
    total_students: int
    total_trainers: int
    total_courses: int
    total_training_plans: int
    total_enrollments: int
    certificates_issued: int
    avg_completion_rate: float
    total_study_hours: float
    active_students_30d: int
    pending_trainers: int
    top_performing_bank: str
    most_popular_product: str