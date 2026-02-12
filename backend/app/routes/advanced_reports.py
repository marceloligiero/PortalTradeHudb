from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app import models, auth
from app.database import get_db

router = APIRouter(prefix="/api/admin/advanced-reports", tags=["advanced_reports"])


# ============ Response Schemas ============

class DashboardSummary(BaseModel):
    total_students: int = 0
    total_trainers: int = 0
    total_courses: int = 0
    total_training_plans: int = 0
    total_enrollments: int = 0
    certificates_issued: int = 0
    avg_completion_rate: float = 0.0
    total_study_hours: float = 0.0
    active_students_30d: int = 0
    pending_trainers: int = 0
    top_performing_bank: str = "N/A"
    most_popular_product: str = "N/A"


class StudentPerformanceItem(BaseModel):
    student_name: str
    email: str
    total_lessons: int = 0
    completed_lessons: int = 0
    avg_mpu: float = 0.0
    total_time_hours: float = 0.0
    certificates_count: int = 0


class StudentPerformanceResponse(BaseModel):
    students: List[StudentPerformanceItem] = []


class TrainerProductivityItem(BaseModel):
    trainer_name: str
    email: str
    total_courses: int = 0
    total_students: int = 0
    total_training_plans: int = 0
    avg_student_completion: float = 0.0


class TrainerProductivityResponse(BaseModel):
    trainers: List[TrainerProductivityItem] = []


class CourseAnalyticsItem(BaseModel):
    course_title: str
    bank_code: str = "N/A"
    product_code: str = "N/A"
    total_lessons: int = 0
    total_enrollments: int = 0
    avg_completion_rate: float = 0.0
    avg_mpu: float = 0.0


class CourseAnalyticsResponse(BaseModel):
    courses: List[CourseAnalyticsItem] = []


class CertificationItem(BaseModel):
    month: str
    certificates_issued: int = 0
    avg_completion_time_days: float = 0.0


class CertificationResponse(BaseModel):
    certifications: List[CertificationItem] = []


class MPUAnalyticsItem(BaseModel):
    bank_code: str
    avg_mpu: float = 0.0
    total_students: int = 0
    performance_category: str = "Sem Dados"


class MPUAnalyticsResponse(BaseModel):
    banks: List[MPUAnalyticsItem] = []


# ============ Endpoints ============

@router.get("/dashboard-summary")
async def get_dashboard_summary(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> DashboardSummary:
    """Complete dashboard summary with all key metrics"""
    
    try:
        # Basic counts
        total_students = db.query(models.User).filter(models.User.role == "TRAINEE").count()
        total_trainers = db.query(models.User).filter(
            models.User.role == "TRAINER", 
            models.User.is_pending == False
        ).count()
        pending_trainers = db.query(models.User).filter(
            models.User.role == "TRAINER",
            models.User.is_pending == True
        ).count()
        
        total_courses = db.query(models.Course).count()
        total_training_plans = db.query(models.TrainingPlan).count()
        total_enrollments = db.query(models.Enrollment).count()
        certificates_issued = db.query(models.Certificate).count()
        
        # Completion rate
        completed_enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.completed_at.isnot(None)
        ).count()
        avg_completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Total study hours (from lesson progress)
        total_study_minutes = db.query(func.sum(models.LessonProgress.actual_time_minutes)).scalar() or 0
        total_study_hours = total_study_minutes / 60.0
        
        # Active students (30 days) - simplified query
        month_ago = datetime.utcnow() - timedelta(days=30)
        active_students_30d = db.query(func.count(func.distinct(models.LessonProgress.user_id))).filter(
            models.LessonProgress.started_at >= month_ago
        ).scalar() or 0
        
        # Top performing bank - by most enrollments across its courses
        top_performing_bank = "N/A"
        bank_scores = []
        for bank in db.query(models.Bank).filter(models.Bank.is_active == True).all():
            # Legacy courses
            legacy_course_ids = [c.id for c in db.query(models.Course.id).filter(models.Course.bank_id == bank.id).all()]
            # Many-to-many courses
            m2m_course_ids = [cb.course_id for cb in db.query(models.CourseBank.course_id).filter(models.CourseBank.bank_id == bank.id).all()]
            all_course_ids = list(set(legacy_course_ids + m2m_course_ids))
            if all_course_ids:
                enroll_count = db.query(models.Enrollment).filter(models.Enrollment.course_id.in_(all_course_ids)).count()
                bank_scores.append((bank.code, enroll_count))
        if bank_scores:
            bank_scores.sort(key=lambda x: x[1], reverse=True)
            top_performing_bank = bank_scores[0][0]
        
        # Most popular product - by most courses + plans associated
        most_popular_product = "N/A"
        product_scores = []
        for product in db.query(models.Product).filter(models.Product.is_active == True).all():
            p_courses = db.query(models.Course).filter(models.Course.product_id == product.id).count()
            p_courses += db.query(models.CourseProduct).filter(models.CourseProduct.product_id == product.id).count()
            p_plans = db.query(models.TrainingPlan).filter(models.TrainingPlan.product_id == product.id).count()
            p_plans += db.query(models.TrainingPlanProduct).filter(models.TrainingPlanProduct.product_id == product.id).count()
            product_scores.append((product.code, p_courses + p_plans))
        if product_scores:
            product_scores.sort(key=lambda x: x[1], reverse=True)
            most_popular_product = product_scores[0][0]
        
        return DashboardSummary(
            total_students=total_students,
            total_trainers=total_trainers,
            total_courses=total_courses,
            total_training_plans=total_training_plans,
            total_enrollments=total_enrollments,
            certificates_issued=certificates_issued,
            avg_completion_rate=round(avg_completion_rate, 2),
            total_study_hours=round(total_study_hours, 2),
            active_students_30d=active_students_30d,
            pending_trainers=pending_trainers,
            top_performing_bank=top_performing_bank,
            most_popular_product=most_popular_product
        )
    except Exception as e:
        # Return default values on error
        return DashboardSummary()


@router.get("/student-performance")
async def get_student_performance_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> StudentPerformanceResponse:
    """Detailed student performance analytics - MPU = minutos por operação"""
    
    try:
        students = db.query(models.User).filter(models.User.role == "TRAINEE").all()
        performance_list = []
        
        for student in students:
            # Get lesson progress for this student
            lesson_progress = db.query(models.LessonProgress).filter(
                models.LessonProgress.user_id == student.id
            ).all()
            
            total_lessons = len(lesson_progress)
            completed_lessons = len([lp for lp in lesson_progress if lp.status == "COMPLETED"])
            
            # Calculate average MPU from challenge submissions (minutos por operação)
            submissions = db.query(models.ChallengeSubmission).filter(
                models.ChallengeSubmission.user_id == student.id,
                models.ChallengeSubmission.calculated_mpu.isnot(None)
            ).all()
            mpu_values = [s.calculated_mpu for s in submissions if s.calculated_mpu and s.calculated_mpu > 0]
            avg_mpu = sum(mpu_values) / len(mpu_values) if mpu_values else 0
            
            # Calculate total time
            time_values = [lp.actual_time_minutes or 0 for lp in lesson_progress]
            total_time_hours = sum(time_values) / 60.0
            
            # Count certificates
            certificates_count = db.query(models.Certificate).filter(
                models.Certificate.user_id == student.id
            ).count()
            
            performance_list.append(StudentPerformanceItem(
                student_name=student.full_name or "Sem nome",
                email=student.email,
                total_lessons=total_lessons,
                completed_lessons=completed_lessons,
                avg_mpu=round(avg_mpu, 2),
                total_time_hours=round(total_time_hours, 2),
                certificates_count=certificates_count
            ))
        
        return StudentPerformanceResponse(students=performance_list)
    except Exception as e:
        return StudentPerformanceResponse(students=[])


@router.get("/trainer-productivity")
async def get_trainer_productivity_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> TrainerProductivityResponse:
    """Trainer productivity and effectiveness analysis"""
    
    try:
        trainers = db.query(models.User).filter(
            models.User.role == "TRAINER",
            models.User.is_pending == False
        ).all()
        
        productivity_list = []
        
        for trainer in trainers:
            # Count courses created
            total_courses = db.query(models.Course).filter(
                models.Course.created_by == trainer.id
            ).count()
            
            # Count training plans
            total_training_plans = db.query(models.TrainingPlan).filter(
                models.TrainingPlan.trainer_id == trainer.id
            ).count()
            
            # Count unique students in training plans
            total_students = db.query(func.count(func.distinct(models.TrainingPlan.student_id))).filter(
                models.TrainingPlan.trainer_id == trainer.id
            ).scalar() or 0
            
            # Calculate average completion rate of their training plans
            plans = db.query(models.TrainingPlan).filter(
                models.TrainingPlan.trainer_id == trainer.id
            ).all()
            
            completed_plans = len([p for p in plans if p.status == "COMPLETED"])
            avg_completion = (completed_plans / len(plans) * 100) if plans else 0
            
            productivity_list.append(TrainerProductivityItem(
                trainer_name=trainer.full_name or "Sem nome",
                email=trainer.email,
                total_courses=total_courses,
                total_students=total_students,
                total_training_plans=total_training_plans,
                avg_student_completion=round(avg_completion, 2)
            ))
        
        return TrainerProductivityResponse(trainers=productivity_list)
    except Exception as e:
        return TrainerProductivityResponse(trainers=[])


@router.get("/course-analytics")
async def get_course_analytics_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> CourseAnalyticsResponse:
    """Detailed analytics for each course - MPU = minutos por operação"""
    
    try:
        courses = db.query(models.Course).all()
        analytics_list = []
        
        for course in courses:
            # Get bank and product codes (many-to-many + legacy fallback)
            bank_code = "N/A"
            product_code = "N/A"
            
            # Try many-to-many first
            course_banks = db.query(models.CourseBank).filter(models.CourseBank.course_id == course.id).all()
            if course_banks:
                bank_codes = []
                for cb in course_banks:
                    b = db.query(models.Bank).filter(models.Bank.id == cb.bank_id).first()
                    if b:
                        bank_codes.append(b.code)
                bank_code = ", ".join(bank_codes) if bank_codes else "N/A"
            elif course.bank_id:
                bank = db.query(models.Bank).filter(models.Bank.id == course.bank_id).first()
                if bank:
                    bank_code = bank.code
            
            course_products = db.query(models.CourseProduct).filter(models.CourseProduct.course_id == course.id).all()
            if course_products:
                prod_codes = []
                for cp in course_products:
                    p = db.query(models.Product).filter(models.Product.id == cp.product_id).first()
                    if p:
                        prod_codes.append(p.code)
                product_code = ", ".join(prod_codes) if prod_codes else "N/A"
            elif course.product_id:
                product = db.query(models.Product).filter(models.Product.id == course.product_id).first()
                if product:
                    product_code = product.code
            
            # Count lessons
            total_lessons = db.query(models.Lesson).filter(
                models.Lesson.course_id == course.id
            ).count()
            
            # Count enrollments
            enrollments = db.query(models.Enrollment).filter(
                models.Enrollment.course_id == course.id
            ).all()
            total_enrollments = len(enrollments)
            
            # Calculate completion rate
            completed = len([e for e in enrollments if e.completed_at])
            avg_completion_rate = (completed / total_enrollments * 100) if total_enrollments > 0 else 0
            
            # Calculate average MPU from challenge submissions (minutos por operação)
            challenges = db.query(models.Challenge).filter(
                models.Challenge.course_id == course.id
            ).all()
            challenge_ids = [c.id for c in challenges]
            
            if challenge_ids:
                submissions = db.query(models.ChallengeSubmission).filter(
                    models.ChallengeSubmission.challenge_id.in_(challenge_ids),
                    models.ChallengeSubmission.calculated_mpu.isnot(None)
                ).all()
                mpu_values = [s.calculated_mpu for s in submissions if s.calculated_mpu and s.calculated_mpu > 0]
                avg_mpu = sum(mpu_values) / len(mpu_values) if mpu_values else 0
            else:
                avg_mpu = 0
            
            analytics_list.append(CourseAnalyticsItem(
                course_title=course.title,
                bank_code=bank_code,
                product_code=product_code,
                total_lessons=total_lessons,
                total_enrollments=total_enrollments,
                avg_completion_rate=round(avg_completion_rate, 2),
                avg_mpu=round(avg_mpu, 2)
            ))
        
        return CourseAnalyticsResponse(courses=analytics_list)
    except Exception as e:
        return CourseAnalyticsResponse(courses=[])


@router.get("/certifications")
async def get_certification_report(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> CertificationResponse:
    """Certification report with monthly breakdown"""
    
    try:
        # Group certificates by month
        certificates = db.query(models.Certificate).all()
        
        # Create monthly summary
        monthly_data = {}
        for cert in certificates:
            if cert.issued_at:
                month_key = cert.issued_at.strftime("%Y-%m")
                if month_key not in monthly_data:
                    monthly_data[month_key] = {"count": 0, "total_days": 0}
                monthly_data[month_key]["count"] += 1
                # Estimate completion time (placeholder)
                monthly_data[month_key]["total_days"] += 30  # Default 30 days
        
        certifications_list = []
        for month, data in sorted(monthly_data.items()):
            avg_days = data["total_days"] / data["count"] if data["count"] > 0 else 0
            certifications_list.append(CertificationItem(
                month=month,
                certificates_issued=data["count"],
                avg_completion_time_days=round(avg_days, 1)
            ))
        
        # If no data, return some sample months
        if not certifications_list:
            current = datetime.utcnow()
            for i in range(6):
                month = current - timedelta(days=30*i)
                certifications_list.append(CertificationItem(
                    month=month.strftime("%Y-%m"),
                    certificates_issued=0,
                    avg_completion_time_days=0
                ))
            certifications_list.reverse()
        
        return CertificationResponse(certifications=certifications_list)
    except Exception as e:
        return CertificationResponse(certifications=[])


@router.get("/mpu-analytics")
async def get_mpu_analytics(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> MPUAnalyticsResponse:
    """MPU performance analytics by bank - MPU = minutos por operação nos desafios"""
    
    try:
        banks = db.query(models.Bank).all()
        mpu_list = []
        
        for bank in banks:
            # Get courses for this bank (legacy + many-to-many)
            legacy_courses = db.query(models.Course).filter(
                models.Course.bank_id == bank.id
            ).all()
            m2m_course_ids = [cb.course_id for cb in db.query(models.CourseBank.course_id).filter(models.CourseBank.bank_id == bank.id).all()]
            m2m_courses = db.query(models.Course).filter(models.Course.id.in_(m2m_course_ids)).all() if m2m_course_ids else []
            # Merge unique
            seen_ids = set()
            courses = []
            for c in legacy_courses + m2m_courses:
                if c.id not in seen_ids:
                    seen_ids.add(c.id)
                    courses.append(c)
            
            if not courses:
                # Add bank with no data
                mpu_list.append(MPUAnalyticsItem(
                    bank_code=bank.code,
                    avg_mpu=0,
                    total_students=0,
                    performance_category="Sem Dados"
                ))
                continue
            
            course_ids = [c.id for c in courses]
            
            # Get challenge submissions for these courses
            submissions = db.query(models.ChallengeSubmission).join(
                models.Challenge, models.ChallengeSubmission.challenge_id == models.Challenge.id
            ).filter(
                models.Challenge.course_id.in_(course_ids),
                models.ChallengeSubmission.calculated_mpu.isnot(None)
            ).all()
            
            # Calculate average MPU from submissions
            mpu_values = [s.calculated_mpu for s in submissions if s.calculated_mpu and s.calculated_mpu > 0]
            avg_mpu = sum(mpu_values) / len(mpu_values) if mpu_values else 0
            
            # Count unique students
            total_students = len(set([s.user_id for s in submissions]))
            
            # Determine performance category based on MPU (lower is better for time)
            if avg_mpu > 0 and avg_mpu <= 3:
                performance_category = "Excelente"
            elif avg_mpu > 0 and avg_mpu <= 5:
                performance_category = "Bom"
            elif avg_mpu > 0 and avg_mpu <= 10:
                performance_category = "Regular"
            elif avg_mpu > 0:
                performance_category = "Precisa Melhorar"
            else:
                performance_category = "Sem Dados"
            
            mpu_list.append(MPUAnalyticsItem(
                bank_code=bank.code,
                avg_mpu=round(avg_mpu, 2),
                total_students=total_students,
                performance_category=performance_category
            ))
        
        return MPUAnalyticsResponse(banks=mpu_list)
    except Exception as e:
        return MPUAnalyticsResponse(banks=[])
