from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from io import BytesIO
import logging

from app.database import get_db
from app import models, auth

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{certificate_id}")
async def get_certificate(
    certificate_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de um certificado
    """
    certificate = db.query(models.Certificate).filter(
        models.Certificate.id == certificate_id
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")
    
    # Verificar permissões - dono, formador do plano ou admin
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == certificate.training_plan_id
    ).first()
    
    if current_user.role not in ["ADMIN"] and \
       current_user.id != certificate.user_id and \
       (plan and current_user.id != plan.trainer_id):
        raise HTTPException(status_code=403, detail="Sem permissão para ver este certificado")
    
    # Buscar detalhes dos cursos e desafios
    courses_details = []
    
    if plan:
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan.id
        ).all()
        
        for pc in plan_courses:
            course = db.query(models.Course).filter(models.Course.id == pc.course_id).first()
            if not course:
                continue
            
            # Buscar lições do curso
            lessons = db.query(models.Lesson).filter(
                models.Lesson.course_id == course.id
            ).order_by(models.Lesson.order_index).all()
            
            lessons_data = []
            for lesson in lessons:
                # Buscar progresso da lição
                progress = db.query(models.LessonProgress).filter(
                    models.LessonProgress.lesson_id == lesson.id,
                    models.LessonProgress.user_id == certificate.user_id,
                    models.LessonProgress.training_plan_id == plan.id
                ).first()
                
                lessons_data.append({
                    "id": lesson.id,
                    "title": lesson.title,
                    "estimated_minutes": lesson.estimated_minutes,
                    "completed": progress.status == "COMPLETED" if progress else False,
                    "confirmed": progress.student_confirmed if progress else False
                })
            
            # Buscar desafios do curso
            challenges = db.query(models.Challenge).filter(
                models.Challenge.course_id == course.id,
                models.Challenge.is_active == True
            ).all()
            
            challenges_data = []
            for challenge in challenges:
                # Buscar melhor submissão aprovada
                submission = db.query(models.ChallengeSubmission).filter(
                    models.ChallengeSubmission.challenge_id == challenge.id,
                    models.ChallengeSubmission.user_id == certificate.user_id,
                    models.ChallengeSubmission.training_plan_id == plan.id,
                    models.ChallengeSubmission.is_approved == True
                ).order_by(models.ChallengeSubmission.score.desc()).first()
                
                challenges_data.append({
                    "id": challenge.id,
                    "title": challenge.title,
                    "target_mpu": challenge.target_mpu,
                    "is_approved": submission is not None,
                    "score": submission.score if submission else None,
                    "calculated_mpu": submission.calculated_mpu if submission else None,
                    "mpu_vs_target": submission.mpu_vs_target if submission else None
                })
            
            courses_details.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "lessons": lessons_data,
                "challenges": challenges_data,
                "total_lessons": len(lessons),
                "total_challenges": len(challenges)
            })
    
    # Buscar dados do formador
    trainer_name = None
    if plan and plan.trainer_id:
        trainer = db.query(models.User).filter(models.User.id == plan.trainer_id).first()
        if trainer:
            trainer_name = trainer.full_name
    
    return {
        "id": certificate.id,
        "certificate_number": certificate.certificate_number,
        "student_name": certificate.student_name,
        "student_email": certificate.student_email,
        "training_plan_title": certificate.training_plan_title,
        "total_hours": certificate.total_hours,
        "courses_completed": certificate.courses_completed,
        "average_mpu": certificate.average_mpu,
        "average_approval_rate": certificate.average_approval_rate,
        "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None,
        "is_valid": certificate.is_valid,
        "trainer_name": trainer_name,
        "courses": courses_details
    }


@router.get("/{certificate_id}/pdf")
async def download_certificate_pdf(
    certificate_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Gerar e baixar o certificado em PDF
    """
    certificate = db.query(models.Certificate).filter(
        models.Certificate.id == certificate_id
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")
    
    # Verificar permissões
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == certificate.training_plan_id
    ).first()
    
    if current_user.role not in ["ADMIN"] and \
       current_user.id != certificate.user_id and \
       (plan and current_user.id != plan.trainer_id):
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Buscar detalhes para o PDF
    courses_details = []
    if plan:
        plan_courses = db.query(models.TrainingPlanCourse).filter(
            models.TrainingPlanCourse.training_plan_id == plan.id
        ).all()
        
        for pc in plan_courses:
            course = db.query(models.Course).filter(models.Course.id == pc.course_id).first()
            if not course:
                continue
            
            # Contar lições
            lessons_count = db.query(models.Lesson).filter(
                models.Lesson.course_id == course.id
            ).count()
            
            # Buscar desafios aprovados
            challenges = db.query(models.Challenge).filter(
                models.Challenge.course_id == course.id,
                models.Challenge.is_active == True
            ).all()
            
            challenge_results = []
            for ch in challenges:
                sub = db.query(models.ChallengeSubmission).filter(
                    models.ChallengeSubmission.challenge_id == ch.id,
                    models.ChallengeSubmission.user_id == certificate.user_id,
                    models.ChallengeSubmission.training_plan_id == plan.id,
                    models.ChallengeSubmission.is_approved == True
                ).first()
                if sub:
                    challenge_results.append({
                        "title": ch.title,
                        "mpu": sub.calculated_mpu,
                        "score": sub.score
                    })
            
            courses_details.append({
                "title": course.title,
                "lessons_count": lessons_count,
                "challenges": challenge_results
            })
    
    # Buscar formador
    trainer_name = "N/A"
    if plan and plan.trainer_id:
        trainer = db.query(models.User).filter(models.User.id == plan.trainer_id).first()
        if trainer:
            trainer_name = trainer.full_name
    
    # Gerar PDF
    pdf_bytes = generate_certificate_pdf(
        certificate_number=certificate.certificate_number,
        student_name=certificate.student_name,
        training_plan_title=certificate.training_plan_title,
        total_hours=certificate.total_hours,
        courses_completed=certificate.courses_completed,
        average_mpu=certificate.average_mpu,
        issued_at=certificate.issued_at,
        trainer_name=trainer_name,
        courses=courses_details
    )
    
    filename = f"certificado_{certificate.certificate_number}.pdf"
    
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_certificate_pdf(
    certificate_number: str,
    student_name: str,
    training_plan_title: str,
    total_hours: float,
    courses_completed: int,
    average_mpu: float,
    issued_at: datetime,
    trainer_name: str,
    courses: list
) -> bytes:
    """
    Gera o PDF do certificado usando weasyprint com HTML/CSS
    Layout idêntico ao frontend
    """
    try:
        from weasyprint import HTML, CSS
        import os
    except ImportError:
        return generate_simple_pdf(
            certificate_number, student_name, training_plan_title,
            total_hours, courses_completed, average_mpu, issued_at, trainer_name, courses
        )
    
    # Data formatada
    issued_date = issued_at.strftime("%d de janeiro de %Y") if issued_at else "N/A"
    if issued_at:
        month_map = {
            'January': 'janeiro', 'February': 'fevereiro', 'March': 'março',
            'April': 'abril', 'May': 'maio', 'June': 'junho',
            'July': 'julho', 'August': 'agosto', 'September': 'setembro',
            'October': 'outubro', 'November': 'novembro', 'December': 'dezembro'
        }
        issued_date = issued_at.strftime("%d de %B de %Y")
        for en, pt in month_map.items():
            issued_date = issued_date.replace(en, pt)
    
    course_word = "curso" if courses_completed == 1 else "cursos"
    courses_word_completed = "concluído" if courses_completed == 1 else "concluídos"
    
    # Logo path
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'frontend', 'public', 'logo-sds.png')
    logo_uri = f"file:///{logo_path.replace(os.sep, '/')}" if os.path.exists(logo_path) else ""
    
    # Gerar HTML dos cursos
    courses_html = ""
    if courses:
        for idx, course in enumerate(courses, 1):
            course_title = course.get("title", "Curso")
            lessons_count = course.get("lessons_count", 0)
            challenges = course.get("challenges", [])
            
            lessons_html = ""
            for lesson in course.get("lessons", []):
                lessons_html += f'''
                <div class="lesson-item">
                    <span class="check-icon">✓</span>
                    <span class="lesson-title">{lesson.get("title", "Aula")}</span>
                    <span class="lesson-time">{lesson.get("estimated_minutes", 0)} min</span>
                </div>
                '''
            
            challenges_html = ""
            for ch in challenges:
                challenges_html += f'''
                <div class="challenge-item">
                    <span class="check-icon">✓</span>
                    <span class="challenge-title">{ch.get("title", "Desafio")}</span>
                    <span class="approved-badge">Aprovado</span>
                </div>
                '''
            
            courses_html += f'''
            <div class="course-card">
                <div class="course-header">
                    <div class="course-number">{idx}</div>
                    <div class="course-info">
                        <div class="course-title">{course_title}</div>
                        <div class="course-stats">{lessons_count} aulas • {len(challenges)} desafios</div>
                    </div>
                    <div class="completed-badge">✓ Concluído</div>
                </div>
                <div class="course-content">
                    <div class="content-column">
                        <div class="column-header">
                            <span class="column-icon">📖</span>
                            <span>AULAS COMPLETADAS</span>
                        </div>
                        <div class="lessons-list">
                            {lessons_html if lessons_html else f'<div class="lesson-item"><span class="check-icon">✓</span><span>{lessons_count} aulas completadas</span></div>'}
                        </div>
                    </div>
                    <div class="content-column">
                        <div class="column-header">
                            <span class="column-icon">🎯</span>
                            <span>DESAFIOS APROVADOS</span>
                        </div>
                        <div class="challenges-list">
                            {challenges_html if challenges_html else '<div class="challenge-item"><span class="check-icon">✓</span><span>Todos aprovados</span></div>'}
                        </div>
                    </div>
                </div>
            </div>
            '''
    
    html_content = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4 landscape;
                margin: 0;
            }}
            
            @page details {{
                size: A4 portrait;
                margin: 1cm;
            }}
            
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                min-height: 100vh;
            }}
            
            .certificate-page {{
                width: 297mm;
                height: 210mm;
                padding: 15mm;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                page-break-after: always;
            }}
            
            .certificate-frame {{
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fffbeb 100%);
                border-radius: 20px;
                position: relative;
                padding: 25px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }}
            
            /* Decorative borders */
            .border-outer {{
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 8px solid rgba(253, 230, 138, 0.5);
                border-radius: 20px;
                pointer-events: none;
            }}
            
            .border-middle {{
                position: absolute;
                top: 12px;
                left: 12px;
                right: 12px;
                bottom: 12px;
                border: 4px solid rgba(252, 211, 77, 0.3);
                border-radius: 15px;
                pointer-events: none;
            }}
            
            .border-inner {{
                position: absolute;
                top: 24px;
                left: 24px;
                right: 24px;
                bottom: 24px;
                border: 2px solid rgba(245, 158, 11, 0.2);
                border-radius: 10px;
                pointer-events: none;
            }}
            
            /* Corner decorations */
            .corner {{
                position: absolute;
                width: 60px;
                height: 60px;
                opacity: 0.3;
            }}
            .corner-tl {{ top: 15px; left: 15px; }}
            .corner-tr {{ top: 15px; right: 15px; transform: scaleX(-1); }}
            .corner-bl {{ bottom: 15px; left: 15px; transform: scaleY(-1); }}
            .corner-br {{ bottom: 15px; right: 15px; transform: scale(-1); }}
            
            .corner svg {{
                width: 100%;
                height: 100%;
            }}
            
            .content {{
                position: relative;
                z-index: 10;
                text-align: center;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 10px 30px;
            }}
            
            .logo {{
                width: 80px;
                height: auto;
                margin: 0 auto 10px;
            }}
            
            .stars {{
                color: #f59e0b;
                font-size: 14px;
                letter-spacing: 8px;
                margin-bottom: 5px;
            }}
            
            .title {{
                font-size: 42px;
                font-weight: bold;
                color: #92400e;
                letter-spacing: 4px;
                margin-bottom: 2px;
            }}
            
            .subtitle {{
                font-size: 18px;
                color: #d97706;
                letter-spacing: 6px;
                text-transform: uppercase;
                margin-bottom: 10px;
            }}
            
            .star-divider {{
                color: #d97706;
                font-size: 12px;
                letter-spacing: 15px;
                margin: 10px 0;
            }}
            
            .certify-text {{
                font-size: 16px;
                color: #4b5563;
                margin-bottom: 5px;
            }}
            
            .student-name {{
                font-size: 36px;
                font-weight: bold;
                color: #1f2937;
                padding: 12px 40px;
                border-top: 2px solid #fde68a;
                border-bottom: 2px solid #fde68a;
                display: inline-block;
                margin: 10px 0;
            }}
            
            .description {{
                font-size: 14px;
                color: #4b5563;
                line-height: 1.6;
                max-width: 700px;
                margin: 0 auto;
            }}
            
            .plan-title {{
                font-size: 20px;
                font-weight: 600;
                color: #b45309;
                margin: 8px 0;
            }}
            
            /* Stats grid */
            .stats-grid {{
                display: flex;
                justify-content: center;
                gap: 15px;
                margin: 15px 0;
            }}
            
            .stat-card {{
                background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
                border: 1px solid #fde68a;
                border-radius: 12px;
                padding: 12px 20px;
                min-width: 130px;
                text-align: center;
            }}
            
            .stat-icon {{
                font-size: 20px;
                color: #d97706;
                margin-bottom: 5px;
            }}
            
            .stat-label {{
                font-size: 10px;
                color: #d97706;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 3px;
            }}
            
            .stat-value {{
                font-size: 12px;
                font-weight: bold;
                color: #1f2937;
            }}
            
            /* Signatures */
            .signatures {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 40px;
                margin-top: 10px;
            }}
            
            .signature {{
                text-align: center;
                flex: 1;
            }}
            
            .signature-line {{
                width: 180px;
                height: 1px;
                background: #9ca3af;
                margin: 0 auto 8px;
            }}
            
            .signature-name {{
                font-size: 13px;
                font-weight: 600;
                color: #374151;
            }}
            
            .signature-title {{
                font-size: 11px;
                color: #6b7280;
            }}
            
            .seal {{
                width: 90px;
                height: 90px;
                border-radius: 50%;
                background: linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #d97706 100%);
                padding: 3px;
                margin: 0 30px;
            }}
            
            .seal-inner {{
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%);
                border: 3px solid #f59e0b;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }}
            
            .seal-icon {{
                font-size: 24px;
                color: #d97706;
            }}
            
            .seal-text {{
                font-size: 7px;
                font-weight: bold;
                color: #b45309;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            
            .seal-valid {{
                font-size: 7px;
                font-weight: bold;
                color: #d97706;
                text-transform: uppercase;
            }}
            
            /* Certificate number */
            .cert-number-box {{
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 25px;
                background: linear-gradient(90deg, #fef3c7 0%, #ffffff 50%, #fef3c7 100%);
                border: 2px solid #fcd34d;
                border-radius: 50px;
                margin-top: 10px;
            }}
            
            .cert-number-label {{
                font-size: 12px;
                color: #4b5563;
            }}
            
            .cert-number-value {{
                font-family: 'Courier New', monospace;
                font-size: 13px;
                font-weight: bold;
                color: #b45309;
                letter-spacing: 1px;
            }}
            
            /* ===== Details Page ===== */
            .details-page {{
                page: details;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                padding: 20px;
                min-height: 297mm;
            }}
            
            .details-header {{
                text-align: center;
                margin-bottom: 25px;
            }}
            
            .details-title {{
                font-size: 24px;
                font-weight: bold;
                color: #fbbf24;
                margin-bottom: 20px;
            }}
            
            .course-card {{
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                margin-bottom: 20px;
                overflow: hidden;
            }}
            
            .course-header {{
                background: linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%);
                padding: 15px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                gap: 15px;
            }}
            
            .course-number {{
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
            }}
            
            .course-info {{
                flex: 1;
            }}
            
            .course-title {{
                font-size: 16px;
                font-weight: bold;
                color: #ffffff;
                margin-bottom: 3px;
            }}
            
            .course-stats {{
                font-size: 12px;
                color: #9ca3af;
            }}
            
            .completed-badge {{
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.3);
                color: #4ade80;
                font-size: 11px;
                font-weight: bold;
                padding: 5px 12px;
                border-radius: 20px;
            }}
            
            .course-content {{
                padding: 20px;
                display: flex;
                gap: 30px;
            }}
            
            .content-column {{
                flex: 1;
            }}
            
            .column-header {{
                font-size: 11px;
                font-weight: 600;
                color: #fbbf24;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }}
            
            .column-icon {{
                font-size: 14px;
            }}
            
            .lessons-list, .challenges-list {{
                display: flex;
                flex-direction: column;
                gap: 8px;
            }}
            
            .lesson-item, .challenge-item {{
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 10px 12px;
            }}
            
            .check-icon {{
                color: #4ade80;
                font-size: 14px;
            }}
            
            .lesson-title, .challenge-title {{
                flex: 1;
                font-size: 12px;
                color: #d1d5db;
            }}
            
            .lesson-time {{
                font-size: 10px;
                color: #9ca3af;
                background: rgba(255, 255, 255, 0.1);
                padding: 3px 8px;
                border-radius: 4px;
            }}
            
            .approved-badge {{
                font-size: 10px;
                color: #4ade80;
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.3);
                padding: 3px 10px;
                border-radius: 4px;
            }}
            
            .validity-note {{
                text-align: center;
                color: #9ca3af;
                font-size: 12px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }}
        </style>
    </head>
    <body>
        <!-- Page 1: Main Certificate -->
        <div class="certificate-page">
            <div class="certificate-frame">
                <div class="border-outer"></div>
                <div class="border-middle"></div>
                <div class="border-inner"></div>
                
                <!-- Corner decorations -->
                <div class="corner corner-tl">
                    <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="#d97706"/></svg>
                </div>
                <div class="corner corner-tr">
                    <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="#d97706"/></svg>
                </div>
                <div class="corner corner-bl">
                    <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="#d97706"/></svg>
                </div>
                <div class="corner corner-br">
                    <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="#d97706"/></svg>
                </div>
                
                <div class="content">
                    <div>
                        {f'<img src="{logo_uri}" class="logo" alt="Logo">' if logo_uri else ''}
                        <div class="stars">✦ ✦ ✦</div>
                        <div class="title">CERTIFICADO</div>
                        <div class="subtitle">de Conclusão</div>
                        <div class="star-divider">☆ ☆ ☆</div>
                    </div>
                    
                    <div>
                        <div class="certify-text">Certificamos que</div>
                        <div class="student-name">{student_name}</div>
                        <div class="description">concluiu com êxito o plano de formação</div>
                        <div class="plan-title">"{training_plan_title}"</div>
                        <div class="description">
                            com carga horária total de <strong>{total_hours:.1f} horas</strong>,
                            tendo completado com sucesso <strong>{courses_completed} {course_word}</strong> e
                            demonstrado excelente aproveitamento em todos os desafios práticos.
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📅</div>
                            <div class="stat-label">Emitido em</div>
                            <div class="stat-value">{issued_date}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⏱️</div>
                            <div class="stat-label">Carga Horária</div>
                            <div class="stat-value">{total_hours:.1f} horas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎓</div>
                            <div class="stat-label">Aprovação</div>
                            <div class="stat-value">100%</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-label">Cursos</div>
                            <div class="stat-value">{courses_completed} {courses_word_completed}</div>
                        </div>
                    </div>
                    
                    <div class="signatures">
                        <div class="signature">
                            <div class="signature-line"></div>
                            <div class="signature-name">{trainer_name}</div>
                            <div class="signature-title">Formador</div>
                        </div>
                        
                        <div class="seal">
                            <div class="seal-inner">
                                <div class="seal-icon">✓</div>
                                <div class="seal-text">Certificado</div>
                                <div class="seal-valid">Válido</div>
                            </div>
                        </div>
                        
                        <div class="signature">
                            <div class="signature-line"></div>
                            <div class="signature-name">Portal TradeHub</div>
                            <div class="signature-title">Plataforma de Formação</div>
                        </div>
                    </div>
                    
                    <div class="cert-number-box">
                        <span class="cert-number-label">Certificado Nº:</span>
                        <span class="cert-number-value">{certificate_number}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Page 2: Course Details -->
        {"" if not courses else f'''
        <div class="details-page">
            <div class="details-header">
                <div class="details-title">📚 Detalhes da Formação</div>
            </div>
            
            {courses_html}
            
            <div class="validity-note">
                🛡️ Este certificado é válido e pode ser verificado através do número de série acima.
            </div>
        </div>
        '''}
    </body>
    </html>
    '''
    
    # Gerar PDF
    html = HTML(string=html_content)
    pdf_bytes = html.write_pdf()
    
    return pdf_bytes


def generate_simple_pdf(
    certificate_number: str,
    student_name: str,
    training_plan_title: str,
    total_hours: float,
    courses_completed: int,
    average_mpu: float,
    issued_at: datetime,
    trainer_name: str,
    courses: list
) -> bytes:
    """
    Fallback: gera um PDF usando fpdf2 com layout profissional
    (cores âmbar/dourado, sem MPU)
    """
    try:
        from fpdf import FPDF
        
        # Cores âmbar
        AMBER_800 = (146, 64, 14)
        AMBER_700 = (180, 83, 9)
        AMBER_600 = (217, 119, 6)
        AMBER_500 = (245, 158, 11)
        GRAY_800 = (31, 41, 55)
        GRAY_600 = (75, 85, 99)
        GREEN_600 = (22, 163, 74)
        
        pdf = FPDF(orientation='L', format='A4')
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # ===== PÁGINA 1: CERTIFICADO PRINCIPAL =====
        pdf.add_page()
        
        # Borda decorativa
        pdf.set_draw_color(*AMBER_600)
        pdf.set_line_width(3)
        pdf.rect(10, 10, 277, 190)
        pdf.set_line_width(1)
        pdf.rect(15, 15, 267, 180)
        
        # Título
        pdf.set_y(25)
        pdf.set_font('Helvetica', '', 12)
        pdf.set_text_color(*AMBER_500)
        pdf.cell(0, 8, chr(9830) + '  ' + chr(9830) + '  ' + chr(9830), align='C', ln=True)
        
        pdf.set_font('Helvetica', 'B', 36)
        pdf.set_text_color(*AMBER_800)
        pdf.cell(0, 15, 'CERTIFICADO', align='C', ln=True)
        
        pdf.set_font('Helvetica', '', 16)
        pdf.set_text_color(*AMBER_600)
        pdf.cell(0, 10, 'de Conclusao', align='C', ln=True)
        
        pdf.set_text_color(*AMBER_600)
        pdf.cell(0, 8, chr(9733) + '  ' + chr(9733) + '  ' + chr(9733), align='C', ln=True)
        
        pdf.ln(10)
        
        # Certificamos que
        pdf.set_text_color(*GRAY_600)
        pdf.set_font('Helvetica', '', 14)
        pdf.cell(0, 10, 'Certificamos que', align='C', ln=True)
        
        # Nome do aluno
        pdf.set_font('Helvetica', 'B', 28)
        pdf.set_text_color(*GRAY_800)
        pdf.cell(0, 15, student_name, align='C', ln=True)
        
        pdf.ln(5)
        
        # Texto (SEM MPU)
        pdf.set_font('Helvetica', '', 13)
        pdf.set_text_color(*GRAY_600)
        pdf.cell(0, 8, 'concluiu com exito o plano de formacao', align='C', ln=True)
        
        pdf.set_font('Helvetica', 'B', 18)
        pdf.set_text_color(*AMBER_700)
        pdf.cell(0, 12, f'"{training_plan_title}"', align='C', ln=True)
        
        course_word = "curso" if courses_completed == 1 else "cursos"
        pdf.set_font('Helvetica', '', 12)
        pdf.set_text_color(*GRAY_600)
        pdf.multi_cell(0, 7, f'com carga horaria total de {total_hours:.1f} horas, tendo completado com sucesso {courses_completed} {course_word} e demonstrado excelente aproveitamento em todos os desafios praticos.', align='C')
        
        pdf.ln(10)
        
        # Estatísticas
        issued_date = issued_at.strftime("%d/%m/%Y") if issued_at else "N/A"
        
        pdf.set_fill_color(255, 251, 235)  # AMBER_50
        pdf.set_draw_color(*AMBER_500)
        
        # Tabela de estatísticas
        table_y = pdf.get_y()
        col_width = 60
        start_x = (297 - 4 * col_width) / 2
        
        pdf.set_xy(start_x, table_y)
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_text_color(*AMBER_600)
        
        headers = ['Emitido em', 'Carga Horaria', 'Aprovacao', 'Cursos']
        values = [issued_date, f'{total_hours:.1f} horas', '100%', f'{courses_completed} concluido(s)']
        
        for i, header in enumerate(headers):
            pdf.set_xy(start_x + i * col_width, table_y)
            pdf.cell(col_width, 8, header, border=1, align='C', fill=True)
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*GRAY_800)
        for i, value in enumerate(values):
            pdf.set_xy(start_x + i * col_width, table_y + 8)
            pdf.cell(col_width, 8, value, border=1, align='C', fill=True)
        
        pdf.set_y(table_y + 25)
        
        # Assinaturas
        pdf.ln(10)
        sig_y = pdf.get_y()
        
        # Formador
        pdf.set_xy(40, sig_y)
        pdf.set_text_color(*GRAY_600)
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(80, 5, '_' * 40, align='C')
        pdf.set_xy(40, sig_y + 6)
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*GRAY_800)
        pdf.cell(80, 5, trainer_name, align='C')
        pdf.set_xy(40, sig_y + 12)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(*GRAY_600)
        pdf.cell(80, 5, 'Formador', align='C')
        
        # Selo
        pdf.set_xy(130, sig_y)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(*GREEN_600)
        pdf.cell(40, 15, chr(10003) + ' VALIDO', align='C')
        
        # Plataforma
        pdf.set_xy(180, sig_y)
        pdf.set_text_color(*GRAY_600)
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(80, 5, '_' * 40, align='C')
        pdf.set_xy(180, sig_y + 6)
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*GRAY_800)
        pdf.cell(80, 5, 'Portal TradeHub', align='C')
        pdf.set_xy(180, sig_y + 12)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(*GRAY_600)
        pdf.cell(80, 5, 'Plataforma de Formacao', align='C')
        
        # Número do certificado
        pdf.set_y(180)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(*GRAY_600)
        pdf.cell(0, 5, 'Certificado No:', align='C', ln=True)
        pdf.set_font('Courier', 'B', 12)
        pdf.set_text_color(*AMBER_700)
        pdf.cell(0, 6, certificate_number, align='C', ln=True)
        
        # ===== PÁGINA 2: ANEXO COM DETALHES =====
        if courses:
            pdf.add_page()
            
            # Cabeçalho
            pdf.set_font('Helvetica', 'B', 20)
            pdf.set_text_color(*AMBER_800)
            pdf.cell(0, 12, 'ANEXO AO CERTIFICADO', align='C', ln=True)
            
            pdf.set_font('Courier', 'B', 11)
            pdf.set_text_color(*AMBER_700)
            pdf.cell(0, 8, f'Certificado No: {certificate_number}', align='C', ln=True)
            
            pdf.set_draw_color(*AMBER_500)
            pdf.line(20, pdf.get_y(), 277, pdf.get_y())
            pdf.ln(10)
            
            pdf.set_font('Helvetica', 'B', 16)
            pdf.set_text_color(*AMBER_700)
            pdf.cell(0, 10, 'Detalhes da Formacao', align='L', ln=True)
            pdf.ln(5)
            
            for idx, course in enumerate(courses, 1):
                course_title = course.get("title", "Curso")
                lessons_count = course.get("lessons_count", 0)
                challenges = course.get("challenges", [])
                
                # Header do curso
                pdf.set_fill_color(*AMBER_500)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font('Helvetica', 'B', 12)
                pdf.cell(15, 10, str(idx), border=1, align='C', fill=True)
                
                pdf.set_fill_color(254, 243, 199)  # AMBER_100
                pdf.set_text_color(*GRAY_800)
                pdf.cell(200, 10, f'  {course_title}', border=1, align='L', fill=True)
                
                pdf.set_fill_color(220, 252, 231)  # GREEN_100
                pdf.set_text_color(*GREEN_600)
                pdf.set_font('Helvetica', 'B', 10)
                pdf.cell(50, 10, chr(10003) + ' Concluido', border=1, align='C', fill=True, ln=True)
                
                # Detalhes (SEM MPU)
                pdf.set_text_color(*GRAY_600)
                pdf.set_font('Helvetica', '', 11)
                pdf.cell(15, 8, '', border=0)
                pdf.cell(250, 8, f'{lessons_count} Aulas Completadas', border=0, ln=True)
                
                if challenges:
                    pdf.cell(15, 8, '', border=0)
                    pdf.set_font('Helvetica', 'B', 11)
                    pdf.cell(250, 8, f'{len(challenges)} Desafios Aprovados:', border=0, ln=True)
                    pdf.set_font('Helvetica', '', 10)
                    for ch in challenges:
                        pdf.cell(25, 6, '', border=0)
                        pdf.cell(240, 6, f'{chr(10003)} {ch["title"]} - Aprovado', border=0, ln=True)
                
                pdf.ln(5)
            
            # Rodapé
            pdf.ln(10)
            pdf.set_draw_color(*AMBER_500)
            pdf.line(20, pdf.get_y(), 277, pdf.get_y())
            pdf.ln(5)
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(*GRAY_600)
            pdf.cell(0, 6, 'Este anexo e parte integrante do certificado e comprova os detalhes da formacao concluida.', align='C')
        
        return pdf.output()
        
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="Biblioteca de geracao de PDF nao disponivel. Instale 'reportlab' ou 'fpdf2'."
        )


@router.get("/by-plan/{plan_id}")
async def get_certificate_by_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buscar certificado por plano de formação
    """
    certificate = db.query(models.Certificate).filter(
        models.Certificate.training_plan_id == plan_id
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificado não encontrado para este plano")
    
    # Verificar permissões
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_id
    ).first()
    
    if current_user.role not in ["ADMIN"] and \
       current_user.id != certificate.user_id and \
       (plan and current_user.id != plan.trainer_id):
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    return {
        "id": certificate.id,
        "certificate_number": certificate.certificate_number,
        "student_name": certificate.student_name,
        "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None
    }


@router.get("/")
async def list_my_certificates(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar certificados do usuário atual ou todos (se admin)
    """
    query = db.query(models.Certificate)
    
    if current_user.role == "ADMIN":
        certificates = query.all()
    elif current_user.role == "TRAINER":
        # Certificados dos planos do formador
        plan_ids = db.query(models.TrainingPlan.id).filter(
            models.TrainingPlan.trainer_id == current_user.id
        ).subquery()
        certificates = query.filter(
            models.Certificate.training_plan_id.in_(plan_ids)
        ).all()
    else:
        # Apenas certificados do próprio aluno
        certificates = query.filter(
            models.Certificate.user_id == current_user.id
        ).all()
    
    return [{
        "id": c.id,
        "certificate_number": c.certificate_number,
        "student_name": c.student_name,
        "training_plan_title": c.training_plan_title,
        "total_hours": c.total_hours,
        "issued_at": c.issued_at.isoformat() if c.issued_at else None,
        "is_valid": c.is_valid
    } for c in certificates]
