import pymysql

conn = pymysql.connect(
    host='72.60.188.172',
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db'
)
cursor = conn.cursor(pymysql.cursors.DictCursor)

user_id = 3  # Formando Teste

print("=" * 60)
print("ANÁLISE DE DADOS DO FORMANDO")
print("=" * 60)

# 1. Dados do utilizador
cursor.execute("SELECT id, full_name, email, role, created_at FROM users WHERE id = %s", (user_id,))
user = cursor.fetchone()
print(f"\n1. UTILIZADOR: {user}")

# 2. Training Plans atribuídos
cursor.execute("""
    SELECT tp.id, tp.title, tp.status, tpa.assigned_at, tpa.completed_at
    FROM training_plans tp
    JOIN training_plan_assignments tpa ON tp.id = tpa.training_plan_id
    WHERE tpa.user_id = %s
""", (user_id,))
plans = cursor.fetchall()
print(f"\n2. PLANOS DE FORMAÇÃO ({len(plans)})")
for p in plans:
    print(f"   - {p}")

# 3. Certificados
cursor.execute("""
    SELECT id, certificate_number, training_plan_id, issued_at, average_mpu, average_approval_rate
    FROM certificates WHERE user_id = %s
""", (user_id,))
certs = cursor.fetchall()
print(f"\n3. CERTIFICADOS ({len(certs)})")
for c in certs:
    print(f"   - {c}")

# 4. Challenge Submissions
cursor.execute("""
    SELECT cs.id, ch.title as challenge_title, cs.status, cs.is_approved, 
           cs.calculated_mpu, cs.errors_count, cs.total_operations, 
           cs.total_time_minutes, cs.completed_at
    FROM challenge_submissions cs
    JOIN challenges ch ON cs.challenge_id = ch.id
    WHERE cs.user_id = %s
    ORDER BY cs.completed_at DESC
""", (user_id,))
submissions = cursor.fetchall()
print(f"\n4. SUBMISSÕES DE DESAFIOS ({len(submissions)})")
for s in submissions[:5]:  # Mostrar só as 5 mais recentes
    print(f"   - {s}")

# 5. Estatísticas de Desafios
cursor.execute("""
    SELECT 
        COUNT(*) as total_submissions,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as aprovados,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as reprovados,
        AVG(calculated_mpu) as mpu_medio,
        SUM(errors_count) as total_erros,
        SUM(total_operations) as total_operacoes
    FROM challenge_submissions WHERE user_id = %s AND status = 'REVIEWED'
""", (user_id,))
stats = cursor.fetchone()
print(f"\n5. ESTATÍSTICAS DE DESAFIOS:")
print(f"   {stats}")

# 6. Lesson Progress
cursor.execute("""
    SELECT lp.id, l.title as lesson_title, c.title as course_title,
           lp.status, lp.started_at, lp.completed_at, lp.time_spent_seconds
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN courses c ON l.course_id = c.id
    WHERE lp.user_id = %s
""", (user_id,))
lesson_progress = cursor.fetchall()
print(f"\n6. PROGRESSO DE AULAS ({len(lesson_progress)})")
for lp in lesson_progress[:5]:
    print(f"   - {lp}")

# 7. Erros por tipo
cursor.execute("""
    SELECT 
        SUM(error_methodology) as metodologia,
        SUM(error_knowledge) as conhecimento,
        SUM(error_detail) as detalhe,
        SUM(error_procedure) as procedimento
    FROM challenge_submissions WHERE user_id = %s
""", (user_id,))
errors = cursor.fetchone()
print(f"\n7. ERROS POR TIPO:")
print(f"   {errors}")

# 8. Evolução temporal (últimos desafios)
cursor.execute("""
    SELECT DATE(completed_at) as data, 
           COUNT(*) as desafios,
           AVG(calculated_mpu) as mpu_medio,
           SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as aprovados
    FROM challenge_submissions 
    WHERE user_id = %s AND completed_at IS NOT NULL
    GROUP BY DATE(completed_at)
    ORDER BY data DESC
    LIMIT 10
""", (user_id,))
evolucao = cursor.fetchall()
print(f"\n8. EVOLUÇÃO TEMPORAL (últimos 10 dias com atividade):")
for e in evolucao:
    print(f"   - {e}")

# 9. Performance por desafio
cursor.execute("""
    SELECT ch.title, 
           COUNT(*) as tentativas,
           SUM(CASE WHEN cs.is_approved = 1 THEN 1 ELSE 0 END) as aprovacoes,
           AVG(cs.calculated_mpu) as mpu_medio,
           MIN(cs.calculated_mpu) as melhor_mpu
    FROM challenge_submissions cs
    JOIN challenges ch ON cs.challenge_id = ch.id
    WHERE cs.user_id = %s
    GROUP BY ch.id, ch.title
""", (user_id,))
performance = cursor.fetchall()
print(f"\n9. PERFORMANCE POR DESAFIO:")
for p in performance:
    print(f"   - {p}")

# 10. Cursos nos planos
cursor.execute("""
    SELECT DISTINCT c.id, c.title, c.bank_code
    FROM training_plan_courses tpc
    JOIN courses c ON tpc.course_id = c.id
    JOIN training_plan_assignments tpa ON tpc.training_plan_id = tpa.training_plan_id
    WHERE tpa.user_id = %s
""", (user_id,))
courses = cursor.fetchall()
print(f"\n10. CURSOS NOS PLANOS ({len(courses)}):")
for c in courses:
    print(f"   - {c}")

conn.close()
print("\n" + "=" * 60)
