from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, and_, or_, extract
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import statistics

from app import models, auth
from app.database import get_db
from app.schemas.reports import (
    ReportFilters, PerformanceReport, TrainerProductivityReport,
    CourseAnalyticsReport, LearningProgressReport, CertificationReport,
    EngagementReport, MPUAnalyticsReport, FinancialReport, ComplianceReport,
    DashboardSummary
)

router = APIRouter(prefix="/api/admin/advanced-reports", tags=["advanced_reports"])

@router.get("/dashboard-summary")
async def get_dashboard_summary(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> DashboardSummary:
    """Complete dashboard summary with all key metrics"""
    
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
    total_study_hours = db.query(func.sum(models.LessonProgress.actual_time_minutes)).scalar() or 0
    total_study_hours = total_study_hours / 60.0  # Convert to hours
    
    # Active students (30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    active_students_30d = db.query(models.LessonProgress.enrollment_id).join(
        models.Enrollment
    ).filter(
        models.LessonProgress.started_at >= month_ago
    ).distinct().count()
    
    # Top performing bank
    bank_performance = db.query(
        models.Bank.code,
        func.avg(models.LessonProgress.mpu_percentage).label('avg_performance')
    ).join(models.Course).join(models.Enrollment).join(models.LessonProgress).filter(
        models.LessonProgress.mpu_percentage.isnot(None)
    ).group_by(models.Bank.code).order_by(desc('avg_performance')).first()
    
    top_performing_bank = bank_performance[0] if bank_performance else "N/A"
    
    # Most popular product
    popular_product = db.query(
        models.Product.code,
        func.count(models.Enrollment.id).label('enrollment_count')
    ).join(models.Course).join(models.Enrollment).group_by(
        models.Product.code
    ).order_by(desc('enrollment_count')).first()
    
    most_popular_product = popular_product[0] if popular_product else "N/A"
    
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

@router.get("/student-performance")
async def get_student_performance_report(
    bank_id: Optional[int] = Query(None, description="Filter by bank"),
    product_id: Optional[int] = Query(None, description="Filter by product"), 
    date_from: Optional[datetime] = Query(None, description="Start date"),
    date_to: Optional[datetime] = Query(None, description="End date"),
    min_completion_rate: Optional[float] = Query(None, description="Minimum completion rate"),
    performance_rating: Optional[str] = Query(None, description="Performance rating filter"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[PerformanceReport]:
    """Detailed student performance analytics"""
    
    # Base query
    query = db.query(models.User).filter(models.User.role == "TRAINEE")
    
    students = query.all()
    performance_reports = []
    
    for student in students:
        # Get enrollments with filters
        enrollments_query = db.query(models.Enrollment).filter(
            models.Enrollment.user_id == student.id
        )
        
        if bank_id or product_id:
            enrollments_query = enrollments_query.join(models.Course)
            if bank_id:
                enrollments_query = enrollments_query.filter(models.Course.bank_id == bank_id)
            if product_id:
                enrollments_query = enrollments_query.filter(models.Course.product_id == product_id)
        
        if date_from:
            enrollments_query = enrollments_query.filter(models.Enrollment.enrolled_at >= date_from)
        if date_to:
            enrollments_query = enrollments_query.filter(models.Enrollment.enrolled_at <= date_to)
            
        enrollments = enrollments_query.all()
        
        if not enrollments:
            continue
            
        # Calculate metrics
        total_courses_enrolled = len(enrollments)
        courses_completed = len([e for e in enrollments if e.completed_at])
        completion_rate = (courses_completed / total_courses_enrolled * 100) if total_courses_enrolled > 0 else 0
        
        # Get lesson progress data
        enrollment_ids = [e.id for e in enrollments]
        lesson_progress = db.query(models.LessonProgress).filter(
            models.LessonProgress.enrollment_id.in_(enrollment_ids)
        ).all()
        
        total_lessons = len(lesson_progress)
        lessons_completed = len([lp for lp in lesson_progress if lp.completed_at])
        
        # MPU and time calculations
        mpu_values = [lp.mpu for lp in lesson_progress if lp.mpu is not None]
        avg_mpu = statistics.mean(mpu_values) if mpu_values else None
        
        time_values = [lp.actual_time_minutes for lp in lesson_progress if lp.actual_time_minutes is not None]
        avg_time_per_lesson = statistics.mean(time_values) if time_values else None
        total_study_hours = sum(time_values) / 60.0 if time_values else 0
        
        # Certificates
        certificates_earned = db.query(models.Certificate).filter(
            models.Certificate.user_id == student.id
        ).count()
        
        # Performance rating
        if completion_rate >= 90 and (avg_mpu or 0) >= 80:
            performance_rating = "Excellent"
        elif completion_rate >= 70 and (avg_mpu or 0) >= 60:
            performance_rating = "Good"
        else:
            performance_rating = "Needs Improvement"
            
        # Last activity
        last_progress = db.query(models.LessonProgress).filter(
            models.LessonProgress.enrollment_id.in_(enrollment_ids)
        ).order_by(desc(models.LessonProgress.started_at)).first()
        last_activity = last_progress.started_at if last_progress else None
        
        # Get bank code (from first enrollment)
        first_enrollment = enrollments[0] if enrollments else None
        bank_code = "N/A"
        if first_enrollment and first_enrollment.course and first_enrollment.course.bank:
            bank_code = first_enrollment.course.bank.code
        
        report = PerformanceReport(
            student_id=student.id,
            student_name=student.full_name,
            student_email=student.email,
            bank_code=bank_code,
            total_courses_enrolled=total_courses_enrolled,
            courses_completed=courses_completed,
            completion_rate=round(completion_rate, 2),
            total_lessons=total_lessons,
            lessons_completed=lessons_completed,
            avg_mpu=round(avg_mpu, 2) if avg_mpu else None,
            avg_time_per_lesson=round(avg_time_per_lesson, 2) if avg_time_per_lesson else None,
            total_study_hours=round(total_study_hours, 2),
            certificates_earned=certificates_earned,
            last_activity=last_activity,
            performance_rating=performance_rating
        )
        
        # Apply filters
        if min_completion_rate and completion_rate < min_completion_rate:
            continue
        if performance_rating and report.performance_rating != performance_rating:
            continue
            
        performance_reports.append(report)
    
    return performance_reports

@router.get("/trainer-productivity")
async def get_trainer_productivity_report(
    bank_id: Optional[int] = Query(None, description="Filter by bank"),
    date_from: Optional[datetime] = Query(None, description="Start date"),
    date_to: Optional[datetime] = Query(None, description="End date"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[TrainerProductivityReport]:
    """Trainer productivity and effectiveness analysis"""
    
    trainers = db.query(models.User).filter(
        models.User.role == "TRAINER",
        models.User.is_pending == False
    ).all()
    
    productivity_reports = []
    
    for trainer in trainers:
        # Get courses created by trainer
        courses_query = db.query(models.Course).filter(
            models.Course.created_by == trainer.id
        )
        
        if bank_id:
            courses_query = courses_query.filter(models.Course.bank_id == bank_id)
        if date_from:
            courses_query = courses_query.filter(models.Course.created_at >= date_from)
        if date_to:
            courses_query = courses_query.filter(models.Course.created_at <= date_to)
            
        courses = courses_query.all()
        courses_created = len(courses)
        
        if courses_created == 0:
            continue
            
        # Get students trained (unique enrollments)
        course_ids = [c.id for c in courses]
        students_trained = db.query(models.Enrollment.user_id).filter(
            models.Enrollment.course_id.in_(course_ids)
        ).distinct().count()
        
        # Average completion rate of students
        total_enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.course_id.in_(course_ids)
        ).count()
        completed_enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.course_id.in_(course_ids),
            models.Enrollment.completed_at.isnot(None)
        ).count()
        
        avg_completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Training plans created
        training_plans_created = db.query(models.TrainingPlan).filter(
            models.TrainingPlan.trainer_id == trainer.id
        ).count()
        
        # Average MPU of students
        enrollment_ids = [e.id for e in db.query(models.Enrollment).filter(
            models.Enrollment.course_id.in_(course_ids)
        ).all()]
        
        mpu_values = db.query(models.LessonProgress.mpu).filter(
            models.LessonProgress.enrollment_id.in_(enrollment_ids),
            models.LessonProgress.mpu.isnot(None)
        ).all()
        mpu_values = [m[0] for m in mpu_values]
        avg_mpu_students = statistics.mean(mpu_values) if mpu_values else None
        
        # Total hours of content created
        total_hours_content = db.query(func.sum(models.Lesson.estimated_minutes)).filter(
            models.Lesson.course_id.in_(course_ids)
        ).scalar() or 0
        total_hours_content = total_hours_content / 60.0
        
        # Productivity score (weighted formula)
        productivity_score = (
            courses_created * 10 +
            students_trained * 2 +
            avg_completion_rate * 0.5 +
            training_plans_created * 15 +
            (avg_mpu_students or 0) * 0.2
        )
        
        # Last course created
        last_course = db.query(models.Course).filter(
            models.Course.created_by == trainer.id
        ).order_by(desc(models.Course.created_at)).first()
        last_course_created = last_course.created_at if last_course else None
        
        # Get bank code
        bank_code = "N/A"
        if courses and courses[0].bank:
            bank_code = courses[0].bank.code
        
        productivity_reports.append(TrainerProductivityReport(
            trainer_id=trainer.id,
            trainer_name=trainer.full_name,
            trainer_email=trainer.email,
            bank_code=bank_code,
            courses_created=courses_created,
            students_trained=students_trained,
            avg_student_completion_rate=round(avg_completion_rate, 2),
            training_plans_created=training_plans_created,
            avg_mpu_students=round(avg_mpu_students, 2) if avg_mpu_students else None,
            total_hours_content=round(total_hours_content, 2),
            productivity_score=round(productivity_score, 2),
            last_course_created=last_course_created
        ))
    
    return sorted(productivity_reports, key=lambda x: x.productivity_score, reverse=True)

@router.get("/course-analytics")
async def get_course_analytics_report(
    bank_id: Optional[int] = Query(None, description="Filter by bank"),
    product_id: Optional[int] = Query(None, description="Filter by product"),
    trainer_id: Optional[int] = Query(None, description="Filter by trainer"),
    min_students: Optional[int] = Query(None, description="Minimum number of students"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[CourseAnalyticsReport]:
    """Detailed analytics for each course"""
    
    # Build query with filters
    query = db.query(models.Course).join(models.Bank).join(models.Product).join(
        models.User, models.Course.created_by == models.User.id
    )
    
    if bank_id:
        query = query.filter(models.Course.bank_id == bank_id)
    if product_id:
        query = query.filter(models.Course.product_id == product_id)
    if trainer_id:
        query = query.filter(models.Course.created_by == trainer_id)
        
    courses = query.all()
    analytics_reports = []
    
    for course in courses:
        # Get enrollments
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id
        ).all()
        
        total_students = len(enrollments)
        
        if min_students and total_students < min_students:
            continue
            
        completed_students = len([e for e in enrollments if e.completed_at])
        completion_rate = (completed_students / total_students * 100) if total_students > 0 else 0
        
        # Calculate completion times
        completion_times = []
        for enrollment in enrollments:
            if enrollment.completed_at and enrollment.enrolled_at:
                diff = enrollment.completed_at - enrollment.enrolled_at
                completion_times.append(diff.total_seconds() / 3600)  # hours
                
        avg_completion_time = statistics.mean(completion_times) if completion_times else None
        
        # Get lesson progress for MPU
        enrollment_ids = [e.id for e in enrollments]
        lesson_progress = db.query(models.LessonProgress).filter(
            models.LessonProgress.enrollment_id.in_(enrollment_ids)
        ).all()
        
        mpu_values = [lp.mpu for lp in lesson_progress if lp.mpu is not None]
        avg_mpu = statistics.mean(mpu_values) if mpu_values else None
        
        # Dropout rate (enrolled but no progress in 30 days)
        month_ago = datetime.utcnow() - timedelta(days=30)
        inactive_enrollments = 0
        for enrollment in enrollments:
            last_progress = db.query(models.LessonProgress).filter(
                models.LessonProgress.enrollment_id == enrollment.id
            ).order_by(desc(models.LessonProgress.started_at)).first()
            
            if not last_progress or last_progress.started_at < month_ago:
                inactive_enrollments += 1
                
        dropout_rate = (inactive_enrollments / total_students * 100) if total_students > 0 else 0
        
        # Lesson statistics
        total_lessons = db.query(models.Lesson).filter(
            models.Lesson.course_id == course.id
        ).count()
        
        avg_lesson_time = db.query(func.avg(models.Lesson.estimated_minutes)).filter(
            models.Lesson.course_id == course.id
        ).scalar()
        
        # Difficulty rating based on completion rate and average MPU
        if completion_rate >= 80 and (avg_mpu or 0) >= 70:
            difficulty_rating = "Easy"
        elif completion_rate >= 60 and (avg_mpu or 0) >= 50:
            difficulty_rating = "Medium"
        else:
            difficulty_rating = "Hard"
        
        analytics_reports.append(CourseAnalyticsReport(
            course_id=course.id,
            course_title=course.title,
            bank_code=course.bank.code,
            product_code=course.product.code,
            trainer_name=course.creator.full_name,
            total_students=total_students,
            completed_students=completed_students,
            completion_rate=round(completion_rate, 2),
            avg_completion_time_hours=round(avg_completion_time, 2) if avg_completion_time else None,
            avg_mpu=round(avg_mpu, 2) if avg_mpu else None,
            dropout_rate=round(dropout_rate, 2),
            total_lessons=total_lessons,
            avg_lesson_time=round(avg_lesson_time, 2) if avg_lesson_time else None,
            difficulty_rating=difficulty_rating,
            created_at=course.created_at
        ))
    
    return analytics_reports

@router.get("/mpu-analytics")
async def get_mpu_analytics(
    bank_id: Optional[int] = Query(None, description="Filter by bank"),
    product_id: Optional[int] = Query(None, description="Filter by product"),
    date_from: Optional[datetime] = Query(None, description="Start date"),
    date_to: Optional[datetime] = Query(None, description="End date"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[MPUAnalyticsReport]:
    """MPU performance analytics by bank and product"""
    
    # Build base query
    query = db.query(
        models.Bank.code.label('bank_code'),
        models.Product.code.label('product_code'),
        models.LessonProgress.mpu
    ).join(models.Course, models.Course.bank_id == models.Bank.id).join(
        models.Product, models.Course.product_id == models.Product.id
    ).join(models.Enrollment, models.Enrollment.course_id == models.Course.id).join(
        models.LessonProgress, models.LessonProgress.enrollment_id == models.Enrollment.id
    ).filter(models.LessonProgress.mpu.isnot(None))
    
    # Apply filters
    if bank_id:
        query = query.filter(models.Bank.id == bank_id)
    if product_id:
        query = query.filter(models.Product.id == product_id)
    if date_from:
        query = query.filter(models.LessonProgress.started_at >= date_from)
    if date_to:
        query = query.filter(models.LessonProgress.started_at <= date_to)
    
    # Get data grouped by bank and product
    data = query.all()
    
    # Group data
    grouped_data = {}
    for record in data:
        key = (record.bank_code, record.product_code)
        if key not in grouped_data:
            grouped_data[key] = []
        grouped_data[key].append(record.mpu)
    
    # Generate analytics
    mpu_reports = []
    for (bank_code, product_code), mpu_values in grouped_data.items():
        if len(mpu_values) < 5:  # Skip if too few samples
            continue
            
        avg_mpu = statistics.mean(mpu_values)
        median_mpu = statistics.median(mpu_values)
        min_mpu = min(mpu_values)
        max_mpu = max(mpu_values)
        std_dev_mpu = statistics.stdev(mpu_values) if len(mpu_values) > 1 else 0
        
        # Calculate percentiles
        sorted_values = sorted(mpu_values)
        p80 = sorted_values[int(len(sorted_values) * 0.8)]
        p20 = sorted_values[int(len(sorted_values) * 0.2)]
        
        excellent_performers = len([v for v in mpu_values if v >= p80])
        poor_performers = len([v for v in mpu_values if v <= p20])
        
        mpu_reports.append(MPUAnalyticsReport(
            bank_code=bank_code,
            product_code=product_code,
            avg_mpu=round(avg_mpu, 2),
            median_mpu=round(median_mpu, 2),
            min_mpu=round(min_mpu, 2),
            max_mpu=round(max_mpu, 2),
            std_dev_mpu=round(std_dev_mpu, 2),
            total_samples=len(mpu_values),
            excellent_performers=excellent_performers,
            poor_performers=poor_performers
        ))
    
    return mpu_reports

@router.get("/certifications")
async def get_certification_report(
    bank_id: Optional[int] = Query(None, description="Filter by bank"),
    date_from: Optional[datetime] = Query(None, description="Start date"),
    date_to: Optional[datetime] = Query(None, description="End date"),
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
) -> List[CertificationReport]:
    """Certification report with detailed metrics"""
    
    query = db.query(models.Certificate).join(models.User).join(models.TrainingPlan)
    
    if date_from:
        query = query.filter(models.Certificate.issued_at >= date_from)
    if date_to:
        query = query.filter(models.Certificate.issued_at <= date_to)
    if bank_id:
        query = query.filter(models.TrainingPlan.bank_id == bank_id)
        
    certificates = query.all()
    
    certification_reports = []
    for cert in certificates:
        # Performance rating based on MPU and hours
        if cert.average_mpu >= 80 and cert.total_hours >= 40:
            performance_rating = "Excellent"
        elif cert.average_mpu >= 60 and cert.total_hours >= 20:
            performance_rating = "Good"
        else:
            performance_rating = "Satisfactory"
        
        bank_code = cert.training_plan.bank.code if cert.training_plan.bank else "N/A"
        
        certification_reports.append(CertificationReport(
            certificate_id=cert.id,
            certificate_number=cert.certificate_number,
            student_name=cert.student_name,
            student_email=cert.student_email,
            bank_code=bank_code,
            training_plan_title=cert.training_plan_title,
            issued_date=cert.issued_at,
            total_hours=cert.total_hours,
            courses_completed=cert.courses_completed,
            avg_mpu=cert.average_mpu,
            performance_rating=performance_rating,
            is_valid=cert.is_valid
        ))
    
    return certification_reports
