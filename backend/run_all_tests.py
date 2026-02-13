#!/usr/bin/env python3
"""Script para testar TODAS as operações do Portal TradeHub - Versão Completa"""

import requests
import json
from datetime import datetime
import uuid

BASE_URL = 'https://srv1242193.hstgr.cloud'

print('=' * 80)
print('    TESTE COMPLETO DE TODAS AS OPERACOES DO PORTAL TRADEHUB')
print('=' * 80)
print(f'Data: {datetime.now()}')
print(f'URL: {BASE_URL}')
print('=' * 80)

session = requests.Session()
session.headers.update({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
})
results = {'passed': 0, 'failed': 0, 'details': []}

def test(method, endpoint, expected_codes, data=None, auth=None, desc=''):
    url = f'{BASE_URL}{endpoint}'
    headers = {'Authorization': f'Bearer {auth}'} if auth else {}
    try:
        if method == 'GET':
            r = session.get(url, headers=headers, timeout=30)
        elif method == 'POST':
            r = session.post(url, json=data, headers=headers, timeout=30)
        elif method == 'PUT':
            r = session.put(url, json=data, headers=headers, timeout=30)
        elif method == 'DELETE':
            r = session.delete(url, headers=headers, timeout=30)
        elif method == 'PATCH':
            r = session.patch(url, json=data, headers=headers, timeout=30)
        passed = r.status_code in expected_codes
        status = 'OK' if passed else 'FAIL'
        results['passed' if passed else 'failed'] += 1
        results['details'].append({
            'method': method, 'endpoint': endpoint, 
            'status': r.status_code, 'passed': passed
        })
        print(f'{status:4} {method:6} {endpoint:55} -> {r.status_code} {desc}')
        return r.status_code, r
    except Exception as e:
        results['failed'] += 1
        results['details'].append({
            'method': method, 'endpoint': endpoint, 
            'status': 'ERROR', 'passed': False, 'error': str(e)
        })
        print(f'FAIL {method:6} {endpoint:55} -> ERROR: {str(e)[:35]}')
        return None, None

print('\n[HEALTH CHECK]')
test('GET', '/', [200], desc='Root')
test('GET', '/health', [200], desc='Health')
test('GET', '/docs', [200], desc='Swagger')
test('GET', '/redoc', [200], desc='ReDoc')
test('GET', '/openapi.json', [200], desc='OpenAPI')

print('\n[ESTATISTICAS PUBLICAS]')
test('GET', '/api/stats/kpis', [200], desc='KPIs')
test('GET', '/api/stats/courses/featured', [200], desc='Cursos em destaque')
test('GET', '/api/stats/training-plans/featured', [200], desc='Planos em destaque')

# ========================================================================
# AUTENTICAÇÃO - Testes de Login e Registro
# ========================================================================
print('\n[AUTENTICACAO - LOGIN]')

# Teste login inválido
test('POST', '/api/auth/login', [401, 422], data={'username': 'invalido@test.com', 'password': 'wrongpass'}, desc='Login invalido')

# Teste login sem dados
test('POST', '/api/auth/login', [401, 422, 500], data={}, desc='Login sem dados')

# Teste de registro com dados incompletos
print('\n[AUTENTICACAO - REGISTRO]')
test('POST', '/api/auth/register', [400, 422], data={'email': 'test@test.com'}, desc='Registro incompleto')

# Teste de registro com senha fraca
test('POST', '/api/auth/register', [400, 422], data={
    'email': f'test_{uuid.uuid4().hex[:8]}@test.com',
    'password': '123',  # senha muito curta
    'full_name': 'Test User',
    'role': 'TRAINEE'
}, desc='Senha fraca')

# Teste /me sem token
test('GET', '/api/auth/me', [401], desc='Me sem token')

# ========================================================================
# ROTAS ADMIN (SEM AUTENTICAÇÃO - devem retornar 401)
# ========================================================================
print('\n[ADMIN - SEM AUTH - USUARIOS]')
test('GET', '/api/admin/users', [401], desc='Listar usuarios')
test('POST', '/api/admin/users', [401], data={'email': 'x@x.com'}, desc='Criar usuario')
test('GET', '/api/admin/users/1', [401], desc='Usuario por ID')
test('PUT', '/api/admin/users/1', [401], data={'email': 'x@x.com'}, desc='Atualizar usuario')
test('DELETE', '/api/admin/users/1', [401], desc='Deletar usuario')

print('\n[ADMIN - SEM AUTH - TRAINERS]')
test('GET', '/api/admin/trainers', [401], desc='Listar trainers')
test('GET', '/api/admin/pending-trainers', [401], desc='Trainers pendentes')
test('POST', '/api/admin/validate-trainer/1', [401], desc='Validar trainer')
test('POST', '/api/admin/reject-trainer/1', [401], desc='Rejeitar trainer')

print('\n[ADMIN - SEM AUTH - STUDENTS]')
test('GET', '/api/admin/students', [401], desc='Listar students')

print('\n[ADMIN - SEM AUTH - CURSOS]')
test('GET', '/api/admin/courses', [401], desc='Listar cursos')
test('POST', '/api/admin/courses', [401], data={'title': 'Test'}, desc='Criar curso')
test('GET', '/api/admin/courses/1', [401], desc='Curso por ID')
test('DELETE', '/api/admin/courses/1', [401], desc='Deletar curso')

print('\n[ADMIN - SEM AUTH - BANCOS]')
test('GET', '/api/admin/banks', [401], desc='Listar bancos')
test('POST', '/api/admin/banks', [401], data={'name': 'Test Bank'}, desc='Criar banco')
test('PUT', '/api/admin/banks/1', [401], data={'name': 'Test Bank'}, desc='Atualizar banco')
test('DELETE', '/api/admin/banks/1', [401], desc='Deletar banco')

print('\n[ADMIN - SEM AUTH - PRODUTOS]')
test('GET', '/api/admin/products', [401], desc='Listar produtos')
test('POST', '/api/admin/products', [401], data={'name': 'Test Product'}, desc='Criar produto')
test('PUT', '/api/admin/products/1', [401], data={'name': 'Test Product'}, desc='Atualizar produto')
test('DELETE', '/api/admin/products/1', [401], desc='Deletar produto')

print('\n[ADMIN - SEM AUTH - REPORTS]')
test('GET', '/api/admin/reports/stats', [401], desc='Stats report')
test('GET', '/api/admin/reports/courses', [401], desc='Courses report')
test('GET', '/api/admin/reports/trainers', [401], desc='Trainers report')
test('GET', '/api/admin/reports/training-plans', [401], desc='Plans report')

print('\n[ADMIN - SEM AUTH - ADVANCED REPORTS]')
test('GET', '/api/admin/advanced-reports/dashboard-summary', [401], desc='Dashboard summary')
test('GET', '/api/admin/advanced-reports/student-performance', [401], desc='Student performance')
test('GET', '/api/admin/advanced-reports/trainer-productivity', [401], desc='Trainer productivity')
test('GET', '/api/admin/advanced-reports/course-analytics', [401], desc='Course analytics')
test('GET', '/api/admin/advanced-reports/certifications', [401], desc='Certifications')
test('GET', '/api/admin/advanced-reports/mpu-analytics', [401], desc='MPU analytics')

# ========================================================================
# ROTAS TRAINER (SEM AUTENTICAÇÃO - devem retornar 401)
# ========================================================================
print('\n[TRAINER - SEM AUTH]')
test('GET', '/api/trainer/courses', [401], desc='Meus cursos')
test('POST', '/api/trainer/courses', [401], data={'title': 'Test'}, desc='Criar curso')
test('GET', '/api/trainer/courses/all', [401], desc='Todos cursos')
test('GET', '/api/trainer/courses/1', [401], desc='Curso por ID')
test('PUT', '/api/trainer/courses/1', [401], data={'title': 'Test'}, desc='Atualizar curso')
test('DELETE', '/api/trainer/courses/1', [401], desc='Deletar curso')
test('GET', '/api/trainer/courses/details/1', [401], desc='Detalhes curso')
test('POST', '/api/trainer/lessons', [401], data={'title': 'Test'}, desc='Criar licao')
test('GET', '/api/trainer/training-plans', [401], desc='Meus planos')
test('POST', '/api/trainer/training-plans', [401], data={'title': 'Test'}, desc='Criar plano')
test('GET', '/api/trainer/stats', [401], desc='Stats')
test('GET', '/api/trainer/reports/overview', [401], desc='Overview')
test('GET', '/api/trainer/reports/students', [401], desc='Students')
test('GET', '/api/trainer/reports/lessons', [401], desc='Lessons')
test('GET', '/api/trainer/reports/plans', [401], desc='Plans')

# ========================================================================
# ROTAS STUDENT (SEM AUTENTICAÇÃO - devem retornar 401)
# ========================================================================
print('\n[STUDENT - SEM AUTH]')
test('GET', '/api/student/courses', [401], desc='Meus cursos')
test('POST', '/api/student/enroll/1', [401], desc='Inscrever em curso')
test('GET', '/api/student/certificates', [401], desc='Certificados')
test('GET', '/api/student/stats', [401], desc='Stats')
test('GET', '/api/student/reports/dashboard', [401], desc='Dashboard')
test('GET', '/api/student/reports/overview', [401], desc='Overview')
test('GET', '/api/student/reports/courses', [401], desc='Courses')
test('GET', '/api/student/reports/lessons', [401], desc='Lessons')
test('GET', '/api/student/reports/achievements', [401], desc='Achievements')

# ========================================================================
# TRAINING PLANS (SEM AUTENTICAÇÃO)
# ========================================================================
print('\n[TRAINING PLANS - SEM AUTH]')
test('GET', '/api/training-plans/', [401], desc='Listar planos')
test('POST', '/api/training-plans/', [401], data={'title': 'Test'}, desc='Criar plano')
test('GET', '/api/training-plans/1', [401], desc='Plano por ID')
test('PUT', '/api/training-plans/1', [401], data={'title': 'Test'}, desc='Atualizar plano')
test('DELETE', '/api/training-plans/1', [401], desc='Deletar plano')
test('GET', '/api/training-plans/trainers', [401], desc='Trainers')

# ========================================================================
# CHALLENGES (SEM AUTENTICAÇÃO)
# ========================================================================
print('\n[CHALLENGES - SEM AUTH]')
test('POST', '/api/challenges/', [401], data={'title': 'Test'}, desc='Criar desafio')
test('GET', '/api/challenges/1', [401], desc='Desafio por ID')
test('PUT', '/api/challenges/1', [401], data={'title': 'Test'}, desc='Atualizar desafio')
test('GET', '/api/challenges/course/1', [401], desc='Desafios do curso')
test('GET', '/api/challenges/student/released', [401], desc='Desafios liberados')
test('GET', '/api/challenges/student/my-submissions', [401], desc='Minhas submissoes')
test('GET', '/api/challenges/pending-review/list', [401], desc='Pendentes revisao')

# ========================================================================
# LESSONS (SEM AUTENTICAÇÃO)
# ========================================================================
print('\n[LESSONS - SEM AUTH]')
test('GET', '/api/lessons/student/my-lessons', [401], desc='Minhas licoes')
test('GET', '/api/lessons/1/detail', [401], desc='Detalhe licao')
test('GET', '/api/lessons/1/progress', [401], desc='Progresso licao')
test('POST', '/api/lessons/1/start', [401], desc='Iniciar licao')
test('POST', '/api/lessons/1/pause', [401], desc='Pausar licao')
test('POST', '/api/lessons/1/resume', [401], desc='Retomar licao')
test('POST', '/api/lessons/1/finish', [401], desc='Finalizar licao')

# ========================================================================
# CERTIFICATES (SEM AUTENTICAÇÃO)
# ========================================================================
print('\n[CERTIFICATES - SEM AUTH]')
test('GET', '/api/certificates/', [401], desc='Listar certificados')
test('GET', '/api/certificates/1', [401], desc='Certificado por ID')
test('GET', '/api/certificates/by-plan/1', [401], desc='Certificados por plano')

# ========================================================================
# FINALIZATION (SEM AUTENTICAÇÃO)
# ========================================================================
print('\n[FINALIZATION - SEM AUTH]')
test('GET', '/api/finalization/plan/1/status', [401], desc='Status plano')
test('GET', '/api/finalization/plan/1/calculate-status', [401], desc='Calcular status')
test('POST', '/api/finalization/plan/1/finalize', [401], desc='Finalizar plano')

# RESUMO FINAL
print('\n' + '=' * 70)
print('RESUMO FINAL')
print('=' * 70)
total = results['passed'] + results['failed']
pct = results['passed'] / total * 100 if total > 0 else 0
print(f'Passou: {results["passed"]}')
print(f'Falhou: {results["failed"]}')
print(f'Total:  {total}')
print(f'Taxa:   {pct:.1f}%')
print('=' * 70)
