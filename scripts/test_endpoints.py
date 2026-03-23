#!/usr/bin/env python3
"""
test_endpoints.py — Teste completo de todos os endpoints por role.

Executa em sequência:
  1. SETUP   — Cria utilizadores, dados-mestre e dados operacionais via API
  2. TESTES  — Testa cada endpoint com o(s) role(s) correcto(s)
  3. REPORT  — Gera relatório .md e .html com pass/fail por endpoint

Pré-requisito: backend em execução (Docker ou local)
Uso:
  python scripts/test_endpoints.py
  python scripts/test_endpoints.py --url http://localhost:8100
  python scripts/test_endpoints.py --url http://localhost:8100 --reset
  python scripts/test_endpoints.py --skip-setup   # só testa (dados já existem)
  python scripts/test_endpoints.py --report-only  # lê último run.json e regenera relatório
"""
from __future__ import annotations

import argparse, json, os, sys, time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

# ── CLI ────────────────────────────────────────────────────────────────────────
ap = argparse.ArgumentParser()
ap.add_argument("--url",         default="http://localhost:8100", help="URL base do backend")
ap.add_argument("--reset",       action="store_true", help="Limpar BD antes de correr (chama seed --reset)")
ap.add_argument("--skip-setup",  action="store_true", help="Não criar dados (já existem)")
ap.add_argument("--report-only", action="store_true", help="Só regenera relatório do último run")
ap.add_argument("--verbose",     action="store_true", help="Mostrar cada chamada HTTP")
args = ap.parse_args()

BASE = args.url.rstrip("/")
V    = args.verbose

# ── Dependências ───────────────────────────────────────────────────────────────
try:
    import requests
except ImportError:
    sys.exit("❌  Instalar: pip install requests")

# ── Cores terminal ─────────────────────────────────────────────────────────────
GREEN  = "\033[32m"
RED    = "\033[31m"
YELLOW = "\033[33m"
CYAN   = "\033[36m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):  print(f"  {GREEN}✓{RESET} {msg}")
def err(msg): print(f"  {RED}✗{RESET} {msg}")
def info(msg):print(f"  {CYAN}→{RESET} {msg}")
def warn(msg):print(f"  {YELLOW}⚠{RESET} {msg}")

# ══════════════════════════════════════════════════════════════════════════════
# ESTADO GLOBAL — IDs criados durante o setup
# ══════════════════════════════════════════════════════════════════════════════
class S:
    # Tokens por role
    tok: dict[str, str] = {}

    # User IDs
    admin_id      = 1
    manager_id    = None
    trainer_id    = None
    tutor_id      = None
    student_id    = None
    liberador_id  = None
    referente_id  = None

    # Master data
    bank_id       = None
    product_id    = None
    team_id       = None
    category_id   = None
    impact_id     = None
    origin_id     = None
    detected_id   = None
    dept_id       = None
    activity_id   = None
    errtype_id    = None

    # Formações
    course_id     = None
    lesson_id     = None
    challenge_id  = None
    plan_id       = None          # training plan
    assignment_id = None
    submission_id = None
    certificate_id= None

    # Tutoria
    t_cat_id      = None
    t_error_id    = None
    t_plan_id     = None
    t_item_id     = None
    t_sheet_id    = None
    capsula_id    = None
    notif_id      = None

    # Erros internos
    senso_id      = None
    ie_id         = None          # internal error
    ie_plan_id    = None
    ie_item_id    = None
    ie_sheet_id   = None

    # Feedback
    survey_id     = None
    response_id   = None

    # Chamados
    chamado_id    = None

    # Org hierarchy
    org_node_id   = None

    # Ratings
    rating_id     = None

    # FAQ
    faq_id        = None

# ══════════════════════════════════════════════════════════════════════════════
# HTTP helpers
# ══════════════════════════════════════════════════════════════════════════════
_session = requests.Session()
_session.headers.update({"Content-Type": "application/json"})

def _headers(role: str = "admin") -> dict:
    tok = S.tok.get(role, "")
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"} if tok else {}

def _req(method: str, path: str, role: str = "admin", **kwargs) -> requests.Response:
    url = f"{BASE}{path}"
    r = _session.request(method, url, headers=_headers(role), timeout=15, **kwargs)
    if V:
        color = GREEN if r.status_code < 300 else RED
        print(f"    {color}{method:6}{RESET} {path} → {r.status_code}")
    return r

def _get(path, role="admin", **kw):   return _req("GET",    path, role, **kw)
def _post(path, role="admin", **kw):  return _req("POST",   path, role, **kw)
def _put(path, role="admin", **kw):   return _req("PUT",    path, role, **kw)
def _patch(path, role="admin", **kw): return _req("PATCH",  path, role, **kw)
def _delete(path, role="admin", **kw):return _req("DELETE", path, role, **kw)

def _login(email: str, password: str = "test123") -> Optional[str]:
    """Login e retorna token. Tenta até 3x com backoff (rate limit 5/min)."""
    for attempt in range(3):
        try:
            r = requests.post(f"{BASE}/api/auth/login",
                              json={"email": email, "password": password}, timeout=10)
            if r.status_code == 200:
                return r.json().get("access_token")
            if r.status_code == 429:
                wait = 15 * (attempt + 1)
                warn(f"Rate limit em login ({email}), aguardando {wait}s...")
                time.sleep(wait)
            else:
                return None
        except Exception as e:
            warn(f"Erro de ligação: {e}")
            time.sleep(3)
    return None

def _id(r: requests.Response) -> Optional[int]:
    """Extrai o id da resposta JSON."""
    try:
        data = r.json()
        return data.get("id")
    except Exception:
        return None

# ══════════════════════════════════════════════════════════════════════════════
# FASE 1 — LOGIN DE TODOS OS ROLES
# ══════════════════════════════════════════════════════════════════════════════
USERS = {
    "admin":     "admin@tradehub.com",
    "manager":   "manager@tradehub.com",
    "trainer":   "trainer@tradehub.com",
    "tutor":     "tutor@tradehub.com",
    "student":   "student@tradehub.com",
    "liberador": "liberador@tradehub.com",
    "referente": "referente@tradehub.com",
}

def phase_login():
    print(f"\n{BOLD}━━━ FASE 1 — Login por role ━━━{RESET}")
    for role, email in USERS.items():
        tok = _login(email)
        if tok:
            S.tok[role] = tok
            ok(f"{role:12} ({email})")
        else:
            err(f"{role:12} ({email}) — falha no login")
    if "admin" not in S.tok:
        sys.exit(f"{RED}❌  Admin não autenticado — verificar se o backend está a correr em {BASE}{RESET}")

# ══════════════════════════════════════════════════════════════════════════════
# FASE 2 — SETUP: criar utilizadores de teste se não existirem
# ══════════════════════════════════════════════════════════════════════════════
def _ensure_user(email: str, full_name: str, role: str, **flags) -> Optional[int]:
    """Cria utilizador via API ou encontra o existente."""
    # Verificar se existe
    r = _get(f"/api/admin/users?page_size=200", "admin")
    if r.status_code == 200:
        users = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        for u in users:
            if u.get("email") == email:
                return u["id"]
    # Criar
    payload = {
        "full_name": full_name, "email": email, "password": "test123",
        "role": role, "is_active": True, **flags
    }
    r2 = _post("/api/admin/users", "admin", json=payload)
    if r2.status_code in (200, 201):
        return _id(r2)
    return None

def phase_users():
    print(f"\n{BOLD}━━━ FASE 2 — Utilizadores ━━━{RESET}")
    # Admin — já existe (id=1)
    r = _get("/api/admin/users/1", "admin")
    if r.status_code == 200:
        ok(f"admin  id=1  ({r.json().get('email')})")

    uid = _ensure_user("manager@tradehub.com", "Manager Teste",
                       "MANAGER", is_team_lead=True)
    S.manager_id = uid; ok(f"manager   id={uid}")

    uid = _ensure_user("trainer@tradehub.com", "Trainer Teste",
                       "TRAINER", is_pending=False)
    S.trainer_id = uid; ok(f"trainer   id={uid}")

    uid = _ensure_user("tutor@tradehub.com", "Tutor Teste",
                       "TRAINEE", is_tutor=True)
    S.tutor_id = uid; ok(f"tutor     id={uid}")

    uid = _ensure_user("student@tradehub.com", "Student Teste",
                       "TRAINEE")
    S.student_id = uid; ok(f"student   id={uid}")

    uid = _ensure_user("liberador@tradehub.com", "Liberador Teste",
                       "TRAINEE", is_liberador=True)
    S.liberador_id = uid; ok(f"liberador id={uid}")

    uid = _ensure_user("referente@tradehub.com", "Referente Teste",
                       "TRAINEE", is_referente=True)
    S.referente_id = uid; ok(f"referente id={uid}")

    # Re-login para obter tokens com as flags actualizadas
    time.sleep(1)
    phase_login()

# ══════════════════════════════════════════════════════════════════════════════
# FASE 3 — MASTER DATA
# ══════════════════════════════════════════════════════════════════════════════
def _find_or_create_list(path: str, name: str, extra: dict = {}) -> Optional[int]:
    """Cria item numa lista ou encontra pelo nome."""
    r = _post(path, "admin", json={"name": name, **extra})
    if r.status_code in (200, 201):
        return _id(r)
    # Já existe — procurar
    rl = _get(path, "admin")
    if rl.status_code == 200:
        items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
        for it in items:
            if it.get("name") == name:
                return it["id"]
    return None

def phase_master_data():
    print(f"\n{BOLD}━━━ FASE 3 — Dados Mestres ━━━{RESET}")

    # Banks
    r = _post("/api/admin/banks", "admin", json={"name": "BSA - Banco Santander SA", "code": "BSA"})
    if r.status_code not in (200, 201):
        rl = _get("/api/admin/banks", "admin")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
            if items: S.bank_id = items[0]["id"]
    else:
        S.bank_id = _id(r)
    ok(f"bank    id={S.bank_id}")

    # Products
    r = _post("/api/admin/products", "admin", json={"name": "Créditos Documentários", "code": "CRED_IMP"})
    if r.status_code not in (200, 201):
        rl = _get("/api/admin/products", "admin")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
            if items: S.product_id = items[0]["id"]
    else:
        S.product_id = _id(r)
    ok(f"product id={S.product_id}")

    # Teams
    r = _post("/api/teams", "admin", json={
        "name": "CREDITOS DOCUMENTARIOS",
        "description": "Equipa de Créditos Documentários",
        "manager_id": S.manager_id
    })
    if r.status_code not in (200, 201):
        rl = _get("/api/teams", "admin")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
            if items: S.team_id = items[0]["id"]
    else:
        S.team_id = _id(r)
    ok(f"team    id={S.team_id}")

    # Adicionar membros à equipa
    if S.team_id and S.student_id:
        _post(f"/api/teams/{S.team_id}/members", "admin", json={"user_id": S.student_id})
    if S.team_id and S.liberador_id:
        _post(f"/api/teams/{S.team_id}/members", "admin", json={"user_id": S.liberador_id})

    # Error categories (tutoria)
    S.t_cat_id = _find_or_create_list("/api/tutoria/categories", "Conhecimento do Produto")
    ok(f"tutoria_category id={S.t_cat_id}")

    # Master data lookups
    S.impact_id   = _find_or_create_list("/api/admin/master/impacts",      "ALTA")
    S.origin_id   = _find_or_create_list("/api/admin/master/origins",      "Trade_Procesos")
    S.detected_id = _find_or_create_list("/api/admin/master/detected-by",  "Operador")
    S.dept_id     = _find_or_create_list("/api/admin/master/departments",  "Back Office")
    S.activity_id = _find_or_create_list("/api/admin/master/activities",   "Processamento LC")
    S.errtype_id  = _find_or_create_list("/api/admin/master/error-types",  "Omissão de Dados")
    ok(f"master lookups: impact={S.impact_id} origin={S.origin_id} dept={S.dept_id}")

    # Org hierarchy
    r = _post("/api/org/nodes", "admin", json={
        "name": "SANTANDER TRADE FINANCE", "description": "Raiz", "parent_id": None, "position": 0
    })
    if r.status_code in (200, 201):
        S.org_node_id = _id(r)
    else:
        rl = _get("/api/org/tree", "admin")
        if rl.status_code == 200:
            nodes = rl.json()
            if nodes: S.org_node_id = nodes[0]["id"]
    ok(f"org_node id={S.org_node_id}")

    # FAQ
    r = _post("/api/chat/faqs", "admin", json={
        "question_pt": "Como criar um chamado?",
        "answer_pt": "Aceda ao Portal de Chamados e clique em Novo.",
        "question_es": "¿Cómo crear un ticket?",
        "answer_es": "Acceda al Portal de Chamados y haga clic en Nuevo.",
        "question_en": "How to create a ticket?",
        "answer_en": "Go to the Chamados Portal and click New.",
        "priority": 1, "is_active": True, "roles": []
    })
    S.faq_id = _id(r) if r.status_code in (200, 201) else None
    ok(f"faq     id={S.faq_id}")

# ══════════════════════════════════════════════════════════════════════════════
# FASE 4 — FORMAÇÕES
# ══════════════════════════════════════════════════════════════════════════════
def phase_formacoes():
    print(f"\n{BOLD}━━━ FASE 4 — Formações ━━━{RESET}")

    # Curso
    r = _post("/api/trainer/courses", "trainer", json={
        "title": "Créditos Documentários — Nível I",
        "description": "Curso base de créditos documentários de importação",
        "level": "BEGINNER",
        "bank_ids":    [S.bank_id]    if S.bank_id    else [],
        "product_ids": [S.product_id] if S.product_id else [],
    })
    if r.status_code in (200, 201):
        S.course_id = _id(r)
    else:
        rl = _get("/api/trainer/courses", "trainer")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
            if items: S.course_id = items[0]["id"]
    ok(f"course  id={S.course_id}")

    # Lição
    r = _post("/api/trainer/lessons", "trainer", json={
        "title":       "Abertura de Carta de Crédito",
        "description": "Processo completo de abertura de LC de importação",
        "content":     "Conteúdo detalhado sobre abertura de LC...",
        "course_id":   S.course_id,
        "position":    1,
        "estimated_minutes": 45,
    })
    if r.status_code in (200, 201):
        S.lesson_id = _id(r)
    else:
        if S.course_id:
            rl = _get(f"/api/admin/courses/{S.course_id}", "admin")
            if rl.status_code == 200:
                lessons = rl.json().get("lessons", [])
                if lessons: S.lesson_id = lessons[0]["id"]
    ok(f"lesson  id={S.lesson_id}")

    # Desafio
    r = _post("/api/challenges/", "trainer", json={
        "title":       "Desafio LC Importação — Caso Prático",
        "description": "Executar operação completa de LC",
        "difficulty":  "MEDIUM",
        "course_id":   S.course_id,
        "parts":       [
            {"description": "Verificar documentação apresentada", "position": 1},
            {"description": "Inserir dados no sistema operacional", "position": 2},
            {"description": "Calcular comissões e juros", "position": 3},
        ],
    })
    if r.status_code in (200, 201):
        S.challenge_id = _id(r)
    else:
        if S.course_id:
            rl = _get(f"/api/challenges/course/{S.course_id}", "admin")
            if rl.status_code == 200:
                chals = rl.json()
                if chals: S.challenge_id = chals[0]["id"]
    ok(f"challenge id={S.challenge_id}")

    # Plano de formação
    r = _post("/api/trainer/training-plans", "trainer", json={
        "title":       "Plano Formação LC — Q1 2026",
        "description": "Plano trimestral de formação em créditos documentários",
        "trainer_id":  S.trainer_id,
        "student_ids": [S.student_id] if S.student_id else [],
        "course_ids":  [S.course_id]  if S.course_id  else [],
        "bank_ids":    [S.bank_id]    if S.bank_id    else [],
        "product_ids": [S.product_id] if S.product_id else [],
    })
    if r.status_code in (200, 201):
        S.plan_id = _id(r)
    else:
        rl = _get("/api/trainer/training-plans", "trainer")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
            if items: S.plan_id = items[0]["id"]
    ok(f"training_plan id={S.plan_id}")

    # Inscrever estudante no curso
    if S.course_id and S.student_id:
        _post(f"/api/student/enroll/{S.course_id}", "student")
        ok("student enrolled in course")

    # Libertar desafio ao estudante
    if S.challenge_id and S.student_id:
        r = _post(f"/api/challenges/{S.challenge_id}/release/{S.student_id}", "trainer")
        ok(f"challenge released → student (status {r.status_code})")

    # Estudante executa lição
    if S.lesson_id:
        _post(f"/api/lessons/{S.lesson_id}/start",  "student")
        time.sleep(1)
        _post(f"/api/lessons/{S.lesson_id}/pause",  "student")
        time.sleep(1)
        _post(f"/api/lessons/{S.lesson_id}/resume", "student")
        time.sleep(1)
        _post(f"/api/lessons/{S.lesson_id}/finish", "student")
        _post(f"/api/lessons/{S.lesson_id}/confirm","student")
        ok("lesson lifecycle: start→pause→resume→finish→confirm")

    # Estudante inicia desafio
    if S.challenge_id:
        r = _post(f"/api/challenges/submit/complete/start/{S.challenge_id}/self", "student")
        if r.status_code in (200, 201):
            S.submission_id = r.json().get("submission_id") or _id(r)
        ok(f"challenge started → submission id={S.submission_id}")

    # Submeter partes do desafio
    if S.submission_id:
        r = _post(f"/api/challenges/submit/complete/{S.submission_id}/part", "student",
                  json={"description": "Verificação concluída", "time_seconds": 120})
        r = _post(f"/api/challenges/submit/complete/{S.submission_id}/finish", "student",
                  json={"total_time_seconds": 300})
        r = _post(f"/api/challenges/submissions/{S.submission_id}/submit-for-review", "student")
        ok(f"challenge submitted for review (status {r.status_code})")

    # Trainer aprova submissão
    if S.submission_id:
        r = _patch(f"/api/challenges/submissions/{S.submission_id}/finalize-review", "trainer",
                   json={"approved": True, "feedback": "Excelente execução!"})
        if r.status_code not in (200, 201):
            r = _post(f"/api/challenges/submissions/{S.submission_id}/finalize-review", "trainer",
                      json={"approved": True, "feedback": "Excelente execução!"})
        ok(f"submission reviewed (status {r.status_code})")

    # Finalizar plano e gerar certificado
    if S.plan_id and S.course_id:
        _post(f"/api/finalization/course/{S.plan_id}/{S.course_id}/finalize", "trainer",
              json={"student_id": S.student_id})
        r = _post(f"/api/finalization/plan/{S.plan_id}/finalize", "trainer",
                  json={"generate_certificate": True, "student_id": S.student_id})
        ok(f"plan finalized (status {r.status_code})")
        # Obter certificado
        rc = _get("/api/certificates/", "student")
        if rc.status_code == 200:
            certs = rc.json()
            if certs: S.certificate_id = certs[0]["id"]
        ok(f"certificate id={S.certificate_id}")

# ══════════════════════════════════════════════════════════════════════════════
# FASE 5 — TUTORIA
# ══════════════════════════════════════════════════════════════════════════════
def phase_tutoria():
    print(f"\n{BOLD}━━━ FASE 5 — Tutoria ━━━{RESET}")

    # Erro de tutoria
    r = _post("/api/tutoria/errors", "tutor", json={
        "title":        "Erro na abertura de LC — dados incompletos",
        "description":  "O operador não inseriu corretamente os dados da mercadoria",
        "category_id":  S.t_cat_id,
        "severity":     "ALTA",
        "tutorado_id":  S.student_id,
        "bank_id":      S.bank_id,
        "product_id":   S.product_id,
        "motivos":      ["KNOWLEDGE"],
    })
    if r.status_code in (200, 201):
        S.t_error_id = _id(r)
    else:
        rl = _get("/api/tutoria/errors", "tutor")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("errors", [])
            if items: S.t_error_id = items[0]["id"]
    ok(f"tutoria_error id={S.t_error_id}")

    if not S.t_error_id: return

    # Adicionar comentário ao erro
    _post(f"/api/tutoria/errors/{S.t_error_id}/comments", "tutor",
          json={"content": "Erro confirmado. A iniciar análise."})
    ok("comment added to error")

    # Análise do tutor
    _patch(f"/api/tutoria/errors/{S.t_error_id}/analysis", "tutor",
           json={"analysis": "Falta de conhecimento sobre requisitos documentais de LC."})
    _patch(f"/api/tutoria/errors/{S.t_error_id}/tutor-review", "tutor",
           json={"review": "Necessário plano de formação específico sobre documentação LC."})
    ok("tutor analysis + review added")

    # Submeter análise
    r = _post(f"/api/tutoria/errors/{S.t_error_id}/submit-analysis", "tutor")
    ok(f"analysis submitted (status {r.status_code})")

    # Plano de acção
    r = _post(f"/api/tutoria/errors/{S.t_error_id}/plans", "tutor", json={
        "title":       "Plano de Acção — Formação LC Documentação",
        "description": "Reforço de conhecimentos sobre documentação exigida em LC",
        "type":        "CORRECTIVO",
        "due_date":    (datetime.now(timezone.utc).replace(tzinfo=None)
                        .__str__()[:10]),
        "responsible_id": S.student_id,
    })
    if r.status_code in (200, 201):
        S.t_plan_id = _id(r)
    else:
        rl = _get("/api/tutoria/plans", "tutor")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("plans", [])
            if items: S.t_plan_id = items[0]["id"]
    ok(f"action_plan id={S.t_plan_id}")

    if S.t_plan_id:
        # Item do plano
        r = _post(f"/api/tutoria/plans/{S.t_plan_id}/items", "tutor",
                  json={"description": "Estudar Guia de Documentação LC", "position": 1})
        S.t_item_id = _id(r)
        ok(f"plan_item id={S.t_item_id}")

        # Submeter e aprovar plano
        _post(f"/api/tutoria/plans/{S.t_plan_id}/submit", "student")
        _post(f"/api/tutoria/plans/{S.t_plan_id}/approve", "tutor",
              json={"notes": "Plano adequado."})
        ok("plan submitted + approved")

        # Adicionar comentário ao plano
        _post(f"/api/tutoria/plans/{S.t_plan_id}/comments", "student",
              json={"content": "A trabalhar nos itens do plano."})

    # Ficha de aprendizagem
    r = _post("/api/tutoria/learning-sheets", "tutor", json={
        "title":      "Ficha — Documentação LC Importação",
        "content":    "Lista de documentos obrigatórios numa LC de importação...",
        "student_id": S.student_id,
        "error_id":   S.t_error_id,
    })
    if r.status_code in (200, 201):
        S.t_sheet_id = _id(r)
        ok(f"learning_sheet id={S.t_sheet_id}")

    # Cápsula
    r = _post("/api/tutoria/capsulas", "tutor", json={
        "title":       "Cápsula — Abertura de LC de Importação",
        "description": "Guia rápido para abertura de LC",
        "level":       "BEGINNER",
        "type":        "VIDEO",
        "content_url": "https://intranet.santander.pt/lc-importacao",
    })
    S.capsula_id = _id(r) if r.status_code in (200, 201) else None
    ok(f"capsula id={S.capsula_id}")

    # Side-by-side
    r = _post("/api/tutoria/plans/side-by-side", "tutor", json={
        "student_id":  S.student_id,
        "title":       "Treino LC ao lado — Fev 2026",
        "description": "Supervisão directa no processamento de LC",
        "date":        datetime.now(timezone.utc).date().__str__(),
        "mpu_minutes": 35,
    })
    ok(f"side_by_side plan (status {r.status_code})")

    # Notificações
    rn = _get("/api/tutoria/notifications", "student")
    if rn.status_code == 200:
        notifs = rn.json()
        if notifs: S.notif_id = notifs[0]["id"]
    ok(f"notification id={S.notif_id}")

# ══════════════════════════════════════════════════════════════════════════════
# FASE 6 — ERROS INTERNOS + FEEDBACK
# ══════════════════════════════════════════════════════════════════════════════
def phase_internal_and_feedback():
    print(f"\n{BOLD}━━━ FASE 6 — Erros Internos + Feedback ━━━{RESET}")

    # Censo
    r = _post("/api/internal-errors/sensos", "tutor", json={
        "name":        "Censo Operacional — Q1 2026",
        "description": "Levantamento de erros operacionais do trimestre",
        "start_date":  "2026-01-01",
        "end_date":    "2026-03-31",
    })
    S.senso_id = _id(r) if r.status_code in (200, 201) else None
    ok(f"senso id={S.senso_id}")

    # Erro interno
    r = _post("/api/internal-errors/errors", "liberador", json={
        "title":          "Erro de inserção — campos LC em branco",
        "description":    "Grabador não preencheu todos os campos obrigatórios",
        "impact_id":      S.impact_id,
        "origin_id":      S.origin_id,
        "detected_by_id": S.detected_id,
        "department_id":  S.dept_id,
        "activity_id":    S.activity_id,
        "error_type_id":  S.errtype_id,
        "bank_id":        S.bank_id,
        "grabador_id":    S.student_id,
    })
    if r.status_code in (200, 201):
        S.ie_id = _id(r)
    else:
        rl = _get("/api/internal-errors/errors", "tutor")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("errors", [])
            if items: S.ie_id = items[0]["id"]
    ok(f"internal_error id={S.ie_id}")

    if S.ie_id:
        # Plano de acção interno
        r = _post(f"/api/internal-errors/errors/{S.ie_id}/action-plan", "tutor", json={
            "title":       "Plano Qualidade — Campos obrigatórios LC",
            "description": "Reforço de procedimentos de inserção de dados",
        })
        if r.status_code in (200, 201):
            S.ie_plan_id = _id(r)

        # Ficha de aprendizagem interna
        r = _post(f"/api/internal-errors/errors/{S.ie_id}/learning-sheet", "tutor", json={
            "title":   "Ficha — Campos obrigatórios operação LC",
            "content": "Checklist de campos obrigatórios a verificar antes de submeter operação LC.",
        })
        if r.status_code in (200, 201):
            S.ie_sheet_id = _id(r)
            ok(f"ie_sheet id={S.ie_sheet_id}")

        # Marcar ficha como lida
        if S.ie_sheet_id:
            _post(f"/api/internal-errors/learning-sheets/{S.ie_sheet_id}/mark-read", "student")

    # Feedback survey
    r = _post("/api/feedback/surveys", "tutor", json={
        "title":        "Survey Semanal — Semana 12/2026",
        "description":  "Avaliação semanal dos grabadores",
        "week_start":   "2026-03-16",
        "week_end":     "2026-03-22",
        "grabador_ids": [S.student_id] if S.student_id else [],
    })
    if r.status_code in (200, 201):
        S.survey_id = _id(r)
    else:
        rl = _get("/api/feedback/surveys", "tutor")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else rl.json().get("items", [])
            if items: S.survey_id = items[0]["id"]
    ok(f"feedback_survey id={S.survey_id}")

    if S.survey_id:
        r = _post("/api/feedback/responses", "liberador", json={
            "survey_id":   S.survey_id,
            "grabador_id": S.student_id,
            "rating":      3,
            "notes":       "Boa evolução mas ainda precisa de reforço em LC.",
        })
        S.response_id = _id(r) if r.status_code in (200, 201) else None
        ok(f"feedback_response id={S.response_id}")

# ══════════════════════════════════════════════════════════════════════════════
# FASE 7 — CHAMADOS
# ══════════════════════════════════════════════════════════════════════════════
def phase_chamados():
    print(f"\n{BOLD}━━━ FASE 7 — Chamados ━━━{RESET}")
    r = _post("/api/chamados", "student", json={
        "title":       "Erro no carregamento do módulo de desafios",
        "description": "Ao aceder a /my-challenges a página não carrega após reload",
        "type":        "BUG",
        "priority":    "ALTA",
        "portal":      "FORMACOES",
    })
    if r.status_code in (200, 201):
        S.chamado_id = _id(r)
    else:
        rl = _get("/api/chamados", "admin")
        if rl.status_code == 200:
            items = rl.json() if isinstance(rl.json(), list) else []
            if items: S.chamado_id = items[0]["id"]
    ok(f"chamado id={S.chamado_id}")

    if S.chamado_id:
        _post(f"/api/chamados/{S.chamado_id}/comments", "student",
              json={"content": "Acontece em todos os browsers. Testado em Chrome e Firefox."})
        _put(f"/api/chamados/{S.chamado_id}", "admin",
             json={"status": "EM_ANDAMENTO", "assigned_to_id": S.trainer_id,
                   "admin_notes": "A investigar. Possível problema de cache."})
        ok("chamado moved to EM_ANDAMENTO + assigned")

    r = _post("/api/chamados", "trainer", json={
        "title":       "Sugestão — Filtro por data nos relatórios de tutoria",
        "description": "Seria útil poder filtrar os erros de tutoria por período",
        "type":        "MELHORIA", "priority": "MEDIA", "portal": "TUTORIA",
    })
    ok(f"second chamado (status {r.status_code})")

    # Ratings
    if S.course_id:
        r = _post("/api/ratings/submit", "student", json={
            "rating_type": "course", "item_id": S.course_id,
            "score": 5, "comment": "Excelente curso, muito bem estruturado!"
        })
        ok(f"rating submitted (status {r.status_code})")

# ══════════════════════════════════════════════════════════════════════════════
# FASE 8 — TESTES DE TODOS OS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

# Estrutura: (method, path, role, expected_status, description)
# expected_status pode ser lista de códigos aceitáveis

def _build_tests() -> list[tuple]:
    c   = S.course_id    or 1
    l   = S.lesson_id    or 1
    ch  = S.challenge_id or 1
    p   = S.plan_id      or 1
    sub = S.submission_id or 1
    cert= S.certificate_id or 1
    te  = S.t_error_id   or 1
    tp  = S.t_plan_id    or 1
    ti  = S.t_item_id    or 1
    ts  = S.t_sheet_id   or 1
    cap = S.capsula_id   or 1
    ie  = S.ie_id        or 1
    ips = S.ie_plan_id   or 1
    ish = S.ie_sheet_id  or 1
    sv  = S.survey_id    or 1
    ch2 = S.chamado_id   or 1
    org = S.org_node_id  or 1
    faq = S.faq_id       or 1
    cat = S.t_cat_id     or 1
    bid = S.bank_id      or 1
    pid = S.product_id   or 1
    tid = S.team_id      or 1
    iid = S.impact_id    or 1
    sid = S.student_id   or 2
    trid= S.trainer_id   or 3
    mid = S.manager_id   or 4

    tests = [
        # ── PÚBLICO ────────────────────────────────────────────────────────────
        ("GET",  "/api/public/landing",    None,      [200],    "Landing page stats (público)"),
        ("GET",  "/api/health",            None,      [200],    "Health check (público)"),
        ("GET",  "/api/stats/kpis",        None,      [200],    "KPIs públicos"),
        ("GET",  "/api/stats/courses/featured", None, [200],    "Cursos em destaque (público)"),

        # ── AUTH ───────────────────────────────────────────────────────────────
        ("GET",  "/api/auth/me",           "admin",   [200],    "Perfil admin"),
        ("GET",  "/api/auth/me",           "trainer", [200],    "Perfil trainer"),
        ("GET",  "/api/auth/me",           "student", [200],    "Perfil student"),
        ("GET",  "/api/auth/me",           "tutor",   [200],    "Perfil tutor"),
        ("GET",  "/api/auth/me",           "manager", [200],    "Perfil manager"),

        # ── ADMIN — USERS ──────────────────────────────────────────────────────
        ("GET",  "/api/admin/users",       "admin",   [200],    "Listar users (admin)"),
        ("GET",  "/api/admin/users",       "manager", [200],    "Listar users (manager)"),
        ("GET",  f"/api/admin/users/{sid}","admin",   [200],    "Detalhe user (admin)"),
        ("GET",  "/api/admin/users",       "student", [403],    "Listar users (student — proibido)"),
        ("GET",  "/api/admin/pending-trainers", "admin", [200], "Pendentes (admin)"),
        ("GET",  "/api/admin/pending-trainers", "trainer",[403],"Pendentes (trainer — proibido)"),

        # ── ADMIN — MASTER DATA ────────────────────────────────────────────────
        ("GET",  "/api/admin/banks",       "admin",   [200],    "Listar banks (admin)"),
        ("GET",  "/api/admin/banks",       "manager", [200],    "Listar banks (manager)"),
        ("GET",  "/api/admin/banks",       "student", [403],    "Listar banks (student — proibido)"),
        ("GET",  "/api/admin/products",    "admin",   [200],    "Listar products (admin)"),
        ("GET",  "/api/admin/master/impacts",    "admin",   [200], "Listar impacts"),
        ("GET",  "/api/admin/master/origins",    "admin",   [200], "Listar origins"),
        ("GET",  "/api/admin/master/detected-by","admin",   [200], "Listar detected-by"),
        ("GET",  "/api/admin/master/departments","admin",   [200], "Listar departments"),
        ("GET",  "/api/admin/master/activities", "admin",   [200], "Listar activities"),
        ("GET",  "/api/admin/master/error-types","admin",   [200], "Listar error-types"),

        # ── ADMIN — COURSES ────────────────────────────────────────────────────
        ("GET",  "/api/admin/courses",     "admin",   [200],    "Listar cursos (admin)"),
        ("GET",  f"/api/admin/courses/{c}","admin",   [200],    "Detalhe curso (admin)"),

        # ── TRAINER — CURSOS ───────────────────────────────────────────────────
        ("GET",  "/api/trainer/courses",   "trainer", [200],    "Listar cursos (trainer)"),
        ("GET",  f"/api/trainer/courses/details/{c}", "trainer", [200], "Detalhe curso com lições (trainer)"),
        ("GET",  "/api/trainer/training-plans", "trainer", [200], "Listar planos (trainer)"),
        ("GET",  "/api/trainer/students",  "trainer", [200],    "Listar alunos (trainer)"),
        ("GET",  "/api/trainer/stats",     "trainer", [200],    "Stats (trainer)"),
        ("GET",  "/api/trainer/reports/overview", "trainer", [200], "Report overview (trainer)"),

        # ── LESSONS ────────────────────────────────────────────────────────────
        ("GET",  f"/api/lessons/{l}/progress", "student", [200, 404], "Progresso lição (student)"),
        ("GET",  f"/api/lessons/{l}/detail",   "student", [200, 404], "Detalhe lição (student)"),
        ("GET",  "/api/lessons/student/my-lessons", "student", [200],  "Minhas lições (student)"),
        ("GET",  f"/api/lessons/{l}/timer-state",   "student", [200, 404], "Timer state (student)"),

        # ── CHALLENGES ────────────────────────────────────────────────────────
        ("GET",  f"/api/challenges/course/{c}", "student", [200], "Desafios do curso (student)"),
        ("GET",  f"/api/challenges/{ch}",        "student", [200], "Detalhe desafio (student)"),
        ("GET",  "/api/challenges/student/released", "student", [200], "Desafios liberados (student)"),
        ("GET",  f"/api/challenges/{ch}/eligible-students", "trainer", [200], "Alunos elegíveis (trainer)"),
        ("GET",  f"/api/challenges/{ch}/submissions", "trainer", [200], "Submissões desafio (trainer)"),
        ("GET",  "/api/challenges/pending-review/list", "trainer", [200], "Pendentes revisão (trainer)"),
        ("GET",  f"/api/challenges/submissions/{sub}", "student", [200, 404], "Detalhe submissão (student)"),
        ("GET",  "/api/challenges/student/my-submissions", "student", [200], "Minhas submissões (student)"),

        # ── TRAINING PLANS ────────────────────────────────────────────────────
        ("GET",  f"/api/finalization/plan/{p}/status", "trainer", [200, 404], "Status plano (trainer)"),

        # ── STUDENT ───────────────────────────────────────────────────────────
        ("GET",  "/api/student/stats",     "student", [200],    "Stats (student)"),
        ("GET",  "/api/student/courses",   "student", [200],    "Cursos (student)"),
        ("GET",  "/api/student/certificates", "student", [200], "Certs (student)"),
        ("GET",  "/api/student/reports/overview", "student", [200], "Report (student)"),

        # ── CERTIFICATES ──────────────────────────────────────────────────────
        ("GET",  "/api/certificates/",     "student", [200],    "Listar certs (student)"),
        ("GET",  f"/api/certificates/{cert}", "student", [200, 404], "Detalhe cert (student)"),

        # ── RATINGS ───────────────────────────────────────────────────────────
        ("GET",  "/api/ratings/my-ratings", "student", [200],   "Minhas avaliações (student)"),
        ("GET",  "/api/ratings/admin/all",  "admin",   [200],   "Todas avaliações (admin)"),
        ("GET",  "/api/ratings/admin/summary", "admin",[200],   "Resumo avaliações (admin)"),
        ("GET",  "/api/ratings/admin/dashboard","admin",[200],  "Dashboard avaliações (admin)"),
        ("GET",  "/api/ratings/admin/all",  "student", [403],   "Admin ratings (student — proibido)"),

        # ── ADVANCED REPORTS ──────────────────────────────────────────────────
        ("GET",  "/api/advanced-reports/dashboard-summary", "admin", [200], "Advanced summary (admin)"),
        ("GET",  "/api/advanced-reports/student-performance","admin",[200], "Student perf (admin)"),
        ("GET",  "/api/advanced-reports/trainer-productivity","admin",[200],"Trainer prod (admin)"),
        ("GET",  "/api/advanced-reports/course-analytics",  "admin", [200], "Course analytics (admin)"),

        # ── KNOWLEDGE MATRIX ─────────────────────────────────────────────────
        ("GET",  "/api/admin/knowledge-matrix", "admin",  [200], "Knowledge matrix (admin)"),
        ("GET",  "/api/admin/knowledge-matrix", "student",[403], "Knowledge matrix (student — proibido)"),

        # ── TEAMS ─────────────────────────────────────────────────────────────
        ("GET",  "/api/teams",             "admin",   [200],    "Listar equipas (admin)"),
        ("GET",  "/api/teams",             "manager", [200],    "Listar equipas (manager)"),
        ("GET",  "/api/teams",             "student", [403],    "Listar equipas (student — proibido)"),
        ("GET",  f"/api/teams/{tid}",      "admin",   [200, 404],"Detalhe equipa (admin)"),
        ("GET",  f"/api/teams/{tid}/members", "admin",[200, 404],"Membros equipa (admin)"),
        ("GET",  f"/api/teams/{tid}/services","admin",[200, 404],"Serviços equipa (admin)"),

        # ── ORG HIERARCHY ────────────────────────────────────────────────────
        ("GET",  "/api/org/tree",          "admin",   [200],    "Árvore org (admin)"),
        ("GET",  "/api/org/tree",          "manager", [200],    "Árvore org (manager)"),
        ("GET",  "/api/org/tree",          "student", [200],    "Árvore org (student — leitura)"),
        ("GET",  "/api/org/nodes",         "admin",   [200],    "Nós org (admin)"),
        ("GET",  f"/api/org/nodes/{org}/members", "admin", [200, 404], "Membros nó (admin)"),
        ("GET",  "/api/org/audit",         "admin",   [200],    "Auditoria org (admin)"),
        ("GET",  "/api/org/audit",         "manager", [403],    "Auditoria org (manager — proibido)"),
        ("GET",  "/api/org/available-users","admin",  [200],    "Utilizadores disponíveis (admin)"),

        # ── TUTORIA — CATEGORIAS ──────────────────────────────────────────────
        ("GET",  "/api/tutoria/categories","student", [200],    "Categorias tutoria (student)"),
        ("GET",  "/api/tutoria/categories","tutor",   [200],    "Categorias tutoria (tutor)"),

        # ── TUTORIA — ERROS ───────────────────────────────────────────────────
        ("GET",  "/api/tutoria/errors",    "admin",   [200],    "Erros tutoria (admin — todos)"),
        ("GET",  "/api/tutoria/errors",    "tutor",   [200],    "Erros tutoria (tutor — tutorandos)"),
        ("GET",  "/api/tutoria/errors",    "manager", [200],    "Erros tutoria (manager — equipa)"),
        ("GET",  "/api/tutoria/errors",    "student", [200],    "Erros tutoria (student — próprios)"),
        ("GET",  f"/api/tutoria/errors/{te}", "tutor",[200, 404],"Detalhe erro (tutor)"),
        ("GET",  f"/api/tutoria/errors/{te}/comments","tutor",[200, 404],"Comentários erro (tutor)"),
        ("GET",  f"/api/tutoria/errors/{te}/plans",  "tutor",[200, 404],"Planos do erro (tutor)"),

        # ── TUTORIA — PLANOS ──────────────────────────────────────────────────
        ("GET",  "/api/tutoria/plans",     "admin",   [200],    "Planos acção (admin)"),
        ("GET",  "/api/tutoria/plans",     "tutor",   [200],    "Planos acção (tutor)"),
        ("GET",  "/api/tutoria/plans",     "student", [200],    "Planos acção (student — próprios)"),
        ("GET",  f"/api/tutoria/plans/{tp}", "tutor", [200, 404],"Detalhe plano (tutor)"),
        ("GET",  f"/api/tutoria/plans/{tp}/items", "tutor", [200, 404], "Items plano (tutor)"),
        ("GET",  f"/api/tutoria/plans/{tp}/comments","tutor",[200, 404],"Comentários plano (tutor)"),
        ("GET",  "/api/tutoria/my-plans",  "student", [200],    "Meus planos (student)"),

        # ── TUTORIA — OUTROS ──────────────────────────────────────────────────
        ("GET",  "/api/tutoria/dashboard", "tutor",   [200],    "Dashboard tutoria (tutor)"),
        ("GET",  "/api/tutoria/dashboard", "student", [403],    "Dashboard tutoria (student — proibido)"),
        ("GET",  "/api/tutoria/capsulas",  "student", [200],    "Cápsulas (student)"),
        ("GET",  "/api/tutoria/capsulas",  "tutor",   [200],    "Cápsulas (tutor)"),
        ("GET",  "/api/tutoria/notifications", "student", [200],"Notificações (student)"),
        ("GET",  "/api/tutoria/learning-sheets", "tutor", [200],"Fichas aprendizagem (tutor)"),
        ("GET",  "/api/tutoria/learning-sheets/mine","student",[200],"Minhas fichas (student)"),
        ("GET",  "/api/tutoria/students",  "tutor",   [200],    "Alunos do tutor"),
        ("GET",  "/api/tutoria/team",      "tutor",   [200],    "Equipa do tutor"),

        # ── ERROS INTERNOS ────────────────────────────────────────────────────
        ("GET",  "/api/internal-errors/errors",    "tutor",    [200], "Erros internos (tutor)"),
        ("GET",  "/api/internal-errors/errors",    "liberador",[200], "Erros internos (liberador)"),
        ("GET",  "/api/internal-errors/errors",    "student",  [200], "Erros internos (student — próprios)"),
        ("GET",  f"/api/internal-errors/errors/{ie}", "tutor", [200, 404], "Detalhe erro interno (tutor)"),
        ("GET",  "/api/internal-errors/dashboard", "tutor",   [200], "Dashboard erros internos (tutor)"),
        ("GET",  "/api/internal-errors/dashboard", "student", [403], "Dashboard erros internos (student — proibido)"),
        ("GET",  "/api/internal-errors/sensos",    "tutor",   [200], "Censos (tutor)"),
        ("GET",  "/api/internal-errors/sensos",    "student", [200], "Censos (student — listagem)"),
        ("GET",  "/api/internal-errors/my-learning-sheets", "student", [200], "Minhas fichas int. (student)"),
        ("GET",  "/api/internal-errors/lookups/impacts",    "student", [200], "Lookup impacts"),
        ("GET",  "/api/internal-errors/lookups/categories", "student", [200], "Lookup categories"),
        ("GET",  "/api/internal-errors/lookups/error-types","student", [200], "Lookup error-types"),
        ("GET",  "/api/internal-errors/lookups/departments","student", [200], "Lookup departments"),
        ("GET",  "/api/internal-errors/lookups/activities", "student", [200], "Lookup activities"),
        ("GET",  "/api/internal-errors/lookups/banks",      "student", [200], "Lookup banks"),

        # ── FEEDBACK ─────────────────────────────────────────────────────────
        ("GET",  "/api/feedback/surveys",          "tutor",    [200], "Surveys (tutor)"),
        ("GET",  "/api/feedback/surveys",          "liberador",[403], "Surveys (liberador — proibido)"),
        ("GET",  "/api/feedback/my-pending",       "liberador",[200], "Pending surveys (liberador)"),
        ("GET",  "/api/feedback/my-pending",       "student",  [200, 403], "Pending surveys (student)"),
        ("GET",  "/api/feedback/dashboard",        "tutor",    [200], "Feedback dashboard (tutor)"),
        ("GET",  "/api/feedback/dashboard",        "student",  [403], "Feedback dashboard (student — proibido)"),
        ("GET",  f"/api/feedback/surveys/{sv}",    "tutor",    [200, 404], "Detalhe survey (tutor)"),

        # ── CHAMADOS ─────────────────────────────────────────────────────────
        ("GET",  "/api/chamados",          "admin",   [200],    "Chamados (admin — todos)"),
        ("GET",  "/api/chamados",          "manager", [200],    "Chamados (manager — equipa)"),
        ("GET",  "/api/chamados",          "student", [200],    "Chamados (student — próprios)"),
        ("GET",  f"/api/chamados/{ch2}",   "admin",   [200, 404],"Detalhe chamado (admin)"),
        ("GET",  f"/api/chamados/{ch2}",   "student", [200, 404],"Detalhe chamado (student)"),

        # ── RELATÓRIOS ────────────────────────────────────────────────────────
        ("GET",  "/api/relatorios/overview",   "admin",   [200], "Overview (admin)"),
        ("GET",  "/api/relatorios/overview",   "student", [200], "Overview (student)"),
        ("GET",  "/api/relatorios/formacoes",  "admin",   [200], "Formações (admin)"),
        ("GET",  "/api/relatorios/formacoes",  "trainer", [200], "Formações (trainer)"),
        ("GET",  "/api/relatorios/tutoria",    "admin",   [200], "Tutoria (admin)"),
        ("GET",  "/api/relatorios/tutoria",    "student", [200], "Tutoria (student)"),
        ("GET",  "/api/relatorios/teams",      "admin",   [200], "Teams (admin)"),
        ("GET",  "/api/relatorios/teams",      "student", [403], "Teams (student — proibido)"),
        ("GET",  "/api/relatorios/members",    "manager", [200], "Members (manager)"),
        ("GET",  "/api/relatorios/incidents",  "admin",   [200], "Incidents (admin)"),
        ("GET",  "/api/relatorios/incidents",  "student", [403], "Incidents (student — proibido)"),

        # ── DW ────────────────────────────────────────────────────────────────
        ("GET",  "/api/dw/snapshot/latest",    "admin",   [200], "DW snapshot (admin)"),
        ("GET",  "/api/dw/training/by-month",  "admin",   [200], "DW training/month (admin)"),
        ("GET",  "/api/dw/tutoria/by-category","admin",   [200], "DW tutoria/cat (admin)"),
        ("GET",  "/api/dw/chamados/by-status", "admin",   [200], "DW chamados/status (admin)"),
        ("GET",  "/api/dw/teams/overview",     "admin",   [200], "DW teams (admin)"),
        ("GET",  "/api/dw/snapshot/latest",    "student", [403], "DW snapshot (student — proibido)"),

        # ── CHAT / FAQs ───────────────────────────────────────────────────────
        ("GET",  "/api/chat/faqs",        "student",  [200], "FAQs (student)"),
        ("GET",  "/api/chat/faqs",        "admin",    [200], "FAQs (admin)"),
    ]
    return tests

# ══════════════════════════════════════════════════════════════════════════════
# EXECUTOR DE TESTES
# ══════════════════════════════════════════════════════════════════════════════
def run_tests() -> list[dict]:
    print(f"\n{BOLD}━━━ FASE 8 — Testes de endpoints ━━━{RESET}")
    tests = _build_tests()
    results = []
    passed = failed = 0

    for method, path, role, expected, desc in tests:
        try:
            if role is None:
                # Sem auth
                url = f"{BASE}{path}"
                r = _session.request(method, url, timeout=10)
            else:
                r = _req(method, path, role)
            status = r.status_code
            passed_test = status in expected
        except Exception as ex:
            status = 0
            passed_test = False
            if V: print(f"    {RED}ERROR{RESET} {path}: {ex}")

        results.append({
            "method": method, "path": path, "role": role or "público",
            "expected": expected, "actual": status,
            "pass": passed_test, "desc": desc,
        })

        if passed_test:
            passed += 1
            if V: ok(f"[{role or 'público':10}] {method:6} {path} → {status}")
        else:
            failed += 1
            err(f"[{role or 'público':10}] {method:6} {path} → {status} (esperado: {expected})")

    print(f"\n  {BOLD}Resultado: {GREEN}{passed} PASS{RESET} · {RED}{failed} FAIL{RESET} · {passed+failed} total{RESET}")
    return results

# ══════════════════════════════════════════════════════════════════════════════
# RELATÓRIO
# ══════════════════════════════════════════════════════════════════════════════
def generate_report(results: list[dict]):
    ts   = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    docs = ROOT / "docs"
    docs.mkdir(exist_ok=True)

    passed  = [r for r in results if r["pass"]]
    failed  = [r for r in results if not r["pass"]]
    total   = len(results)
    pct     = round(len(passed) / total * 100, 1) if total else 0

    # ── Markdown ───────────────────────────────────────────────────────────────
    md_path = docs / f"TEST_ENDPOINTS_{ts}.md"
    lines = [
        f"# Relatório de Testes de Endpoints\n",
        f"**Data:** {datetime.now().strftime('%d/%m/%Y %H:%M')}  ",
        f"**Backend:** {BASE}  ",
        f"**Total:** {total}  |  **Pass:** {len(passed)} ✅  |  **Fail:** {len(failed)} ❌  |  **Taxa:** {pct}%\n",
        "---\n",
        "## ❌ Falhas\n",
    ]
    if failed:
        lines.append("| Role | Método | Endpoint | Esperado | Obtido | Descrição |")
        lines.append("|------|--------|----------|----------|--------|-----------|")
        for r in failed:
            exp = "/".join(str(e) for e in r["expected"])
            lines.append(f"| {r['role']} | `{r['method']}` | `{r['path']}` | {exp} | **{r['actual']}** | {r['desc']} |")
    else:
        lines.append("_Nenhuma falha! 🎉_")

    lines += ["\n---\n", "## ✅ Todos os resultados\n",
              "| # | Role | Método | Endpoint | Esperado | Obtido | Estado | Descrição |",
              "|---|------|--------|----------|----------|--------|--------|-----------|"]
    for i, r in enumerate(results, 1):
        exp  = "/".join(str(e) for e in r["expected"])
        icon = "✅" if r["pass"] else "❌"
        lines.append(
            f"| {i} | {r['role']} | `{r['method']}` | `{r['path']}` | {exp} | {r['actual']} | {icon} | {r['desc']} |"
        )

    md_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n  {CYAN}→{RESET} Markdown: {md_path}")

    # ── HTML ───────────────────────────────────────────────────────────────────
    html_path = docs / f"TEST_ENDPOINTS_{ts}.html"

    rows = ""
    for i, r in enumerate(results, 1):
        bg  = "#f0fdf4" if r["pass"] else "#fef2f2"
        ico = "✅" if r["pass"] else "❌"
        exp = " / ".join(str(e) for e in r["expected"])
        rows += (
            f'<tr style="background:{bg}">'
            f"<td>{i}</td><td><code>{r['role']}</code></td>"
            f"<td><span class='method {r['method'].lower()}'>{r['method']}</span></td>"
            f"<td><code>{r['path']}</code></td>"
            f"<td>{exp}</td><td><b>{r['actual']}</b></td><td>{ico}</td>"
            f"<td style='font-size:.85em'>{r['desc']}</td></tr>\n"
        )

    fail_rows = ""
    for r in failed:
        exp = " / ".join(str(e) for e in r["expected"])
        fail_rows += (
            f'<tr style="background:#fef2f2">'
            f"<td><code>{r['role']}</code></td>"
            f"<td><span class='method {r['method'].lower()}'>{r['method']}</span></td>"
            f"<td><code>{r['path']}</code></td>"
            f"<td>{exp}</td><td><b>{r['actual']}</b></td>"
            f"<td style='font-size:.85em'>{r['desc']}</td></tr>\n"
        )

    html = f"""<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>Relatório de Endpoints — {ts}</title>
<style>
  body {{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;background:#f9fafb;color:#111}}
  h1   {{font-size:1.6rem;font-weight:700;margin-bottom:4px}}
  .meta{{color:#555;font-size:.9rem;margin-bottom:24px}}
  .stats{{display:flex;gap:16px;margin-bottom:32px;flex-wrap:wrap}}
  .stat{{padding:16px 24px;border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08);min-width:120px}}
  .stat .n{{font-size:2rem;font-weight:700}}
  .stat .l{{font-size:.8rem;color:#666;text-transform:uppercase;letter-spacing:.05em}}
  .green{{color:#16a34a}} .red{{color:#dc2626}} .blue{{color:#2563eb}}
  table{{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:32px}}
  th   {{background:#1e293b;color:#fff;padding:10px 12px;text-align:left;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em}}
  td   {{padding:9px 12px;font-size:.85rem;border-bottom:1px solid #f1f5f9}}
  tr:last-child td{{border-bottom:none}}
  code {{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:.8rem}}
  .method{{display:inline-block;padding:2px 8px;border-radius:4px;font-weight:600;font-size:.75rem}}
  .get  {{background:#dbeafe;color:#1d4ed8}}
  .post {{background:#dcfce7;color:#166534}}
  .put  {{background:#fef9c3;color:#854d0e}}
  .patch{{background:#ede9fe;color:#6d28d9}}
  .delete{{background:#fee2e2;color:#991b1b}}
  h2   {{font-size:1.2rem;font-weight:600;margin:32px 0 12px}}
</style>
</head>
<body>
<h1>Relatório de Testes de Endpoints</h1>
<p class="meta">Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} &nbsp;|&nbsp; Backend: <b>{BASE}</b></p>

<div class="stats">
  <div class="stat"><div class="n">{total}</div><div class="l">Total</div></div>
  <div class="stat"><div class="n green">{len(passed)}</div><div class="l">Pass ✅</div></div>
  <div class="stat"><div class="n red">{len(failed)}</div><div class="l">Fail ❌</div></div>
  <div class="stat"><div class="n blue">{pct}%</div><div class="l">Taxa de sucesso</div></div>
</div>

{"<h2>❌ Falhas</h2><table><thead><tr><th>Role</th><th>Método</th><th>Endpoint</th><th>Esperado</th><th>Obtido</th><th>Descrição</th></tr></thead><tbody>" + fail_rows + "</tbody></table>" if failed else "<h2>❌ Falhas</h2><p style='color:#16a34a;font-weight:600'>Nenhuma falha! 🎉</p>"}

<h2>Todos os resultados ({total})</h2>
<table>
<thead><tr><th>#</th><th>Role</th><th>Método</th><th>Endpoint</th><th>Esperado</th><th>Obtido</th><th>Estado</th><th>Descrição</th></tr></thead>
<tbody>{rows}</tbody>
</table>
</body></html>"""

    html_path.write_text(html, encoding="utf-8")
    print(f"  {CYAN}→{RESET} HTML:     {html_path}")

    # Guardar JSON para --report-only
    json_path = ROOT / "docs" / "last_test_run.json"
    json_path.write_text(json.dumps({
        "timestamp": ts, "base_url": BASE, "results": results
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    return md_path, html_path

# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
def main():
    print(f"\n{BOLD}{CYAN}═══════════════════════════════════════════════")
    print(f"  PortalTradeHub — Teste Completo de Endpoints")
    print(f"  Backend: {BASE}")
    print(f"═══════════════════════════════════════════════{RESET}\n")

    # Verificar que o backend está acessível
    try:
        r = requests.get(f"{BASE}/api/health", timeout=5)
        print(f"{GREEN}✓ Backend acessível{RESET} (status {r.status_code})")
    except Exception:
        try:
            r = requests.get(f"{BASE}/api/public/landing", timeout=5)
            print(f"{GREEN}✓ Backend acessível{RESET} (via /api/public/landing)")
        except Exception as e:
            sys.exit(f"{RED}❌  Backend não acessível em {BASE}: {e}{RESET}")

    # --report-only
    if args.report_only:
        json_path = ROOT / "docs" / "last_test_run.json"
        if not json_path.exists():
            sys.exit("❌  Nenhum run anterior encontrado. Correr sem --report-only primeiro.")
        data    = json.loads(json_path.read_text(encoding="utf-8"))
        results = data["results"]
        print(f"A regenerar relatório de {data['timestamp']}...")
        generate_report(results)
        return

    # --reset
    if args.reset:
        print(f"\n{YELLOW}⚠  A executar seed --reset...{RESET}")
        import subprocess
        seed_path = ROOT / "scripts" / "seed.py"
        subprocess.run([sys.executable, str(seed_path), "--reset", "--url", BASE], check=False)

    # Login inicial
    phase_login()

    if not args.skip_setup:
        # Criar dados completos
        phase_users()
        phase_master_data()
        phase_formacoes()
        phase_tutoria()
        phase_internal_and_feedback()
        phase_chamados()
    else:
        print(f"\n{YELLOW}⚠  --skip-setup: a usar dados existentes{RESET}")
        # Tentar obter IDs existentes
        _populate_existing_ids()

    # Executar testes
    results = run_tests()

    # Relatório
    md, html = generate_report(results)

    passed = sum(1 for r in results if r["pass"])
    failed = sum(1 for r in results if not r["pass"])
    total  = len(results)
    pct    = round(passed / total * 100, 1) if total else 0

    print(f"\n{BOLD}{'─'*50}{RESET}")
    print(f"  {GREEN}✅ PASS: {passed}/{total} ({pct}%){RESET}")
    if failed:
        print(f"  {RED}❌ FAIL: {failed}/{total}{RESET}")
    print(f"\n  Relatórios em:")
    print(f"  {CYAN}{md.name}{RESET}")
    print(f"  {CYAN}{html.name}{RESET}")
    print(f"{BOLD}{'─'*50}{RESET}\n")

    sys.exit(0 if failed == 0 else 1)


def _populate_existing_ids():
    """Tenta descobrir IDs de recursos existentes sem criar novos."""
    info("A descobrir IDs de recursos existentes...")

    r = _get("/api/admin/banks", "admin")
    if r.status_code == 200:
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        if items: S.bank_id = items[0]["id"]

    r = _get("/api/admin/products", "admin")
    if r.status_code == 200:
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        if items: S.product_id = items[0]["id"]

    r = _get("/api/teams", "admin")
    if r.status_code == 200:
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        if items: S.team_id = items[0]["id"]

    r = _get("/api/trainer/courses", "trainer")
    if r.status_code == 200:
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        if items: S.course_id = items[0]["id"]

    r = _get("/api/tutoria/errors", "tutor")
    if r.status_code == 200:
        items = r.json() if isinstance(r.json(), list) else r.json().get("errors", [])
        if items: S.t_error_id = items[0]["id"]

    r = _get("/api/chamados", "admin")
    if r.status_code == 200:
        items = r.json() if isinstance(r.json(), list) else []
        if items: S.chamado_id = items[0]["id"]

    r = _get("/api/org/tree", "admin")
    if r.status_code == 200:
        nodes = r.json()
        if nodes: S.org_node_id = nodes[0]["id"]

    r = _get("/api/admin/users?page_size=100", "admin")
    if r.status_code == 200:
        users = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        for u in users:
            email = u.get("email", "")
            if "manager"   in email: S.manager_id   = u["id"]
            elif "trainer" in email: S.trainer_id   = u["id"]
            elif "tutor"   in email and u.get("is_tutor"): S.tutor_id = u["id"]
            elif "student" in email: S.student_id   = u["id"]
            elif "liberador" in email: S.liberador_id = u["id"]
            elif "referente" in email: S.referente_id = u["id"]


if __name__ == "__main__":
    main()
