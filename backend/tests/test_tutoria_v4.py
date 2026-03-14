"""
Testes Completos do Portal de Tutoria — V4

Utiliza utilizadores reais em base de dados com os seguintes perfis:
  ADMIN           — admin@tradehub.com
  MANAGER/CHEFE   — chefe_test@tradehub.com (is_team_lead)
  REFERENTE       — referente_test@tradehub.com (is_referente)
  TUTOR           — tutor_test@tradehub.com (is_tutor)
  STUDENT         — student_test@tradehub.com (TRAINEE básico)
  LIBERADOR       — liberador_test@tradehub.com (is_liberador)
  TRAINER         — trainer_test@tradehub.com (TRAINER, is_trainer)

Responsabilidades por perfil (endpoints Tutoria):
  - ADMIN: acesso total (CRUD categorias, deactivate, verify, etc.)
  - CHEFE (MANAGER+is_team_lead): análise, cancelar, aprovar chefe, confirmar solução
  - REFERENTE (is_referente): análise (submit → PENDING_CHIEF_APPROVAL), confirmar solução
  - TUTOR (is_tutor): criar planos, aprovar/devolver análise, resolver, learning sheets
  - TRAINER (role TRAINER): actualizar erros/planos (require_manager), NÃO pode criar planos/aprovar
  - STUDENT (TRAINEE básico): criar erros para si, ver próprios, comentar
  - LIBERADOR (is_liberador): sem permissões especiais em tutoria (= student)

Criar utilizadores: cd backend && python scripts/create_test_users.py
Execute: cd backend && pytest tests/test_tutoria_v4.py -v --tb=short
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from app.auth import create_access_token

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _make_token(email: str) -> str:
    """Generate JWT directly — avoids hitting the 5/min rate-limited login endpoint."""
    return create_access_token(data={"sub": email})


def _h(token):
    """Auth headers helper."""
    return {"Authorization": f"Bearer {token}"} if token else {}


def _find_user_id(admin_headers, email):
    """Find user ID by email using admin API (page_size=100)."""
    resp = client.get("/api/admin/users?page_size=100", headers=admin_headers)
    if resp.status_code == 200:
        data = resp.json()
        items = data.get("items", data) if isinstance(data, dict) else data
        for u in items:
            if u.get("email") == email:
                return u["id"]
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# FIXTURES — sessão autenticada para cada perfil
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture(scope="module")
def admin_token():
    return _make_token("admin@tradehub.com")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return _h(admin_token)


@pytest.fixture(scope="module")
def chefe_token():
    return _make_token("chefe_test@tradehub.com")


@pytest.fixture(scope="module")
def chefe_headers(chefe_token):
    return _h(chefe_token)


@pytest.fixture(scope="module")
def referente_token():
    return _make_token("referente_test@tradehub.com")


@pytest.fixture(scope="module")
def referente_headers(referente_token):
    return _h(referente_token)


@pytest.fixture(scope="module")
def tutor_token():
    return _make_token("tutor_test@tradehub.com")


@pytest.fixture(scope="module")
def tutor_headers(tutor_token):
    return _h(tutor_token)


@pytest.fixture(scope="module")
def student_token():
    return _make_token("student_test@tradehub.com")


@pytest.fixture(scope="module")
def student_headers(student_token):
    return _h(student_token)


@pytest.fixture(scope="module")
def liberador_token():
    return _make_token("liberador_test@tradehub.com")


@pytest.fixture(scope="module")
def liberador_headers(liberador_token):
    return _h(liberador_token)


@pytest.fixture(scope="module")
def trainer_token():
    return _make_token("trainer_test@tradehub.com")


@pytest.fixture(scope="module")
def trainer_headers(trainer_token):
    return _h(trainer_token)


# ═══════════════════════════════════════════════════════════════════════════════
# SHARED STATE — IDs criados durante os testes
# ═══════════════════════════════════════════════════════════════════════════════

class State:
    category_id = None
    error_id = None
    plan_id = None
    item_id = None
    sheet_id = None
    _item_plan_id = None
    # User IDs
    admin_id = None
    chefe_id = None
    referente_id = None
    tutor_id = None
    student_id = None
    liberador_id = None
    trainer_id = None

st = State()


# ═══════════════════════════════════════════════════════════════════════════════
# 0. SETUP — Validar utilizadores existentes e obter IDs
# ═══════════════════════════════════════════════════════════════════════════════

class TestSetup:
    """Validate all real test users exist and find their IDs."""

    def test_admin_login(self, admin_token):
        assert admin_token is not None, "Admin login failed"

    def test_find_user_ids(self, admin_headers):
        st.admin_id = _find_user_id(admin_headers, "admin@tradehub.com")
        st.chefe_id = _find_user_id(admin_headers, "chefe_test@tradehub.com")
        st.referente_id = _find_user_id(admin_headers, "referente_test@tradehub.com")
        st.tutor_id = _find_user_id(admin_headers, "tutor_test@tradehub.com")
        st.student_id = _find_user_id(admin_headers, "student_test@tradehub.com")
        st.liberador_id = _find_user_id(admin_headers, "liberador_test@tradehub.com")
        st.trainer_id = _find_user_id(admin_headers, "trainer_test@tradehub.com")
        assert st.admin_id, "Admin user not found"
        assert st.chefe_id, "Chefe user not found"
        assert st.referente_id, "Referente user not found"
        assert st.tutor_id, "Tutor user not found"
        assert st.student_id, "Student user not found"
        assert st.liberador_id, "Liberador user not found"
        assert st.trainer_id, "Trainer user not found"

    def test_all_tokens(self, chefe_token, referente_token, tutor_token,
                        student_token, liberador_token, trainer_token):
        assert chefe_token, "Chefe token not generated"
        assert referente_token, "Referente token not generated"
        assert tutor_token, "Tutor token not generated"
        assert student_token, "Student token not generated"
        assert liberador_token, "Liberador token not generated"
        assert trainer_token, "Trainer token not generated"


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

    def test_create_category_student_forbidden(self, student_headers):
        resp = client.post("/api/tutoria/categories", headers=student_headers,
                           json={"name": "Hack"})
        assert resp.status_code == 403

    def test_create_category_trainer_forbidden(self, trainer_headers):
        """Trainer (role TRAINER) is not ADMIN — cannot create categories."""
        resp = client.post("/api/tutoria/categories", headers=trainer_headers,
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

    def test_update_category_student_forbidden(self, student_headers):
        resp = client.patch(f"/api/tutoria/categories/{st.category_id}",
                            headers=student_headers,
                            json={"name": "Hack2"})
        assert resp.status_code == 403

    def test_delete_category(self, admin_headers):
        r = client.post("/api/tutoria/categories", headers=admin_headers,
                        json={"name": "ToDelete"})
        assert r.status_code == 201
        del_id = r.json()["id"]
        resp = client.delete(f"/api/tutoria/categories/{del_id}", headers=admin_headers)
        assert resp.status_code == 204

    def test_delete_category_student_forbidden(self, student_headers):
        resp = client.delete(f"/api/tutoria/categories/{st.category_id}",
                             headers=student_headers)
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 2. PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestProducts:
    def test_list_products_admin(self, admin_headers):
        resp = client.get("/api/tutoria/products", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_products_student(self, student_headers):
        """Any authenticated user can list products."""
        resp = client.get("/api/tutoria/products", headers=student_headers)
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# 3. ERROR REGISTRATION — create, list, get, update (role tests)
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

    def test_create_error_student(self, student_headers):
        """Student can create errors for themselves."""
        resp = client.post("/api/tutoria/errors", headers=student_headers, json={
            "date_occurrence": "2026-03-11",
            "description": "Erro registado por estudante",
            "severity": "BAIXA",
        })
        assert resp.status_code == 201
        assert resp.json()["status"] == "REGISTERED"

    def test_create_error_student_cannot_assign_other(self, student_headers):
        """Student cannot assign error to another user."""
        resp = client.post("/api/tutoria/errors", headers=student_headers, json={
            "date_occurrence": "2026-03-11",
            "description": "Tentativa de atribuição",
            "severity": "MEDIA",
            "tutorado_id": st.chefe_id,
        })
        assert resp.status_code == 403

    def test_create_error_chefe_can_assign(self, chefe_headers):
        """Chefe (MANAGER+is_team_lead) can assign error to another user."""
        resp = client.post("/api/tutoria/errors", headers=chefe_headers, json={
            "date_occurrence": "2026-03-11",
            "description": "Erro atribuído pelo chefe ao estudante",
            "severity": "ALTA",
            "tutorado_id": st.student_id,
        })
        assert resp.status_code == 201
        assert resp.json()["tutorado_id"] == st.student_id

    def test_create_error_referente_can_assign(self, referente_headers):
        """Referente (is_referente) can assign error to another user."""
        resp = client.post("/api/tutoria/errors", headers=referente_headers, json={
            "date_occurrence": "2026-03-11",
            "description": "Erro atribuído pelo referente",
            "severity": "MEDIA",
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

    def test_update_error_admin(self, admin_headers):
        """Admin can update errors (require_manager)."""
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

    def test_update_error_trainer(self, trainer_headers):
        """Trainer (role TRAINER) passes require_manager — can update errors."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}", headers=trainer_headers,
                            json={"tags": ["trainer_updated"]})
        assert resp.status_code == 200

    def test_update_error_student_forbidden(self, student_headers):
        """Student cannot update errors (requires manager+)."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}",
                            headers=student_headers,
                            json={"severity": "CRITICA"})
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 4. ANALYSIS PHASE — save/submit (Chefe/Referente/Manager/Admin)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAnalysis:
    """Secção 3: Análise por Chefe/Referente/Manager.
    Requires is_chefe_referente_manager: is_team_lead, is_referente, MANAGER, or ADMIN.
    """

    def test_analysis_student_forbidden(self, student_headers):
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=student_headers,
                            json={"impact_level": "ALTO"})
        assert resp.status_code == 403

    def test_analysis_trainer_forbidden(self, trainer_headers):
        """Trainer (role TRAINER without is_referente/is_team_lead) cannot analyze."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=trainer_headers,
                            json={"impact_level": "ALTO"})
        assert resp.status_code == 403

    def test_save_analysis_chefe(self, chefe_headers):
        """Chefe (MANAGER+is_team_lead) saves analysis draft."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=chefe_headers,
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

    def test_save_analysis_referente(self, referente_headers):
        """Referente (is_referente) can also save analysis."""
        resp = client.patch(f"/api/tutoria/errors/{st.error_id}/analysis",
                            headers=referente_headers,
                            json={"action_plan_summary": "Plano correctivo necessário"})
        assert resp.status_code == 200

    def test_submit_analysis_chefe(self, chefe_headers):
        """Chefe submits analysis → PENDING_TUTOR_REVIEW."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/submit-analysis",
                           headers=chefe_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "PENDING_TUTOR_REVIEW"

    def test_submit_analysis_wrong_status(self, admin_headers):
        """Cannot submit analysis when status is not ANALYSIS/REGISTERED."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/submit-analysis",
                           headers=admin_headers)
        assert resp.status_code == 400

    def test_referente_submit_goes_to_chief_approval(self, admin_headers, referente_headers):
        """Referente submits → PENDING_CHIEF_APPROVAL (not directly to tutor)."""
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
                     headers=referente_headers,
                     json={"impact_level": "BAIXO"})

        # Referente submits → PENDING_CHIEF_APPROVAL
        resp = client.post(f"/api/tutoria/errors/{err_id}/submit-analysis",
                           headers=referente_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "PENDING_CHIEF_APPROVAL"

        # Chefe/Admin approves → PENDING_TUTOR_REVIEW
        resp2 = client.post(f"/api/tutoria/errors/{err_id}/approve-chief",
                            headers=admin_headers)
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "PENDING_TUTOR_REVIEW"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. CANCEL ERROR — Chefe/Manager/Admin only
# ═══════════════════════════════════════════════════════════════════════════════

class TestCancelError:
    """Secção 3: Eliminação de incidência.
    Requires is_chefe_or_manager: is_team_lead, MANAGER, or ADMIN.
    """

    def test_cancel_student_forbidden(self, admin_headers, student_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro temp cancel test",
            "severity": "BAIXA",
        })
        tmp_id = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{tmp_id}/cancel",
                           headers=student_headers,
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

    def test_cancel_success_chefe(self, admin_headers, chefe_headers):
        """Chefe (MANAGER+is_team_lead) can cancel errors."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro to cancel by chefe",
            "severity": "BAIXA",
        })
        tmp_id = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{tmp_id}/cancel",
                           headers=chefe_headers,
                           json={"reason": "Duplicado"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] == True
        assert data["status"] == "CANCELLED"


# ═══════════════════════════════════════════════════════════════════════════════
# 6. TUTOR REVIEW — approve/return (Tutor/Manager/Admin)
# ═══════════════════════════════════════════════════════════════════════════════

class TestTutorReview:
    """Secção 4: Revisão do Tutor.
    Requires is_tutor_or_above: is_tutor, MANAGER, or ADMIN.
    """

    def test_approve_plans_student_forbidden(self, student_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/approve-plans",
                           headers=student_headers)
        assert resp.status_code == 403

    def test_approve_plans_trainer_forbidden(self, trainer_headers):
        """Trainer (role TRAINER without is_tutor) cannot approve—requires is_tutor_or_above."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/approve-plans",
                           headers=trainer_headers)
        assert resp.status_code == 403

    def test_approve_plans_tutor(self, tutor_headers):
        """Tutor (is_tutor) approves plans → APPROVED."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/approve-plans",
                           headers=tutor_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "APPROVED"

    def test_return_analysis_wrong_status(self, tutor_headers):
        """Cannot return analysis when not in PENDING_TUTOR_REVIEW."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/return-analysis",
                           headers=tutor_headers,
                           json={"reason": "Falta info"})
        assert resp.status_code == 400

    def test_return_analysis_flow(self, admin_headers, tutor_headers):
        """Full return flow: create error → analysis → submit → tutor returns."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-12",
            "description": "Erro para return flow",
            "severity": "MEDIA",
        })
        eid = r.json()["id"]
        client.patch(f"/api/tutoria/errors/{eid}/analysis",
                     headers=admin_headers,
                     json={"impact_level": "BAIXO"})
        client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                    headers=admin_headers)
        # Tutor returns
        resp = client.post(f"/api/tutoria/errors/{eid}/return-analysis",
                           headers=tutor_headers,
                           json={"reason": "Falta informação de impacto"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "ANALYSIS"

    def test_return_analysis_no_reason(self, admin_headers, tutor_headers):
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
                           headers=tutor_headers,
                           json={"reason": ""})
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 7. CONFIRM SOLUTION — Chefe/Referente/Manager/Admin
# ═══════════════════════════════════════════════════════════════════════════════

class TestConfirmSolution:
    """Secção 4: Confirmar solução.
    Requires is_chefe_referente_manager.
    """

    def test_confirm_solution_student_forbidden(self, student_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/confirm-solution",
                           headers=student_headers,
                           json={"date_solution": "2026-03-13", "solution": "x"})
        assert resp.status_code == 403

    def test_confirm_solution_chefe(self, chefe_headers):
        """Chefe confirms solution → PENDING_TUTOR_REVIEW."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/confirm-solution",
                           headers=chefe_headers,
                           json={"date_solution": "2026-03-13", "solution": "Processo corrigido"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["solution_confirmed"] == True
        assert data["status"] == "PENDING_TUTOR_REVIEW"


# ═══════════════════════════════════════════════════════════════════════════════
# 8. RESOLVE — Tutor/Manager/Admin
# ═══════════════════════════════════════════════════════════════════════════════

class TestResolve:
    """Secção 4: Resolver incidência.
    Requires is_tutor_or_above: is_tutor, MANAGER, or ADMIN.
    """

    def test_resolve_student_forbidden(self, student_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/resolve",
                           headers=student_headers)
        assert resp.status_code == 403

    def test_resolve_tutor(self, tutor_headers):
        """Tutor (is_tutor) resolves → RESOLVED."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/resolve",
                           headers=tutor_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "RESOLVED"

    def test_resolve_wrong_status(self, tutor_headers):
        """Cannot resolve when already RESOLVED."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/resolve",
                           headers=tutor_headers)
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 9. PLANS — CRUD, start, complete (Tutor creates, Manager manages)
# ═══════════════════════════════════════════════════════════════════════════════

class TestPlans:
    """Secção 5: Planos de ação.
    Create: _require_tutor_or_admin (ADMIN or is_tutor).
    Update/submit/validate: require_manager (ADMIN, TRAINER, MANAGER, or is_tutor).
    """

    def _ensure_error(self, admin_headers):
        """Create a fresh error for plan tests."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13",
            "description": "Erro para plano de ação",
            "severity": "MEDIA",
        })
        return r.json()["id"]

    def test_create_plan_tutor(self, admin_headers, tutor_headers):
        """Tutor (is_tutor) can create plans."""
        eid = self._ensure_error(admin_headers)
        resp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=tutor_headers,
                           json={
                               "tutorado_id": st.student_id,
                               "plan_type": "CORRECTIVO",
                               "description": "Plano correctivo criado pelo tutor",
                               "expected_result": "Eliminar causa raiz",
                               "deadline": "2026-04-01",
                           })
        assert resp.status_code == 201
        st.plan_id = resp.json()["id"]
        assert resp.json()["plan_type"] == "CORRECTIVO"

    def test_create_plan_admin(self, admin_headers):
        """Admin can also create plans."""
        eid = self._ensure_error(admin_headers)
        resp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                           json={"tutorado_id": st.student_id, "description": "Plano admin"})
        assert resp.status_code == 201

    def test_create_plan_student_forbidden(self, student_headers):
        """Student cannot create plans."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/plans",
                           headers=student_headers,
                           json={"tutorado_id": st.student_id, "description": "Hack"})
        assert resp.status_code == 403

    def test_create_plan_trainer_forbidden(self, admin_headers, trainer_headers):
        """Trainer (role TRAINER without is_tutor) cannot create plans."""
        eid = self._ensure_error(admin_headers)
        resp = client.post(f"/api/tutoria/errors/{eid}/plans",
                           headers=trainer_headers,
                           json={"tutorado_id": st.student_id, "description": "Hack"})
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

    def test_update_plan_tutor(self, tutor_headers):
        """Tutor (is_tutor → passes require_manager) can update plans."""
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.patch(f"/api/tutoria/plans/{st.plan_id}", headers=tutor_headers,
                            json={"what": "Acção correctiva principal"})
        assert resp.status_code == 200

    def test_update_plan_trainer(self, trainer_headers):
        """Trainer (role TRAINER → passes require_manager) can update plans."""
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.patch(f"/api/tutoria/plans/{st.plan_id}", headers=trainer_headers,
                            json={"what": "Updated by trainer"})
        assert resp.status_code == 200

    def test_submit_plan_admin(self, admin_headers):
        """Admin auto-approves on submit."""
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.post(f"/api/tutoria/plans/{st.plan_id}/submit", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "APROVADO"

    def test_validate_plan(self, admin_headers):
        if not st.plan_id:
            pytest.skip("No plan created")
        resp = client.post(f"/api/tutoria/plans/{st.plan_id}/validate", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "CONCLUIDO"

    def test_start_plan_flow(self, admin_headers):
        """Create plan → start → complete with score."""
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": st.student_id, "plan_type": "PREVENTIVO",
                              "description": "Plan start test"})
        pid = r.json()["id"]

        resp = client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "IN_PROGRESS"
        assert resp.json()["started_at"] is not None

        resp2 = client.patch(f"/api/tutoria/plans/{pid}/complete", headers=admin_headers,
                             json={"result_score": 4, "result_comment": "Bom resultado"})
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "DONE"
        assert resp2.json()["result_score"] == 4

    def test_complete_plan_invalid_score(self, admin_headers):
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": st.student_id, "plan_type": "CORRECTIVO",
                              "description": "Bad score"})
        pid = r.json()["id"]
        client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        resp = client.patch(f"/api/tutoria/plans/{pid}/complete", headers=admin_headers,
                            json={"result_score": 10, "result_comment": "x"})
        assert resp.status_code == 400

    def test_complete_plan_long_comment(self, admin_headers):
        eid = self._ensure_error(admin_headers)
        r = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                        json={"tutorado_id": st.student_id, "plan_type": "CORRECTIVO",
                              "description": "Long comment"})
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
                        json={"tutorado_id": st.student_id, "description": "To return"})
        pid = r.json()["id"]
        resp = client.post(f"/api/tutoria/plans/{pid}/return", headers=admin_headers,
                           json={"comment": "Falta detalhes"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "DEVOLVIDO"


# ═══════════════════════════════════════════════════════════════════════════════
# 10. ACTION ITEMS
# ═══════════════════════════════════════════════════════════════════════════════

class TestActionItems:
    """Items de ação dentro de planos.
    Create/return: require_manager.
    """

    def test_create_item(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "For items", "severity": "BAIXA"})
        eid = r.json()["id"]
        rp = client.post(f"/api/tutoria/errors/{eid}/plans", headers=admin_headers,
                         json={"tutorado_id": st.student_id, "description": "Plan items"})
        pid = rp.json()["id"]

        resp = client.post(f"/api/tutoria/plans/{pid}/items", headers=admin_headers,
                           json={"description": "Item teste", "type": "CORRETIVA"})
        assert resp.status_code == 201
        st.item_id = resp.json()["id"]
        assert resp.json()["description"] == "Item teste"
        st._item_plan_id = pid

    def test_list_items(self, admin_headers):
        if not hasattr(st, '_item_plan_id') or not st._item_plan_id:
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
    """Comentários em erros e planos — qualquer utilizador autenticado."""

    def test_add_error_comment_admin(self, admin_headers):
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

    def test_comment_by_student(self, student_headers):
        """Students can comment on errors."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/comments",
                           headers=student_headers,
                           json={"content": "Comentário do estudante"})
        # May be 201 or 403 depending on error visibility
        assert resp.status_code in (201, 403)


# ═══════════════════════════════════════════════════════════════════════════════
# 12. NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

class TestNotifications:
    """Secção 7: Sistema de notificações — cada utilizador vê apenas as suas."""

    def test_list_notifications_admin(self, admin_headers):
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

    def test_mark_notification_other_user(self, admin_headers, student_headers):
        """Cannot mark another user's notification."""
        notifs = client.get("/api/tutoria/notifications", headers=admin_headers).json()
        if not notifs:
            pytest.skip("No admin notifications")
        nid = notifs[0]["id"]
        resp = client.patch(f"/api/tutoria/notifications/{nid}/read",
                            headers=student_headers)
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 13. LEARNING SHEETS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLearningSheets:
    """Secção 6: Fichas de aprendizagem.
    List/create/review: is_tutor_or_above (is_tutor, MANAGER, ADMIN).
    Mine: any authenticated. Submit: sheet owner only.
    """

    def test_list_sheets_admin(self, admin_headers):
        resp = client.get("/api/tutoria/learning-sheets", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_sheets_tutor(self, tutor_headers):
        """Tutor (is_tutor) can list learning sheets."""
        resp = client.get("/api/tutoria/learning-sheets", headers=tutor_headers)
        assert resp.status_code == 200

    def test_list_sheets_student_forbidden(self, student_headers):
        resp = client.get("/api/tutoria/learning-sheets", headers=student_headers)
        assert resp.status_code == 403

    def test_list_sheets_trainer_forbidden(self, trainer_headers):
        """Trainer (role TRAINER without is_tutor) cannot list sheets."""
        resp = client.get("/api/tutoria/learning-sheets", headers=trainer_headers)
        assert resp.status_code == 403

    def test_create_sheet_tutor(self, tutor_headers):
        """Tutor creates learning sheet linked to error."""
        resp = client.post("/api/tutoria/learning-sheets", headers=tutor_headers,
                           json={"error_id": st.error_id,
                                 "title": "Ficha teste V4",
                                 "error_summary": "Resumo do erro para aprendizagem"})
        assert resp.status_code == 201
        st.sheet_id = resp.json()["id"]

    def test_my_sheets_admin(self, admin_headers):
        resp = client.get("/api/tutoria/learning-sheets/mine", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_my_sheets_student(self, student_headers):
        """Any authenticated user can see their own sheets."""
        resp = client.get("/api/tutoria/learning-sheets/mine", headers=student_headers)
        assert resp.status_code == 200

    def test_submit_reflection_wrong_user(self, student_headers):
        """Cannot submit reflection for someone else's sheet."""
        resp = client.post("/api/tutoria/learning-sheets/999999/submit",
                           headers=student_headers,
                           json={"reflection": "hack"})
        assert resp.status_code == 404

    def test_review_sheet_student_forbidden(self, student_headers):
        """Student cannot review sheets."""
        resp = client.patch("/api/tutoria/learning-sheets/999999/review",
                            headers=student_headers,
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

    def test_dashboard_student(self, student_headers):
        resp = client.get("/api/tutoria/dashboard", headers=student_headers)
        assert resp.status_code == 200

    def test_dashboard_unauthenticated(self):
        resp = client.get("/api/tutoria/dashboard")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# 15. UTILITY — students, team
# ═══════════════════════════════════════════════════════════════════════════════

class TestUtility:
    """Listar alunos e equipa.
    Requires is_chefe_referente_manager OR is_tutor_or_above.
    """

    def test_list_students_admin(self, admin_headers):
        resp = client.get("/api/tutoria/students", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_students_tutor(self, tutor_headers):
        """Tutor can list students."""
        resp = client.get("/api/tutoria/students", headers=tutor_headers)
        assert resp.status_code == 200

    def test_list_students_student_forbidden(self, student_headers):
        resp = client.get("/api/tutoria/students", headers=student_headers)
        assert resp.status_code == 403

    def test_list_team_admin(self, admin_headers):
        resp = client.get("/api/tutoria/team", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        if resp.json():
            u = resp.json()[0]
            assert "role" in u
            assert "is_tutor" in u
            assert "is_team_lead" in u
            assert "is_referente" in u

    def test_list_team_student_forbidden(self, student_headers):
        resp = client.get("/api/tutoria/team", headers=student_headers)
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 16. DEACTIVATE ERROR — Admin only
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

    def test_deactivate_success_admin(self, admin_headers):
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "Deactivate success", "severity": "BAIXA"})
        eid = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{eid}/deactivate",
                           headers=admin_headers,
                           json={"reason": "Registo duplicado"})
        assert resp.status_code == 200

    def test_deactivate_student_forbidden(self, student_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/deactivate",
                           headers=student_headers,
                           json={"reason": "Hack"})
        assert resp.status_code == 403

    def test_deactivate_chefe_forbidden(self, chefe_headers):
        """Deactivate requires ADMIN — even chefe (MANAGER) is forbidden."""
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/deactivate",
                           headers=chefe_headers,
                           json={"reason": "Hack"})
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 17. VERIFY ERROR — Admin only
# ═══════════════════════════════════════════════════════════════════════════════

class TestVerifyError:

    def test_verify_not_concluido(self, admin_headers):
        """Cannot verify error that is not CONCLUIDO."""
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13", "description": "Verify not ready", "severity": "BAIXA"})
        eid = r.json()["id"]
        resp = client.post(f"/api/tutoria/errors/{eid}/verify", headers=admin_headers)
        assert resp.status_code == 400

    def test_verify_student_forbidden(self, student_headers):
        resp = client.post(f"/api/tutoria/errors/{st.error_id}/verify",
                           headers=student_headers)
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 18. FULL WORKFLOW — end-to-end com múltiplos perfis
# ═══════════════════════════════════════════════════════════════════════════════

class TestFullWorkflow:
    """Testes end-to-end do fluxo completo da incidência."""

    def test_full_lifecycle_admin(self, admin_headers):
        """
        1. Create error → REGISTERED
        2. Save analysis → ANALYSIS
        3. Submit analysis → PENDING_TUTOR_REVIEW
        4. Approve plans → APPROVED
        5. Confirm solution → PENDING_TUTOR_REVIEW
        6. Resolve → RESOLVED
        """
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-13",
            "description": "Lifecycle test — full workflow (admin)",
            "severity": "ALTA",
            "refs": [{"referencia": "LC001", "divisa": "EUR", "importe": 500}],
        })
        assert r.status_code == 201
        eid = r.json()["id"]
        assert r.json()["status"] == "REGISTERED"

        r2 = client.patch(f"/api/tutoria/errors/{eid}/analysis",
                          headers=admin_headers,
                          json={"impact_level": "ALTO", "impact_detail": "REGULATORIO"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "ANALYSIS"

        r3 = client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                         headers=admin_headers)
        assert r3.status_code == 200
        assert r3.json()["status"] == "PENDING_TUTOR_REVIEW"

        r4 = client.post(f"/api/tutoria/errors/{eid}/approve-plans",
                         headers=admin_headers)
        assert r4.status_code == 200
        assert r4.json()["status"] == "APPROVED"

        r5 = client.post(f"/api/tutoria/errors/{eid}/confirm-solution",
                         headers=admin_headers,
                         json={"date_solution": "2026-03-13", "solution": "Admin lifecycle solution"})
        assert r5.status_code == 200
        assert r5.json()["status"] == "PENDING_TUTOR_REVIEW"

        r6 = client.post(f"/api/tutoria/errors/{eid}/resolve",
                         headers=admin_headers)
        assert r6.status_code == 200
        assert r6.json()["status"] == "RESOLVED"

    def test_multi_role_workflow(self, admin_headers, chefe_headers,
                                referente_headers, tutor_headers):
        """
        Multi-role flow:
        1. Admin creates error → REGISTERED
        2. Chefe analyzes → ANALYSIS
        3. Chefe submits → PENDING_TUTOR_REVIEW
        4. Tutor approves → APPROVED
        5. Chefe confirms solution → PENDING_TUTOR_REVIEW
        6. Tutor resolves → RESOLVED
        """
        r = client.post("/api/tutoria/errors", headers=admin_headers, json={
            "date_occurrence": "2026-03-14",
            "description": "Multi-role workflow test",
            "severity": "ALTA",
        })
        assert r.status_code == 201
        eid = r.json()["id"]

        # Chefe analyzes
        r2 = client.patch(f"/api/tutoria/errors/{eid}/analysis",
                          headers=chefe_headers,
                          json={"impact_level": "ALTO", "solution": "Plano correctivo"})
        assert r2.status_code == 200

        # Chefe submits
        r3 = client.post(f"/api/tutoria/errors/{eid}/submit-analysis",
                         headers=chefe_headers)
        assert r3.status_code == 200
        assert r3.json()["status"] == "PENDING_TUTOR_REVIEW"

        # Tutor approves
        r4 = client.post(f"/api/tutoria/errors/{eid}/approve-plans",
                         headers=tutor_headers)
        assert r4.status_code == 200
        assert r4.json()["status"] == "APPROVED"

        # Chefe confirms solution
        r5 = client.post(f"/api/tutoria/errors/{eid}/confirm-solution",
                         headers=chefe_headers,
                         json={"date_solution": "2026-03-14", "solution": "Solução multi-role"})
        assert r5.status_code == 200
        assert r5.json()["status"] == "PENDING_TUTOR_REVIEW"

        # Tutor resolves
        r6 = client.post(f"/api/tutoria/errors/{eid}/resolve",
                         headers=tutor_headers)
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
                         json={"tutorado_id": st.student_id, "plan_type": "PREVENTIVO",
                               "description": "Prevenir recorrência"})
        assert rp.status_code == 201
        pid = rp.json()["id"]

        rs = client.post(f"/api/tutoria/plans/{pid}/submit", headers=admin_headers)
        assert rs.status_code == 200
        assert rs.json()["status"] == "APROVADO"

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
                         json={"tutorado_id": st.student_id, "plan_type": "MELHORIA",
                               "description": "Desenvolvimento competências"})
        pid = rp.json()["id"]

        r1 = client.patch(f"/api/tutoria/plans/{pid}/start", headers=admin_headers)
        assert r1.status_code == 200
        assert r1.json()["status"] == "IN_PROGRESS"

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
            resp = client.get(url)
            assert resp.status_code == 401, f"{url} returned {resp.status_code} instead of 401"

    def test_empty_description_error(self, admin_headers):
        resp = client.post("/api/tutoria/errors", headers=admin_headers,
                           json={"date_occurrence": "2026-03-13", "severity": "BAIXA"})
        assert resp.status_code == 422  # Missing required field
