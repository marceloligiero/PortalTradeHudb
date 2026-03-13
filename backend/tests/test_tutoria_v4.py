"""
Testes Completos do Portal de Tutoria — V4
Cobre todas as operações do ajustes.txt com os seguintes perfis:
  ADMIN, MANAGER(chefe), TRAINER(tutor), REFERENTE, STUDENT(básico)

Endpoints testados:
  Categories CRUD, Products, Errors CRUD, Refs, Analysis,
  Plans CRUD (start/complete), Items, Comments,
  Notifications, Learning Sheets, Dashboard, Utility

Execute: cd backend && pytest tests/test_tutoria_v4.py -v --tb=short
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ═══════════════════════════════════════════════════════════════════════════════
# FIXTURES — login para cada role
# ═══════════════════════════════════════════════════════════════════════════════

def _login(email: str, password: str = "admin123"):
    resp = client.post("/api/auth/login", json={"username": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None

def _h(token):
    """Auth headers helper."""
    return {"Authorization": f"Bearer {token}"} if token else {}


@pytest.fixture(scope="module")
def admin_token():
    return _login("admin@tradehub.com")

@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return _h(admin_token)


# ═══════════════════════════════════════════════════════════════════════════════
# Shared state — stores IDs created during the test session
# ═══════════════════════════════════════════════════════════════════════════════

class State:
    category_id = None
    error_id = None
    plan_id = None
    item_id = None
    comment_id = None
    notif_id = None
    sheet_id = None
    # Users created for role tests
    chefe_id = None
    referente_id = None
    tutor_id = None
    student_id = None
    chefe_token = None
    referente_token = None
    tutor_token = None
    student_token = None

st = State()


# ═══════════════════════════════════════════════════════════════════════════════
# 0. SETUP — Create test users with each role
# ═══════════════════════════════════════════════════════════════════════════════

class TestSetup:
    """Create test users for each profile if they don't exist."""

    def _find_user(self, admin_headers, email):
        users = client.get("/api/admin/users", headers=admin_headers)
        if users.status_code == 200:
            data = users.json()
            items = data.get("items", data) if isinstance(data, dict) else data
            for u in items:
                if u.get("email") == email:
                    return u["id"]
        return None

    def test_admin_login(self, admin_token):
        assert admin_token is not None, "Admin login failed — cannot run tests"

    def test_create_chefe_user(self, admin_headers):
        client.post("/api/auth/register", json={
            "email": "chefe_test@tradehub.com",
            "password": "Test1234!",
            "full_name": "Chefe Teste",
            "role": "MANAGER",
        })
        uid = self._find_user(admin_headers, "chefe_test@tradehub.com")
        if uid:
            st.chefe_id = uid
            client.put(f"/api/admin/users/{uid}", headers=admin_headers,
                       json={"is_active": True, "is_pending": False, "is_team_lead": True})
        st.chefe_token = _login("chefe_test@tradehub.com", "Test1234!")

    def test_create_referente_user(self, admin_headers):
        client.post("/api/auth/register", json={
            "email": "referente_test@tradehub.com",
            "password": "Test1234!",
            "full_name": "Referente Teste",
            "role": "TRAINEE",
        })
        uid = self._find_user(admin_headers, "referente_test@tradehub.com")
        if uid:
            st.referente_id = uid
            client.put(f"/api/admin/users/{uid}", headers=admin_headers,
                       json={"is_active": True, "is_pending": False, "is_referente": True})
        st.referente_token = _login("referente_test@tradehub.com", "Test1234!")

    def test_create_tutor_user(self, admin_headers):
        client.post("/api/auth/register", json={
            "email": "tutor_test@tradehub.com",
            "password": "Test1234!",
            "full_name": "Tutor Teste",
            "role": "TRAINEE",
        })
        uid = self._find_user(admin_headers, "tutor_test@tradehub.com")
        if uid:
            st.tutor_id = uid
            client.put(f"/api/admin/users/{uid}", headers=admin_headers,
                       json={"is_active": True, "is_pending": False, "is_tutor": True})
        st.tutor_token = _login("tutor_test@tradehub.com", "Test1234!")

    def test_create_student_user(self, admin_headers):
        client.post("/api/auth/register", json={
            "email": "student_test@tradehub.com",
            "password": "Test1234!",
            "full_name": "Estudante Teste",
            "role": "TRAINEE",
        })
        uid = self._find_user(admin_headers, "student_test@tradehub.com")
        if uid:
            st.student_id = uid
            client.put(f"/api/admin/users/{uid}", headers=admin_headers,
                       json={"is_active": True, "is_pending": False})
        st.student_token = _login("student_test@tradehub.com", "Test1234!")


# ═══════════════════════════════════════════════════════════════════════════════
# 1. CATEGORIES — CRUD (Admin only)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCategories:
    """Secção 1: Categorias de erro — CRUD pelo Admin."""

    def test_create_category_admin(self, admin_headers):
        resp = client.post("/api/tutoria/categories", headers=admin_headers,
                           json={"name": "Teste V4 Cat", "description": "Categoria de teste V4"})
        assert resp.status_code == 201
        st.category_id = resp.json()["id"]
        assert resp.json()["name"] == "Teste V4 Cat"

    def test_create_category_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.post("/api/tutoria/categories", headers=_h(st.student_token),
                           json={"name": "Hack"})
        assert resp.status_code == 403

    def test_list_categories(self, admin_headers):
        resp = client.get("/api/tutoria/categories", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert any(c["id"] == st.category_id for c in resp.json())

    def test_update_category(self, admin_headers):
        resp = client.patch(f"/api/tutoria/categories/{st.category_id}",
                            headers=admin_headers,
                            json={"name": "Teste V4 Cat Updated"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Teste V4 Cat Updated"

    def test_update_category_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.patch(f"/api/tutoria/categories/{st.category_id}",
                            headers=_h(st.student_token),
                            json={"name": "Hack2"})
        assert resp.status_code == 403

    def test_delete_category(self, admin_headers):
        # Create throwaway
        r = client.post("/api/tutoria/categories", headers=admin_headers,
                        json={"name": "ToDelete"})
        assert r.status_code == 201
        del_id = r.json()["id"]
        resp = client.delete(f"/api/tutoria/categories/{del_id}", headers=admin_headers)
        assert resp.status_code == 204

    def test_delete_category_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.delete(f"/api/tutoria/categories/{st.category_id}",
                             headers=_h(st.student_token))
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 2. PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestProducts:
    def test_list_products(self, admin_headers):
        resp = client.get("/api/tutoria/products", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. ERROR REGISTRATION — create, list, get (all roles)
# ═══════════════════════════════════════════════════════════════════════════════

class TestErrorRegistration:
    """Secção 2: Registo de incidência com refs."""

    def test_create_error_admin(self, admin_headers):
        resp = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-10",
            "description": "Erro de teste V4 — testes automáticos",
            "severity": "MEDIA",
            "category_id": st.category_id,
            "refs": [
                {"referencia": "REF001", "divisa": "EUR", "importe": 1500.50, "cliente_final": "Cliente A"},
                {"referencia": "REF002", "divisa": "USD", "importe": 2000.00, "cliente_final": "Cliente B"},
            ],
        })
        assert resp.status_code == 201
        data = resp.json()
        st.error_id = data["id"]
        assert data["status"] == "REGISTERED"
        assert data["description"] == "Erro de teste V4 — testes automáticos"
        assert len(data.get("refs", [])) == 2

    def test_create_error_student(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.post("/api/tutoria/errors", headers=_h(st.student_token), json={
            "date_occurrence": "2026-03-11",
            "description": "Erro registado por estudante",
            "severity": "BAIXA",
        })
        assert resp.status_code == 201
        assert resp.json()["status"] == "REGISTERED"

    def test_create_error_student_cannot_assign_other(self):
        """Student cannot assign error to another user."""
        if not st.student_token or not st.chefe_id:
            pytest.skip("Users not available")
        resp = client.post("/api/tutoria/errors", headers=_h(st.student_token), json={
            "date_occurrence": "2026-03-11",
            "description": "Tentativa de atribuição",
            "severity": "MEDIA",
            "tutorado_id": st.chefe_id,
        })
        assert resp.status_code == 403

    def test_create_error_chefe_can_assign(self):
        """Chefe can assign error to another user."""
        if not st.chefe_token or not st.student_id:
            pytest.skip("Users not available")
        resp = client.post("/api/tutoria/errors", headers=_h(st.chefe_token), json={
            "date_occurrence": "2026-03-11",
            "description": "Erro atribuído pelo chefe",
            "severity": "ALTA",
            "tutorado_id": st.student_id,
        })
        assert resp.status_code == 201
        assert resp.json()["tutorado_id"] == st.student_id

    def test_list_errors_admin(self, admin_headers):
        resp = client.get("/api/tutoria/errors", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert any(e["id"] == st.error_id for e in resp.json())

    def test_list_errors_with_filters(self, admin_headers):
        resp = client.get("/api/tutoria/errors?status=REGISTERED&severity=MEDIA",
                          headers=admin_headers)
        assert resp.status_code == 200

    def test_get_error_detail(self, admin_headers):
        resp = client.get(f"/api/tutoria/errors/{st.error_id}", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == st.error_id
        assert "refs" in data

    def test_get_error_not_found(self, admin_headers):
        resp = client.get("/api/tutoria/errors/999999", headers=admin_headers)
        assert resp.status_code == 404

    def test_update_error(self, admin_headers):
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}", headers=admin_headers,
                            json={"severity": "ALTA", "tags": ["urgente", "v4"]})
        assert resp.status_code == 200
        assert resp.json()["severity"] == "ALTA"

    def test_update_error_refs(self, admin_headers):
        """Replace refs via PATCH."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}", headers=admin_headers,
                            json={"refs": [
                                {"referencia": "REF_NEW", "divisa": "GBP", "importe": 999.99, "cliente_final": "New Client"}
                            ]})
        assert resp.status_code == 200
        assert len(resp.json()["refs"]) == 1
        assert resp.json()["refs"][0]["referencia"] == "REF_NEW"

    def test_update_error_student_forbidden(self):
        """Student cannot update errors (requires manager)."""
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}",
                            headers=_h(st.student_token),
                            json={"severity": "CRITICA"})
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 4. ANALYSIS PHASE — save/submit (Chefe/Manager/Referente)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAnalysis:
    """Secção 3: Análise por Chefe/Manager/Referente."""

    def test_analysis_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=_h(st.student_token),
                            json={"impact_level": "ALTO"})
        assert resp.status_code == 403

    def test_save_analysis_admin(self, admin_headers):
        """Admin (is chefe_referente_manager) can save analysis draft."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=admin_headers,
                            json={
                                "impact_level": "ALTO",
                                "impact_detail": "ECONOMICO",
                                "origin_detail": "Error Puntual",
                                "solution": "Corrigir procedimento",
                                "recurrence_type": "PUNTUAL",
                            })
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ANALYSIS"
        assert data["impact_level"] == "ALTO"
        assert data["impact_detail"] == "ECONOMICO"

    def test_save_analysis_chefe(self):
        """Chefe can save analysis."""
        if not st.chefe_token:
            pytest.skip("Chefe user not available")
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=_h(st.chefe_token),
                            json={"action_plan_summary": "Plano correctivo necessário"})
        assert resp.status_code == 200

    def test_submit_analysis_admin(self, admin_headers):
        """Admin submits analysis → PENDING_TUTOR_REVIEW."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/submit-analysis",
                           headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PENDING_TUTOR_REVIEW"

    def test_submit_analysis_wrong_status(self, admin_headers):
        """Cannot submit analysis when status is not ANALYSIS/REGISTERED."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/submit-analysis",
                           headers=admin_headers)
        assert resp.status_code == 400

    def test_referente_submit_goes_to_chief_approval(self, admin_headers):
        """Referente submits → PENDING_CHIEF_APPROVAL (not directly to tutor)."""
        if not st.referente_token:
            pytest.skip("Referente user not available")
        # Create a new error for this test
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro para teste referente flow",
            "severity": "MEDIA",
        })
        assert r.status_code == 201
        err_id = r.json()["id"]

        # Referente saves analysis
        client.patch(f"/api/tutoria/errors/{err_id}/analysis",
                     headers=_h(st.referente_token),
                     json={"impact_level": "BAIXO"})

        # Referente submits → PENDING_CHIEF_APPROVAL
        resp = client.post(f"/api/tutoria/errors/{err_id}/submit-analysis",
                           headers=_h(st.referente_token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "PENDING_CHIEF_APPROVAL"

        # Chief approves → PENDING_TUTOR_REVIEW
        resp2 = client.post(f"/api/tutoria/errors/{err_id}/approve-chief",
                            headers=admin_headers)
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "PENDING_TUTOR_REVIEW"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. CANCEL ERROR — Chefe/Manager only
# ═══════════════════════════════════════════════════════════════════════════════

class TestCancelError:
    """Secção 3: Eliminação de incidência (Chefe/Manager)."""

    def test_cancel_student_forbidden(self, admin_headers):
        if not st.student_token:
            pytest.skip("Student user not available")
        # Create a temp error
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro temp cancel test",
            "severity": "BAIXA",
        })
        tmp_id = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{tmp_id}/cancel",
                           headers=_h(st.student_token),
                           json={"reason": "Hack"})
        assert resp.status_code == 403

    def test_cancel_without_reason(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro cancel no reason",
            "severity": "BAIXA",
        })
        tmp_id = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{tmp_id}/cancel",
                           headers=admin_headers,
                           json={"reason": ""})
        assert resp.status_code == 400

    def test_cancel_success(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro to cancel",
            "severity": "BAIXA",
        })
        tmp_id = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{tmp_id}/cancel",
                           headers=admin_headers,
                           json={"reason": "Duplicado"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] == True
        assert data["status"] == "CANCELLED"


# ═══════════════════════════════════════════════════════════════════════════════
# 6. TUTOR REVIEW — approve/return (Tutor)
# ═══════════════════════════════════════════════════════════════════════════════

class TestTutorReview:
    """Secção 4: Revisão do Tutor."""

    def test_approve_plans_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/approve-plans",
                           headers=_h(st.student_token))
        assert resp.status_code == 403

    def test_approve_plans_admin(self, admin_headers):
        """Admin approves plans → APPROVED."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/approve-plans",
                           headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "APPROVED"

    def test_return_analysis_wrong_status(self, admin_headers):
        """Cannot return analysis when not in PENDING_TUTOR_REVIEW."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/return-analysis",
                           headers=admin_headers,
                           json={"reason": "Falta info"})
        assert resp.status_code == 400

    def test_return_analysis_flow(self, admin_headers):
        """Full return flow: create error → analysis → submit → return."""
        # Create
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro para return flow",
            "severity": "MEDIA",
        })
        eid = r.json()["id"]
        # Analysis
        client.patch(f"/api/tutoria/errors/{eid}/analysis",
                     headers=admin_headers,
                     json={"impact_level": "BAIXO"})
        # Submit
        client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                    headers=admin_headers)
        # Return
        resp = client.post(f"/api/tutoria/errors/{eid}/return-analysis",
                           headers=admin_headers,
                           json={"reason": "Falta informação de impacto"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "ANALYSIS"

    def test_return_analysis_no_reason(self, admin_headers):
        """Return without reason → 400."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "No reason return",
            "severity": "BAIXA",
        })
        eid = r.json()["id"]
        client.patch(f"/api/tutoria/errors/{eid}/analysis",
                     headers=admin_headers, json={"impact_level": "BAIXO"})
        client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                    headers=admin_headers)
        resp = client.post(f"/api/tutoria/errors/{eid}/return-analysis",
                           headers=admin_headers,
                           json={"reason": ""})
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 7. CONFIRM SOLUTION — Chefe fills solution
# ═══════════════════════════════════════════════════════════════════════════════

class TestConfirmSolution:
    """Secção 4: Confirmar solução."""

    def test_confirm_solution_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/confirm-solution",
                           headers=_h(st.student_token),
                           json={"date_solution": "2026-03-13", "solution": "x"})
        assert resp.status_code == 403

    def test_confirm_solution_success(self, admin_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/confirm-solution",
                           headers=admin_headers,
                           json={"date_solution": "2026-03-13", "solution": "Processo corrigido"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["solution_confirmed"] == True
        assert data["status"] == "PENDING_TUTOR_REVIEW"


# ═══════════════════════════════════════════════════════════════════════════════
# 8. RESOLVE — Tutor confirms final
# ═══════════════════════════════════════════════════════════════════════════════

class TestResolve:
    """Secção 4: Resolver incidência."""

    def test_resolve_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/resolve",
                           headers=_h(st.student_token))
        assert resp.status_code == 403

    def test_resolve_success(self, admin_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/resolve",
                           headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "RESOLVED"

    def test_resolve_wrong_status(self, admin_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/resolve",
                           headers=admin_headers)
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 9. PLANS — CRUD, start, complete
# ═══════════════════════════════════════════════════════════════════════════════

class TestPlans:
    """Secção 5: Planos de ação."""

    def _ensure_error(self, admin_headers):
        """Create a fresh error for plan tests."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13",
            "description": "Erro para plano de ação",
            "severity": "MEDIA",
        })
        return r.json()["id"]

    def test_create_plan_admin(self, admin_headers):
        eid = self._ensure_error(admin_headers)
        # Need a tutorado_id
        resp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                           json={
                               "tutorado_id": 1,
                               "plan_type": "CORRECTIVO",
                               "description": "Plano correctivo teste",
                               "expected_result": "Eliminar causa raiz",
                               "deadline": "2026-04-01",
                           })
        assert resp.status_code == 201
        st.plan_id = resp.json()["id"]
        assert resp.json()["plan_type"] == "CORRECTIVO"

    def test_create_plan_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student user not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/plans",
                           headers=_h(st.student_token),
                           json={"tutorado_id": 1, "description": "Hack"})
        assert resp.status_code == 403

    def test_list_plans(self, admin_headers):
        resp = client.get("/api/tutoria/plans", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_plan(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.get(f"/api/tutoria/plans/{st.plan_id}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == st.plan_id

    def test_update_plan(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.patch(f"/api/tutoria/plans/{st.plan_id}", headers=admin_headers,
                            json={"what": "Acção correctiva principal"})
        assert resp.status_code == 200

    def test_submit_plan_admin(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.post(f"/api/tutoria/plans/{st.plan_id}/submit", headers=admin_headers)
        assert resp.status_code == 200
        # Admin auto-approves
        assert resp.json()["status"] == "APROVADO"

    def test_validate_plan(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.post(f"/api/tutoria/plans/{st.plan_id}/validate", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "CONCLUIDO"

    def test_start_plan_flow(self, admin_headers):
        """Create plan with OPEN status, start it, complete it."""
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": 1, "plan_type": "PREVENTIVO", "description": "Plan start test"})
        pid = r.json()["id"]

        # Start
        resp = client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "IN_PROGRESS"
        assert resp.json()["started_at"] is not None

        # Complete
        resp2 = client.patch(f"/api/tutoria/plans/{pid}/complete", headers=admin_headers,
                             json={"result_score": 4, "result_comment": "Bom resultado"})
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "DONE"
        assert resp2.json()["result_score"] == 4

    def test_complete_plan_invalid_score(self, admin_headers):
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": 1, "plan_type": "CORRECTIVO", "description": "Bad score"})
        pid = r.json()["id"]
        client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        resp = client.patch(f"/api/tutoria/plans/{pid}/complete", headers=admin_headers,
                            json={"result_score": 10, "result_comment": "x"})
        assert resp.status_code == 400

    def test_complete_plan_long_comment(self, admin_headers):
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": 1, "plan_type": "CORRECTIVO", "description": "Long comment"})
        pid = r.json()["id"]
        client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        resp = client.patch(f"/api/tutoria/plans/{pid}/complete", headers=admin_headers,
                            json={"result_score": 3, "result_comment": "x" * 200})
        assert resp.status_code == 400

    def test_start_plan_wrong_status(self, admin_headers):
        """Cannot start a plan that is not OPEN."""
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.patch(f"/api/tutoria/plans/{st.plan_id}/start", headers=admin_headers)
        assert resp.status_code == 400

    def test_my_plans(self, admin_headers):
        resp = client.get("/api/tutoria/my-plans", headers=admin_headers)
        assert resp.status_code == 200

    def test_return_plan(self, admin_headers):
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": 1, "description": "To return"})
        pid = r.json()["id"]
        resp = client.post(f"/api/tutoria/plans/{pid}/return", headers=admin_headers,
                           json={"comment": "Falta detalhes"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "DEVOLVIDO"


# ═══════════════════════════════════════════════════════════════════════════════
# 10. ACTION ITEMS
# ═══════════════════════════════════════════════════════════════════════════════

class TestActionItems:
    """Items de ação dentro de planos."""

    def test_create_item(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan created")
        # Need a fresh plan
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "For items", "severity": "BAIXA"})
        eid = r.json()["id"]
        rp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                         json={"tutorado_id": 1, "description": "Plan items"})
        pid = rp.json()["id"]

        resp = client.post(f"/api/tutoria/plans/{pid}/items", headers=admin_headers,
                           json={"description": "Item teste", "type": "CORRETIVA"})
        assert resp.status_code == 201
        st.item_id = resp.json()["id"]
        assert resp.json()["description"] == "Item teste"
        st._item_plan_id = pid

    def test_list_items(self, admin_headers):
        if not hasattr(st, '_item_plan_id'):
            pytest.skip("No plan")
        resp = client.get(f"/api/tutoria/plans/{st._item_plan_id}/items", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_update_item_status(self, admin_headers):
        if not st.item_id:
            pytest.skip("No item")
        resp = client.patch(f"/api/tutoria/items/{st.item_id}", headers=admin_headers,
                            json={"status": "EM_ANDAMENTO"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "EM_ANDAMENTO"

    def test_update_item_invalid_transition(self, admin_headers):
        if not st.item_id:
            pytest.skip("No item")
        resp = client.patch(f"/api/tutoria/items/{st.item_id}", headers=admin_headers,
                            json={"status": "DEVOLVIDO"})
        assert resp.status_code == 400

    def test_complete_item(self, admin_headers):
        if not st.item_id:
            pytest.skip("No item")
        resp = client.patch(f"/api/tutoria/items/{st.item_id}", headers=admin_headers,
                            json={"status": "CONCLUIDO", "evidence_text": "Prova de conclusão"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "CONCLUIDO"

    def test_return_item(self, admin_headers):
        if not st.item_id:
            pytest.skip("No item")
        resp = client.post(f"/api/tutoria/items/{st.item_id}/return", headers=admin_headers,
                           json={"comment": "Precisa mais evidência"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "DEVOLVIDO"


# ═══════════════════════════════════════════════════════════════════════════════
# 11. COMMENTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestComments:
    """Comentários em erros e planos."""

    def test_add_error_comment(self, admin_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/comments",
                           headers=admin_headers,
                           json={"content": "Comentário de teste V4"})
        assert resp.status_code == 201
        assert resp.json()["content"] == "Comentário de teste V4"

    def test_list_error_comments(self, admin_headers):
        resp = client.get(f"/api/tutoria/errors/{st.error_id}/comments",
                          headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert any(c["content"] == "Comentário de teste V4" for c in resp.json())

    def test_add_plan_comment(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan")
        resp = client.post(f"/api/tutoria/plans/{st.plan_id}/comments",
                           headers=admin_headers,
                           json={"content": "Comentário no plano"})
        assert resp.status_code == 201

    def test_list_plan_comments(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan")
        resp = client.get(f"/api/tutoria/plans/{st.plan_id}/comments",
                          headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_comment_by_student(self):
        """Students can also comment."""
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/comments",
                           headers=_h(st.student_token),
                           json={"content": "Comentário do estudante"})
        # May be 201 or 403 depending on access — just check it doesn't crash
        assert resp.status_code in (201, 403)


# ═══════════════════════════════════════════════════════════════════════════════
# 12. NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

class TestNotifications:
    """Secção 7: Sistema de notificações."""

    def test_list_notifications(self, admin_headers):
        resp = client.get("/api/tutoria/notifications", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_notifications_unauthenticated(self):
        resp = client.get("/api/tutoria/notifications")
        assert resp.status_code == 401

    def test_mark_notification_read(self, admin_headers):
        notifs = client.get("/api/tutoria/notifications", headers=admin_headers).json()
        if not notifs:
            pytest.skip("No notifications to mark")
        nid = notifs[0]["id"]
        resp = client.patch(f"/api/tutoria/notifications/{nid}/read",
                            headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] == True

    def test_mark_all_read(self, admin_headers):
        resp = client.patch("/api/tutoria/notifications/read-all",
                            headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] == True

    def test_mark_notification_other_user(self, admin_headers):
        """Cannot mark another user's notification."""
        if not st.student_token:
            pytest.skip("Student not available")
        notifs = client.get("/api/tutoria/notifications", headers=admin_headers).json()
        if not notifs:
            pytest.skip("No admin notifications")
        nid = notifs[0]["id"]
        resp = client.patch(f"/api/tutoria/notifications/{nid}/read",
                            headers=_h(st.student_token))
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 13. LEARNING SHEETS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLearningSheets:
    """Secção 6: Fichas de aprendizagem."""

    def test_list_sheets_admin(self, admin_headers):
        resp = client.get("/api/tutoria/learning-sheets", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_sheets_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.get("/api/tutoria/learning-sheets",
                          headers=_h(st.student_token))
        assert resp.status_code == 403

    def test_my_sheets(self, admin_headers):
        resp = client.get("/api/tutoria/learning-sheets/mine", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_my_sheets_student(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.get("/api/tutoria/learning-sheets/mine",
                          headers=_h(st.student_token))
        assert resp.status_code == 200

    def test_submit_reflection_wrong_user(self):
        """Cannot submit reflection for someone else's sheet."""
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.post("/api/tutoria/learning-sheets/999999/submit",
                           headers=_h(st.student_token),
                           json={"reflection": "hack"})
        assert resp.status_code == 404

    def test_review_sheet_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.patch("/api/tutoria/learning-sheets/999999/review",
                            headers=_h(st.student_token),
                            json={"tutor_outcome": "SEM_ACAO"})
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 14. DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

class TestDashboard:

    def test_dashboard_admin(self, admin_headers):
        resp = client.get("/api/tutoria/dashboard", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_errors" in data
        assert "errors_by_status" in data
        assert "total_plans" in data
        assert "plans_by_status" in data
        assert "severity_counts" in data

    def test_dashboard_student(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.get("/api/tutoria/dashboard",
                          headers=_h(st.student_token))
        assert resp.status_code == 200

    def test_dashboard_unauthenticated(self):
        resp = client.get("/api/tutoria/dashboard")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# 15. UTILITY — students, team
# ═══════════════════════════════════════════════════════════════════════════════

class TestUtility:

    def test_list_students_admin(self, admin_headers):
        resp = client.get("/api/tutoria/students", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_students_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.get("/api/tutoria/students",
                          headers=_h(st.student_token))
        assert resp.status_code == 403

    def test_list_team_admin(self, admin_headers):
        resp = client.get("/api/tutoria/team", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        # Verify it returns role info
        if resp.json():
            u = resp.json()[0]
            assert "role" in u
            assert "is_tutor" in u
            assert "is_team_lead" in u
            assert "is_referente" in u

    def test_list_team_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.get("/api/tutoria/team",
                          headers=_h(st.student_token))
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 16. DEACTIVATE ERROR
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeactivateError:

    def test_deactivate_without_reason(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "Deactivate test", "severity": "BAIXA"})
        eid = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{eid}/deactivate",
                           headers=admin_headers,
                           json={"reason": ""})
        assert resp.status_code == 400

    def test_deactivate_success(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "Deactivate success", "severity": "BAIXA"})
        eid = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{eid}/deactivate",
                           headers=admin_headers,
                           json={"reason": "Registo duplicado"})
        assert resp.status_code == 200

    def test_deactivate_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/deactivate",
                           headers=_h(st.student_token),
                           json={"reason": "Hack"})
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 17. VERIFY ERROR
# ═══════════════════════════════════════════════════════════════════════════════

class TestVerifyError:

    def test_verify_not_concluido(self, admin_headers):
        """Cannot verify error that is not CONCLUIDO."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "Verify not ready", "severity": "BAIXA"})
        eid = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{eid}/verify", headers=admin_headers)
        assert resp.status_code == 400

    def test_verify_student_forbidden(self):
        if not st.student_token:
            pytest.skip("Student not available")
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/verify",
                           headers=_h(st.student_token))
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 18. FULL WORKFLOW — end-to-end
# ═══════════════════════════════════════════════════════════════════════════════

class TestFullWorkflow:
    """Teste end-to-end do fluxo completo da incidência."""

    def test_full_lifecycle(self, admin_headers):
        """
        1. Create error → REGISTERED
        2. Save analysis → ANALYSIS
        3. Submit analysis → PENDING_TUTOR_REVIEW
        4. Approve plans → APPROVED
        5. Confirm solution → PENDING_TUTOR_REVIEW
        6. Resolve → RESOLVED
        """
        # 1. Create
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13",
            "description": "Lifecycle test — full workflow",
            "severity": "ALTA",
            "refs": [{"referencia": "LC001", "divisa": "EUR", "importe": 500}],
        })
        assert r.status_code == 201
        eid = r.json()["id"]
        assert r.json()["status"] == "REGISTERED"

        # 2. Analysis
        r2 = client.patch(f"/api/tutoria/errors/{eid}/analysis",
                          headers=admin_headers,
                          json={"impact_level": "ALTO", "impact_detail": "REGULATORIO"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "ANALYSIS"

        # 3. Submit
        r3 = client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                         headers=admin_headers)
        assert r3.status_code == 200
        assert r3.json()["status"] == "PENDING_TUTOR_REVIEW"

        # 4. Approve
        r4 = client.post(f"/api/tutoria/errors/{eid}/approve-plans",
                         headers=admin_headers)
        assert r4.status_code == 200
        assert r4.json()["status"] == "APPROVED"

        # 5. Confirm solution
        r5 = client.post(f"/api/tutoria/errors/{eid}/confirm-solution",
                         headers=admin_headers,
                         json={"date_solution": "2026-03-13", "solution": "Lifecycle solution"})
        assert r5.status_code == 200
        assert r5.json()["status"] == "PENDING_TUTOR_REVIEW"
        assert r5.json()["solution_confirmed"] == True

        # 6. Resolve
        r6 = client.post(f"/api/tutoria/errors/{eid}/resolve",
                         headers=admin_headers)
        assert r6.status_code == 200
        assert r6.json()["status"] == "RESOLVED"

    def test_plan_lifecycle(self, admin_headers):
        """Plan: create → submit → (auto-approve for admin) → validate."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13",
            "description": "Plan lifecycle test",
            "severity": "MEDIA",
        })
        eid = r.json()["id"]

        rp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                         json={"tutorado_id": 1, "plan_type": "PREVENTIVO",
                               "description": "Prevenir recorrência"})
        assert rp.status_code == 201
        pid = rp.json()["id"]

        # Submit (admin → auto-approve)
        rs = client.post(f"/api/tutoria/plans/{pid}/submit", headers=admin_headers)
        assert rs.status_code == 200
        assert rs.json()["status"] == "APROVADO"

        # Validate
        rv = client.post(f"/api/tutoria/plans/{pid}/validate", headers=admin_headers)
        assert rv.status_code == 200
        assert rv.json()["status"] == "CONCLUIDO"

    def test_plan_start_complete_lifecycle(self, admin_headers):
        """Plan: create → start → complete with score."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13",
            "description": "Plan start-complete test",
            "severity": "BAIXA",
        })
        eid = r.json()["id"]

        rp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                         json={"tutorado_id": 1, "plan_type": "MELHORIA",
                               "description": "Desenvolvimento competências"})
        pid = rp.json()["id"]

        # Start
        r1 = client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        assert r1.status_code == 200
        assert r1.json()["status"] == "IN_PROGRESS"

        # Complete
        r2 = client.patch(f"/api/tutoria/plans/{pid}/complete", headers=admin_headers,
                          json={"result_score": 5, "result_comment": "Excelente resultado"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "DONE"
        assert r2.json()["result_score"] == 5
        assert r2.json()["completed_at"] is not None


# ═══════════════════════════════════════════════════════════════════════════════
# 19. EDGE CASES & VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Testes de validação e casos fronteira."""

    def test_error_not_found(self, admin_headers):
        resp = client.get("/api/tutoria/errors/999999", headers=admin_headers)
        assert resp.status_code == 404

    def test_plan_not_found(self, admin_headers):
        resp = client.get("/api/tutoria/plans/999999", headers=admin_headers)
        assert resp.status_code == 404

    def test_item_not_found(self, admin_headers):
        resp = client.patch("/api/tutoria/items/999999", headers=admin_headers,
                            json={"status": "EM_ANDAMENTO"})
        assert resp.status_code == 404

    def test_category_not_found(self, admin_headers):
        resp = client.patch("/api/tutoria/categories/999999", headers=admin_headers,
                            json={"name": "Ghost"})
        assert resp.status_code == 404

    def test_unauthenticated_access(self):
        endpoints = [
            ("GET", "/api/tutoria/errors"),
            ("GET", "/api/tutoria/plans"),
            ("GET", "/api/tutoria/categories"),
            ("GET", "/api/tutoria/dashboard"),
            ("GET", "/api/tutoria/notifications"),
            ("GET", "/api/tutoria/learning-sheets"),
            ("GET", "/api/tutoria/students"),
            ("GET", "/api/tutoria/team"),
        ]
        for method, url in endpoints:
            if method == "GET":
                resp = client.get(url)
            assert resp.status_code == 401, f"{url} returned {resp.status_code} instead of 401"

    def test_empty_description_error(self, admin_headers):
        resp = client.post("/api/tutoria/errors", headers=admin_headers,
                           json={"date_occurrence": "2026-03-13", "severity": "BAIXA"})
        assert resp.status_code == 422  # Missing required field
