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
    name: str
    avg_mpu: float = 0.0
    total_students: int = 0
    total_submissions: int = 0
    performance_category: str = "Sem Dados"


class MPUAnalyticsResponse(BaseModel):
    by_bank: List[MPUAnalyticsItem] = []
    by_service: List[MPUAnalyticsItem] = []
    by_plan: List[MPUAnalyticsItem] = []


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
                bank_scores.append((bank.name, enroll_count))
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
            product_scores.append((product.name, p_courses + p_plans))
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
        # Include both TRAINER and ADMIN roles (admins also train)
        trainers = db.query(models.User).filter(
            models.User.role.in_(["TRAINER", "ADMIN"]),
            models.User.is_active == True
        ).all()
        
        productivity_list = []
        
        for trainer in trainers:
            # Count courses created
            total_courses = db.query(models.Course).filter(
                models.Course.created_by == trainer.id
            ).count()
            
            # Count training plans (as trainer_id, created_by, or via training_plan_trainers)
            plan_ids_trainer = set(
                tp.id for tp in db.query(models.TrainingPlan.id).filter(
                    models.TrainingPlan.trainer_id == trainer.id
                ).all()
            )
            plan_ids_created = set(
                tp.id for tp in db.query(models.TrainingPlan.id).filter(
                    models.TrainingPlan.created_by == trainer.id
                ).all()
            )
            plan_ids_m2m = set(
                tpt.training_plan_id for tpt in db.query(models.TrainingPlanTrainer.training_plan_id).filter(
                    models.TrainingPlanTrainer.trainer_id == trainer.id
                ).all()
            )
            all_plan_ids = plan_ids_trainer | plan_ids_created | plan_ids_m2m
            total_training_plans = len(all_plan_ids)
            
            # Count unique students from assignments of these plans
            total_students = 0
            if all_plan_ids:
                total_students = db.query(func.count(func.distinct(models.TrainingPlanAssignment.user_id))).filter(
                    models.TrainingPlanAssignment.training_plan_id.in_(all_plan_ids)
                ).scalar() or 0
            
            # Also count lessons given and challenges applied/reviewed
            lessons_given = db.query(models.LessonProgress).filter(
                models.LessonProgress.finished_by == trainer.id
            ).count()
            challenges_applied = db.query(models.ChallengeSubmission).filter(
                models.ChallengeSubmission.submitted_by == trainer.id
            ).count()
            challenges_reviewed = db.query(models.ChallengeSubmission).filter(
                models.ChallengeSubmission.reviewed_by == trainer.id
            ).count()
            
            # If no training plans, count students from lesson/challenge activity
            if total_students == 0:
                student_ids_lessons = set(
                    lp.user_id for lp in db.query(models.LessonProgress.user_id).filter(
                        models.LessonProgress.finished_by == trainer.id
                    ).all()
                )
                student_ids_challenges = set(
                    cs.user_id for cs in db.query(models.ChallengeSubmission.user_id).filter(
                        models.ChallengeSubmission.submitted_by == trainer.id
                    ).all()
                )
                total_students = len(student_ids_lessons | student_ids_challenges)
            
            # Calculate average completion rate of their training plans
            if all_plan_ids:
                plans = db.query(models.TrainingPlan).filter(
                    models.TrainingPlan.id.in_(all_plan_ids)
                ).all()
            else:
                plans = []
            
            completed_plans = len([p for p in plans if p.status == "COMPLETED"])
            avg_completion = (completed_plans / len(plans) * 100) if plans else 0
            
            # Only include trainers with any activity
            total_activity = total_courses + total_training_plans + lessons_given + challenges_applied + challenges_reviewed
            if total_activity > 0 or total_students > 0:
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
                        bank_codes.append(b.name)
                bank_code = ", ".join(bank_codes) if bank_codes else "N/A"
            elif course.bank_id:
                bank = db.query(models.Bank).filter(models.Bank.id == course.bank_id).first()
                if bank:
                    bank_code = bank.name
            
            course_products = db.query(models.CourseProduct).filter(models.CourseProduct.course_id == course.id).all()
            if course_products:
                prod_codes = []
                for cp in course_products:
                    p = db.query(models.Product).filter(models.Product.id == cp.product_id).first()
                    if p:
                        prod_codes.append(p.name)
                product_code = ", ".join(prod_codes) if prod_codes else "N/A"
            elif course.product_id:
                product = db.query(models.Product).filter(models.Product.id == course.product_id).first()
                if product:
                    product_code = product.name
            
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
):
    """MPU performance analytics by bank, service and training plan"""
    
    def categorize_mpu(avg_mpu):
        if avg_mpu > 0 and avg_mpu <= 3:
            return "Excelente"
        elif avg_mpu > 0 and avg_mpu <= 5:
            return "Bom"
        elif avg_mpu > 0 and avg_mpu <= 10:
            return "Regular"
        elif avg_mpu > 0:
            return "Precisa Melhorar"
        return "Sem Dados"
    
    try:
        # Get all approved/rejected submissions with MPU
        all_submissions = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.calculated_mpu.isnot(None),
            models.ChallengeSubmission.calculated_mpu > 0,
            models.ChallengeSubmission.status.in_(["APPROVED", "REJECTED", "COMPLETED"])
        ).all()
        
        # Pre-load challenge -> course mapping
        challenge_ids = list(set(s.challenge_id for s in all_submissions))
        challenges = {c.id: c for c in db.query(models.Challenge).filter(models.Challenge.id.in_(challenge_ids)).all()} if challenge_ids else {}
        
        course_ids = list(set(c.course_id for c in challenges.values()))
        courses = {c.id: c for c in db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()} if course_ids else {}
        
        # ========= BY BANK =========
        # Build course_id -> bank_names mapping
        course_bank_map = {}  # course_id -> [bank_names]
        for cid in course_ids:
            banks_list = []
            # Many-to-many
            cbs = db.query(models.CourseBank).filter(models.CourseBank.course_id == cid).all()
            for cb in cbs:
                bank = db.query(models.Bank).filter(models.Bank.id == cb.bank_id).first()
                if bank:
                    banks_list.append(bank.name)
            # Legacy fallback
            if not banks_list and courses.get(cid) and courses[cid].bank_id:
                bank = db.query(models.Bank).filter(models.Bank.id == courses[cid].bank_id).first()
                if bank:
                    banks_list.append(bank.name)
            course_bank_map[cid] = banks_list if banks_list else ["N/A"]
        
        # Aggregate by bank
        bank_data = {}  # bank_name -> {mpus: [], students: set()}
        for sub in all_submissions:
            ch = challenges.get(sub.challenge_id)
            if not ch:
                continue
            for bank_name in course_bank_map.get(ch.course_id, ["N/A"]):
                if bank_name not in bank_data:
                    bank_data[bank_name] = {"mpus": [], "students": set()}
                bank_data[bank_name]["mpus"].append(sub.calculated_mpu)
                bank_data[bank_name]["students"].add(sub.user_id)
        
        by_bank = []
        for name, data in sorted(bank_data.items()):
            avg = sum(data["mpus"]) / len(data["mpus"]) if data["mpus"] else 0
            by_bank.append(MPUAnalyticsItem(
                name=name,
                avg_mpu=round(avg, 2),
                total_students=len(data["students"]),
                total_submissions=len(data["mpus"]),
                performance_category=categorize_mpu(avg)
            ))
        
        # ========= BY SERVICE (Product) =========
        course_product_map = {}  # course_id -> [product_names]
        for cid in course_ids:
            products_list = []
            cps = db.query(models.CourseProduct).filter(models.CourseProduct.course_id == cid).all()
            for cp in cps:
                prod = db.query(models.Product).filter(models.Product.id == cp.product_id).first()
                if prod:
                    products_list.append(prod.name)
            if not products_list and courses.get(cid) and courses[cid].product_id:
                prod = db.query(models.Product).filter(models.Product.id == courses[cid].product_id).first()
                if prod:
                    products_list.append(prod.name)
            course_product_map[cid] = products_list if products_list else ["N/A"]
        
        service_data = {}
        for sub in all_submissions:
            ch = challenges.get(sub.challenge_id)
            if not ch:
                continue
            for prod_name in course_product_map.get(ch.course_id, ["N/A"]):
                if prod_name not in service_data:
                    service_data[prod_name] = {"mpus": [], "students": set()}
                service_data[prod_name]["mpus"].append(sub.calculated_mpu)
                service_data[prod_name]["students"].add(sub.user_id)
        
        by_service = []
        for name, data in sorted(service_data.items()):
            avg = sum(data["mpus"]) / len(data["mpus"]) if data["mpus"] else 0
            by_service.append(MPUAnalyticsItem(
                name=name,
                avg_mpu=round(avg, 2),
                total_students=len(data["students"]),
                total_submissions=len(data["mpus"]),
                performance_category=categorize_mpu(avg)
            ))
        
        # ========= BY TRAINING PLAN =========
        plan_data = {}  # plan_title -> {mpus: [], students: set()}
        for sub in all_submissions:
            plan_id = sub.training_plan_id
            if plan_id:
                plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
                plan_title = plan.title if plan else f"Plano #{plan_id}"
            else:
                plan_title = "Sem Plano"
            if plan_title not in plan_data:
                plan_data[plan_title] = {"mpus": [], "students": set()}
            plan_data[plan_title]["mpus"].append(sub.calculated_mpu)
            plan_data[plan_title]["students"].add(sub.user_id)
        
        by_plan = []
        for name, data in sorted(plan_data.items()):
            avg = sum(data["mpus"]) / len(data["mpus"]) if data["mpus"] else 0
            by_plan.append(MPUAnalyticsItem(
                name=name,
                avg_mpu=round(avg, 2),
                total_students=len(data["students"]),
                total_submissions=len(data["mpus"]),
                performance_category=categorize_mpu(avg)
            ))
        
        return {"by_bank": by_bank, "by_service": by_service, "by_plan": by_plan}
    except Exception as e:
        return {"by_bank": [], "by_service": [], "by_plan": []}
