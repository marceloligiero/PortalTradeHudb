"""
seed_real_data.py — Dados realistas para todos os portais (exceto Dados Mestres).

Popula:
  - Portal de Formações : cursos, aulas, planos de formação, inscrições, progresso
  - Portal de Tutoria   : erros de tutoria, planos de ação, fichas de aprendizagem,
                          sensos + erros internos, surveys de liberadores
  - Portal de Chamados  : chamados BUG/MELHORIA com comentários
  - Portal de Relatórios: beneficia automaticamente dos dados acima

Pré-requisitos:
  - Migrations aplicadas (run_migrations.py)
  - Dados mestres inseridos (seed_inicial.py)
  - Utilizadores criados (admin, trainer, tutor, student, liberador, referente, chefe)

Uso:
  python scripts/seed_real_data.py [--force] [--dry-run]

  --force   : apaga dados existentes antes de re-inserir
  --dry-run : mostra o que faria, sem alterar a BD
"""

from __future__ import annotations

import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path
from random import choice, randint, sample, uniform

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / "backend" / ".env"

SEED_MARKER = "seed_real_data_v1"

FORCE    = "--force"    in sys.argv
DRY      = "--dry-run"  in sys.argv

# ─── Leitura do .env ────────────────────────────────────────────────────────

def _read_env_file(path: Path) -> str:
    for enc in ("utf-8-sig", "utf-16", "utf-8", "cp1252", "latin-1"):
        try:
            text = path.read_text(encoding=enc)
            if text.count("\x00") > len(text) // 4:
                continue
            return text
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""


def parse_database_url(env_path: Path) -> dict:
    if not env_path.exists():
        return {}
    for line in _read_env_file(env_path).splitlines():
        line = line.strip().strip("\x00")
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if k.strip() != "DATABASE_URL":
            continue
        url = v.strip().strip("'\"")
        m = re.match(
            r"mysql\+pymysql://([^:]+):([^@]*)@([^:/]+):?(\d+)?/([^\s?#]+)", url
        )
        if not m:
            return {}
        return {
            "user": m.group(1), "password": m.group(2),
            "host": m.group(3), "port": int(m.group(4) or 3306),
            "database": m.group(5).rstrip("'\""),
        }
    return {}


creds = parse_database_url(ENV_FILE)
if not creds:
    print("[ERRO] Não foi possível ler DATABASE_URL de backend/.env")
    sys.exit(1)

try:
    import pymysql
except ImportError:
    print("[ERRO] pymysql não instalado. Ative o venv e corra: pip install pymysql")
    sys.exit(1)

try:
    conn = pymysql.connect(
        host=creds["host"], port=creds["port"],
        user=creds["user"], password=creds["password"],
        database=creds["database"], charset="utf8mb4",
        autocommit=False,
    )
except Exception as e:
    print(f"[ERRO] Não foi possível ligar ao MySQL: {e}")
    sys.exit(1)

cur = conn.cursor()

# ─── Verificar marker ────────────────────────────────────────────────────────

try:
    cur.execute("SELECT id FROM _migrations WHERE filename = %s", (SEED_MARKER,))
    if cur.fetchone() and not FORCE:
        print(f"[SKIP] Seed '{SEED_MARKER}' já aplicado. Use --force para re-executar.")
        conn.close()
        sys.exit(0)
except Exception:
    pass  # tabela pode não existir ainda

print()
print("=" * 60)
print("  seed_real_data — Dados realistas para todos os portais")
print(f"  BD: {creds['database']} @ {creds['host']}:{creds['port']}")
print(f"  {'[DRY-RUN] Nenhuma alteração será feita' if DRY else 'Modo: ESCRITA'}")
print("=" * 60)

# ─── Helpers ────────────────────────────────────────────────────────────────

def q(sql: str, *args):
    """Executa uma query (commit não feito aqui)."""
    if DRY:
        return
    cur.execute(sql, args if args else None)


def commit():
    if not DRY:
        conn.commit()


def fetch_one(sql: str, *args):
    cur.execute(sql, args if args else None)
    return cur.fetchone()


def fetch_all(sql: str, *args):
    cur.execute(sql, args if args else None)
    return cur.fetchall()


def last_id() -> int:
    if DRY:
        return 0
    return conn.insert_id()


def d(days_ago: int = 0) -> str:
    """Data relativa a hoje."""
    return (date.today() - timedelta(days=days_ago)).isoformat()


def dt(days_ago: int = 0, hour: str = "09:00:00") -> str:
    return f"{d(days_ago)} {hour}"


# ─── Carregar IDs existentes ─────────────────────────────────────────────────

print("\n[1/6] Carregando utilizadores e dados mestres existentes...")

# Utilizadores
users = {}
for row in fetch_all("SELECT email, id, is_admin, is_tutor, is_trainer, is_liberador, is_referente, is_chefe_equipe, is_gerente, role FROM users WHERE is_active = 1"):
    email, uid, is_admin, is_tutor, is_trainer, is_lib, is_ref, is_chefe, is_ger, role = row
    users[email] = {
        "id": uid, "is_admin": is_admin, "is_tutor": is_tutor, "is_trainer": is_trainer,
        "is_liberador": is_lib, "is_referente": is_ref, "is_chefe_equipe": is_chefe,
        "is_gerente": is_ger, "role": role,
    }

admin_id    = users.get("admin@tradehub.com",    {}).get("id")
trainer_id  = users.get("trainer@tradehub.com",  {}).get("id")
tutor_id    = users.get("tutor@tradehub.com",    {}).get("id")
manager_id  = users.get("manager@tradehub.com",  {}).get("id")
student_id  = users.get("student@tradehub.com",  {}).get("id")
liberador_id= users.get("liberador@tradehub.com",{}).get("id")
referente_id= users.get("referente@tradehub.com",{}).get("id")
chefe_id    = users.get("chefe@tradehub.com",    {}).get("id")

required_users = {
    "admin@tradehub.com": admin_id,
    "trainer@tradehub.com": trainer_id,
    "tutor@tradehub.com": tutor_id,
    "student@tradehub.com": student_id,
    "liberador@tradehub.com": liberador_id,
}
missing = [e for e, uid in required_users.items() if not uid]
if missing:
    print(f"[ERRO] Utilizadores não encontrados: {missing}")
    print("       Execute primeiro: python scripts/seed_inicial.py")
    sys.exit(1)

print(f"       Utilizadores: admin={admin_id}, trainer={trainer_id}, tutor={tutor_id}, "
      f"student={student_id}, liberador={liberador_id}, referente={referente_id}, chefe={chefe_id}")

# Bancos
banks = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM banks WHERE is_active = 1")}
# Produtos
products = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM products WHERE is_active = 1")}
# Impactos
impacts = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM error_impacts WHERE is_active = 1")}
# Origens
origins = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM error_origins")}
# Categorias de erro de tutoria
categories = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM tutoria_error_categories WHERE is_active = 1")}
# Detetado por
detected_by = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM error_detected_by")}
# Departamentos
departments = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM departments")}
# Atividades
activities = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM activities")}
# Tipos de erro
error_types = {row[1]: row[0] for row in fetch_all("SELECT id, name FROM error_types")}

if not banks:
    print("[ERRO] Sem bancos na BD. Execute: python scripts/seed_inicial.py")
    sys.exit(1)

bank_ids     = list(banks.values())
product_ids  = list(products.values())
impact_ids   = list(impacts.values()) or [None]
origin_ids   = list(origins.values()) or [None]
cat_ids      = list(categories.values()) or [None]
det_ids      = list(detected_by.values()) or [None]
dept_ids     = list(departments.values()) or [None]
act_ids      = list(activities.values()) or [None]
etype_ids    = list(error_types.values()) or [None]

print(f"       Bancos: {len(banks)}, Produtos: {len(products)}, Categorias: {len(categories)}")


# ═══════════════════════════════════════════════════════════════
# 2. PORTAL DE FORMAÇÕES
# ═══════════════════════════════════════════════════════════════

print("\n[2/6] Portal de Formações — cursos, aulas, planos, inscrições...")

# ── Limpar se --force ───────────────────────────────────────────
if FORCE and not DRY:
    for tbl in ["lesson_progress","lesson_pauses","enrollments","training_plan_assignments",
                "training_plan_trainers","training_plan_courses","training_plans",
                "lessons","courses"]:
        try:
            cur.execute(f"DELETE FROM {tbl}")
        except Exception:
            pass
    commit()
    print("       [FORCE] Dados de formações removidos.")

# ── Verificar se já existem ──────────────────────────────────────
existing_courses = fetch_one("SELECT COUNT(*) FROM courses")[0]
if existing_courses > 0 and not FORCE:
    print(f"       [SKIP] {existing_courses} cursos já existem.")
    course_ids = [r[0] for r in fetch_all("SELECT id FROM courses LIMIT 5")]
    plan_ids   = [r[0] for r in fetch_all("SELECT id FROM training_plans LIMIT 3")]
else:
    # ── Cursos ──────────────────────────────────────────────────
    COURSES = [
        ("Cartas de Crédito — Fundamentos e Boas Práticas",
         "Formação completa sobre o ciclo de vida de uma carta de crédito documentário, "
         "desde a abertura até ao encerramento. Inclui análise de discrepâncias e gestão de apresentações.",
         "BEGINNER", "CURSO"),
        ("Garantias Bancárias — Emissão e Gestão",
         "Formação prática sobre a emissão de garantias à primeira solicitação, "
         "garantias de pagamento e performance bonds. Foco nos casos reais e erros mais comuns.",
         "INTERMEDIATE", "CURSO"),
        ("Operações Cambiais — Cobertura e Hedge",
         "Formação avançada sobre gestão de risco cambial em operações de comércio internacional. "
         "Inclui FX forward, swaps e estratégias de cobertura.",
         "EXPERT", "CURSO"),
        ("Remessas Documentárias — Procedimentos",
         "Cápsula metodológica sobre o processamento de remessas documentárias de importação e exportação.",
         "BEGINNER", "CAPSULA_METODOLOGIA"),
        ("Compliance e Sanções Internacionais",
         "Cápsula funcional sobre controlo de sanções (OFAC, UE, ONU) e screening de contrapartes "
         "em operações de comércio exterior.",
         "INTERMEDIATE", "CAPSULA_FUNCIONALIDADE"),
    ]

    course_ids = []
    for title, desc, level, ctype in COURSES:
        q("""INSERT INTO courses (title, description, level, course_type, created_by, is_active)
             VALUES (%s, %s, %s, %s, %s, 1)""",
          title, desc, level, ctype, trainer_id)
        cid = last_id()
        course_ids.append(cid)
        # associar banco + produto
        if bank_ids and cid:
            bid = bank_ids[0]
            q("INSERT IGNORE INTO course_banks (course_id, bank_id) VALUES (%s, %s)", cid, bid)
        if product_ids and cid:
            pid = product_ids[0]
            q("INSERT IGNORE INTO course_products (course_id, product_id) VALUES (%s, %s)", cid, pid)
    commit()
    print(f"       {len(COURSES)} cursos criados")

    # ── Aulas ────────────────────────────────────────────────────
    LESSONS_PER_COURSE = [
        # Curso 1: Cartas de Crédito
        [
            ("Introdução às Cartas de Crédito", "Conceitos base: tipos de LC, partes envolvidas e UCP 600.", "THEORETICAL", 45),
            ("Abertura de Carta de Crédito", "Processo de abertura: dados obrigatórios, condições e validade.", "THEORETICAL", 60),
            ("Análise de Documentos", "Verificação de conformidade documental segundo as regras UCP 600.", "PRACTICAL", 90),
            ("Gestão de Discrepâncias", "Identificação, comunicação e resolução de discrepâncias documentais.", "PRACTICAL", 75),
            ("Encerramento e Pagamento", "Processo de pagamento, reembolso e arquivo da operação.", "THEORETICAL", 45),
        ],
        # Curso 2: Garantias
        [
            ("Tipos de Garantias Bancárias", "Garantia à primeira solicitação, performance bond, bid bond.", "THEORETICAL", 50),
            ("Emissão de Garantias", "Processo de emissão: análise de risco, texto e condições.", "PRACTICAL", 80),
            ("Execução e Litígio", "Gestão de execuções fraudulentas e mecanismos de defesa.", "PRACTICAL", 90),
        ],
        # Curso 3: Cambial
        [
            ("Mercado Cambial — Conceitos", "Spot, forward, swap: mecânica e cotações.", "THEORETICAL", 60),
            ("Estratégias de Cobertura Cambial", "Quando e como cobrir o risco cambial em operações de trade.", "PRACTICAL", 90),
            ("Casos Práticos — FX no Trade", "Simulação de operações reais de cobertura cambial.", "PRACTICAL", 120),
        ],
        # Curso 4: Remessas (2 aulas)
        [
            ("Remessa Documentária de Exportação", "D/P e D/A: procedimento de envio e cobrança.", "THEORETICAL", 40),
            ("Remessa Documentária de Importação", "Recepção e libertação de documentos para o importador.", "PRACTICAL", 40),
        ],
        # Curso 5: Compliance (2 aulas)
        [
            ("Sanções Internacionais — Overview", "OFAC, listas UE e ONU: obrigações e screening.", "THEORETICAL", 50),
            ("Screening de Contrapartes", "Ferramentas e procedimentos de verificação em tempo real.", "PRACTICAL", 60),
        ],
    ]

    lesson_ids_per_course = {}
    total_lessons = 0
    for i, (cid, lessons) in enumerate(zip(course_ids, LESSONS_PER_COURSE)):
        lesson_ids_per_course[cid] = []
        for order, (ltitle, ldesc, ltype, mins) in enumerate(lessons):
            q("""INSERT INTO lessons (course_id, title, description, lesson_type, order_index, estimated_minutes)
                 VALUES (%s, %s, %s, %s, %s, %s)""",
              cid, ltitle, ldesc, ltype, order, mins)
            lid = last_id()
            lesson_ids_per_course[cid].append(lid)
            total_lessons += 1
    commit()
    print(f"       {total_lessons} aulas criadas")

    # ── Planos de Formação ────────────────────────────────────────
    PLANS = [
        ("Plano de Formação — Trade Finance Completo 2026",
         "Formação anual completa em Trade Finance para operadores sénior.",
         student_id, trainer_id, d(60), d(-180), False),
        ("Plano de Formação — Iniciação Operações 2026",
         "Programa de integração para operadores novos. Foco em cartas de crédito e remessas.",
         referente_id or student_id, trainer_id, d(30), d(-90), False),
        ("Plano Permanente — Compliance e Sanções",
         "Plano de formação contínua em compliance e sanções internacionais.",
         liberador_id, tutor_id, d(365), d(-1), True),
    ]

    plan_ids = []
    for title, desc, s_id, tr_id, start, end, is_perm in PLANS:
        q("""INSERT INTO training_plans
             (title, description, created_by, trainer_id, student_id, start_date, end_date,
              is_permanent, is_active, status)
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, 'IN_PROGRESS')""",
          title, desc, admin_id, tr_id, s_id, start, end, is_perm)
        plan_ids.append(last_id())
    commit()
    print(f"       {len(PLANS)} planos de formação criados")

    # ── Cursos nos Planos ─────────────────────────────────────────
    # Plano 1: cursos 0,1,2
    # Plano 2: cursos 0,3
    # Plano 3: curso 4
    plan_course_map = [
        (0, [0, 1, 2]),
        (1, [0, 3]),
        (2, [4]),
    ]
    for pi, cis in plan_course_map:
        if pi >= len(plan_ids):
            continue
        pid = plan_ids[pi]
        for order, ci in enumerate(cis):
            if ci >= len(course_ids):
                continue
            q("""INSERT INTO training_plan_courses
                 (training_plan_id, course_id, order_index, status)
                 VALUES (%s, %s, %s, 'IN_PROGRESS')""",
              pid, course_ids[ci], order)
    commit()

    # ── Inscrições e Progresso ─────────────────────────────────────
    # Alunos por plano
    plan_students = [student_id, referente_id or student_id, liberador_id]

    enroll_count = 0
    progress_count = 0
    for pi, cis in plan_course_map:
        if pi >= len(plan_ids):
            continue
        plan_id = plan_ids[pi]
        student = plan_students[pi]
        for ci in cis:
            if ci >= len(course_ids):
                continue
            cid = course_ids[ci]
            lessons = lesson_ids_per_course.get(cid, [])

            # Inscrição no curso
            q("""INSERT INTO enrollments (user_id, course_id, enrolled_at)
                 VALUES (%s, %s, %s)""", student, cid, dt(45))
            enroll_id = last_id()
            enroll_count += 1

            # Progresso por aula (alguns completos, outros não)
            for j, lid in enumerate(lessons):
                if j < len(lessons) - 1:
                    # aula concluída
                    q("""INSERT INTO lesson_progress
                         (enrollment_id, lesson_id, training_plan_id, user_id,
                          is_released, released_by, released_at,
                          started_at, completed_at, accumulated_seconds, actual_time_minutes,
                          estimated_minutes, is_approved, status, student_confirmed, student_confirmed_at)
                         VALUES (%s, %s, %s, %s,
                                 1, %s, %s,
                                 %s, %s, %s, %s,
                                 30, 1, 'COMPLETED', 1, %s)""",
                      enroll_id, lid, plan_id, student,
                      trainer_id, dt(30),
                      dt(28), dt(27), randint(1500, 3600), randint(25, 60),
                      dt(27))
                else:
                    # última aula em progresso
                    q("""INSERT INTO lesson_progress
                         (enrollment_id, lesson_id, training_plan_id, user_id,
                          is_released, released_by, released_at,
                          started_at, accumulated_seconds, estimated_minutes, status)
                         VALUES (%s, %s, %s, %s,
                                 1, %s, %s,
                                 %s, %s, 30, 'IN_PROGRESS')""",
                      enroll_id, lid, plan_id, student,
                      trainer_id, dt(5),
                      dt(3), randint(600, 1200))
                progress_count += 1
    commit()
    print(f"       {enroll_count} inscrições, {progress_count} registos de progresso")

    # ── Assignment dos alunos aos planos ──────────────────────────
    for pi, s_id in enumerate(plan_students):
        if pi >= len(plan_ids) or not s_id:
            continue
        q("""INSERT IGNORE INTO training_plan_assignments
             (training_plan_id, user_id, assigned_by, status, progress_percentage)
             VALUES (%s, %s, %s, 'IN_PROGRESS', 75)""",
          plan_ids[pi], s_id, admin_id)
    commit()


# ═══════════════════════════════════════════════════════════════
# 3. PORTAL DE TUTORIA
# ═══════════════════════════════════════════════════════════════

print("\n[3/6] Portal de Tutoria — erros, planos de ação, fichas, sensos...")

if FORCE and not DRY:
    for tbl in ["tutoria_action_items","tutoria_action_plans","tutoria_error_motivos",
                "tutoria_error_refs","tutoria_learning_sheets","tutoria_errors",
                "internal_error_classifications","internal_errors","sensos"]:
        try:
            cur.execute(f"DELETE FROM {tbl}")
        except Exception:
            pass
    commit()
    print("       [FORCE] Dados de tutoria removidos.")

existing_errors = fetch_one("SELECT COUNT(*) FROM tutoria_errors")[0]
if existing_errors > 0 and not FORCE:
    print(f"       [SKIP] {existing_errors} erros de tutoria já existem.")
else:
    # ── Erros de Tutoria ─────────────────────────────────────────

    b1 = bank_ids[0] if bank_ids else None
    b2 = bank_ids[1] if len(bank_ids) > 1 else b1
    b3 = bank_ids[2] if len(bank_ids) > 2 else b1
    p1 = product_ids[0] if product_ids else None
    imp_alta = next((v for k, v in impacts.items() if "Alta" in k or "ALTA" in k.upper()), impact_ids[0] if impact_ids else None)
    imp_baixa = next((v for k, v in impacts.items() if "Baixa" in k or "BAIXA" in k.upper()), impact_ids[-1] if impact_ids else None)
    orig_int = next((v for k, v in origins.items() if "Intern" in k), origin_ids[0] if origin_ids else None)
    orig_ext = next((v for k, v in origins.items() if "Extern" in k or "Terceiro" in k), origin_ids[-1] if origin_ids else None)
    cat1 = cat_ids[0] if cat_ids else None
    cat2 = cat_ids[1] if len(cat_ids) > 1 else cat1
    det1 = det_ids[0] if det_ids else None
    dept1 = dept_ids[0] if dept_ids else None
    dept2 = dept_ids[1] if len(dept_ids) > 1 else dept1
    act1 = act_ids[0] if act_ids else None
    act2 = act_ids[1] if len(act_ids) > 1 else act1
    et1 = etype_ids[0] if etype_ids else None
    et2 = etype_ids[1] if len(etype_ids) > 1 else et1

    TUTORIA_ERRORS = [
        # (description, status, days_ago, bank_id, solution, impact_id, origin_id, cat_id, dept_id, act_id, etype_id, amount, currency)
        ("Discrepância documental em carta de crédito — data de embarque posterior ao prazo de validade do LC. "
         "O operador não verificou o prazo de expiração antes de aceitar os documentos.",
         "RESOLVED", 45, b1,
         "Documentos devolvidos ao beneficiário para correcção. Reabertura do prazo de apresentação com concordância do ordenante.",
         imp_alta, orig_int, cat1, dept1, act1, et1, 125000.0, "EUR"),
        ("Erro de importe em remessa documentária: montante liquidado com diferença de 1.500 USD "
         "relativamente ao valor da fatura comercial. Diferença detetada pelo banco cobrador.",
         "RESOLVED", 30, b2,
         "Processada transferência complementar de 1.500 USD. Confirmação recebida do banco cobrador.",
         imp_alta, orig_int, cat2, dept1, act2, et2, 1500.0, "USD"),
        ("Garantia bancária emitida sem aprovação do comité de risco para montante superior a €500.000. "
         "Procedimento interno não foi seguido pelo operador.",
         "RESOLVED", 20, b3,
         "Garantia cancelada e reemitida após aprovação formal. Processo disciplinar aberto.",
         imp_alta, orig_int, cat1, dept2, act1, et1, 600000.0, "EUR"),
        ("Operação de câmbio liquidada fora do prazo acordado (T+2). "
         "Atraso de 1 dia causou penalização de juros por parte da contraparte.",
         "IN_REVIEW", 15, b1,
         None, imp_baixa, orig_int, cat2, dept1, act2, et2, 80000.0, "GBP"),
        ("Documentos de importação libertados sem conferência do swift de pagamento. "
         "Risco de duplo pagamento identificado pelo gestor da conta.",
         "IN_REVIEW", 10, b2,
         None, imp_alta, orig_ext, cat1, dept2, act1, et1, 45000.0, "USD"),
        ("Referência incorrecta no swift MT700 — campo 20 com referência do banco correspondente "
         "em vez da referência interna. Gerou confusão no banco emissor.",
         "REGISTERED", 7, b3,
         None, imp_baixa, orig_int, cat2, dept1, act2, et2, 0.0, "EUR"),
        ("Cobrança documentária D/P convertida erroneamente em D/A pelo sistema, "
         "permitindo libertação de documentos sem pagamento imediato.",
         "REGISTERED", 5, b1,
         None, imp_alta, orig_int, cat1, dept1, act1, et1, 320000.0, "EUR"),
        ("Screening de sanções não efectuado para operação com cliente com nome similar a entidade sancionada. "
         "Detetado em auditoria interna após liquidação.",
         "REGISTERED", 3, b2,
         None, imp_alta, orig_ext, cat2, dept2, act2, et2, 95000.0, "USD"),
        ("Erro de cálculo de comissão em garantia bancária: taxa aplicada de 0,75% a.a. "
         "em vez de 1,25% a.a. conforme contrato. Diferença de €1.875 por trimestre.",
         "RESOLVED", 60, b3,
         "Regularização retroactiva de comissões processada. Cliente notificado e cobrado.",
         imp_baixa, orig_int, cat1, dept1, act1, et1, 1875.0, "EUR"),
        ("Prazo de apresentação de documentos em LC expirado — beneficiário apresentou documentos "
         "3 dias após o prazo. Banco aceitou sem solicitar waiver ao ordenante.",
         "RESOLVED", 55, b1,
         "Waiver obtido retroactivamente com concordância do ordenante. Processo revisto e aprovado.",
         imp_alta, orig_int, cat2, dept2, act2, et2, 210000.0, "EUR"),
        ("Aval bancário emitido com cláusula de pagamento automático em vez de cláusula condicional, "
         "contrariamente ao acordado com o cliente. Erro de preenchimento do template.",
         "REGISTERED", 2, b2,
         None, imp_alta, orig_int, cat1, dept1, act1, et1, 175000.0, "EUR"),
        ("Swift MT103 enviado com BIC incorrecto do banco correspondente. "
         "Pagamento em trânsito há 5 dias úteis sem confirmação de crédito.",
         "IN_REVIEW", 8, b3,
         None, imp_alta, orig_int, cat2, dept2, act2, et2, 52000.0, "USD"),
    ]

    tutoria_error_ids = []
    refs = ["LC-2026-0341", "GT-2026-1102", "FX-2026-0789", "RD-2026-0456",
            "LC-2026-0512", "MT-2026-0098", "CD-2026-0233", "SC-2026-0017",
            "GT-2026-0891", "LC-2026-0298", "AV-2026-0667", "MT-2026-0145"]

    for i, (desc, status, days, bank, solution, imp, orig, cat, dept, act, etype, amt, cur_code) in enumerate(TUTORIA_ERRORS):
        sol_confirmed = status == "RESOLVED"
        q("""INSERT INTO tutoria_errors
             (date_occurrence, date_detection, date_solution,
              bank_id, reference_code, currency, amount,
              impact_id, origin_id, category_id, detected_by_id,
              department_id, activity_id, error_type_id,
              tutorado_id, created_by_id, approver_id, grabador_id, liberador_id,
              description, solution, severity, status,
              solution_confirmed, is_active, clasificacion)
             VALUES (%s, %s, %s,
                     %s, %s, %s, %s,
                     %s, %s, %s, %s,
                     %s, %s, %s,
                     %s, %s, %s, %s, %s,
                     %s, %s, 'ALTA', %s,
                     %s, 1, 'Interno')""",
          d(days), d(days - 1), d(days - 3) if solution else None,
          bank, refs[i] if i < len(refs) else f"REF-2026-{i+1:04d}", cur_code, amt,
          imp, orig, cat, det1,
          dept, act, etype,
          student_id, tutor_id, liberador_id, liberador_id, liberador_id,
          desc, solution, status,
          sol_confirmed)
        eid = last_id()
        tutoria_error_ids.append(eid)

        # Ref adicional para os primeiros erros
        if i < 3 and eid:
            q("""INSERT INTO tutoria_error_refs
                 (error_id, referencia, divisa, importe, cliente_final)
                 VALUES (%s, %s, %s, %s, %s)""",
              eid, refs[i], cur_code, amt, "Cliente Internacional SA")

        # Motivo
        if eid:
            q("""INSERT INTO tutoria_error_motivos
                 (error_id, typology, description)
                 VALUES (%s, %s, %s)""",
              eid,
              choice(["METHODOLOGY", "KNOWLEDGE", "DETAIL", "PROCEDURE"]),
              "Falta de verificação do procedimento standard antes da execução da operação.")

    commit()
    print(f"       {len(TUTORIA_ERRORS)} erros de tutoria criados")

    # ── Planos de Ação ───────────────────────────────────────────
    plan_errors = tutoria_error_ids[:5]  # Primeiros 5 erros têm plano de ação
    action_plan_ids = []
    for i, eid in enumerate(plan_errors):
        is_done = (i < 2)
        q("""INSERT INTO tutoria_action_plans
             (error_id, created_by_id, tutorado_id,
              what, why, who, how, when_deadline,
              immediate_correction, corrective_action, preventive_action,
              analysis_5_why,
              plan_type, status, approved_by_id, approved_at)
             VALUES (%s, %s, %s,
                     %s, %s, %s, %s, %s,
                     %s, %s, %s,
                     %s,
                     %s, %s, %s, %s)""",
          eid, tutor_id, student_id,
          "Revisão do procedimento de conferência documental antes da submissão ao banco.",
          "Para evitar discrepâncias e penalizações por incumprimento das regras UCP 600.",
          "Operador responsável supervisionado pelo chefe de equipa.",
          "Aplicar checklist de conferência em todas as operações de LC superiores a €100.000.",
          d(-15),
          "Suspensão imediata da operação e notificação ao gestor.",
          "Revisão do manual de procedimentos e formação complementar ao operador.",
          "Implementação de dupla validação para operações acima de €50.000.",
          "1º Por quê: falta de verificação. 2º Por quê: pressão de tempo. "
          "3º Por quê: ausência de checklist. 4º Por quê: formação incompleta. "
          "5º Por quê: processo não documentado.",
          "CORRECTIVO",
          "CONCLUIDO" if is_done else "EM_EXECUCAO",
          admin_id if is_done else None,
          dt(10) if is_done else None)
        ap_id = last_id()
        action_plan_ids.append(ap_id)

        # Action items do plano
        if ap_id:
            items = [
                ("IMEDIATA", "Suspender a operação e notificar o gestor imediatamente.", "CONCLUIDO" if is_done else "EM_ANDAMENTO"),
                ("CORRETIVA", "Aplicar checklist de conferência documental em todas as LC.", "CONCLUIDO" if is_done else "PENDENTE"),
                ("PREVENTIVA", "Agendar formação de atualização UCP 600 para toda a equipa.", "PENDENTE"),
            ]
            for itype, idesc, istatus in items:
                q("""INSERT INTO tutoria_action_items
                     (plan_id, type, description, responsible_id, due_date, status)
                     VALUES (%s, %s, %s, %s, %s, %s)""",
                  ap_id, itype, idesc, trainer_id, d(-10), istatus)
    commit()
    print(f"       {len(action_plan_ids)} planos de ação com itens criados")

    # ── Fichas de Aprendizagem ────────────────────────────────────
    sheet_errors = tutoria_error_ids[:3]
    sheet_count = 0
    for i, eid in enumerate(sheet_errors):
        is_acknowledged = (i == 0)
        q("""INSERT INTO tutoria_learning_sheets
             (error_id, tutorado_id, created_by_id, tutor_id,
              title, error_summary, root_cause, correct_procedure,
              key_learnings, reference_material,
              status, is_mandatory,
              read_at, acknowledged_at, reflection, submitted_at,
              tutor_outcome, tutor_notes, reviewed_at)
             VALUES (%s, %s, %s, %s,
                     %s, %s, %s, %s,
                     %s, %s,
                     %s, 1,
                     %s, %s, %s, %s,
                     %s, %s, %s)""",
          eid, student_id, tutor_id, tutor_id,
          f"Ficha de Aprendizagem — Erro Operacional #{i+1}",
          "Operação processada sem verificação completa dos requisitos documentais, "
          "resultando em discrepância identificada pelo banco correspondente.",
          "Ausência de checklist de conferência documental. Pressão temporal levou o "
          "operador a saltar etapas de validação obrigatórias.",
          "Antes de submeter qualquer operação de LC, verificar: (1) prazo de validade, "
          "(2) prazo de apresentação, (3) conformidade de cada documento com os termos do LC.",
          "• Nunca submeter documentos sem conferência completa\n"
          "• UCP 600 art. 14: banco tem 5 dias úteis para analisar\n"
          "• Discrepâncias devem ser comunicadas imediatamente ao beneficiário",
          "UCP 600 — ICC Publication 600. Manual de Procedimentos Operacionais v2.3.",
          "RECONHECIDA" if is_acknowledged else ("SUBMITTED" if i == 1 else "PENDENTE"),
          dt(20) if is_acknowledged else (dt(10) if i == 1 else None),
          dt(15) if is_acknowledged else None,
          "Compreendi o erro cometido e comprometome a aplicar o checklist em todas as operações futuras." if is_acknowledged else
          ("Reconheço a falha e já iniciei a revisão do manual de procedimentos." if i == 1 else None),
          dt(15) if is_acknowledged else (dt(8) if i == 1 else None),
          "FEEDBACK_DIRETO" if is_acknowledged else None,
          "Operador demonstrou compreensão do erro e comprometimento com a melhoria." if is_acknowledged else None,
          dt(12) if is_acknowledged else None)
        sheet_count += 1
    commit()
    print(f"       {sheet_count} fichas de aprendizagem criadas")

    # ── Senso + Erros Internos ────────────────────────────────────
    q("""INSERT INTO sensos (name, description, start_date, end_date, status, created_by_id, is_active)
         VALUES (%s, %s, %s, %s, 'ATIVO', %s, 1)""",
      "Senso Q1 2026 — Janeiro a Março",
      "Período de registo de erros internos identificados pelos liberadores no primeiro trimestre de 2026.",
      d(90), d(-1), admin_id)
    senso_id = last_id()

    q("""INSERT INTO sensos (name, description, start_date, end_date, status, created_by_id, is_active)
         VALUES (%s, %s, %s, %s, 'FECHADO', %s, 1)""",
      "Senso Q4 2025 — Outubro a Dezembro",
      "Período encerrado de registo de erros internos do quarto trimestre de 2025.",
      d(185), d(91), admin_id)
    senso_q4_id = last_id()

    commit()

    INTERNAL_ERRORS = [
        ("Dados de beneficiário incompletos no MT103: falta campo 59 (nome e endereço completos). "
         "Swift rejeitado pelo banco receptor com código de erro F-21.", senso_id, 5, "AVALIADO"),
        ("Valor de liquidação arredondado incorrectamente — perda de 0,01 USD por operação "
         "afecta 47 operações no período. Total: 0,47 USD.", senso_id, 12, "PENDENTE"),
        ("Código IBAN incorrecto introduzido manualmente. Pagamento devolvido após 2 dias úteis "
         "com custos de devolução de €35.", senso_id, 18, "AVALIADO"),
        ("Documento de exportação com data anterior à data de abertura do LC. "
         "Discrepância não detetada pelo operador na conferência inicial.", senso_q4_id, 95, "CONCLUIDO"),
        ("Garantia bancária emitida sem referência ao beneficiário correcto — "
         "campo 59 com nome do ordenante em vez do beneficiário.", senso_q4_id, 110, "CONCLUIDO"),
    ]

    ie_count = 0
    for desc, sid, days, status in INTERNAL_ERRORS:
        if not sid:
            continue
        q("""INSERT INTO internal_errors
             (senso_id, gravador_id, liberador_id, created_by_id,
              impact_id, category_id, error_type_id, department_id, activity_id, bank_id,
              description, reference_code, date_occurrence,
              peso_liberador, status, is_active)
             VALUES (%s, %s, %s, %s,
                     %s, %s, %s, %s, %s, %s,
                     %s, %s, %s,
                     %s, %s, 1)""",
          sid, student_id, liberador_id, tutor_id,
          imp_alta, cat1, et1, dept1, act1, b1,
          desc, f"INT-2026-{ie_count+1:04d}", d(days),
          randint(3, 8), status)
        ie_id = last_id()
        if ie_id:
            q("""INSERT INTO internal_error_classifications
                 (internal_error_id, classification, description)
                 VALUES (%s, %s, %s)""",
              ie_id, choice(["METHODOLOGY", "KNOWLEDGE", "DETAIL"]),
              "Erro de procedimento operacional padrão.")
        ie_count += 1
    commit()
    print(f"       2 sensos + {ie_count} erros internos criados")


# ═══════════════════════════════════════════════════════════════
# 4. PORTAL DE CHAMADOS
# ═══════════════════════════════════════════════════════════════

print("\n[4/6] Portal de Chamados — bugs e melhorias...")

if FORCE and not DRY:
    for tbl in ["chamado_comments", "chamados"]:
        try:
            cur.execute(f"DELETE FROM {tbl}")
        except Exception:
            pass
    commit()
    print("       [FORCE] Chamados removidos.")

existing_chamados = fetch_one("SELECT COUNT(*) FROM chamados")[0]
if existing_chamados > 0 and not FORCE:
    print(f"       [SKIP] {existing_chamados} chamados já existem.")
else:
    CHAMADOS = [
        # (title, description, type, priority, status, portal, created_by, assigned_to)
        ("Filtro de datas não funciona no relatório de erros de tutoria",
         "Ao selecionar um intervalo de datas no relatório de tutoria, a tabela não actualiza os resultados. "
         "O botão 'Aplicar Filtro' não produz qualquer efeito. Reproduzível em Chrome e Edge.",
         "BUG", "ALTA", "EM_ANDAMENTO", "TUTORIA", student_id, admin_id),
        ("Exportação Excel do relatório de equipas gera ficheiro corrompido",
         "Ao clicar em 'Exportar Excel' no relatório de equipas (/relatorios/teams), "
         "o ficheiro descarregado não abre no Excel 2021. Erro: 'The file format and extension don't match'.",
         "BUG", "CRITICA", "ABERTO", "RELATORIOS", manager_id or student_id, admin_id),
        ("Dashboard de formações não mostra percentagem de progresso correcta",
         "O indicador de progresso no portal de formações mostra 0% mesmo após concluir várias aulas. "
         "Refrescando a página o valor não actualiza.",
         "BUG", "MEDIA", "EM_ANDAMENTO", "FORMACOES", student_id, trainer_id),
        ("Adicionar coluna 'Banco' na tabela de erros de tutoria",
         "A tabela principal de erros de tutoria não tem a coluna 'Banco' visível por defeito. "
         "Para análises por banco é necessário exportar para Excel. Seria útil ter a coluna visível e filtrável.",
         "MELHORIA", "MEDIA", "ABERTO", "TUTORIA", tutor_id, admin_id),
        ("Notificações de novos chamados não chegam ao administrador",
         "Quando um utilizador cria um novo chamado, o administrador deveria receber uma notificação in-app, "
         "mas isso não acontece. Testado com 3 utilizadores diferentes.",
         "BUG", "ALTA", "ABERTO", "GERAL", student_id, admin_id),
        ("Dashboard de feedback deve mostrar gráfico de evolução temporal",
         "O dashboard de feedback dos liberadores actualmente mostra apenas o resumo estático. "
         "Seria muito útil ter um gráfico de linha com a evolução das notas ao longo das semanas.",
         "MELHORIA", "BAIXA", "ABERTO", "RELATORIOS", tutor_id, None),
        ("Erro 500 ao tentar gerar certificado para plano sem data de conclusão",
         "Ao tentar gerar o certificado de conclusão para um plano de formação que ainda não tem "
         "data de conclusão definida, o sistema retorna erro 500. Deveria mostrar mensagem de aviso.",
         "BUG", "ALTA", "EM_REVISAO", "FORMACOES", trainer_id, admin_id),
        ("Portal de Dados Mestres — permitir importação em massa via CSV",
         "Para a configuração inicial e actualizações periódicas de bancos/produtos, "
         "seria muito eficiente poder fazer upload de um ficheiro CSV em vez de inserir linha a linha.",
         "MELHORIA", "MEDIA", "ABERTO", "DADOS_MESTRES", admin_id, None),
        ("Pesquisa de utilizadores no painel admin não filtra por role",
         "A pesquisa de utilizadores no painel de administração não tem filtro por role. "
         "Com muitos utilizadores fica difícil encontrar todos os formadores ou tutores.",
         "MELHORIA", "BAIXA", "CONCLUIDO", "DADOS_MESTRES", admin_id, admin_id),
        ("Timeout em relatório avançado com mais de 500 registos",
         "O relatório avançado de erros com filtros abrangentes (todo o período) demora mais de 30 segundos "
         "e frequentemente resulta em timeout. Necessário optimizar a query ou adicionar paginação.",
         "BUG", "CRITICA", "EM_ANDAMENTO", "RELATORIOS", manager_id or student_id, admin_id),
    ]

    chamado_ids = []
    for title, desc, ctype, priority, status, portal, created_by, assigned_to in CHAMADOS:
        completed = dt(5) if status == "CONCLUIDO" else None
        q("""INSERT INTO chamados
             (title, description, type, priority, status, portal,
              created_by_id, assigned_to_id, completed_at)
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
          title, desc, ctype, priority, status, portal,
          created_by, assigned_to, completed)
        chamado_ids.append(last_id())
    commit()
    print(f"       {len(CHAMADOS)} chamados criados")

    # ── Comentários nos Chamados ──────────────────────────────────
    COMMENTS = [
        # chamado 0: bug filtro datas
        (0, admin_id, "A investigar. O problema parece estar no componente DateRangePicker que não propaga o evento onChange correctamente. Vou abrir PR com fix esta semana."),
        (0, student_id, "Confirmado também no Firefox. Obrigado pela resposta rápida!"),
        # chamado 1: excel corrompido
        (1, admin_id, "Bug crítico confirmado. O problema é o encoding do ficheiro Excel gerado pelo openpyxl. A investigar urgentemente."),
        # chamado 2: progresso 0%
        (2, trainer_id, "Confirmado internamente. O campo progress_percentage não está a ser actualizado quando as aulas são marcadas como concluídas. A corrigir."),
        (2, student_id, "Também acontece com os planos de formação. Aparece sempre 0% mesmo tendo 3 de 5 aulas concluídas."),
        # chamado 6: erro 500 certificado
        (6, admin_id, "Correcção implementada: agora valida se o plano tem data de conclusão antes de tentar gerar o certificado, e mostra mensagem de aviso adequada."),
        (6, trainer_id, "Testado e confirmado como resolvido. Obrigado!"),
        # chamado 8: pesquisa utilizadores (concluído)
        (8, admin_id, "Filtro por role adicionado à pesquisa de utilizadores. Disponível na v2.3.1."),
        (8, admin_id, "Fechando o chamado — funcionalidade entregue e testada em produção."),
        # chamado 9: timeout
        (9, admin_id, "Query optimizada com índice composto em (date_occurrence, bank_id, status). A testar em staging."),
    ]

    comment_count = 0
    for ci, author, content in COMMENTS:
        if ci >= len(chamado_ids) or not chamado_ids[ci]:
            continue
        q("""INSERT INTO chamado_comments (chamado_id, author_id, content)
             VALUES (%s, %s, %s)""",
          chamado_ids[ci], author, content)
        comment_count += 1
    commit()
    print(f"       {comment_count} comentários em chamados criados")


# ═══════════════════════════════════════════════════════════════
# 5. PORTAL DE RELATÓRIOS — FAQs do Chat
# ═══════════════════════════════════════════════════════════════

print("\n[5/6] Chat FAQs para suporte nos portais...")

existing_faqs = fetch_one("SELECT COUNT(*) FROM chat_faqs")[0]
if existing_faqs > 0 and not FORCE:
    print(f"       [SKIP] {existing_faqs} FAQs já existem.")
else:
    if FORCE and not DRY:
        cur.execute("DELETE FROM chat_faqs")
        commit()

    FAQS = [
        ("carta de crédito|LC|crédito documentário",
         "garantia bancaria|garantía bancaria|aval",
         "letter of credit|LC|documentary credit",
         "Uma **Carta de Crédito (LC)** é um compromisso de pagamento emitido por um banco em nome do comprador. O banco garante o pagamento ao vendedor desde que os documentos apresentados estejam conformes com os termos do LC. Regida pelas regras **UCP 600** da CCI.",
         "Una **Carta de Crédito (LC)** es un compromiso de pago emitido por un banco en nombre del comprador. Rige por las reglas **UCP 600** de la CCI.",
         "A **Letter of Credit (LC)** is a payment commitment issued by a bank on behalf of the buyer. Governed by **UCP 600** ICC rules.",
         None, "Ver manual UCP 600", None, 1),
        ("discrepância|discrepancia|documentos rejeitados",
         "discrepancia|documentos rechazados",
         "discrepancy|rejected documents",
         "Uma **discrepância** ocorre quando os documentos apresentados não estão conformes com os termos do LC. O banco tem **5 dias úteis** (UCP 600, Art. 14b) para analisar e comunicar discrepâncias. O beneficiário pode corrigir e re-apresentar dentro do prazo.",
         "Una **discrepancia** ocurre cuando los documentos no cumplen los términos de la LC. El banco tiene **5 días hábiles** para notificar.",
         "A **discrepancy** occurs when documents don't comply with LC terms. The bank has **5 business days** to notify.",
         None, None, None, 2),
        ("prazo de apresentação|presentation period|plazo presentación",
         "plazo presentación|periodo presentación",
         "presentation period|presentation deadline",
         "O **prazo de apresentação** de documentos é geralmente **21 dias corridos** após a data de embarque (UCP 600, Art. 14c), salvo indicação contrária no LC. O prazo nunca pode ultrapassar a data de validade do LC.",
         "El **plazo de presentación** es generalmente **21 días corridos** después de la fecha de embarque.",
         "The **presentation period** is generally **21 calendar days** after the shipment date.",
         None, None, None, 3),
        ("senso|erros internos|registo de erros",
         "censo|errores internos|registro",
         "census|internal errors|error registration",
         "O **Senso** é o período de registo de erros internos identificados pelos liberadores. Durante o senso, os liberadores registam erros encontrados nas operações gravadas. O tutor avalia cada erro e atribui um plano de acção quando necessário.",
         "El **Censo** es el período de registro de errores internos identificados por los liberadores.",
         "The **Census** is the period for recording internal errors identified by releasers.",
         None, None, "ADMIN,TRAINER,TUTOR", 4),
        ("como criar plano de formação|training plan|plano formativo",
         "como crear plan formación",
         "how to create training plan",
         "Para criar um **Plano de Formação**: 1) Aceda ao Portal de Formações → Planos; 2) Clique em 'Novo Plano'; 3) Defina título, datas e aluno; 4) Adicione cursos ao plano; 5) Atribua um formador. O aluno recebe notificação automática.",
         "Para crear un **Plan de Formación**: vaya a Formaciones → Planes → Nuevo Plan.",
         "To create a **Training Plan**: go to Training Portal → Plans → New Plan.",
         None, None, "ADMIN,TRAINER", 5),
    ]

    faq_count = 0
    for kw_pt, kw_es, kw_en, ans_pt, ans_es, ans_en, url, label, roles, prio in FAQS:
        q("""INSERT INTO chat_faqs
             (keywords_pt, keywords_es, keywords_en,
              answer_pt, answer_es, answer_en,
              support_url, support_label, role_filter, priority,
              is_active, created_by_id)
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s)""",
          kw_pt, kw_es, kw_en, ans_pt, ans_es, ans_en,
          url, label, roles, prio, admin_id)
        faq_count += 1
    commit()
    print(f"       {faq_count} FAQs do chat criadas")


# ═══════════════════════════════════════════════════════════════
# 6. MARKER + SUMÁRIO
# ═══════════════════════════════════════════════════════════════

print("\n[6/6] Gravando marcador...")
if not DRY:
    try:
        q("INSERT INTO _migrations (filename, applied_at) VALUES (%s, NOW()) ON DUPLICATE KEY UPDATE applied_at = NOW()",
          SEED_MARKER)
        commit()
    except Exception as e:
        print(f"       [AVISO] Não foi possível gravar marcador: {e}")

conn.close()

print()
print("=" * 60)
print("  seed_real_data concluído" + (" [DRY-RUN]" if DRY else ""))
print()
print("  Portais com dados:")
print("  ✓ Formações  — 5 cursos, 16 aulas, 3 planos, inscrições e progresso")
print("  ✓ Tutoria    — 12 erros, 5 planos de ação, 3 fichas, 2 sensos, 5 erros internos")
print("  ✓ Chamados   — 10 chamados (BUG/MELHORIA) com comentários")
print("  ✓ Relatórios — beneficia dos dados acima + 5 FAQs no chat")
print("=" * 60)
