#!/usr/bin/env python3
"""Script para criar dados de teste completos"""

import pymysql
from datetime import datetime, timedelta

conn = pymysql.connect(
    host='72.60.188.172',
    port=3306,
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db',
    charset='utf8mb4'
)

cursor = conn.cursor()

print('Criando dados de teste...')
print('=' * 60)

# 1. Buscar IDs existentes
cursor.execute('SELECT id FROM banks LIMIT 1')
bank = cursor.fetchone()
bank_id = bank[0] if bank else 1

cursor.execute('SELECT id FROM products LIMIT 1')
product = cursor.fetchone()
product_id = product[0] if product else 1

cursor.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
admin = cursor.fetchone()
admin_id = admin[0] if admin else 1

cursor.execute("SELECT id FROM users WHERE role = 'TRAINER' LIMIT 1")
trainer = cursor.fetchone()
trainer_id = trainer[0] if trainer else admin_id

cursor.execute("SELECT id FROM users WHERE role IN ('TRAINEE', 'STUDENT') LIMIT 1")
student = cursor.fetchone()
if not student:
    # Criar um formando de teste
    cursor.execute('''
        INSERT INTO users (email, full_name, hashed_password, role, is_active, is_pending)
        VALUES ('formando@tradehub.com', 'Formando Teste', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S3I7.V7vjxG.jm', 'TRAINEE', 1, 0)
    ''')
    conn.commit()
    cursor.execute('SELECT LAST_INSERT_ID()')
    student_id = cursor.fetchone()[0]
    print(f'  Formando criado: ID {student_id}')
else:
    student_id = student[0]

print(f'  Bank ID: {bank_id}')
print(f'  Product ID: {product_id}')
print(f'  Admin ID: {admin_id}')
print(f'  Trainer ID: {trainer_id}')
print(f'  Student ID: {student_id}')

# 2. Criar Curso
cursor.execute('''
    INSERT INTO courses (title, description, bank_id, product_id, created_by, is_active)
    VALUES ('Gestão de Remessas Internacionais', 'Curso completo sobre processamento de remessas internacionais e pagamentos SWIFT.', %s, %s, %s, 1)
''', (bank_id, product_id, trainer_id))
conn.commit()
cursor.execute('SELECT LAST_INSERT_ID()')
course_id = cursor.fetchone()[0]
print(f'  Curso criado: ID {course_id}')

# 3. Criar Lições
lessons_data = [
    ('Introdução às Remessas', 'Conceitos fundamentais de remessas internacionais', 'THEORETICAL', 30),
    ('Mensagens SWIFT MT103', 'Estrutura e processamento de mensagens MT103', 'THEORETICAL', 45),
    ('Processamento Prático', 'Exercício prático de processamento de remessas', 'PRACTICAL', 60),
]

lesson_ids = []
for idx, (title, desc, lesson_type, minutes) in enumerate(lessons_data):
    cursor.execute('''
        INSERT INTO lessons (course_id, title, description, lesson_type, order_index, estimated_minutes, started_by)
        VALUES (%s, %s, %s, %s, %s, %s, 'TRAINER')
    ''', (course_id, title, desc, lesson_type, idx, minutes))
    conn.commit()
    cursor.execute('SELECT LAST_INSERT_ID()')
    lesson_ids.append(cursor.fetchone()[0])
print(f'  Licoes criadas: {len(lesson_ids)} licoes')

# 4. Criar Desafios
# Estrutura: (title, desc, challenge_type, operations_required, time_limit_minutes, target_mpu, max_errors)
challenges_data = [
    ('Desafio 1: Identificação de Campos MT103', 'Identificar campos obrigatórios numa mensagem MT103', 'SUMMARY', 10, 20, 5.0, 2),
    ('Desafio 2: Processamento Completo', 'Processar 5 remessas internacionais', 'COMPLETE', 5, 30, 6.0, 1),
]

challenge_ids = []
for idx, (title, desc, ch_type, ops_required, time_limit, target_mpu, max_errors) in enumerate(challenges_data):
    cursor.execute('''
        INSERT INTO challenges (course_id, title, description, challenge_type, operations_required, time_limit_minutes, target_mpu, max_errors, created_by, is_released, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 1)
    ''', (course_id, title, desc, ch_type, ops_required, time_limit, target_mpu, max_errors, trainer_id))
    conn.commit()
    cursor.execute('SELECT LAST_INSERT_ID()')
    challenge_ids.append(cursor.fetchone()[0])
print(f'  Desafios criados: {len(challenge_ids)} desafios')

# 5. Criar Plano de Formação
cursor.execute('''
    INSERT INTO training_plans (title, description, created_by, trainer_id, student_id, bank_id, product_id, status, is_active)
    VALUES ('Plano de Formação - Remessas', 'Formação completa em processamento de remessas internacionais', %s, %s, %s, %s, %s, 'ACTIVE', 1)
''', (trainer_id, trainer_id, student_id, bank_id, product_id))
conn.commit()
cursor.execute('SELECT LAST_INSERT_ID()')
plan_id = cursor.fetchone()[0]
print(f'  Plano de Formacao criado: ID {plan_id}')

# 6. Vincular curso ao plano
cursor.execute('''
    INSERT INTO training_plan_courses (training_plan_id, course_id, order_index)
    VALUES (%s, %s, 0)
''', (plan_id, course_id))
conn.commit()
print(f'  Curso vinculado ao plano')

# 7. Criar Enrollment
cursor.execute('''
    INSERT INTO enrollments (user_id, course_id)
    VALUES (%s, %s)
''', (student_id, course_id))
conn.commit()
cursor.execute('SELECT LAST_INSERT_ID()')
enrollment_id = cursor.fetchone()[0]
print(f'  Enrollment criado: ID {enrollment_id}')

# 8. Criar submissão de desafio pendente de revisão
now = datetime.now()
started = now - timedelta(minutes=15)
cursor.execute('''
    INSERT INTO challenge_submissions (challenge_id, user_id, training_plan_id, submission_type, status, total_operations, started_at, completed_at, total_time_minutes, errors_count, calculated_mpu)
    VALUES (%s, %s, %s, 'COMPLETE', 'PENDING_REVIEW', 5, %s, %s, 15, 1, 3.0)
''', (challenge_ids[1], student_id, plan_id, started, now))
conn.commit()
cursor.execute('SELECT LAST_INSERT_ID()')
submission_id = cursor.fetchone()[0]
print(f'  Submissao pendente de revisao criada: ID {submission_id}')

# 9. Criar operações para a submissão
for i in range(5):
    cursor.execute('''
        INSERT INTO challenge_operations (submission_id, operation_number, operation_reference, started_at, completed_at, has_error)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (submission_id, i+1, f'REM2026{str(i+1).zfill(4)}', started + timedelta(minutes=i*2), started + timedelta(minutes=i*2+2), i == 2))
conn.commit()
print(f'  Operacoes criadas: 5 operacoes')

# 10. Criar progresso de lições
for lesson_id in lesson_ids[:2]:
    cursor.execute('''
        INSERT INTO lesson_progress (lesson_id, user_id, training_plan_id, enrollment_id, status, is_released, estimated_minutes, started_at, completed_at)
        VALUES (%s, %s, %s, %s, 'COMPLETED', 1, 30, %s, %s)
    ''', (lesson_id, student_id, plan_id, enrollment_id, started, now))
conn.commit()
print(f'  Progresso de licoes criado')

cursor.close()
conn.close()

print('=' * 60)
print('Dados de teste criados com sucesso!')
print()
print('Resumo:')
print(f'  - 1 Curso: Gestao de Remessas Internacionais')
print(f'  - 3 Licoes')
print(f'  - 2 Desafios')
print(f'  - 1 Plano de Formacao')
print(f'  - 1 Submissao PENDENTE DE REVISAO')
print()
print('Agora voce pode testar a pagina de Pendentes de Revisao!')
