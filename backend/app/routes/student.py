from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database import get_db
from app import models, schemas, auth
from datetime import datetime, timedelta

router = APIRouter()


# Dashboard Stats
@router.get("/stats")
async def get_student_stats(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get student dashboard statistics"""
    student_id = current_user.id
    
    # Enrollments
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == student_id
    ).all()
    
    total_enrollments = len(enrollments)
    completed_enrollments = len([e for e in enrollments if e.completed_at])
    
    # Training plans assigned to student (both methods)
    plans_by_student_id = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.student_id == student_id
    ).all()
    
    assignments = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.user_id == student_id
    ).all()
    plan_ids_from_assignments = [a.training_plan_id for a in assignments]
    plans_by_assignment = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id.in_(plan_ids_from_assignments)
    ).all() if plan_ids_from_assignments else []
    
    # Combinar sem duplicados
    all_plan_ids = list(set([p.id for p in plans_by_student_id] + [p.id for p in plans_by_assignment]))
    assigned_plans = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id.in_(all_plan_ids)
    ).all() if all_plan_ids else []
    
    total_training_plans = len(assigned_plans)
    active_training_plans = len([p for p in assigned_plans if getattr(p, 'is_active', True)])
    
    # Lesson progress - buscar por user_id OU enrollment_id
    enrollment_ids = [e.id for e in enrollments]
    lesson_progress = db.query(models.LessonProgress).filter(
        (models.LessonProgress.user_id == student_id) |
        (models.LessonProgress.enrollment_id.in_(enrollment_ids) if enrollment_ids else False)
    ).all()
    
    total_lessons_started = len(lesson_progress)
    completed_lessons = len([lp for lp in lesson_progress if lp.completed_at])
    
    # Study time
    total_study_minutes = sum(lp.actual_time_minutes or 0 for lp in lesson_progress)
    total_study_hours = round(total_study_minutes / 60, 1)
    
    # Certificates
    certificates = db.query(models.Certificate).filter(
        models.Certificate.user_id == student_id
    ).count()
    
    # Challenge submissions
    submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.user_id == student_id
    ).all()
    
    total_submissions = len(submissions)
    approved_submissions = len([s for s in submissions if s.is_approved])
    
    # Average MPU
    mpu_values = [s.calculated_mpu for s in submissions if s.calculated_mpu]
    avg_mpu = round(sum(mpu_values) / len(mpu_values), 2) if mpu_values else 0
    
    # Completion rate
    completion_rate = round((completed_lessons / total_lessons_started * 100) if total_lessons_started > 0 else 0, 1)
    
    return {
        "total_enrollments": total_enrollments,
        "completed_enrollments": completed_enrollments,
        "total_training_plans": total_training_plans,
        "active_training_plans": active_training_plans,
        "total_lessons_started": total_lessons_started,
        "completed_lessons": completed_lessons,
        "total_study_hours": total_study_hours,
        "certificates": certificates,
        "total_submissions": total_submissions,
        "approved_submissions": approved_submissions,
        "avg_mpu": avg_mpu,
        "completion_rate": completion_rate
    }


@router.get("/certificates")
async def get_my_certificates(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Listar certificados do formando logado"""
    certificates = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id,
        models.Certificate.is_valid == True
    ).order_by(models.Certificate.issued_at.desc()).all()
    
    result = []
    for cert in certificates:
        result.append({
            "id": cert.id,
            "certificate_number": cert.certificate_number,
            "student_name": cert.student_name,
            "training_plan_title": cert.training_plan_title,
            "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
            "total_hours": cert.total_hours,
            "courses_completed": cert.courses_completed,
            "average_mpu": cert.average_mpu,
            "average_approval_rate": cert.average_approval_rate,
            "is_valid": cert.is_valid
        })
    
    return result


@router.get("/courses")
async def get_my_courses(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Return student's enrolled courses plus optional training plan association when the course
    is part of a training plan assigned to the student.
    """
    # Get assigned training plan ids for this student
    assigned = db.query(models.TrainingPlanAssignment).filter(
        models.TrainingPlanAssignment.user_id == current_user.id
    ).all()
    assigned_plan_ids = [a.training_plan_id for a in assigned]

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id
    ).all()

    result = []
    for enrollment in enrollments:
        course = enrollment.course

        # Build base course dict (keep fields frontend expects)
        course_obj = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bank_code": course.bank.code if hasattr(course, 'bank') and course.bank else None,
            "product_name": course.product.name if hasattr(course, 'product') and course.product else None,
            "is_enrolled": True,
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
        }

        # If the course is part of any training plan assigned to this student, attach the first one found
        tp = None
        if assigned_plan_ids:
            tp_course = db.query(models.TrainingPlanCourse).filter(
                models.TrainingPlanCourse.course_id == course.id,
                models.TrainingPlanCourse.training_plan_id.in_(assigned_plan_ids)
            ).first()
            if tp_course:
                tp_record = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == tp_course.training_plan_id).first()
                if tp_record:
                    tp = {
                        "id": tp_record.id,
                        "title": tp_record.title,
                        "start_date": tp_record.start_date.isoformat() if tp_record.start_date else None,
                        "end_date": tp_record.end_date.isoformat() if tp_record.end_date else None,
                    }

        course_obj["training_plan"] = tp
        result.append(course_obj)

    return result

@router.post("/enroll/{course_id}")
async def enroll_in_course(
    course_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing_enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Create enrollment
    enrollment = models.Enrollment(
        user_id=current_user.id,
        course_id=course_id
    )
    
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    return {"message": "Enrolled successfully", "enrollment_id": enrollment.id}


# ==================== REPORTS ENDPOINTS ====================

@router.get("/reports/overview")
async def get_student_overview(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get student overview statistics"""
    
    # Total courses enrolled
    total_courses = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id
    ).count()
    
    # Completed courses (with certificates)
    completed_courses = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id
    ).count()
    
    # Total study hours (sum of all course hours)
    study_hours = db.query(func.sum(models.Course.duration_hours)).join(
        models.Enrollment, models.Enrollment.course_id == models.Course.id
    ).filter(
        models.Enrollment.user_id == current_user.id
    ).scalar() or 0
    
    # Certificates count
    certificates_count = completed_courses
    
    # Recent activity (last 7 days) - enrollments
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.enrolled_at >= week_ago
    ).count()
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "study_hours": int(study_hours),
        "certificates": certificates_count,
        "recent_activity": recent_enrollments,
        "completion_rate": round((completed_courses / total_courses * 100) if total_courses > 0 else 0, 1)
    }


@router.get("/reports/courses")
async def get_student_courses_report(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get detailed report of student's courses"""
    
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id
    ).all()
    
    courses_report = []
    for enrollment in enrollments:
        course = enrollment.course
        
        # Check if has certificate
        certificate = db.query(models.Certificate).filter(
            models.Certificate.user_id == current_user.id,
            models.Certificate.course_id == course.id
        ).first()
        
        courses_report.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bank_code": course.bank_code,
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "progress": enrollment.progress,
            "completed": certificate is not None,
            "completion_date": certificate.issued_at.isoformat() if certificate and certificate.issued_at else None,
            "duration_hours": course.duration_hours
        })
    
    return courses_report


@router.get("/reports/lessons")
async def get_student_lessons_report(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get report of lessons completed"""
    
    # Get all enrollments
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id
    ).all()
    
    total_lessons = 0
    completed_lessons = 0
    
    for enrollment in enrollments:
        course = enrollment.course
        # Count lessons in this course
        lessons_count = db.query(models.Lesson).filter(
            models.Lesson.course_id == course.id
        ).count()
        total_lessons += lessons_count
        
        # For simplicity, estimate completed based on progress
        completed_lessons += int(lessons_count * enrollment.progress / 100)
    
    return {
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "in_progress_lessons": total_lessons - completed_lessons,
        "completion_rate": round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1)
    }


@router.get("/reports/achievements")
async def get_student_achievements(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get student achievements and certificates"""
    
    certificates = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id
    ).all()
    
    achievements_list = []
    for cert in certificates:
        course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
        achievements_list.append({
            "id": cert.id,
            "course_title": course.title if course else "Unknown",
            "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
            "certificate_url": cert.certificate_url,
            "type": "certificate"
        })
    
    return {
        "total_achievements": len(achievements_list),
        "certificates": len(achievements_list),
        "achievements": achievements_list
    }
