"""
Seed Script — PortalTradeHub
Limpa os dados transacionais e popula a BD com dados realistas de demo.

Executar dentro do container:
  docker exec tradehub-backend-prod sh -c "cd /app/backend && python scripts/seed.py"
"""
import sys, os
sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')

from datetime import date, datetime, timedelta
from sqlalchemy import text
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

db = SessionLocal()
now = datetime.now()

print("=" * 60)
print("SEED — PortalTradeHub")
print("=" * 60)

# ─── 1. LIMPEZA ───────────────────────────────────────────────────────────────
print("\n[1/6] Limpeza de dados transacionais...")

db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

TRUNCATE = [
    "tutoria_notifications", "tutoria_comments", "tutoria_action_items",
    "tutoria_action_plans", "tutoria_learning_sheets", "tutoria_error_refs",
    "tutoria_errors",
    "internal_error_action_items", "internal_error_action_plans",
    "internal_error_classifications", "internal_errors",
    "learning_sheets", "sensos",
    "chamado_comments", "chamados",
    "lesson_pauses", "lesson_progress", "operation_errors",
    "submission_errors", "challenge_parts",
    "challenge_releases", "challenge_operations", "challenge_submissions", "challenges",
    "certificates",
    "enrollments", "training_plan_assignments", "training_plan_courses",
    "training_plan_trainers", "training_plan_banks", "training_plan_products",
    "training_plans",
    "course_banks", "course_products", "lessons", "courses",
    "ratings",
    "releaser_survey_actions", "releaser_survey_responses", "releaser_surveys",
    "org_node_audit", "org_node_members", "org_nodes",
    "password_reset_tokens", "team_members",
    "chat_faqs",
    "dw_fact_chamados", "dw_fact_daily_snapshot", "dw_fact_internal_errors",
    "dw_fact_training", "dw_fact_tutoria",
    "dw_dim_course", "dw_dim_error_category", "dw_dim_status", "dw_dim_team", "dw_dim_user",
]
for tbl in TRUNCATE:
    try:
        db.execute(text(f"TRUNCATE TABLE `{tbl}`"))
    except Exception as e:
        print(f"  skip {tbl}: {e}")

db.execute(text("DELETE FROM users WHERE id != 1"))
db.execute(text("UPDATE users SET full_name='Administrador', email='admin@tradehub.com' WHERE id=1"))
db.commit()
db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
db.commit()
print("  OK")

# ─── 2. UTILIZADORES ──────────────────────────────────────────────────────────
print("\n[2/6] Criando utilizadores...")

def make_user(email, full_name, role, password="Demo1234!", **flags):
    obj = models.User(
        email=email, full_name=full_name, role=role,
        hashed_password=get_password_hash(password),
        is_active=True,
        is_pending=flags.get("is_pending", False),
        is_formador=flags.get("is_formador", False),
        is_tutor=flags.get("is_tutor", False),
        is_chefe_equipe=flags.get("is_chefe_equipe", False),
        is_gerente=flags.get("is_gerente", False),
        is_diretor=flags.get("is_diretor", False),
        is_liberador=flags.get("is_liberador", False),
        is_referente=flags.get("is_referente", False),
    )
    db.add(obj)
    db.flush()
    print(f"  {full_name} ({role}) → id={obj.id}")
    return obj.id

trainer1_id  = make_user("ana.silva@banco.pt",       "Ana Silva",       "USUARIO", is_formador=True)
trainer2_id  = make_user("carlos.santos@banco.pt",   "Carlos Santos",   "USUARIO", is_formador=True)
chefe_id     = make_user("maria.pereira@banco.pt",   "Maria Pereira",   "USUARIO", is_chefe_equipe=True, is_tutor=True)
tutor_id     = make_user("joao.costa@banco.pt",      "João Costa",      "USUARIO", is_tutor=True)
gerente_id   = make_user("antonio.faria@banco.pt",   "António Faria",   "USUARIO", is_gerente=True)
student1_id  = make_user("paula.ferreira@banco.pt",  "Paula Ferreira",  "TRAINEE")
student2_id  = make_user("rui.oliveira@banco.pt",    "Rui Oliveira",    "TRAINEE")
student3_id  = make_user("sofia.rodrigues@banco.pt", "Sofia Rodrigues", "TRAINEE")
student4_id  = make_user("pedro.lima@banco.pt",      "Pedro Lima",      "TRAINEE")
student5_id  = make_user("ines.martins@banco.pt",    "Inês Martins",    "TRAINEE")
admin_id = 1
db.commit()

# ─── 3. CURSOS, LIÇÕES E DESAFIOS ─────────────────────────────────────────────
print("\n[3/6] Criando cursos, lições e desafios...")

bank_row = db.execute(text("SELECT id FROM banks LIMIT 1")).fetchone()
bank_id  = bank_row[0] if bank_row else None
prod_row = db.execute(text("SELECT id FROM products LIMIT 1")).fetchone()
prod_id  = prod_row[0] if prod_row else None

COURSES_DEF = [
    ("Documentários de Importação — Nível 1", "Formação base em operações de importação por documentários."),
    ("Documentários de Exportação — Nível 1", "Formação base em operações de exportação por documentários."),
    ("Gestão de Crédito Documentário",         "Aprofundamento em crédito documentário (LC/SBLC)."),
    ("Eurocobros e Remessas",                  "Operações de cobranças documentárias e remessas."),
]
LESSON_TITLES = [
    ("Introdução e Quadro Regulamentar", 45),
    ("Fluxo Operacional e Documentação", 60),
    ("Casos Práticos e Resolução de Erros", 90),
]

course_ids = []
for title, desc in COURSES_DEF:
    c = models.Course(title=title, description=desc, is_active=True, created_by=admin_id)
    db.add(c); db.flush()
    course_ids.append(c.id)
    if bank_id:
        db.add(models.CourseBank(course_id=c.id, bank_id=bank_id))
    if prod_id:
        db.add(models.CourseProduct(course_id=c.id, product_id=prod_id))
    for order, (ltitle, mins) in enumerate(LESSON_TITLES, 1):
        db.add(models.Lesson(title=ltitle, course_id=c.id, order_index=order,
                             estimated_minutes=mins))
    db.add(models.Challenge(
        title=f"Desafio Final — {title}",
        course_id=c.id, time_limit_minutes=60, operations_required=10,
        target_mpu=95.0, max_errors=2,
        is_active=True, created_by=admin_id,
    ))
    print(f"  '{title[:45]}' → id={c.id}")

db.commit()

# ─── 4. PLANOS DE FORMAÇÃO ────────────────────────────────────────────────────
print("\n[4/6] Criando planos de formação...")

PLANS_DEF = [
    ("Plano Paula Ferreira — Importação Q2 2026",     student1_id, trainer1_id, [0,1], "2026-04-01","2026-06-30"),
    ("Plano Rui Oliveira — Crédito Docum. Q2 2026",   student2_id, trainer1_id, [2],   "2026-04-01","2026-06-30"),
    ("Plano Sofia Rodrigues — Formação Geral Q2 2026", student3_id, trainer2_id, [0,2,3],"2026-04-15","2026-07-31"),
    ("Plano Pedro Lima — Eurocobros Q2 2026",          student4_id, trainer2_id, [3],   "2026-05-01","2026-07-31"),
    ("Plano Inês Martins — Nível 1 Completo",          student5_id, trainer1_id, [0,1,2,3],"2026-03-01","2026-09-30"),
]

plan_ids = []
for title, sid, tid, cidxs, start, end in PLANS_DEF:
    plan = models.TrainingPlan(
        title=title, student_id=sid, trainer_id=tid,
        start_date=date.fromisoformat(start), end_date=date.fromisoformat(end),
        status="ACTIVE", created_by=admin_id,
    )
    db.add(plan); db.flush()
    plan_ids.append(plan.id)
    for order, cidx in enumerate(cidxs, 1):
        db.add(models.TrainingPlanCourse(
            training_plan_id=plan.id, course_id=course_ids[cidx],
            order_index=order, status="IN_PROGRESS",
        ))
    db.add(models.TrainingPlanTrainer(
        training_plan_id=plan.id, trainer_id=tid, is_primary=True, assigned_by=admin_id,
    ))
    for cidx in cidxs:
        db.add(models.Enrollment(user_id=sid, course_id=course_ids[cidx]))
    print(f"  '{title[:52]}' → id={plan.id}")

db.commit()

# ─── 5. ERROS DE TUTORIA ──────────────────────────────────────────────────────
print("\n[5/6] Criando erros de tutoria...")

# Load master data IDs
cat_rows   = db.execute(text("SELECT id FROM tutoria_error_categories ORDER BY id LIMIT 9")).fetchall()
cat_ids    = [r[0] for r in cat_rows] if cat_rows else [1]
impact_alta_id  = db.execute(text("SELECT id FROM error_impacts WHERE level='ALTA' LIMIT 1")).scalar()
impact_baixa_id = db.execute(text("SELECT id FROM error_impacts WHERE level='BAIXA' LIMIT 1")).scalar()
origin_ids = [r[0] for r in db.execute(text("SELECT id FROM error_origins ORDER BY id LIMIT 4")).fetchall()] or [1]
detected_ids = [r[0] for r in db.execute(text("SELECT id FROM error_detected_by ORDER BY id LIMIT 5")).fetchall()] or [1]
dept_ids = [r[0] for r in db.execute(text("SELECT id FROM departments ORDER BY id LIMIT 5")).fetchall()] or [1]
activity_ids = [r[0] for r in db.execute(text("SELECT id FROM activities ORDER BY id LIMIT 5")).fetchall()] or [1]
error_type_ids = [r[0] for r in db.execute(text("SELECT id FROM error_types ORDER BY id LIMIT 5")).fetchall()] or [1]
bank_id_1 = db.execute(text("SELECT id FROM banks ORDER BY id LIMIT 1")).scalar()
bank_id_2 = db.execute(text("SELECT id FROM banks ORDER BY id LIMIT 1 OFFSET 1")).scalar() or bank_id_1
prod_id_1 = db.execute(text("SELECT id FROM products ORDER BY id LIMIT 1")).scalar()
prod_id_2 = db.execute(text("SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 1")).scalar() or prod_id_1

def _c(lst, i): return lst[i % len(lst)]

# 10 errors with ALL Excel columns populated
ERRORS = [
    # 1 — RESOLVED, ALTA
    dict(tutorado_id=student1_id, created_by_id=chefe_id,
         description="Incorrecta aplicação de taxas CCI em LC de importação. O campo 71B não refletia as comissões acordadas.",
         severity="ALTA", impact_level="ALTA", status="RESOLVED",
         date_occurrence=date(2026,3,10), date_detection=date(2026,3,11),
         solution="Taxa corrigida, SWIFT de alteração emitido, formação complementar realizada.",
         action_plan_text="1) Corrigir SWIFT MT700. 2) Atualizar tabela de tarifas CCI. 3) Formação ao operador sobre campo 71B.",
         solution_confirmed=True,
         bank_id=bank_id_1, product_id=prod_id_1,
         office="Madrid — Trade Finance", reference_code="LC/2026/IMP/00342",
         final_client="Empresa Textil SA", amount=185000.00, currency="USD",
         clasificacion="Interno",
         origin_id=_c(origin_ids,0), category_id=_c(cat_ids,0),
         detected_by_id=_c(detected_ids,0), department_id=_c(dept_ids,0),
         activity_id=_c(activity_ids,0), error_type_id=_c(error_type_ids,0),
         recurrence_type="NO", impact_id=impact_alta_id,
         escalado="Escalado a Quality Unit em 2026-03-13. Resolvido sem impacto regulatório.",
         comentarios_reunion="Caso apresentado em reunião semanal. Formação adicional agendada para Q2."),
    # 2 — RESOLVED, BAIXA
    dict(tutorado_id=student2_id, created_by_id=chefe_id,
         description="Divergência nos prazos de apresentação de documentos em remessa de exportação. Prazo MT730 enviado com 1 dia de atraso.",
         severity="MEDIA", impact_level="BAIXA", status="RESOLVED",
         date_occurrence=date(2026,3,12), date_detection=date(2026,3,12),
         solution="Prazos revistos, procedimento atualizado no manual operacional.",
         action_plan_text="1) Rever calendário de prazos MT730. 2) Atualizar checklist diário. 3) Comunicar equipa.",
         solution_confirmed=True,
         bank_id=bank_id_1, product_id=prod_id_2,
         office="Lisboa — Documentários", reference_code="REM/2026/EXP/00128",
         final_client="Agro Export Lda", amount=42500.00, currency="EUR",
         clasificacion="Interno",
         origin_id=_c(origin_ids,1), category_id=_c(cat_ids,1),
         detected_by_id=_c(detected_ids,1), department_id=_c(dept_ids,1),
         activity_id=_c(activity_ids,1), error_type_id=_c(error_type_ids,1),
         recurrence_type="SI", impact_id=impact_baixa_id,
         escalado="Não escalado.",
         comentarios_reunion="Monitorizar recorrência durante 60 dias."),
    # 3 — APPROVED, ALTA
    dict(tutorado_id=student3_id, created_by_id=chefe_id,
         description="Endosso incorreto em letra de câmbio de exportação — falta assinatura do sacador.",
         severity="ALTA", impact_level="ALTA", status="APPROVED",
         date_occurrence=date(2026,3,20), date_detection=date(2026,3,21),
         action_plan_text="1) Devolver letra ao cliente para reendosso. 2) Verificar todos os documentos pendentes.",
         bank_id=bank_id_2, product_id=prod_id_1,
         office="Porto — Comércio Externo", reference_code="CAM/2026/EXP/00057",
         final_client="Metal Parts GmbH", amount=67800.00, currency="EUR",
         clasificacion="Externo",
         origin_id=_c(origin_ids,2), category_id=_c(cat_ids,2),
         detected_by_id=_c(detected_ids,2), department_id=_c(dept_ids,2),
         activity_id=_c(activity_ids,2), error_type_id=_c(error_type_ids,2),
         recurrence_type="NO", impact_id=impact_alta_id,
         escalado="Enviado para responsável de área.",
         comentarios_reunion=""),
    # 4 — PENDING_TUTOR_REVIEW, BAIXA
    dict(tutorado_id=student4_id, created_by_id=chefe_id,
         description="Falta de documentos de embarque no crédito standby — B/L não apresentado dentro do prazo.",
         severity="MEDIA", impact_level="BAIXA", status="PENDING_TUTOR_REVIEW",
         date_occurrence=date(2026,3,25), date_detection=date(2026,3,26),
         action_plan_text="1) Contactar banco emissor. 2) Solicitar extensão de prazo ao cliente.",
         bank_id=bank_id_1, product_id=prod_id_1,
         office="Madrid — SBLC", reference_code="SBLC/2026/000991",
         final_client="Logistics Corp SA", amount=320000.00, currency="USD",
         clasificacion="Externo",
         origin_id=_c(origin_ids,3), category_id=_c(cat_ids,3),
         detected_by_id=_c(detected_ids,3), department_id=_c(dept_ids,3),
         activity_id=_c(activity_ids,3), error_type_id=_c(error_type_ids,3),
         recurrence_type="PERIODICA", impact_id=impact_baixa_id,
         escalado="",
         comentarios_reunion="Revisão pendente do tutor antes de escalada."),
    # 5 — ANALYSIS, BAIXA
    dict(tutorado_id=student5_id, created_by_id=chefe_id,
         description="Erro de cálculo em comissão de abertura de LC — taxa aplicada 0.25% em vez de 0.20%.",
         severity="MEDIA", impact_level="BAIXA", status="ANALYSIS",
         date_occurrence=date(2026,4,1), date_detection=date(2026,4,1),
         action_plan_text="1) Emitir nota de débito/crédito corretiva. 2) Validar tabela de comissões.",
         bank_id=bank_id_1, product_id=prod_id_1,
         office="Barcelona — Trade", reference_code="LC/2026/IMP/00398",
         final_client="Construções Iberia SL", amount=95000.00, currency="EUR",
         clasificacion="Interno",
         origin_id=_c(origin_ids,0), category_id=_c(cat_ids,4),
         detected_by_id=_c(detected_ids,4), department_id=_c(dept_ids,4),
         activity_id=_c(activity_ids,4), error_type_id=_c(error_type_ids,4),
         recurrence_type="NO", impact_id=impact_baixa_id,
         escalado="",
         comentarios_reunion=""),
    # 6 — ANALYSIS, ALTA
    dict(tutorado_id=student1_id, created_by_id=chefe_id,
         description="Dados do beneficiário incorretos em LC de importação — IBAN do banco correspondente errado.",
         severity="ALTA", impact_level="ALTA", status="ANALYSIS",
         date_occurrence=date(2026,4,2), date_detection=date(2026,4,2),
         action_plan_text="1) Emitir MT700 de alteração urgente. 2) Notificar banco correspondente. 3) Monitorizar confirmação.",
         bank_id=bank_id_2, product_id=prod_id_1,
         office="Lisboa — CDI", reference_code="LC/2026/IMP/00401",
         final_client="Tech Solutions Inc", amount=550000.00, currency="USD",
         clasificacion="Interno",
         origin_id=_c(origin_ids,1), category_id=_c(cat_ids,5),
         detected_by_id=_c(detected_ids,0), department_id=_c(dept_ids,1),
         activity_id=_c(activity_ids,0), error_type_id=_c(error_type_ids,1),
         recurrence_type="RECURRENT", impact_id=impact_alta_id,
         escalado="Escalado urgente a chefe de equipa em 2026-04-02.",
         comentarios_reunion="Análise em curso. Reunião de follow-up agendada."),
    # 7 — REGISTERED, BAIXA
    dict(tutorado_id=student2_id, created_by_id=student2_id,
         description="Atraso no envio de SWIFT MT700 — confirmação emitida 2 dias após prazo regulamentar.",
         severity="BAIXA", impact_level="BAIXA", status="REGISTERED",
         date_occurrence=date(2026,4,3), date_detection=date(2026,4,4),
         bank_id=bank_id_1, product_id=prod_id_2,
         office="Bilbao — Documentários", reference_code="LC/2026/EXP/00210",
         final_client="Pesca Atlântica SA", amount=28000.00, currency="EUR",
         clasificacion="Interno",
         origin_id=_c(origin_ids,2), category_id=_c(cat_ids,6),
         detected_by_id=_c(detected_ids,1), department_id=_c(dept_ids,2),
         activity_id=_c(activity_ids,1), error_type_id=_c(error_type_ids,2),
         recurrence_type="NO", impact_id=impact_baixa_id,
         escalado="", comentarios_reunion=""),
    # 8 — REGISTERED, ALTA
    dict(tutorado_id=student3_id, created_by_id=student3_id,
         description="Omissão de cláusula de transferibilidade em LC — campo 48 não preenchido.",
         severity="ALTA", impact_level="ALTA", status="REGISTERED",
         date_occurrence=date(2026,4,4), date_detection=date(2026,4,4),
         bank_id=bank_id_1, product_id=prod_id_1,
         office="Madrid — Trade Finance", reference_code="LC/2026/IMP/00445",
         final_client="Grupo Alimentar Norte SA", amount=120000.00, currency="EUR",
         clasificacion="Interno",
         origin_id=_c(origin_ids,3), category_id=_c(cat_ids,7),
         detected_by_id=_c(detected_ids,2), department_id=_c(dept_ids,3),
         activity_id=_c(activity_ids,2), error_type_id=_c(error_type_ids,3),
         recurrence_type="NO", impact_id=impact_alta_id,
         escalado="", comentarios_reunion=""),
    # 9 — REGISTERED, BAIXA
    dict(tutorado_id=student4_id, created_by_id=student4_id,
         description="Divergência em montante de remessa documentária — diferença de 500 EUR entre MT202 e MT103.",
         severity="MEDIA", impact_level="BAIXA", status="REGISTERED",
         date_occurrence=date(2026,4,5), date_detection=date(2026,4,5),
         bank_id=bank_id_2, product_id=prod_id_2,
         office="Porto — Remessas", reference_code="REM/2026/IMP/00334",
         final_client="Importações do Norte Lda", amount=18500.00, currency="EUR",
         clasificacion="Externo",
         origin_id=_c(origin_ids,0), category_id=_c(cat_ids,8),
         detected_by_id=_c(detected_ids,3), department_id=_c(dept_ids,4),
         activity_id=_c(activity_ids,3), error_type_id=_c(error_type_ids,4),
         recurrence_type="SI", impact_id=impact_baixa_id,
         escalado="", comentarios_reunion=""),
    # 10 — REGISTERED, ALTA
    dict(tutorado_id=student5_id, created_by_id=student5_id,
         description="Referência errada no MT103 de pagamento — código IBAN do beneficiário com dígito transposto.",
         severity="ALTA", impact_level="ALTA", status="REGISTERED",
         date_occurrence=date(2026,4,5), date_detection=date(2026,4,5),
         bank_id=bank_id_1, product_id=prod_id_1,
         office="Lisboa — Pagamentos", reference_code="PAG/2026/000872",
         final_client="Exportações do Sul SA", amount=75000.00, currency="USD",
         clasificacion="Interno",
         origin_id=_c(origin_ids,1), category_id=_c(cat_ids,0),
         detected_by_id=_c(detected_ids,4), department_id=_c(dept_ids,0),
         activity_id=_c(activity_ids,4), error_type_id=_c(error_type_ids,0),
         recurrence_type="RECURRENT", impact_id=impact_alta_id,
         escalado="Escalado ao responsável de pagamentos.",
         comentarios_reunion=""),
]

for e in ERRORS:
    err = models.TutoriaError(**e)
    db.add(err)

db.commit()
print(f"  {len(ERRORS)} erros criados")

# ─── 6. CHAMADOS, RATINGS, FAQ ────────────────────────────────────────────────
print("\n[6/6] Criando chamados, ratings e FAQs...")

CHAMADOS = [
    dict(created_by_id=student1_id, title="Erro ao submeter desafio — LC Importação",
         description="Ao submeter o desafio final recebo erro 500. Já tentei 3 vezes.",
         type="BUG", priority="ALTA", portal="FORMACOES", status="EM_ANDAMENTO",
         assigned_to_id=admin_id),
    dict(created_by_id=student2_id, title="Documentação do plano de formação incompleta",
         description="O plano Crédito Documentário não tem os materiais de apoio.",
         type="BUG", priority="MEDIA", portal="FORMACOES", status="ABERTO"),
    dict(created_by_id=student3_id, title="Melhoria — exportar relatório de progresso em PDF",
         description="Seria útil poder exportar o meu progresso em PDF para partilhar com o tutor.",
         type="MELHORIA", priority="BAIXA", portal="RELATORIOS", status="ABERTO"),
    dict(created_by_id=student4_id, title="Tutoria — não consigo ver o meu erro registado",
         description="Registei um erro mas não aparece na minha lista.",
         type="BUG", priority="ALTA", portal="TUTORIA", status="CONCLUIDO",
         assigned_to_id=admin_id),
    dict(created_by_id=student5_id, title="Sugestão: modo nocturno na app móvel",
         description="O tema escuro não funciona correctamente no iPad.",
         type="MELHORIA", priority="BAIXA", portal="GERAL", status="ABERTO"),
]

for c in CHAMADOS:
    ch = models.Chamado(**c)
    db.add(ch); db.flush()
    if c["status"] in ("EM_ANDAMENTO", "CONCLUIDO"):
        db.add(models.ChamadoComment(
            chamado_id=ch.id, author_id=admin_id,
            content="A analisar o problema. Retorno brevemente.",
        ))

for stars, (sid, cidx, pid_idx) in zip(
    [4, 5, 3, 4, 5],
    [(student1_id,0,0),(student2_id,2,1),(student3_id,1,2),(student4_id,3,3),(student5_id,0,4)],
):
    db.add(models.Rating(
        user_id=sid, rating_type="COURSE", stars=stars,
        comment=["Excelente conteúdo!", "Muito bem estruturado.", "Bom mas podia ter mais exemplos.",
                 "Adorei os casos práticos.", "Recomendo a todos os colegas."][pid_idx],
        course_id=course_ids[cidx],
        training_plan_id=plan_ids[pid_idx],
    ))

# ChatFAQs with correct schema (multilingual)
faqs = [
    dict(keywords_pt="tutoria incidência fluxo",
         keywords_es="tutoría incidencia flujo", keywords_en="tutoring incident flow",
         answer_pt="O processo de tutoria envolve registo, análise, aprovação e resolução com acompanhamento do tutor.",
         answer_es="El proceso de tutoría incluye registro, análisis, aprobación y resolución.",
         answer_en="The tutoring process involves registration, analysis, approval and resolution.",
         priority=1, is_active=True, created_by_id=admin_id),
    dict(keywords_pt="desafio submeter como",
         keywords_es="desafío enviar cómo", keywords_en="challenge submit how",
         answer_pt="Aceda ao seu curso, clique no desafio disponibilizado pelo formador e siga as instruções.",
         answer_es="Acceda a su curso, haga clic en el desafío y siga las instrucciones.",
         answer_en="Go to your course, click on the challenge released by the trainer and follow the steps.",
         priority=2, is_active=True, created_by_id=admin_id),
    dict(keywords_pt="certificado quando obter",
         keywords_es="certificado cuándo obtener", keywords_en="certificate when get",
         answer_pt="O certificado é gerado automaticamente ao finalizar o plano de formação com sucesso.",
         answer_es="El certificado se genera al finalizar el plan de formación.",
         answer_en="The certificate is automatically generated upon successful plan completion.",
         priority=3, is_active=True, created_by_id=admin_id),
]
for faq in faqs:
    db.add(models.ChatFAQ(**faq))

db.commit()
print(f"  {len(CHAMADOS)} chamados, 5 ratings, {len(faqs)} FAQs criados")

# ─── RESUMO ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("ESTADO FINAL DA BD")
print("=" * 60)
for tbl in ["users","courses","lessons","challenges","training_plans","tutoria_errors","chamados","ratings"]:
    try:
        c = db.execute(text(f"SELECT COUNT(*) FROM `{tbl}`")).scalar()
        print(f"  {tbl:<22} {c}")
    except: pass

print("""
╔══════════════════════════════════════════════════════════╗
║  CREDENCIAIS DE ACESSO                                   ║
╠══════════════════════════════════════════════════════════╣
║  admin@tradehub.com          admin123    (Admin)         ║
║  ana.silva@banco.pt          Demo1234!   (Formador)      ║
║  carlos.santos@banco.pt      Demo1234!   (Formador)      ║
║  maria.pereira@banco.pt      Demo1234!   (Chefe+Tutor)   ║
║  joao.costa@banco.pt         Demo1234!   (Tutor)         ║
║  antonio.faria@banco.pt      Demo1234!   (Gerente)       ║
║  paula.ferreira@banco.pt     Demo1234!   (Formando)      ║
║  rui.oliveira@banco.pt       Demo1234!   (Formando)      ║
║  sofia.rodrigues@banco.pt    Demo1234!   (Formando)      ║
║  pedro.lima@banco.pt         Demo1234!   (Formando)      ║
║  ines.martins@banco.pt       Demo1234!   (Formando)      ║
╚══════════════════════════════════════════════════════════╝
""")
db.close()
