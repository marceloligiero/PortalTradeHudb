from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app import models, auth
from app.database import get_db

router = APIRouter(prefix="/api/admin/knowledge-matrix", tags=["knowledge_matrix"])


# ============ Response Schemas ============

class StudentSkillCell(BaseModel):
    """One cell in the matrix: a student's proficiency in a specific area"""
    lessons_completed: int = 0
    lessons_total: int = 0
    lesson_completion_pct: float = 0.0
    challenges_attempted: int = 0
    challenges_approved: int = 0
    challenge_approval_pct: float = 0.0
    avg_mpu: Optional[float] = None
    total_time_hours: float = 0.0
    error_methodology: int = 0
    error_knowledge: int = 0
    error_detail: int = 0
    error_procedure: int = 0
    total_errors: int = 0
    level: str = "NOT_STARTED"  # NOT_STARTED, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

class StudentRow(BaseModel):
    """A row in the matrix: one student with all their skills per course"""
    student_id: int
    student_name: str
    email: str
    overall_level: str = "NOT_STARTED"
    overall_completion_pct: float = 0.0
    overall_avg_mpu: Optional[float] = None
    total_study_hours: float = 0.0
    total_certificates: int = 0
    skills: Dict[str, StudentSkillCell] = {}  # key = course_id as string

class CourseColumn(BaseModel):
    """A column header: one course/knowledge area"""
    course_id: int
    course_title: str
    bank_name: Optional[str] = None
    product_name: Optional[str] = None
    total_lessons: int = 0
    total_challenges: int = 0

class KnowledgeMatrixSummary(BaseModel):
    """Global summary stats"""
    total_students: int = 0
    total_courses: int = 0
    avg_completion: float = 0.0
    avg_mpu: Optional[float] = None
    students_expert: int = 0
    students_advanced: int = 0
    students_intermediate: int = 0
    students_beginner: int = 0
    students_not_started: int = 0
    top_error_type: Optional[str] = None
    total_study_hours: float = 0.0

class KnowledgeMatrixResponse(BaseModel):
    summary: KnowledgeMatrixSummary
    columns: List[CourseColumn]
    rows: List[StudentRow]


def calculate_level(lesson_pct: float, challenge_pct: float, avg_mpu: Optional[float], has_activity: bool) -> str:
    """Determine proficiency level based on multiple metrics"""
    if not has_activity:
        return "NOT_STARTED"
    
    # Score calculation (0-100)
    score = 0.0
    components = 0
    
    if lesson_pct > 0:
        score += lesson_pct * 0.4  # 40% weight on lesson completion
        components += 1
    
    if challenge_pct > 0:
        score += challenge_pct * 0.4  # 40% weight on challenge approval
        components += 1
    
    if avg_mpu is not None and avg_mpu > 0:
        # Normalize MPU: lower is better, cap at 30 min/op
        mpu_score = max(0, min(100, (30 - avg_mpu) / 30 * 100))
        score += mpu_score * 0.2  # 20% weight on MPU performance
        components += 1
    
    if components == 0:
        return "NOT_STARTED"
    
    # Normalize by actual components used
    normalized_score = score
    
    if normalized_score >= 85:
        return "EXPERT"
    elif normalized_score >= 65:
        return "ADVANCED"
    elif normalized_score >= 40:
        return "INTERMEDIATE"
    else:
        return "BEGINNER"


@router.get("", response_model=KnowledgeMatrixResponse)
async def get_knowledge_matrix(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Knowledge Matrix endpoint — returns a matrix of students x courses
    with proficiency levels, completion rates, MPU, error analysis, etc.
    Admin only.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # ============ COLUMNS: All active courses ============
    courses = db.query(models.Course).filter(models.Course.is_active == True).all()
    
    columns = []
    course_lesson_counts = {}  # course_id -> total_lessons
    course_challenge_counts = {}  # course_id -> total_challenges
    
    for course in courses:
        lesson_count = db.query(models.Lesson).filter(
            models.Lesson.course_id == course.id
        ).count()
        
        challenge_count = db.query(models.Challenge).filter(
            models.Challenge.course_id == course.id,
            models.Challenge.is_active == True
        ).count()
        
        course_lesson_counts[course.id] = lesson_count
        course_challenge_counts[course.id] = challenge_count
        
        # Get bank/product names
        bank_name = None
        product_name = None
        bank_assocs = db.query(models.CourseBank).filter(
            models.CourseBank.course_id == course.id
        ).all()
        if bank_assocs:
            banks = db.query(models.Bank).filter(
                models.Bank.id.in_([ba.bank_id for ba in bank_assocs])
            ).all()
            bank_name = ", ".join([b.name for b in banks])
        elif course.bank_id:
            bank = db.query(models.Bank).filter(models.Bank.id == course.bank_id).first()
            if bank:
                bank_name = bank.name
        
        prod_assocs = db.query(models.CourseProduct).filter(
            models.CourseProduct.course_id == course.id
        ).all()
        if prod_assocs:
            prods = db.query(models.Product).filter(
                models.Product.id.in_([pa.product_id for pa in prod_assocs])
            ).all()
            product_name = ", ".join([p.name for p in prods])
        elif course.product_id:
            prod = db.query(models.Product).filter(models.Product.id == course.product_id).first()
            if prod:
                product_name = prod.name
        
        columns.append(CourseColumn(
            course_id=course.id,
            course_title=course.title,
            bank_name=bank_name,
            product_name=product_name,
            total_lessons=lesson_count,
            total_challenges=challenge_count
        ))
    
    # ============ ROWS: All students/trainees ============
    students = db.query(models.User).filter(
        models.User.role.in_(["STUDENT", "TRAINEE"]),
        models.User.is_active == True
    ).all()
    
    rows = []
    level_counts = {"EXPERT": 0, "ADVANCED": 0, "INTERMEDIATE": 0, "BEGINNER": 0, "NOT_STARTED": 0}
    all_completion_pcts = []
    all_mpus = []
    total_platform_hours = 0.0
    global_error_types = {"methodology": 0, "knowledge": 0, "detail": 0, "procedure": 0}
    
    for student in students:
        student_skills: Dict[str, StudentSkillCell] = {}
        student_total_lessons_done = 0
        student_total_lessons = 0
        student_mpus = []
        student_total_hours = 0.0
        student_total_errors = {"methodology": 0, "knowledge": 0, "detail": 0, "procedure": 0}
        
        # Get student enrollments
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.user_id == student.id
        ).all()
        enrollment_course_ids = {e.course_id: e.id for e in enrollments}
        
        # Get student certificates count
        cert_count = db.query(models.Certificate).filter(
            models.Certificate.user_id == student.id
        ).count()
        
        for course in courses:
            total_lessons = course_lesson_counts.get(course.id, 0)
            total_challenges = course_challenge_counts.get(course.id, 0)
            
            cell = StudentSkillCell()
            cell.lessons_total = total_lessons
            has_activity = False
            
            enrollment_id = enrollment_course_ids.get(course.id)
            
            if enrollment_id:
                # Lesson progress
                lesson_progress = db.query(models.LessonProgress).filter(
                    models.LessonProgress.enrollment_id == enrollment_id
                ).all()
                
                completed_lessons = len([lp for lp in lesson_progress if lp.status == "COMPLETED"])
                cell.lessons_completed = completed_lessons
                cell.lesson_completion_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0.0
                
                # Time from lesson progress
                lesson_seconds = sum(lp.accumulated_seconds or 0 for lp in lesson_progress)
                cell.total_time_hours = round(lesson_seconds / 3600.0, 2)
                
                student_total_lessons_done += completed_lessons
                student_total_lessons += total_lessons
                student_total_hours += cell.total_time_hours
                
                if completed_lessons > 0:
                    has_activity = True
            else:
                student_total_lessons += total_lessons
            
            # Challenge submissions for this student and course
            submissions = db.query(models.ChallengeSubmission).join(
                models.Challenge, models.ChallengeSubmission.challenge_id == models.Challenge.id
            ).filter(
                models.Challenge.course_id == course.id,
                models.ChallengeSubmission.user_id == student.id
            ).all()
            
            if submissions:
                has_activity = True
                cell.challenges_attempted = len(submissions)
                approved = len([s for s in submissions if s.is_approved == True])
                cell.challenges_approved = approved
                cell.challenge_approval_pct = (approved / len(submissions) * 100) if len(submissions) > 0 else 0.0
                
                # MPU from submissions
                mpus = [s.calculated_mpu for s in submissions if s.calculated_mpu is not None and s.calculated_mpu > 0]
                if mpus:
                    cell.avg_mpu = round(sum(mpus) / len(mpus), 2)
                    student_mpus.extend(mpus)
                    all_mpus.extend(mpus)
                
                # Time from challenge submissions
                for s in submissions:
                    if s.total_time_minutes and s.total_time_minutes > 0:
                        cell.total_time_hours += round(s.total_time_minutes / 60.0, 2)
                        student_total_hours += s.total_time_minutes / 60.0
                
                # Error analysis
                for s in submissions:
                    cell.error_methodology += s.error_methodology or 0
                    cell.error_knowledge += s.error_knowledge or 0
                    cell.error_detail += s.error_detail or 0
                    cell.error_procedure += s.error_procedure or 0
                
                cell.total_errors = cell.error_methodology + cell.error_knowledge + cell.error_detail + cell.error_procedure
                
                student_total_errors["methodology"] += cell.error_methodology
                student_total_errors["knowledge"] += cell.error_knowledge
                student_total_errors["detail"] += cell.error_detail
                student_total_errors["procedure"] += cell.error_procedure
            
            # Calculate level for this cell
            cell.level = calculate_level(
                cell.lesson_completion_pct,
                cell.challenge_approval_pct,
                cell.avg_mpu,
                has_activity
            )
            
            student_skills[str(course.id)] = cell
        
        # Overall metrics for this student
        overall_completion = (student_total_lessons_done / student_total_lessons * 100) if student_total_lessons > 0 else 0.0
        overall_mpu = round(sum(student_mpus) / len(student_mpus), 2) if student_mpus else None
        
        # Overall level based on all courses
        overall_challenge_approval = 0.0
        total_attempts = sum(cell.challenges_attempted for cell in student_skills.values())
        total_approved = sum(cell.challenges_approved for cell in student_skills.values())
        if total_attempts > 0:
            overall_challenge_approval = total_approved / total_attempts * 100
        
        overall_level = calculate_level(
            overall_completion,
            overall_challenge_approval,
            overall_mpu,
            student_total_lessons_done > 0 or total_attempts > 0
        )
        level_counts[overall_level] += 1
        all_completion_pcts.append(overall_completion)
        total_platform_hours += student_total_hours
        
        for k, v in student_total_errors.items():
            global_error_types[k] += v
        
        rows.append(StudentRow(
            student_id=student.id,
            student_name=student.full_name,
            email=student.email,
            overall_level=overall_level,
            overall_completion_pct=round(overall_completion, 1),
            overall_avg_mpu=overall_mpu,
            total_study_hours=round(student_total_hours, 2),
            total_certificates=cert_count,
            skills=student_skills
        ))
    
    # Sort rows by overall level priority (EXPERT first)
    level_order = {"EXPERT": 0, "ADVANCED": 1, "INTERMEDIATE": 2, "BEGINNER": 3, "NOT_STARTED": 4}
    rows.sort(key=lambda r: (level_order.get(r.overall_level, 5), -r.overall_completion_pct))
    
    # ============ SUMMARY ============
    top_error = None
    if any(global_error_types.values()):
        top_error = max(global_error_types, key=global_error_types.get)
        error_labels = {"methodology": "Metodologia", "knowledge": "Conhecimento", "detail": "Detalhe", "procedure": "Procedimento"}
        top_error = error_labels.get(top_error, top_error)
    
    summary = KnowledgeMatrixSummary(
        total_students=len(students),
        total_courses=len(courses),
        avg_completion=round(sum(all_completion_pcts) / len(all_completion_pcts), 1) if all_completion_pcts else 0.0,
        avg_mpu=round(sum(all_mpus) / len(all_mpus), 2) if all_mpus else None,
        students_expert=level_counts["EXPERT"],
        students_advanced=level_counts["ADVANCED"],
        students_intermediate=level_counts["INTERMEDIATE"],
        students_beginner=level_counts["BEGINNER"],
        students_not_started=level_counts["NOT_STARTED"],
        top_error_type=top_error,
        total_study_hours=round(total_platform_hours, 1)
    )
    
    return KnowledgeMatrixResponse(
        summary=summary,
        columns=columns,
        rows=rows
    )
