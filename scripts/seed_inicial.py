"""
seed_inicial.py — Dados mestres + utilizadores de teste para deploy novo.

Lê as credenciais directamente do backend/.env (DATABASE_URL).
Não requer Docker nem Excel. Idempotente (INSERT IGNORE).

Uso:
  python scripts/seed_inicial.py               # normal (salta se já feito)
  python scripts/seed_inicial.py --force       # re-importa mesmo se já feito
  python scripts/seed_inicial.py --reset-users # só recria utilizadores
  python scripts/seed_inicial.py --dry-run     # mostra o que faria, sem escrever
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

# Force UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / "backend" / ".env"

FORCE       = "--force"       in sys.argv
RESET_USERS = "--reset-users" in sys.argv
DRY         = "--dry-run"     in sys.argv

SEED_MARKER = "seed_inicial_v1"

# ─── bcrypt hash de "test123" ─────────────────────────────────────────────────
HASH_TEST123 = "$2b$12$VbQ4uFFIK/Q.RInCdJVQ7e9rZDoTZOivTmXavig9mVxtyGRjLbZsK"

# ─── Dados-Mestre ─────────────────────────────────────────────────────────────

BANKS = [
    ("BSA", "BANCO SANTANDER, S.A.",      "ES"),
    ("BST", "BANCO SANTANDER TOTTA",      "PT"),
    ("SUK", "SANTANDER UK",               "UK"),
    ("SCB", "SANTANDER CONSUMER BANK AG", "DE"),
]

PRODUCTS = [
    ("CRED_IMP", "Créditos Importación"),
    ("REM_IMP",  "Remesas Importación"),
    ("REM_EXP",  "Remesas Exportación"),
    ("GAR_EMI",  "Garantias Emitidas"),
    ("GAR_REC",  "Garantias Recibidas"),
    ("ORD_PAG",  "Ordenes de Pago Financiadas"),
    ("EURO",     "Eurocobros"),
]

DEPARTMENTS = [
    "OPAGO", "CDI SAN", "REM EXPORT", "FINANCIACIONES", "REM IMPORT",
    "CONTROL", "GARANTIAS", "GENERAL", "CDE", "PRUEBAS",
    "CHEQUES EXPORT", "PAGOS", "ESPANA", "ONE-UK TRADE",
    "PROYECTOS", "CONFIRMING", "FACTURACION",
]

TEAMS = [
    "CLIENT MANAGER", "RESPONSABLE", "DATA", "PROYECTOS",
    "METODOLOGIA Y SOPORTE", "PAGOS FINANCIADOS", "REMESAS",
    "CREDITOS DOCUMENTARIOS", "GARANTIAS", "Sourcing",
]

ERROR_IMPACTS = [
    ("Alto", "HIGH"),
    ("Bajo", "LOW"),
    ("Medio", "MEDIUM"),
]

ERROR_DETECTED_BY = [
    "Corresponsal", "Cliente Final", "TRADE",
    "Of/Uni/Middle/Gestor", "Quality Unit",
]

ERROR_ORIGINS = [
    "Trade_Personas", "Trade_Procesos", "Trade_Tecnologia", "Terceros",
]

TUTORIA_CATEGORIES = [
    "Formación", "Nuevo Conocimiento", "Interpretación y Análisis",
    "Omisión", "Marcación", "Organización", "Tipográfico",
    "Incidencia Cliente", "-- por clasificar --", "Metodologia",
    "Conocimientos", "Procedimientos", "Atención al detalle",
]

# (nome, origem)
TIPOLOGIA_INCIDENTE = [
    ("Formación Insuficiente",                    "Trade_Personas"),
    ("Dependencia de personal clave",             "Trade_Personas"),
    ("Error Puntual",                             "Trade_Personas"),
    ("Sobrecarga Operativa",                      "Trade_Personas"),
    ("Segregación Funcional",                     "Trade_Personas"),
    ("Diseño ineficaz del proceso",               "Trade_Procesos"),
    ("Desempeño ineficaz de un proceso",          "Trade_Procesos"),
    ("Calidad de los datos",                      "Trade_Procesos"),
    ("Gestión del cambio tecnológico inadecuado", "Trade_Tecnologia"),
    ("Diseño inadecuado de los sistemas",         "Trade_Tecnologia"),
    ("Funcionamiento inadecuado de un sistema",  "Trade_Tecnologia"),
    ("Proveedores",                               "Terceros"),
    ("Oficina/Uni/Middle",                        "Terceros"),
    ("Corresponsal",                              "Terceros"),
]

ACTIVITIES = [
    "Análisis de documentación", "Apertura de operación", "Cierre de operación",
    "Comunicación cliente", "Comunicación corresponsal", "Control de calidad",
    "Emisión de garantía", "Emisión de remesa", "Gestión de incidencia",
    "Gestión de pago", "Liquidación", "Modificación de operación",
    "Presentación de documentos", "Reconciliación", "Revisión de operación",
    "Tratamiento de reclamación", "Verificación de datos",
]

ERROR_TYPES = [
    "Datos incorrectos", "Documento faltante", "Error de importe",
    "Error de fecha", "Error de divisa", "Instrucción incorrecta",
    "Operación duplicada", "Retraso en procesamiento", "Comunicación incorrecta",
    "Falta de autorización",
]

# ─── Utilizadores de teste ────────────────────────────────────────────────────
# (email, nome, role, is_trainer, is_tutor, is_liberador, is_team_lead, is_referente)
CORE_USERS = [
    ("admin@tradehub.com",          "Admin Portal",       "ADMIN",    0, 0, 0, 0, 0),
    ("trainer@tradehub.com",        "Test Trainer",       "TRAINEE",  1, 0, 0, 0, 0),
    ("tutor@tradehub.com",          "Test Tutor",         "TRAINEE",  1, 1, 0, 0, 0),
    ("manager@tradehub.com",        "Test Manager",       "MANAGER",  0, 0, 0, 1, 0),
    ("student@tradehub.com",        "Test Student",       "TRAINEE",  0, 0, 0, 0, 0),
    ("liberador@tradehub.com",      "Test Liberador",     "TRAINEE",  0, 0, 1, 0, 0),
    ("referente@tradehub.com",      "Test Referente",     "TRAINEE",  0, 0, 0, 0, 1),
    ("chefe@tradehub.com",          "Test Chefe",         "MANAGER",  0, 0, 0, 1, 0),
    # CI / test-suite
    ("manager_test@tradehub.com",   "Manager Test",       "MANAGER",  0, 0, 0, 1, 0),
    ("trainer_test@tradehub.com",   "Trainer Test",       "TRAINEE",  1, 0, 0, 0, 0),
    ("tutor_test@tradehub.com",     "Tutor Test",         "TRAINEE",  0, 1, 0, 0, 0),
    ("student_test@tradehub.com",   "Student Test",       "TRAINEE",  0, 0, 0, 0, 0),
    ("liberador_test@tradehub.com", "Liberador Test",     "TRAINEE",  0, 0, 1, 0, 0),
    ("referente_test@tradehub.com", "Referente Test",     "TRAINEE",  0, 0, 0, 0, 1),
    ("chefe_test@tradehub.com",     "Chefe Test",         "MANAGER",  0, 0, 0, 1, 0),
]


# ─── Helpers ─────────────────────────────────────────────────────────────────

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
        m = re.match(r"mysql\+pymysql://([^:]+):([^@]*)@([^:/]+):?(\d+)?/([^\s?#]+)", url)
        if not m:
            return {}
        return {
            "user": m.group(1), "password": m.group(2),
            "host": m.group(3), "port": int(m.group(4) or 3306),
            "database": m.group(5).rstrip("'\""),
        }
    return {}


def existing_set(cur, table: str, col: str = "name") -> set:
    try:
        cur.execute(f"SELECT `{col}` FROM `{table}`")
        return {r[0] for r in cur.fetchall()}
    except Exception:
        return set()


def upsert(cur, conn, table: str, cols: list, rows: list, label: str = "") -> int:
    label = label or table
    if not rows:
        print(f"  [--] {label}: nada a inserir (já existe)")
        return 0
    if DRY:
        print(f"  [dry] {label}: {len(rows)} linhas")
        return len(rows)
    ph  = ", ".join(["%s"] * len(cols))
    col_str = ", ".join(f"`{c}`" for c in cols)
    sql = f"INSERT IGNORE INTO `{table}` ({col_str}) VALUES ({ph})"
    cur.executemany(sql, rows)
    conn.commit()
    inserted = cur.rowcount
    skipped  = len(rows) - inserted
    suffix   = f", {skipped} já existiam" if skipped else ""
    print(f"  [OK] {label}: {inserted} inseridos{suffix}")
    return inserted


def insert_names(cur, conn, table: str, names: list, extra: dict | None = None, label: str = "") -> int:
    exist = existing_set(cur, table)
    new   = [n for n in names if n not in exist]
    extra = extra or {}
    cols  = ["name", "is_active"] + list(extra.keys())
    rows  = [(n, 1) + tuple(extra.values()) for n in new]
    return upsert(cur, conn, table, cols, rows, label or table)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    print()
    print("=" * 60)
    print("  PortalTradeHub — Seed Inicial (dados-mestre + utilizadores)")
    print("=" * 60)

    creds = parse_database_url(ENV_FILE)
    if not creds:
        print(f"[ERRO] Não foi possível ler DATABASE_URL em {ENV_FILE}")
        return 1

    print(f"  DB: {creds['host']}:{creds['port']}/{creds['database']}")
    if DRY:
        print("  MODO: dry-run (sem escrita)")
    print()

    try:
        import pymysql
    except ImportError:
        print("[ERRO] pymysql não instalado. Execute: pip install pymysql")
        return 1

    try:
        conn = pymysql.connect(
            host=creds["host"], port=creds["port"],
            user=creds["user"], password=creds["password"],
            database=creds["database"], charset="utf8mb4", autocommit=False,
        )
    except Exception as e:
        print(f"[ERRO] Não foi possível ligar ao MySQL: {e}")
        return 1

    cur = conn.cursor()

    # Verificar marcador (skip se já feito, a não ser --force)
    if not RESET_USERS:
        try:
            cur.execute("SELECT COUNT(*) FROM _migrations WHERE filename = %s", (SEED_MARKER,))
            if cur.fetchone()[0] > 0 and not FORCE:
                print("  Seed já aplicado. Use --force para re-importar.")
                conn.close()
                return 0
        except Exception:
            pass  # tabela _migrations pode não existir

    # ── Banks ─────────────────────────────────────────────────────────────────
    print("── Banks ─────────────────────────────────────────────────────")
    exist = existing_set(cur, "banks", "code")
    upsert(cur, conn, "banks", ["code", "name", "country", "is_active"],
           [(c, n, co, 1) for c, n, co in BANKS if c not in exist], "banks")

    # ── Products ──────────────────────────────────────────────────────────────
    print("── Products ──────────────────────────────────────────────────")
    exist = existing_set(cur, "products", "code")
    upsert(cur, conn, "products", ["code", "name", "is_active"],
           [(c, n, 1) for c, n in PRODUCTS if c not in exist], "products")

    # ── Departments ───────────────────────────────────────────────────────────
    print("── Departments ───────────────────────────────────────────────")
    insert_names(cur, conn, "departments", DEPARTMENTS, label="departments")

    # ── Teams ─────────────────────────────────────────────────────────────────
    print("── Teams ─────────────────────────────────────────────────────")
    insert_names(cur, conn, "teams", TEAMS, label="teams")

    # ── Error Impacts ─────────────────────────────────────────────────────────
    print("── Error Impacts ─────────────────────────────────────────────")
    exist = existing_set(cur, "error_impacts")
    upsert(cur, conn, "error_impacts", ["name", "level", "is_active"],
           [(n, lv, 1) for n, lv in ERROR_IMPACTS if n not in exist], "error_impacts")

    # ── Error Detected By ─────────────────────────────────────────────────────
    print("── Error Detected By ─────────────────────────────────────────")
    insert_names(cur, conn, "error_detected_by", ERROR_DETECTED_BY, label="error_detected_by")

    # ── Error Origins ─────────────────────────────────────────────────────────
    print("── Error Origins ─────────────────────────────────────────────")
    insert_names(cur, conn, "error_origins", ERROR_ORIGINS, label="error_origins")

    # ── Tutoria Categories ────────────────────────────────────────────────────
    print("── Tutoria Error Categories ──────────────────────────────────")
    insert_names(cur, conn, "tutoria_error_categories", TUTORIA_CATEGORIES,
                 label="tutoria_error_categories")

    # Tipologia Incidente (com origin_id)
    cur.execute("SELECT name, id FROM error_origins")
    origin_map = {r[0]: r[1] for r in cur.fetchall()}
    exist_cat = existing_set(cur, "tutoria_error_categories")
    rows_inc = [
        (name, origin_map[orig], 1)
        for name, orig in TIPOLOGIA_INCIDENTE
        if name not in exist_cat and orig in origin_map
    ]
    upsert(cur, conn, "tutoria_error_categories", ["name", "origin_id", "is_active"],
           rows_inc, "tutoria_error_categories (tipología incidente)")

    # ── Activities ────────────────────────────────────────────────────────────
    print("── Activities ────────────────────────────────────────────────")
    insert_names(cur, conn, "activities", ACTIVITIES, label="activities")

    # ── Error Types ───────────────────────────────────────────────────────────
    print("── Error Types ───────────────────────────────────────────────")
    insert_names(cur, conn, "error_types", ERROR_TYPES, label="error_types")

    # ── Utilizadores de teste ─────────────────────────────────────────────────
    print("── Utilizadores de teste (password: test123) ─────────────────")

    # Obter team_id para associar utilizadores
    cur.execute("SELECT id FROM teams LIMIT 1")
    row = cur.fetchone()
    team_id_db = row[0] if row else None

    if RESET_USERS:
        if not DRY:
            cur.execute("DELETE FROM users WHERE role != 'ADMIN'")
            conn.commit()
            print(f"  [OK] Utilizadores não-admin removidos para re-importar.")

    exist_emails = existing_set(cur, "users", "email")
    user_rows = [
        (email, name, HASH_TEST123, role, 1, 0, is_tr, is_tu, is_li, is_tl, is_re, team_id_db)
        for email, name, role, is_tr, is_tu, is_li, is_tl, is_re in CORE_USERS
        if email not in exist_emails
    ]
    upsert(cur, conn, "users",
           ["email", "full_name", "hashed_password", "role", "is_active", "is_pending",
            "is_trainer", "is_tutor", "is_liberador", "is_team_lead", "is_referente", "team_id"],
           user_rows, "users")

    # Atribuir tutor_id ao student, liberador, referente
    if not DRY:
        cur.execute("SELECT id FROM users WHERE email = 'tutor@tradehub.com'")
        tr = cur.fetchone()
        if tr:
            cur.execute(
                "UPDATE users SET tutor_id = %s "
                "WHERE email IN ('student@tradehub.com','liberador@tradehub.com','referente@tradehub.com') "
                "AND tutor_id IS NULL",
                (tr[0],)
            )
            conn.commit()
            if cur.rowcount:
                print(f"  [OK] tutor_id={tr[0]} atribuído a {cur.rowcount} utilizador(es)")

        # Fix NULL is_active
        cur.execute("UPDATE banks SET is_active = 1 WHERE is_active IS NULL")
        cur.execute("UPDATE products SET is_active = 1 WHERE is_active IS NULL")
        conn.commit()

    # ── Gravar marcador ───────────────────────────────────────────────────────
    if not DRY:
        try:
            cur.execute(
                "INSERT INTO _migrations (filename, applied_at) VALUES (%s, NOW()) "
                "ON DUPLICATE KEY UPDATE applied_at = NOW()",
                (SEED_MARKER,)
            )
            conn.commit()
        except Exception:
            pass

    # ── Resumo ────────────────────────────────────────────────────────────────
    print()
    print("─" * 60)
    SUMMARY_TABLES = [
        "users", "banks", "products", "departments", "teams",
        "error_impacts", "error_detected_by", "error_origins",
        "tutoria_error_categories", "activities", "error_types",
    ]
    total = 0
    for t in SUMMARY_TABLES:
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        n = cur.fetchone()[0]
        print(f"  {t:<38} {n:>4} linhas")
        total += n
    print(f"  {'TOTAL':<38} {total:>4} linhas")
    print("─" * 60)
    print()
    print("  Utilizadores criados (password: test123):")
    for email, name, role, *_ in CORE_USERS:
        print(f"    {email:<35} [{role}]")
    print()
    print("  Seed concluido.")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
