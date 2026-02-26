"""
Testes Completos de Todas as Rotas da API TradeHub
Execute com: pytest tests/test_all_routes.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# =============================================================================
# CONFIGURAÇÃO E FIXTURES
# =============================================================================

@pytest.fixture(scope="module")
def admin_token():
    """Obtém token de admin para testes"""
    response = client.post("/api/auth/login", json={
        "email": "admin@tradehub.com",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


@pytest.fixture(scope="module")
def trainer_token():
    """Obtém token de trainer para testes"""
    response = client.post("/api/auth/login", json={
        "email": "trainer@tradehub.com",
        "password": "trainer123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


@pytest.fixture(scope="module")
def student_token():
    """Obtém token de student para testes"""
    response = client.post("/api/auth/login", json={
        "email": "student@tradehub.com",
        "password": "student123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


def auth_headers(token):
    """Retorna headers de autenticação"""
    return {"Authorization": f"Bearer {token}"} if token else {}


# =============================================================================
# TESTES DE HEALTH CHECK
# =============================================================================

class TestHealthCheck:
    """Testes de verificação de saúde da API"""
    
    def test_root(self):
        """GET / - Rota raiz"""
        response = client.get("/")
        assert response.status_code == 200
    
    def test_health(self):
        """GET /health - Health check"""
        response = client.get("/health")
        assert response.status_code == 200


# =============================================================================
# TESTES DE AUTENTICAÇÃO
# =============================================================================

class TestAuth:
    """Testes de autenticação"""
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - Credenciais inválidas"""
        response = client.post("/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400, 422]
    
    def test_login_missing_fields(self):
        """POST /api/auth/login - Campos faltando"""
        response = client.post("/api/auth/login", json={
            "email": "test@test.com"
        })
        # Pode ser 422 (validação) ou 401 (autenticação)
        assert response.status_code in [401, 422]
    
    def test_register_invalid_email(self):
        """POST /api/auth/register - Email inválido"""
        response = client.post("/api/auth/register", json={
            "email": "invalid-email",
            "password": "password123",
            "full_name": "Test User"
        })
        assert response.status_code == 422
    
    def test_me_unauthorized(self):
        """GET /api/auth/me - Sem autenticação"""
        response = client.get("/api/auth/me")
        assert response.status_code == 401


# =============================================================================
# TESTES DE ADMIN
# =============================================================================

class TestAdminUsers:
    """Testes de gerenciamento de usuários (Admin)"""
    
    def test_list_users_unauthorized(self):
        """GET /api/admin/users - Sem autenticação"""
        response = client.get("/api/admin/users")
        assert response.status_code == 401
    
    def test_list_users_authorized(self, admin_token):
        """GET /api/admin/users - Com autenticação admin"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/users", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_get_user_not_found(self, admin_token):
        """GET /api/admin/users/{id} - Usuário não encontrado"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/users/999999", headers=auth_headers(admin_token))
        assert response.status_code == 404


class TestAdminTrainers:
    """Testes de gerenciamento de trainers (Admin)"""
    
    def test_list_trainers(self, admin_token):
        """GET /api/admin/trainers - Listar formadores"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/trainers", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_list_pending_trainers(self, admin_token):
        """GET /api/admin/pending-trainers - Formadores pendentes"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/pending-trainers", headers=auth_headers(admin_token))
        assert response.status_code == 200


class TestAdminCourses:
    """Testes de gerenciamento de cursos (Admin)"""
    
    def test_list_courses(self, admin_token):
        """GET /api/admin/courses - Listar cursos"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/courses", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_get_course_not_found(self, admin_token):
        """GET /api/admin/courses/{id} - Curso não encontrado"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/courses/999999", headers=auth_headers(admin_token))
        assert response.status_code == 404


class TestAdminBanks:
    """Testes de gerenciamento de bancos (Admin)"""
    
    def test_list_banks(self, admin_token):
        """GET /api/admin/banks - Listar bancos"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/banks", headers=auth_headers(admin_token))
        assert response.status_code == 200


class TestAdminProducts:
    """Testes de gerenciamento de produtos (Admin)"""
    
    def test_list_products(self, admin_token):
        """GET /api/admin/products - Listar produtos"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/products", headers=auth_headers(admin_token))
        assert response.status_code == 200


class TestAdminReports:
    """Testes de relatórios Admin"""
    
    def test_reports_stats(self, admin_token):
        """GET /api/admin/reports/stats - Estatísticas"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/reports/stats", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_reports_courses(self, admin_token):
        """GET /api/admin/reports/courses - Relatório de cursos"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/reports/courses", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_reports_trainers(self, admin_token):
        """GET /api/admin/reports/trainers - Relatório de formadores"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/reports/trainers", headers=auth_headers(admin_token))
        assert response.status_code == 200


class TestAdvancedReports:
    """Testes de relatórios avançados"""
    
    def test_dashboard_summary(self, admin_token):
        """GET /api/admin/advanced-reports/dashboard-summary"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/advanced-reports/dashboard-summary", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_student_performance(self, admin_token):
        """GET /api/admin/advanced-reports/student-performance"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/advanced-reports/student-performance", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_trainer_productivity(self, admin_token):
        """GET /api/admin/advanced-reports/trainer-productivity"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/advanced-reports/trainer-productivity", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_course_analytics(self, admin_token):
        """GET /api/admin/advanced-reports/course-analytics"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/admin/advanced-reports/course-analytics", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200


# =============================================================================
# TESTES DE STUDENT
# =============================================================================

class TestStudent:
    """Testes de rotas de Student"""
    
    def test_student_courses_unauthorized(self):
        """GET /api/student/courses - Sem autenticação"""
        response = client.get("/api/student/courses")
        assert response.status_code == 401
    
    def test_student_courses(self, student_token):
        """GET /api/student/courses - Com autenticação"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/student/courses", headers=auth_headers(student_token))
        assert response.status_code == 200
    
    def test_student_stats(self, student_token):
        """GET /api/student/stats - Estatísticas"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/student/stats", headers=auth_headers(student_token))
        assert response.status_code == 200
    
    def test_student_certificates(self, student_token):
        """GET /api/student/certificates - Certificados"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/student/certificates", headers=auth_headers(student_token))
        assert response.status_code == 200


class TestStudentReports:
    """Testes de relatórios do Student"""
    
    def test_dashboard(self, student_token):
        """GET /api/student/reports/dashboard"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/student/reports/dashboard", 
                            headers=auth_headers(student_token))
        assert response.status_code == 200
    
    def test_overview(self, student_token):
        """GET /api/student/reports/overview"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/student/reports/overview", 
                            headers=auth_headers(student_token))
        assert response.status_code == 200


# =============================================================================
# TESTES DE TRAINER
# =============================================================================

class TestTrainer:
    """Testes de rotas de Trainer"""
    
    def test_trainer_courses_unauthorized(self):
        """GET /api/trainer/courses - Sem autenticação"""
        response = client.get("/api/trainer/courses")
        assert response.status_code == 401
    
    def test_trainer_courses(self, trainer_token):
        """GET /api/trainer/courses - Com autenticação"""
        if not trainer_token:
            pytest.skip("Trainer token não disponível")
        response = client.get("/api/trainer/courses", headers=auth_headers(trainer_token))
        assert response.status_code == 200
    
    def test_trainer_stats(self, trainer_token):
        """GET /api/trainer/stats - Estatísticas"""
        if not trainer_token:
            pytest.skip("Trainer token não disponível")
        response = client.get("/api/trainer/stats", headers=auth_headers(trainer_token))
        assert response.status_code == 200
    
    def test_trainer_training_plans(self, trainer_token):
        """GET /api/trainer/training-plans - Planos de formação"""
        if not trainer_token:
            pytest.skip("Trainer token não disponível")
        response = client.get("/api/trainer/training-plans", 
                            headers=auth_headers(trainer_token))
        assert response.status_code == 200


# =============================================================================
# TESTES DE TRAINING PLANS
# =============================================================================

class TestTrainingPlans:
    """Testes de Planos de Formação"""
    
    def test_list_plans_unauthorized(self):
        """GET /api/training-plans/ - Sem autenticação"""
        response = client.get("/api/training-plans/")
        assert response.status_code == 401
    
    def test_list_plans(self, admin_token):
        """GET /api/training-plans/ - Com autenticação"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/training-plans/", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_get_plan_not_found(self, admin_token):
        """GET /api/training-plans/{id} - Plano não encontrado"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/training-plans/999999", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 404
    
    def test_list_trainers(self, admin_token):
        """GET /api/training-plans/trainers - Listar formadores"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/training-plans/trainers", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200


# =============================================================================
# TESTES DE CHALLENGES
# =============================================================================

class TestChallenges:
    """Testes de Desafios"""
    
    def test_get_challenge_not_found(self, admin_token):
        """GET /api/challenges/{id} - Desafio não encontrado"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/challenges/999999", headers=auth_headers(admin_token))
        assert response.status_code == 404
    
    def test_course_challenges(self, admin_token):
        """GET /api/challenges/course/{id} - Desafios do curso"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/challenges/course/1", headers=auth_headers(admin_token))
        # Pode ser 200 ou 404 dependendo se o curso existe
        assert response.status_code in [200, 404]


class TestChallengesStudent:
    """Testes de desafios para Student"""
    
    def test_released_challenges(self, student_token):
        """GET /api/challenges/student/released - Desafios liberados"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/challenges/student/released", 
                            headers=auth_headers(student_token))
        assert response.status_code == 200
    
    def test_my_submissions(self, student_token):
        """GET /api/challenges/student/my-submissions - Minhas submissões"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/challenges/student/my-submissions", 
                            headers=auth_headers(student_token))
        assert response.status_code == 200


class TestChallengesPendingReview:
    """Testes de revisão de desafios"""
    
    def test_pending_review_list(self, trainer_token):
        """GET /api/challenges/pending-review/list - Lista de pendentes"""
        if not trainer_token:
            pytest.skip("Trainer token não disponível")
        response = client.get("/api/challenges/pending-review/list", 
                            headers=auth_headers(trainer_token))
        assert response.status_code == 200


# =============================================================================
# TESTES DE LESSONS
# =============================================================================

class TestLessons:
    """Testes de Lições"""
    
    def test_my_lessons(self, student_token):
        """GET /api/lessons/student/my-lessons - Minhas lições"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/lessons/student/my-lessons", 
                            headers=auth_headers(student_token))
        assert response.status_code == 200
    
    def test_lesson_detail_not_found(self, student_token):
        """GET /api/lessons/{id}/detail - Lição não encontrada"""
        if not student_token:
            pytest.skip("Student token não disponível")
        response = client.get("/api/lessons/999999/detail", 
                            headers=auth_headers(student_token))
        assert response.status_code == 404


# =============================================================================
# TESTES DE CERTIFICATES
# =============================================================================

class TestCertificates:
    """Testes de Certificados"""
    
    def test_list_certificates(self, admin_token):
        """GET /api/certificates/ - Listar certificados"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/certificates/", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_get_certificate_not_found(self, admin_token):
        """GET /api/certificates/{id} - Certificado não encontrado"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/certificates/999999", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 404


# =============================================================================
# TESTES DE STATS
# =============================================================================

class TestStats:
    """Testes de Estatísticas"""
    
    def test_kpis(self, admin_token):
        """GET /api/stats/kpis - KPIs gerais"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/stats/kpis", headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_featured_courses(self, admin_token):
        """GET /api/stats/courses/featured - Cursos em destaque"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/stats/courses/featured", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200
    
    def test_featured_training_plans(self, admin_token):
        """GET /api/stats/training-plans/featured - Planos em destaque"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/stats/training-plans/featured", 
                            headers=auth_headers(admin_token))
        assert response.status_code == 200


# =============================================================================
# TESTES DE FINALIZATION
# =============================================================================

class TestFinalization:
    """Testes de Finalização"""
    
    def test_plan_status_not_found(self, admin_token):
        """GET /api/finalization/plan/{id}/status - Plano não encontrado"""
        if not admin_token:
            pytest.skip("Admin token não disponível")
        response = client.get("/api/finalization/plan/999999/status", 
                            headers=auth_headers(admin_token))
        assert response.status_code in [404, 200]  # Pode retornar vazio


# =============================================================================
# TESTES DE DOCUMENTAÇÃO
# =============================================================================

class TestDocs:
    """Testes de documentação"""
    
    def test_swagger_docs(self):
        """GET /docs - Swagger UI"""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_redoc(self):
        """GET /redoc - ReDoc"""
        response = client.get("/redoc")
        assert response.status_code == 200
    
    def test_openapi(self):
        """GET /openapi.json - OpenAPI Schema"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        assert "paths" in response.json()


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
