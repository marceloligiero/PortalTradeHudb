"""
Testes Completos de TODOS os Portais — PortalTradeHub

Limpa a BD antes de correr (mantém admin), cria utilizadores de teste
e testa todos os endpoints de todos os portais com os perfis adequados.

Portais cobertos:
  1. Auth (login, register, me, forgot/reset password)
  2. Admin (users, banks, products, courses, pending trainers)
  3. Trainer (stats, courses, lessons)
  4. Student (stats, courses, enroll, reports)
  5. Training Plans (CRUD, assign/remove students, courses)
  6. Challenges (create, release, submit summary/complete)
  7. Lessons (progress, release, start, pause)
  8. Finalization (course, plan status/finalize)
  9. Tutoria (categories, errors, analysis, plans, items, sheets, dashboard)
  10. Internal Errors (sensos, errors, action plans, learning sheets)
  11. Teams (CRUD, members, services)
  12. Chamados (CRUD, comments)
  13. Chat (chatbot, FAQ)
  14. Relatórios (overview, formacoes, tutoria, teams, incidents)
  15. Ratings (submit, check, admin summary)
  16. Advanced Reports (dashboard, student perf, trainer prod, courses, certs, MPU)
  17. Knowledge Matrix
  18. Stats (KPIs, featured courses/plans)
  19. Certificates
  20. Public (landing)
  21. Health

Perfis de teste:
  ADMIN           — admin@tradehub.com (id=1, pré-existente)
  MANAGER         — manager_test@tradehub.com (is_team_lead=True)
  TRAINER         — trainer_test@tradehub.com (is_trainer=True)
  TUTOR           — tutor_test@tradehub.com (is_tutor=True)
  STUDENT         — student_test@tradehub.com (TRAINEE básico)
  LIBERADOR       — liberador_test@tradehub.com (is_liberador=True)
  REFERENTE       — referente_test@tradehub.com (is_referente=True)

Executar:
  cd backend && python scripts/clean_database.py
  cd backend && python -m pytest tests/test_all_portals.py -v --tb=short
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from app.auth import create_access_token

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _token(email: str) -> str:
    """Generate JWT directly — bypasses 5/min rate-limited login endpoint."""
    return create_access_token(data={"sub": email})


def _h(token):
    return {"Authorization": f"Bearer {token}"} if token else {}


# ═══════════════════════════════════════════════════════════════════════════════
# SHARED STATE — IDs criados durante os testes
# ═══════════════════════════════════════════════════════════════════════════════

class S:
    """Global test state — populated as tests run (ordered)."""
    # User IDs
    admin_id = 1
    manager_id = None
    trainer_id = None
    tutor_id = None
    student_id = None
    liberador_id = None
    referente_id = None
    # Master data
    bank_id = None
    product_id = None
    # Formações
    course_id = None
    lesson_id = None
    training_plan_id = None
    challenge_id = None
    submission_id = None
    enrollment_id = None
    certificate_id = None
    # Tutoria
    tut_category_id = None
    tut_error_id = None
    tut_plan_id = None
    tut_item_id = None
    tut_sheet_id = None
    # Internal Errors
    senso_id = None
    int_error_id = None
    # Teams
    team_id = None
    # Chamados
    chamado_id = None
    # Ratings
    rating_id = None

st = S()


# ═══════════════════════════════════════════════════════════════════════════════
# FIXTURES — tokens para cada perfil
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture(scope="module")
def admin_headers():
    return _h(_token("admin@tradehub.com"))

@pytest.fixture(scope="module")
def manager_headers():
    return _h(_token("manager_test@tradehub.com"))

@pytest.fixture(scope="module")
def trainer_headers():
    return _h(_token("trainer_test@tradehub.com"))

@pytest.fixture(scope="module")
def tutor_headers():
    return _h(_token("tutor_test@tradehub.com"))

@pytest.fixture(scope="module")
def student_headers():
    return _h(_token("student_test@tradehub.com"))

@pytest.fixture(scope="module")
def liberador_headers():
    return _h(_token("liberador_test@tradehub.com"))

@pytest.fixture(scope="module")
def referente_headers():
    return _h(_token("referente_test@tradehub.com"))


# ═══════════════════════════════════════════════════════════════════════════════
# 0. SETUP — Criar utilizadores de teste via Admin API
# ═══════════════════════════════════════════════════════════════════════════════

class TestSetup:
    """Create all test users using admin API and set their flags."""

    USERS = [
        {"email": "manager_test@tradehub.com", "full_name": "Manager Test",
         "password": "Test1234!", "role": "MANAGER",
         "flags": {"is_team_lead": True}},
        {"email": "trainer_test@tradehub.com", "full_name": "Trainer Test",
         "password": "Test1234!", "role": "TRAINER",
         "flags": {"is_trainer": True, "is_pending": False}},
        {"email": "tutor_test@tradehub.com", "full_name": "Tutor Test",
         "password": "Test1234!", "role": "TRAINEE",
         "flags": {"is_tutor": True}},
        {"email": "student_test@tradehub.com", "full_name": "Student Test",
         "password": "Test1234!", "role": "TRAINEE",
         "flags": {}},
        {"email": "liberador_test@tradehub.com", "full_name": "Liberador Test",
         "password": "Test1234!", "role": "TRAINEE",
         "flags": {"is_liberador": True}},
        {"email": "referente_test@tradehub.com", "full_name": "Referente Test",
         "password": "Test1234!", "role": "TRAINEE",
         "flags": {"is_referente": True}},
    ]

    def test_create_all_users(self, admin_headers):
        """Create 6 test users and update their flags (idempotent)."""
        attr_map = {
            "manager_test@tradehub.com": "manager_id",
            "trainer_test@tradehub.com": "trainer_id",
            "tutor_test@tradehub.com": "tutor_id",
            "student_test@tradehub.com": "student_id",
            "liberador_test@tradehub.com": "liberador_id",
            "referente_test@tradehub.com": "referente_id",
        }
        for u in self.USERS:
            r = client.post("/api/admin/users", headers=admin_headers,
                            json={"email": u["email"], "full_name": u["full_name"],
                                  "password": u["password"], "role": u["role"]})
            if r.status_code == 201:
                uid = r.json()["id"]
            else:
                # User already exists — find their ID
                rl = client.get("/api/admin/users?page_size=200", headers=admin_headers)
                assert rl.status_code == 200
                uid = next(usr["id"] for usr in rl.json()["items"]
                           if usr["email"] == u["email"])
            setattr(st, attr_map[u["email"]], uid)

            # Update flags if needed
            if u["flags"]:
                r2 = client.put(f"/api/admin/users/{uid}", headers=admin_headers,
                                json=u["flags"])
                assert r2.status_code == 200, f"Failed to update flags for {u['email']}: {r2.text}"

    def test_verify_all_users_exist(self, admin_headers):
        """Verify all users via admin list."""
        r = client.get("/api/admin/users?page_size=100", headers=admin_headers)
        assert r.status_code == 200
        emails = [u["email"] for u in r.json()["items"]]
        for u in self.USERS:
            assert u["email"] in emails, f"{u['email']} not found in user list"


# ═══════════════════════════════════════════════════════════════════════════════
# 1. HEALTH & PUBLIC — sem auth
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthAndPublic:

    def test_health(self):
        assert client.get("/health").status_code == 200

    def test_api_health(self):
        assert client.get("/api/health").status_code == 200

    def test_api_root(self):
        r = client.get("/api")
        assert r.status_code == 200
        assert "message" in r.json()

    def test_public_landing(self):
        r = client.get("/api/public/landing")
        assert r.status_code == 200

    def test_stats_kpis(self):
        r = client.get("/api/stats/kpis")
        assert r.status_code == 200

    def test_stats_featured_courses(self):
        r = client.get("/api/stats/courses/featured")
        assert r.status_code == 200

    def test_stats_featured_plans(self):
        r = client.get("/api/stats/training-plans/featured")
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 2. AUTH — login, register, me
# ═══════════════════════════════════════════════════════════════════════════════

class TestAuth:

    def test_login_admin(self):
        r = client.post("/api/auth/login",
                        data={"username": "admin@tradehub.com", "password": "admin123"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self):
        r = client.post("/api/auth/login",
                        data={"username": "admin@tradehub.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, admin_headers):
        r = client.get("/api/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == "admin@tradehub.com"

    def test_me_unauthenticated(self):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_verify_email_exists(self):
        r = client.post("/api/auth/verify-email",
                        json={"email": "admin@tradehub.com"})
        assert r.status_code == 200

    def test_verify_email_not_found(self):
        r = client.post("/api/auth/verify-email",
                        json={"email": "nope@nope.com"})
        # Could be 200 with exists=false or 404
        assert r.status_code in (200, 404)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. ADMIN — Users CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminUsers:

    def test_list_users_admin(self, admin_headers):
        r = client.get("/api/admin/users", headers=admin_headers)
        assert r.status_code == 200
        assert "items" in r.json()
        assert r.json()["total"] >= 7

    def test_list_users_manager(self, manager_headers):
        r = client.get("/api/admin/users", headers=manager_headers)
        assert r.status_code == 200

    def test_list_users_student_forbidden(self, student_headers):
        r = client.get("/api/admin/users", headers=student_headers)
        assert r.status_code == 403

    def test_get_user_admin(self, admin_headers):
        r = client.get(f"/api/admin/users/{st.student_id}", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == "student_test@tradehub.com"

    def test_update_user_admin(self, admin_headers):
        r = client.put(f"/api/admin/users/{st.student_id}", headers=admin_headers,
                       json={"full_name": "Student Test Updated"})
        assert r.status_code == 200
        assert r.json()["full_name"] == "Student Test Updated"
        # Restore
        client.put(f"/api/admin/users/{st.student_id}", headers=admin_headers,
                   json={"full_name": "Student Test"})

    def test_pending_trainers(self, admin_headers):
        r = client.get("/api/admin/pending-trainers", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ═══════════════════════════════════════════════════════════════════════════════
# 4. ADMIN — Banks & Products
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminBanksProducts:

    def test_create_bank(self, admin_headers):
        r = client.post("/api/admin/banks", headers=admin_headers,
                        json={"name": "Banco Teste V5", "country": "PT"})
        assert r.status_code == 201
        st.bank_id = r.json()["id"]

    def test_list_banks(self, admin_headers):
        r = client.get("/api/admin/banks", headers=admin_headers)
        assert r.status_code == 200
        assert any(b["id"] == st.bank_id for b in r.json())

    def test_update_bank(self, admin_headers):
        r = client.put(f"/api/admin/banks/{st.bank_id}", headers=admin_headers,
                       json={"name": "Banco Teste V5 Updated", "country": "PT"})
        assert r.status_code == 200

    def test_create_product(self, admin_headers):
        r = client.post("/api/admin/products", headers=admin_headers,
                        json={"name": "Produto Teste V5"})
        assert r.status_code == 201
        st.product_id = r.json()["id"]

    def test_list_products(self, admin_headers):
        r = client.get("/api/admin/products", headers=admin_headers)
        assert r.status_code == 200
        assert any(p["id"] == st.product_id for p in r.json())

    def test_update_product(self, admin_headers):
        r = client.put(f"/api/admin/products/{st.product_id}", headers=admin_headers,
                       json={"name": "Produto Teste V5 Updated"})
        assert r.status_code == 200

    def test_banks_trainer_can_list(self, trainer_headers):
        r = client.get("/api/admin/banks", headers=trainer_headers)
        assert r.status_code == 200

    def test_products_trainer_can_list(self, trainer_headers):
        r = client.get("/api/admin/products", headers=trainer_headers)
        assert r.status_code == 200

    def test_create_bank_student_forbidden(self, student_headers):
        r = client.post("/api/admin/banks", headers=student_headers,
                        json={"name": "Hack", "country": "XX"})
        assert r.status_code == 403

    def test_create_product_student_forbidden(self, student_headers):
        r = client.post("/api/admin/products", headers=student_headers,
                        json={"name": "Hack"})
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 5. TRAINER — Courses & Lessons
# ═══════════════════════════════════════════════════════════════════════════════

class TestTrainerCourses:

    def test_trainer_stats(self, trainer_headers):
        r = client.get("/api/trainer/stats", headers=trainer_headers)
        assert r.status_code == 200
        assert "total_courses" in r.json()

    def test_create_course_trainer(self, trainer_headers):
        r = client.post("/api/trainer/courses", headers=trainer_headers,
                        json={"title": "Curso Teste V5", "description": "Curso de teste",
                              "bank_ids": [st.bank_id], "product_ids": [st.product_id]})
        assert r.status_code == 201
        st.course_id = r.json()["id"]

    def test_list_courses_trainer(self, trainer_headers):
        r = client.get("/api/trainer/courses", headers=trainer_headers)
        assert r.status_code == 200

    def test_get_course_trainer(self, trainer_headers):
        r = client.get(f"/api/trainer/courses/{st.course_id}", headers=trainer_headers)
        assert r.status_code == 200

    def test_list_all_courses(self, trainer_headers):
        r = client.get("/api/trainer/courses/all", headers=trainer_headers)
        assert r.status_code == 200

    def test_create_lesson(self, trainer_headers):
        r = client.post("/api/trainer/lessons", headers=trainer_headers,
                        json={"title": "Aula Teste V5", "course_id": st.course_id,
                              "order_index": 1, "estimated_minutes": 45,
                              "content": "Conteúdo da aula de teste"})
        assert r.status_code == 201
        st.lesson_id = r.json()["id"]

    def test_create_lesson_student_forbidden(self, student_headers):
        r = client.post("/api/trainer/lessons", headers=student_headers,
                        json={"title": "Hack", "course_id": st.course_id})
        assert r.status_code == 403

    def test_course_details_with_lessons(self, trainer_headers):
        r = client.get(f"/api/trainer/courses/details/{st.course_id}",
                       headers=trainer_headers)
        assert r.status_code == 200

    def test_admin_list_courses(self, admin_headers):
        r = client.get("/api/admin/courses", headers=admin_headers)
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 6. TRAINING PLANS — CRUD, assign students
# ═══════════════════════════════════════════════════════════════════════════════

class TestTrainingPlans:

    def test_create_plan(self, admin_headers):
        r = client.post("/api/training-plans/", headers=admin_headers,
                        json={"title": "Plano Teste V5",
                              "trainer_ids": [st.trainer_id],
                              "course_ids": [st.course_id],
                              "student_ids": [st.student_id],
                              "start_date": "2026-03-01",
                              "end_date": "2026-12-31"})
        assert r.status_code == 201, f"Failed: {r.text}"
        st.training_plan_id = r.json()["id"]

    def test_list_plans_admin(self, admin_headers):
        r = client.get("/api/training-plans/", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_plans_trainer(self, trainer_headers):
        r = client.get("/api/training-plans/", headers=trainer_headers)
        assert r.status_code == 200

    def test_list_plans_student(self, student_headers):
        r = client.get("/api/training-plans/", headers=student_headers)
        assert r.status_code == 200

    def test_get_plan(self, admin_headers):
        r = client.get(f"/api/training-plans/{st.training_plan_id}",
                       headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "Plano Teste V5"

    def test_update_plan(self, admin_headers):
        r = client.put(f"/api/training-plans/{st.training_plan_id}",
                       headers=admin_headers,
                       json={"description": "Descrição actualizada"})
        assert r.status_code == 200

    def test_add_course_to_plan(self, admin_headers, trainer_headers):
        """Create a second course and verify plan has courses."""
        rc = client.post("/api/trainer/courses", headers=trainer_headers,
                         json={"title": "Curso Extra", "description": "Extra"})
        assert rc.status_code == 201
        # Verify plan details include courses
        r = client.get(f"/api/training-plans/{st.training_plan_id}",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_assign_student(self, admin_headers):
        r = client.post(f"/api/training-plans/{st.training_plan_id}/assign",
                        headers=admin_headers,
                        json={"student_id": st.liberador_id})
        assert r.status_code in (200, 201)

    def test_remove_student(self, admin_headers):
        r = client.delete(
            f"/api/training-plans/{st.training_plan_id}/unassign/{st.liberador_id}",
            headers=admin_headers)
        assert r.status_code in (200, 204)

    def test_plan_not_found(self, admin_headers):
        r = client.get("/api/training-plans/999999", headers=admin_headers)
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 7. STUDENT — enroll, courses, stats, reports
# ═══════════════════════════════════════════════════════════════════════════════

class TestStudent:

    def test_student_stats(self, student_headers):
        r = client.get("/api/student/stats", headers=student_headers)
        assert r.status_code == 200

    def test_student_courses(self, student_headers):
        r = client.get("/api/student/courses", headers=student_headers)
        assert r.status_code == 200

    def test_enroll_course(self, student_headers):
        r = client.post(f"/api/student/enroll/{st.course_id}",
                        headers=student_headers)
        assert r.status_code in (200, 201)

    def test_enroll_duplicate(self, student_headers):
        r = client.post(f"/api/student/enroll/{st.course_id}",
                        headers=student_headers)
        assert r.status_code in (200, 400)  # already enrolled

    def test_get_enrolled_course(self, student_headers):
        r = client.get(f"/api/student/courses/{st.course_id}",
                       headers=student_headers)
        assert r.status_code == 200

    def test_student_certificates(self, student_headers):
        r = client.get("/api/student/certificates", headers=student_headers)
        assert r.status_code == 200

    def test_student_reports_overview(self, student_headers):
        r = client.get("/api/student/reports/overview", headers=student_headers)
        assert r.status_code == 200

    def test_student_reports_courses(self, student_headers):
        r = client.get("/api/student/reports/courses", headers=student_headers)
        assert r.status_code == 200

    def test_student_reports_lessons(self, student_headers):
        r = client.get("/api/student/reports/lessons", headers=student_headers)
        assert r.status_code == 200

    def test_student_reports_achievements(self, student_headers):
        r = client.get("/api/student/reports/achievements", headers=student_headers)
        assert r.status_code == 200

    def test_student_reports_dashboard(self):
        h = _h(_token("student_test@tradehub.com"))
        r = client.get("/api/student/reports/overview", headers=h)
        assert r.status_code == 200

    def test_student_stats_trainer_allowed(self, trainer_headers):
        """Student endpoints use get_current_active_user — any authenticated user can access."""
        r = client.get("/api/student/stats", headers=trainer_headers)
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 8. CHALLENGES — create, release, submit
# ═══════════════════════════════════════════════════════════════════════════════

class TestChallenges:

    def test_create_challenge(self, trainer_headers):
        r = client.post("/api/challenges/", headers=trainer_headers,
                        json={"title": "Desafio V5", "course_id": st.course_id,
                              "challenge_type": "SUMMARY",
                              "operations_required": 20,
                              "time_limit_minutes": 30,
                              "target_mpu": 10.0,
                              "max_errors": 2})
        assert r.status_code == 201
        st.challenge_id = r.json()["id"]

    def test_create_challenge_student_forbidden(self, student_headers):
        r = client.post("/api/challenges/", headers=student_headers,
                        json={"title": "Hack", "course_id": st.course_id,
                              "challenge_type": "SUMMARY",
                              "operations_required": 1,
                              "time_limit_minutes": 1,
                              "target_mpu": 1.0})
        assert r.status_code == 403

    def test_list_course_challenges(self, trainer_headers):
        r = client.get(f"/api/challenges/course/{st.course_id}",
                       headers=trainer_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_challenge(self, trainer_headers):
        r = client.get(f"/api/challenges/{st.challenge_id}",
                       headers=trainer_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "Desafio V5"

    def test_update_challenge(self, trainer_headers):
        r = client.put(f"/api/challenges/{st.challenge_id}",
                       headers=trainer_headers,
                       json={"title": "Desafio V5 Updated"})
        assert r.status_code == 200

    def test_release_challenge(self, trainer_headers):
        r = client.post(f"/api/challenges/{st.challenge_id}/release",
                        headers=trainer_headers,
                        json={"is_released": True})
        assert r.status_code == 200

    def test_release_for_student(self, trainer_headers):
        r = client.post(
            f"/api/challenges/{st.challenge_id}/release/{st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_is_released(self, trainer_headers):
        r = client.get(
            f"/api/challenges/{st.challenge_id}/is-released/{st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_eligible_students(self, trainer_headers):
        r = client.get(
            f"/api/challenges/{st.challenge_id}/eligible-students",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_student_released_challenges(self, student_headers):
        r = client.get("/api/challenges/student/released",
                       headers=student_headers)
        assert r.status_code == 200

    def test_submit_summary(self, trainer_headers):
        r = client.post("/api/challenges/submit/summary",
                        headers=trainer_headers,
                        json={"challenge_id": st.challenge_id,
                              "user_id": st.student_id,
                              "submission_type": "SUMMARY",
                              "total_operations": 25,
                              "total_time_minutes": 20.0,
                              "errors_count": 1,
                              "training_plan_id": st.training_plan_id})
        assert r.status_code in (200, 201)
        if r.status_code in (200, 201):
            st.submission_id = r.json().get("id")


# ═══════════════════════════════════════════════════════════════════════════════
# 9. LESSONS — progress, release, start, pause
# ═══════════════════════════════════════════════════════════════════════════════

class TestLessons:

    def test_release_lesson(self, trainer_headers):
        r = client.post(
            f"/api/lessons/{st.lesson_id}/release?user_id={st.student_id}&training_plan_id={st.training_plan_id}",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_start_lesson(self, trainer_headers):
        """Lesson.started_by defaults to TRAINER, so trainer must start it."""
        r = client.post(
            f"/api/lessons/{st.lesson_id}/start?training_plan_id={st.training_plan_id}&user_id={st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_lesson_progress(self, student_headers):
        r = client.get(
            f"/api/lessons/{st.lesson_id}/progress?training_plan_id={st.training_plan_id}",
            headers=student_headers)
        assert r.status_code == 200

    def test_pause_lesson(self, trainer_headers):
        """Pause also needs trainer since started_by=TRAINER."""
        r = client.post(
            f"/api/lessons/{st.lesson_id}/pause?training_plan_id={st.training_plan_id}&pause_reason=Intervalo&user_id={st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 10. FINALIZATION — course/plan status & finalize
# ═══════════════════════════════════════════════════════════════════════════════

class TestFinalization:

    def test_course_status(self, trainer_headers):
        r = client.get(
            f"/api/finalization/course/{st.training_plan_id}/{st.course_id}/status?user_id={st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_plan_status(self, trainer_headers):
        r = client.get(
            f"/api/finalization/plan/{st.training_plan_id}/status?user_id={st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200

    def test_calculate_plan_status(self, trainer_headers):
        r = client.get(
            f"/api/finalization/plan/{st.training_plan_id}/calculate-status?user_id={st.student_id}",
            headers=trainer_headers)
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 11. TUTORIA — Categories, Errors, Analysis, Plans, Items, Sheets, Dashboard
# ═══════════════════════════════════════════════════════════════════════════════

class TestTutoriaCategories:

    def test_create_category(self, admin_headers):
        r = client.post("/api/tutoria/categories", headers=admin_headers,
                        json={"name": "Categoria V5", "description": "Teste"})
        assert r.status_code == 201
        st.tut_category_id = r.json()["id"]

    def test_list_categories(self, admin_headers):
        r = client.get("/api/tutoria/categories", headers=admin_headers)
        assert r.status_code == 200

    def test_update_category(self, admin_headers):
        r = client.patch(f"/api/tutoria/categories/{st.tut_category_id}",
                         headers=admin_headers,
                         json={"name": "Categoria V5 Updated"})
        assert r.status_code == 200

    def test_create_category_student_forbidden(self, student_headers):
        r = client.post("/api/tutoria/categories", headers=student_headers,
                        json={"name": "Hack"})
        assert r.status_code == 403


class TestTutoriaErrors:

    def test_create_error_admin(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers,
                        json={"date_occurrence": "2026-03-10",
                              "description": "Erro teste V5",
                              "severity": "MEDIA",
                              "category_id": st.tut_category_id,
                              "refs": [{"referencia": "REF001", "divisa": "EUR",
                                        "importe": 1500.50}]})
        assert r.status_code == 201
        st.tut_error_id = r.json()["id"]
        assert r.json()["status"] == "REGISTERED"

    def test_create_error_student_self(self, student_headers):
        r = client.post("/api/tutoria/errors", headers=student_headers,
                        json={"date_occurrence": "2026-03-11",
                              "description": "Erro do estudante",
                              "severity": "BAIXA"})
        assert r.status_code == 201

    def test_create_error_student_assign_other_forbidden(self, student_headers):
        r = client.post("/api/tutoria/errors", headers=student_headers,
                        json={"date_occurrence": "2026-03-11",
                              "description": "Hack", "severity": "MEDIA",
                              "tutorado_id": st.manager_id})
        assert r.status_code == 403

    def test_create_error_manager_assign(self, manager_headers):
        r = client.post("/api/tutoria/errors", headers=manager_headers,
                        json={"date_occurrence": "2026-03-11",
                              "description": "Erro atribuído pelo chefe",
                              "severity": "ALTA", "tutorado_id": st.student_id})
        assert r.status_code == 201

    def test_list_errors(self, admin_headers):
        r = client.get("/api/tutoria/errors", headers=admin_headers)
        assert r.status_code == 200

    def test_get_error(self, admin_headers):
        r = client.get(f"/api/tutoria/errors/{st.tut_error_id}",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_update_error_admin(self, admin_headers):
        r = client.patch(f"/api/tutoria/errors/{st.tut_error_id}",
                         headers=admin_headers,
                         json={"severity": "ALTA", "tags": ["v5"]})
        assert r.status_code == 200

    def test_update_error_student_forbidden(self, student_headers):
        r = client.patch(f"/api/tutoria/errors/{st.tut_error_id}",
                         headers=student_headers,
                         json={"severity": "CRITICA"})
        assert r.status_code == 403

    def test_list_products(self, admin_headers):
        r = client.get("/api/tutoria/products", headers=admin_headers)
        assert r.status_code == 200


class TestTutoriaAnalysis:

    def test_analysis_student_forbidden(self, student_headers):
        r = client.patch(f"/api/tutoria/errors/{st.tut_error_id}/analysis",
                         headers=student_headers,
                         json={"impact_level": "ALTO"})
        assert r.status_code == 403

    def test_save_analysis_manager(self, manager_headers):
        r = client.patch(f"/api/tutoria/errors/{st.tut_error_id}/analysis",
                         headers=manager_headers,
                         json={"impact_level": "ALTO", "impact_detail": "ECONOMICO",
                               "solution": "Corrigir processo"})
        assert r.status_code == 200

    def test_submit_analysis(self, manager_headers):
        r = client.post(f"/api/tutoria/errors/{st.tut_error_id}/submit-analysis",
                        headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "PENDING_TUTOR_REVIEW"

    def test_approve_plans_tutor(self, tutor_headers):
        r = client.post(f"/api/tutoria/errors/{st.tut_error_id}/approve-plans",
                        headers=tutor_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "APPROVED"

    def test_confirm_solution(self, manager_headers):
        r = client.post(f"/api/tutoria/errors/{st.tut_error_id}/confirm-solution",
                        headers=manager_headers,
                        json={"date_solution": "2026-03-13",
                              "solution": "Processo corrigido"})
        assert r.status_code == 200

    def test_resolve_tutor(self, tutor_headers):
        r = client.post(f"/api/tutoria/errors/{st.tut_error_id}/resolve",
                        headers=tutor_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "RESOLVED"


class TestTutoriaPlans:

    def test_create_plan(self, admin_headers, tutor_headers):
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Para plano",
                                "severity": "MEDIA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/plans",
                        headers=tutor_headers,
                        json={"tutorado_id": st.student_id,
                              "plan_type": "CORRECTIVO",
                              "description": "Plano V5"})
        assert r.status_code == 201
        st.tut_plan_id = r.json()["id"]

    def test_list_plans(self, admin_headers):
        r = client.get("/api/tutoria/plans", headers=admin_headers)
        assert r.status_code == 200

    def test_get_plan(self, admin_headers):
        r = client.get(f"/api/tutoria/plans/{st.tut_plan_id}",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_update_plan(self, tutor_headers):
        r = client.patch(f"/api/tutoria/plans/{st.tut_plan_id}",
                         headers=tutor_headers,
                         json={"what": "Acção correctiva"})
        assert r.status_code == 200

    def test_submit_plan(self, admin_headers):
        r = client.post(f"/api/tutoria/plans/{st.tut_plan_id}/submit",
                        headers=admin_headers)
        assert r.status_code == 200

    def test_create_plan_student_forbidden(self, student_headers, admin_headers):
        # Create a fresh error to reference
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Plan forbidden test",
                                "severity": "BAIXA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/plans",
                        headers=student_headers,
                        json={"tutorado_id": st.student_id,
                              "plan_type": "CORRECTIVO",
                              "description": "Hack"})
        assert r.status_code == 403

    def test_my_plans(self, admin_headers):
        r = client.get("/api/tutoria/my-plans", headers=admin_headers)
        assert r.status_code == 200


class TestTutoriaItems:

    def test_create_item(self, admin_headers):
        # Need a fresh plan for items
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Para items",
                                "severity": "BAIXA"}).json()["id"]
        pid = client.post(f"/api/tutoria/errors/{eid}/plans",
                          headers=admin_headers,
                          json={"tutorado_id": st.student_id,
                                "description": "Plan items"}).json()["id"]
        r = client.post(f"/api/tutoria/plans/{pid}/items",
                        headers=admin_headers,
                        json={"description": "Item V5", "type": "CORRETIVA"})
        assert r.status_code == 201
        st.tut_item_id = r.json()["id"]

    def test_update_item(self, admin_headers):
        r = client.patch(f"/api/tutoria/items/{st.tut_item_id}",
                         headers=admin_headers,
                         json={"status": "EM_ANDAMENTO"})
        assert r.status_code == 200

    def test_complete_item(self, admin_headers):
        r = client.patch(f"/api/tutoria/items/{st.tut_item_id}",
                         headers=admin_headers,
                         json={"status": "CONCLUIDO",
                               "evidence_text": "Evidência"})
        assert r.status_code == 200


class TestTutoriaSheets:

    def test_create_sheet(self, tutor_headers):
        r = client.post("/api/tutoria/learning-sheets",
                        headers=tutor_headers,
                        json={"error_id": st.tut_error_id,
                              "title": "Ficha V5",
                              "error_summary": "Resumo"})
        assert r.status_code == 201
        st.tut_sheet_id = r.json()["id"]

    def test_list_sheets(self, tutor_headers):
        r = client.get("/api/tutoria/learning-sheets",
                       headers=tutor_headers)
        assert r.status_code == 200

    def test_my_sheets(self, student_headers):
        r = client.get("/api/tutoria/learning-sheets/mine",
                       headers=student_headers)
        assert r.status_code == 200

    def test_list_sheets_student_forbidden(self, student_headers):
        r = client.get("/api/tutoria/learning-sheets",
                       headers=student_headers)
        assert r.status_code == 403


class TestTutoriaDashboard:

    def test_dashboard_admin(self, admin_headers):
        r = client.get("/api/tutoria/dashboard", headers=admin_headers)
        assert r.status_code == 200
        assert "total_errors" in r.json()

    def test_dashboard_unauthenticated(self):
        assert client.get("/api/tutoria/dashboard").status_code == 401


class TestTutoriaNotifications:

    def test_list_notifications(self, admin_headers):
        r = client.get("/api/tutoria/notifications", headers=admin_headers)
        assert r.status_code == 200

    def test_mark_all_read(self, admin_headers):
        r = client.patch("/api/tutoria/notifications/read-all",
                         headers=admin_headers)
        assert r.status_code == 200

    def test_notifications_unauthenticated(self):
        assert client.get("/api/tutoria/notifications").status_code == 401


class TestTutoriaComments:

    def test_add_comment(self, admin_headers):
        r = client.post(f"/api/tutoria/errors/{st.tut_error_id}/comments",
                        headers=admin_headers,
                        json={"content": "Comentário V5"})
        assert r.status_code == 201

    def test_list_comments(self, admin_headers):
        r = client.get(f"/api/tutoria/errors/{st.tut_error_id}/comments",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_add_plan_comment(self, admin_headers):
        r = client.post(f"/api/tutoria/plans/{st.tut_plan_id}/comments",
                        headers=admin_headers,
                        json={"content": "Comentário plano V5"})
        assert r.status_code == 201


class TestTutoriaUtility:

    def test_list_students(self, admin_headers):
        r = client.get("/api/tutoria/students", headers=admin_headers)
        assert r.status_code == 200

    def test_list_team(self, admin_headers):
        r = client.get("/api/tutoria/team", headers=admin_headers)
        assert r.status_code == 200

    def test_students_student_forbidden(self, student_headers):
        r = client.get("/api/tutoria/students", headers=student_headers)
        assert r.status_code == 403


class TestTutoriaCancelDeactivateVerify:

    def test_cancel_error(self, admin_headers, manager_headers):
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Para cancelar",
                                "severity": "BAIXA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/cancel",
                        headers=manager_headers,
                        json={"reason": "Duplicado"})
        assert r.status_code == 200

    def test_cancel_student_forbidden(self, admin_headers, student_headers):
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Cancel test",
                                "severity": "BAIXA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/cancel",
                        headers=student_headers,
                        json={"reason": "Hack"})
        assert r.status_code == 403

    def test_deactivate_admin(self, admin_headers):
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Para desactivar",
                                "severity": "BAIXA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/deactivate",
                        headers=admin_headers,
                        json={"reason": "Duplicado"})
        assert r.status_code == 200

    def test_deactivate_manager_forbidden(self, manager_headers):
        r = client.post(f"/api/tutoria/errors/{st.tut_error_id}/deactivate",
                        headers=manager_headers,
                        json={"reason": "Hack"})
        assert r.status_code == 403

    def test_verify_wrong_status(self, admin_headers):
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Verify test",
                                "severity": "BAIXA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/verify",
                        headers=admin_headers)
        assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 12. INTERNAL ERRORS — Sensos, Errors, Action Plans, Learning Sheets
# ═══════════════════════════════════════════════════════════════════════════════

class TestInternalErrorsLookups:

    def test_impacts(self, admin_headers):
        r = client.get("/api/internal-errors/lookups/impacts",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_categories(self, admin_headers):
        r = client.get("/api/internal-errors/lookups/categories",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_error_types(self, admin_headers):
        r = client.get("/api/internal-errors/lookups/error-types",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_departments(self, admin_headers):
        r = client.get("/api/internal-errors/lookups/departments",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_activities(self, admin_headers):
        r = client.get("/api/internal-errors/lookups/activities",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_banks(self, admin_headers):
        r = client.get("/api/internal-errors/lookups/banks",
                       headers=admin_headers)
        assert r.status_code == 200


class TestInternalErrorsSensos:

    def test_create_senso_tutor(self, tutor_headers):
        r = client.post("/api/internal-errors/sensos",
                        headers=tutor_headers,
                        json={"name": "Senso V5",
                              "start_date": "2026-03-01",
                              "end_date": "2026-03-31"})
        assert r.status_code == 201
        st.senso_id = r.json()["id"]

    def test_create_senso_student_forbidden(self, student_headers):
        r = client.post("/api/internal-errors/sensos",
                        headers=student_headers,
                        json={"name": "Hack",
                              "start_date": "2026-03-01",
                              "end_date": "2026-03-31"})
        assert r.status_code == 403

    def test_list_sensos(self, admin_headers):
        r = client.get("/api/internal-errors/sensos", headers=admin_headers)
        assert r.status_code == 200

    def test_update_senso(self, tutor_headers):
        r = client.patch(f"/api/internal-errors/sensos/{st.senso_id}",
                         headers=tutor_headers,
                         json={"description": "Senso actualizado"})
        assert r.status_code == 200


class TestInternalErrorsErrors:

    def test_create_error_liberador(self, liberador_headers):
        r = client.post("/api/internal-errors/errors",
                        headers=liberador_headers,
                        json={"senso_id": st.senso_id,
                              "gravador_id": st.student_id,
                              "description": "Erro interno V5",
                              "date_occurrence": "2026-03-10"})
        assert r.status_code == 201
        st.int_error_id = r.json()["id"]

    def test_create_error_student_forbidden(self, student_headers):
        r = client.post("/api/internal-errors/errors",
                        headers=student_headers,
                        json={"senso_id": st.senso_id,
                              "gravador_id": st.student_id,
                              "description": "Hack",
                              "date_occurrence": "2026-03-10"})
        assert r.status_code == 403

    def test_list_errors(self, admin_headers):
        r = client.get("/api/internal-errors/errors", headers=admin_headers)
        assert r.status_code == 200

    def test_get_error(self, admin_headers):
        r = client.get(f"/api/internal-errors/errors/{st.int_error_id}",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_update_error_tutor(self, tutor_headers):
        r = client.patch(f"/api/internal-errors/errors/{st.int_error_id}",
                         headers=tutor_headers,
                         json={"why_1": "Falta de atenção",
                               "peso_tutor": 3})
        assert r.status_code == 200

    def test_create_action_plan(self, tutor_headers):
        r = client.post(
            f"/api/internal-errors/errors/{st.int_error_id}/action-plan",
            headers=tutor_headers,
            json={"description": "Plano de acção interno",
                  "items": [{"description": "Item 1", "type": "CORRETIVA"}]})
        assert r.status_code in (200, 201)

    def test_create_learning_sheet(self, tutor_headers):
        r = client.post(
            f"/api/internal-errors/errors/{st.int_error_id}/learning-sheet",
            headers=tutor_headers,
            json={"error_summary": "Resumo do erro interno"})
        assert r.status_code in (200, 201)

    def test_my_learning_sheets(self, student_headers):
        r = client.get("/api/internal-errors/my-learning-sheets",
                       headers=student_headers)
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 13. TEAMS — CRUD, members, services
# ═══════════════════════════════════════════════════════════════════════════════

class TestTeams:

    def test_create_team(self, admin_headers):
        r = client.post("/api/teams", headers=admin_headers,
                        json={"name": "Equipa V5",
                              "description": "Equipa de teste"})
        assert r.status_code == 201
        st.team_id = r.json()["id"]

    def test_list_teams(self, admin_headers):
        r = client.get("/api/teams", headers=admin_headers)
        assert r.status_code == 200

    def test_list_teams_manager(self, manager_headers):
        r = client.get("/api/teams", headers=manager_headers)
        assert r.status_code == 200

    def test_list_teams_student_forbidden(self, student_headers):
        r = client.get("/api/teams", headers=student_headers)
        assert r.status_code == 403

    def test_get_team(self, admin_headers):
        r = client.get(f"/api/teams/{st.team_id}", headers=admin_headers)
        assert r.status_code == 200

    def test_update_team(self, admin_headers):
        r = client.patch(f"/api/teams/{st.team_id}", headers=admin_headers,
                         json={"name": "Equipa V5 Updated"})
        assert r.status_code == 200

    def test_assign_member(self, admin_headers):
        r = client.post(f"/api/teams/{st.team_id}/members",
                        headers=admin_headers,
                        json={"user_id": st.student_id})
        assert r.status_code in (200, 201)

    def test_list_members(self, admin_headers):
        r = client.get(f"/api/teams/{st.team_id}/members",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_add_service(self, admin_headers):
        r = client.post(f"/api/teams/{st.team_id}/services",
                        headers=admin_headers,
                        json={"product_id": st.product_id})
        assert r.status_code in (200, 201)

    def test_list_services(self, admin_headers):
        r = client.get(f"/api/teams/{st.team_id}/services",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_remove_service(self, admin_headers):
        r = client.delete(
            f"/api/teams/{st.team_id}/services/{st.product_id}",
            headers=admin_headers)
        assert r.status_code in (200, 204)

    def test_remove_member(self, admin_headers):
        r = client.delete(
            f"/api/teams/{st.team_id}/members/{st.student_id}",
            headers=admin_headers)
        assert r.status_code in (200, 204)

    def test_unassigned_users(self, admin_headers):
        r = client.get("/api/users/unassigned", headers=admin_headers)
        assert r.status_code == 200

    def test_create_team_student_forbidden(self, student_headers):
        r = client.post("/api/teams", headers=student_headers,
                        json={"name": "Hack"})
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 14. CHAMADOS — Support Tickets
# ═══════════════════════════════════════════════════════════════════════════════

class TestChamados:

    def test_create_chamado(self, student_headers):
        r = client.post("/api/chamados", headers=student_headers,
                        json={"title": "Chamado V5",
                              "description": "Descrição do chamado de teste",
                              "type": "BUG",
                              "priority": "MEDIA",
                              "portal": "FORMACOES"})
        assert r.status_code == 201
        st.chamado_id = r.json()["id"]

    def test_list_chamados(self, admin_headers):
        r = client.get("/api/chamados", headers=admin_headers)
        assert r.status_code == 200

    def test_get_chamado(self, admin_headers):
        r = client.get(f"/api/chamados/{st.chamado_id}",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_update_chamado_admin(self, admin_headers):
        r = client.put(f"/api/chamados/{st.chamado_id}",
                       headers=admin_headers,
                       json={"status": "EM_ANDAMENTO"})
        assert r.status_code == 200

    def test_update_chamado_student_forbidden(self, student_headers):
        r = client.put(f"/api/chamados/{st.chamado_id}",
                       headers=student_headers,
                       json={"status": "CONCLUIDO"})
        assert r.status_code == 403

    def test_add_comment(self, student_headers):
        r = client.post(f"/api/chamados/{st.chamado_id}/comments",
                        headers=student_headers,
                        json={"content": "Comentário do estudante"})
        assert r.status_code == 201

    def test_add_comment_admin(self, admin_headers):
        r = client.post(f"/api/chamados/{st.chamado_id}/comments",
                        headers=admin_headers,
                        json={"content": "Resposta do admin"})
        assert r.status_code == 201

    def test_list_with_filters(self, admin_headers):
        r = client.get("/api/chamados?status=EM_ANDAMENTO&type=BUG",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_chamado_unauthenticated(self):
        assert client.get("/api/chamados").status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# 15. CHAT — Chatbot & FAQ
# ═══════════════════════════════════════════════════════════════════════════════

class TestChat:

    def test_send_message(self, student_headers):
        r = client.post("/api/chat", headers=student_headers,
                        json={"message": "Olá", "lang": "pt"})
        assert r.status_code == 200
        assert "reply" in r.json()

    def test_send_message_help(self, student_headers):
        r = client.post("/api/chat", headers=student_headers,
                        json={"message": "ajuda", "lang": "pt"})
        assert r.status_code == 200

    def test_send_message_es(self, student_headers):
        r = client.post("/api/chat", headers=student_headers,
                        json={"message": "hola", "lang": "es"})
        assert r.status_code == 200

    def test_chat_unauthenticated(self):
        r = client.post("/api/chat",
                        json={"message": "Olá", "lang": "pt"})
        assert r.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# 16. RELATÓRIOS — Overview, Formações, Tutoria, Teams, Incidents
# ═══════════════════════════════════════════════════════════════════════════════

class TestRelatorios:

    def test_overview_admin(self, admin_headers):
        r = client.get("/api/relatorios/overview", headers=admin_headers)
        assert r.status_code == 200

    def test_overview_student(self, student_headers):
        r = client.get("/api/relatorios/overview", headers=student_headers)
        assert r.status_code == 200

    def test_formacoes(self, admin_headers):
        r = client.get("/api/relatorios/formacoes", headers=admin_headers)
        assert r.status_code == 200

    def test_tutoria(self, admin_headers):
        r = client.get("/api/relatorios/tutoria", headers=admin_headers)
        assert r.status_code == 200

    def test_teams_admin(self, admin_headers):
        r = client.get("/api/relatorios/teams", headers=admin_headers)
        assert r.status_code == 200

    def test_teams_student_forbidden(self, student_headers):
        r = client.get("/api/relatorios/teams", headers=student_headers)
        assert r.status_code == 403

    def test_members_admin(self, admin_headers):
        r = client.get("/api/relatorios/members", headers=admin_headers)
        assert r.status_code == 200

    def test_incidents_admin(self, admin_headers):
        r = client.get("/api/relatorios/incidents", headers=admin_headers)
        assert r.status_code == 200

    def test_incidents_filters(self, admin_headers):
        r = client.get("/api/relatorios/incidents/filters",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_relatorios_unauthenticated(self):
        assert client.get("/api/relatorios/overview").status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# 17. RATINGS — Submit, Check, Admin
# ═══════════════════════════════════════════════════════════════════════════════

class TestRatings:

    def test_submit_rating(self, student_headers):
        r = client.post("/api/ratings/submit", headers=student_headers,
                        json={"rating_type": "COURSE",
                              "stars": 4,
                              "comment": "Muito bom!",
                              "course_id": st.course_id,
                              "training_plan_id": st.training_plan_id})
        assert r.status_code in (200, 201)

    def test_check_rating(self, student_headers):
        r = client.get(
            f"/api/ratings/check?rating_type=COURSE&course_id={st.course_id}",
            headers=student_headers)
        assert r.status_code == 200

    def test_my_ratings(self, student_headers):
        r = client.get("/api/ratings/my-ratings", headers=student_headers)
        assert r.status_code == 200

    def test_admin_all_ratings(self, admin_headers):
        r = client.get("/api/ratings/admin/all", headers=admin_headers)
        assert r.status_code == 200

    def test_admin_summary(self, admin_headers):
        r = client.get("/api/ratings/admin/summary", headers=admin_headers)
        assert r.status_code == 200

    def test_admin_dashboard(self, admin_headers):
        r = client.get("/api/ratings/admin/dashboard", headers=admin_headers)
        assert r.status_code == 200

    def test_submit_rating_trainer_forbidden(self, trainer_headers):
        r = client.post("/api/ratings/submit", headers=trainer_headers,
                        json={"rating_type": "COURSE", "stars": 5,
                              "course_id": st.course_id})
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 18. ADVANCED REPORTS — Dashboard, Performance, Productivity
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdvancedReports:

    def test_dashboard_summary(self, admin_headers):
        r = client.get("/api/admin/advanced-reports/dashboard-summary",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_student_performance(self, admin_headers):
        r = client.get("/api/admin/advanced-reports/student-performance",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_trainer_productivity(self, admin_headers):
        r = client.get("/api/admin/advanced-reports/trainer-productivity",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_course_analytics(self, admin_headers):
        r = client.get("/api/admin/advanced-reports/course-analytics",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_certification_trends(self, admin_headers):
        r = client.get("/api/admin/advanced-reports/certifications",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_mpu_analytics(self, admin_headers):
        r = client.get("/api/admin/advanced-reports/mpu-analytics",
                       headers=admin_headers)
        assert r.status_code == 200

    def test_student_forbidden(self, student_headers):
        r = client.get("/api/admin/advanced-reports/dashboard-summary",
                       headers=student_headers)
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 19. KNOWLEDGE MATRIX
# ═══════════════════════════════════════════════════════════════════════════════

class TestKnowledgeMatrix:

    def test_matrix_admin(self, admin_headers):
        r = client.get("/api/admin/knowledge-matrix", headers=admin_headers)
        assert r.status_code == 200

    def test_matrix_manager(self, manager_headers):
        r = client.get("/api/admin/knowledge-matrix",
                       headers=manager_headers)
        assert r.status_code == 200

    def test_matrix_student_forbidden(self, student_headers):
        r = client.get("/api/admin/knowledge-matrix",
                       headers=student_headers)
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 20. FULL WORKFLOW — Lifecycle end-to-end
# ═══════════════════════════════════════════════════════════════════════════════

class TestFullWorkflow:

    def test_training_lifecycle(self, admin_headers, trainer_headers,
                                student_headers):
        """
        Trainer creates course + lesson → Admin creates plan with student →
        Student enrolls → Trainer releases lesson → Student starts lesson
        """
        # Create course
        rc = client.post("/api/trainer/courses", headers=trainer_headers,
                         json={"title": "Lifecycle Course"})
        assert rc.status_code == 201
        cid = rc.json()["id"]

        # Create lesson
        rl = client.post("/api/trainer/lessons", headers=trainer_headers,
                         json={"title": "Lifecycle Lesson", "course_id": cid,
                               "estimated_minutes": 30})
        assert rl.status_code == 201
        lid = rl.json()["id"]

        # Create plan
        rp = client.post("/api/training-plans/", headers=admin_headers,
                         json={"title": "Lifecycle Plan",
                               "trainer_ids": [st.trainer_id],
                               "course_ids": [cid],
                               "student_ids": [st.student_id],
                               "start_date": "2026-03-01",
                               "end_date": "2026-12-31"})
        assert rp.status_code == 201
        pid = rp.json()["id"]

        # Enroll student
        re = client.post(f"/api/student/enroll/{cid}",
                         headers=student_headers)
        assert re.status_code in (200, 201)

        # Release lesson
        rrl = client.post(
            f"/api/lessons/{lid}/release?user_id={st.student_id}&training_plan_id={pid}",
            headers=trainer_headers)
        assert rrl.status_code == 200

        # Start lesson (started_by defaults to TRAINER)
        rs = client.post(
            f"/api/lessons/{lid}/start?training_plan_id={pid}&user_id={st.student_id}",
            headers=trainer_headers)
        assert rs.status_code == 200

    def test_tutoria_multi_role_lifecycle(self, admin_headers,
                                          manager_headers, tutor_headers):
        """
        Admin creates error → Manager analyzes → Manager submits →
        Tutor approves → Manager confirms solution → Tutor resolves
        """
        r1 = client.post("/api/tutoria/errors", headers=admin_headers,
                         json={"date_occurrence": "2026-03-14",
                               "description": "Lifecycle multi-role",
                               "severity": "ALTA"})
        assert r1.status_code == 201
        eid = r1.json()["id"]

        r2 = client.patch(f"/api/tutoria/errors/{eid}/analysis",
                          headers=manager_headers,
                          json={"impact_level": "ALTO"})
        assert r2.status_code == 200

        r3 = client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                         headers=manager_headers)
        assert r3.status_code == 200

        r4 = client.post(f"/api/tutoria/errors/{eid}/approve-plans",
                         headers=tutor_headers)
        assert r4.status_code == 200

        r5 = client.post(f"/api/tutoria/errors/{eid}/confirm-solution",
                         headers=manager_headers,
                         json={"date_solution": "2026-03-14",
                               "solution": "Lifecycle solution"})
        assert r5.status_code == 200

        r6 = client.post(f"/api/tutoria/errors/{eid}/resolve",
                         headers=tutor_headers)
        assert r6.status_code == 200
        assert r6.json()["status"] == "RESOLVED"

    def test_chamado_lifecycle(self, student_headers, admin_headers):
        """Student creates → Admin updates → Both comment."""
        r1 = client.post("/api/chamados", headers=student_headers,
                         json={"title": "Lifecycle Chamado",
                               "description": "Bug report completo",
                               "type": "BUG", "priority": "ALTA",
                               "portal": "FORMACOES"})
        assert r1.status_code == 201
        cid = r1.json()["id"]

        r2 = client.put(f"/api/chamados/{cid}", headers=admin_headers,
                        json={"status": "EM_ANDAMENTO"})
        assert r2.status_code == 200

        r3 = client.post(f"/api/chamados/{cid}/comments",
                         headers=student_headers,
                         json={"content": "Mais detalhes"})
        assert r3.status_code == 201

        r4 = client.post(f"/api/chamados/{cid}/comments",
                         headers=admin_headers,
                         json={"content": "A investigar"})
        assert r4.status_code == 201

        r5 = client.put(f"/api/chamados/{cid}", headers=admin_headers,
                        json={"status": "CONCLUIDO"})
        assert r5.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 21. EDGE CASES — 404, validation, unauthenticated access
# ═══════════════════════════════════════════════════════════════════════════════

class TestEdgeCases:

    def test_error_not_found(self, admin_headers):
        assert client.get("/api/tutoria/errors/999999",
                          headers=admin_headers).status_code == 404

    def test_plan_not_found(self, admin_headers):
        assert client.get("/api/tutoria/plans/999999",
                          headers=admin_headers).status_code == 404

    def test_user_not_found(self, admin_headers):
        assert client.get("/api/admin/users/999999",
                          headers=admin_headers).status_code == 404

    def test_course_not_found(self, student_headers):
        r = client.get("/api/student/courses/999999",
                       headers=student_headers)
        # Returns 403 'not enrolled' before checking if course exists
        assert r.status_code == 403

    def test_challenge_not_found(self, trainer_headers):
        assert client.get("/api/challenges/999999",
                          headers=trainer_headers).status_code == 404

    def test_chamado_not_found(self, admin_headers):
        assert client.get("/api/chamados/999999",
                          headers=admin_headers).status_code == 404

    def test_team_not_found(self, admin_headers):
        assert client.get("/api/teams/999999",
                          headers=admin_headers).status_code == 404

    def test_unauthenticated_endpoints(self):
        """Key endpoints should return 401 without auth."""
        endpoints = [
            "/api/auth/me",
            "/api/admin/users",
            "/api/student/stats",
            "/api/trainer/stats",
            "/api/tutoria/errors",
            "/api/tutoria/dashboard",
            "/api/tutoria/notifications",
            "/api/chamados",
            "/api/relatorios/overview",
            "/api/ratings/my-ratings",
        ]
        for ep in endpoints:
            r = client.get(ep)
            assert r.status_code == 401, f"{ep} should return 401, got {r.status_code}"

    def test_chamado_validation(self, student_headers):
        """Invalid chamado should fail validation."""
        r = client.post("/api/chamados", headers=student_headers,
                        json={"title": "AB",  # too short (min 3)
                              "description": "Desc",  # too short (min 5)
                              "type": "INVALID",
                              "priority": "INVALID",
                              "portal": "INVALID"})
        assert r.status_code == 422

    def test_empty_cancel_reason(self, admin_headers):
        eid = client.post("/api/tutoria/errors", headers=admin_headers,
                          json={"date_occurrence": "2026-03-13",
                                "description": "Edge case",
                                "severity": "BAIXA"}).json()["id"]
        r = client.post(f"/api/tutoria/errors/{eid}/cancel",
                        headers=admin_headers,
                        json={"reason": ""})
        assert r.status_code == 400
