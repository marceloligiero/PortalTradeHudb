"""
diagnostico_bd.py — Verifica o estado real da base de dados.

Mostra:
  - Migracoes aplicadas (tabela _migrations)
  - Colunas em falta na tabela users (vs modelo SQLAlchemy)
  - Todas as tabelas existentes

Uso:
  python scripts/diagnostico_bd.py
"""
import os, re, sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / "backend" / ".env"

def read_env():
    for enc in ("utf-8-sig","utf-16","utf-8","cp1252","latin-1"):
        try:
            t = ENV_FILE.read_text(encoding=enc)
            if t.count("\x00") > len(t)//4: continue
            return t
        except: continue
    return ""

def parse_url():
    for line in read_env().splitlines():
        line = line.strip().strip("\x00")
        if not line or line.startswith("#") or "=" not in line: continue
        k,_,v = line.partition("=")
        if k.strip() != "DATABASE_URL": continue
        url = v.strip().strip("'\"")
        m = re.match(r"mysql\+pymysql://([^:]+):([^@]*)@([^:/]+):?(\d+)?/([^\s?#]+)", url)
        if not m: return {}
        return {"user":m.group(1),"password":m.group(2),"host":m.group(3),
                "port":int(m.group(4) or 3306),"database":m.group(5).rstrip("'\"")}
    return {}

creds = parse_url()
if not creds:
    print("[ERRO] Nao foi possivel ler DATABASE_URL")
    sys.exit(1)

try:
    import pymysql
except ImportError:
    print("[ERRO] pymysql nao instalado")
    sys.exit(1)

try:
    conn = pymysql.connect(host=creds["host"], port=creds["port"],
                           user=creds["user"], password=creds["password"],
                           database=creds["database"], charset="utf8mb4")
except Exception as e:
    print(f"[ERRO] Nao foi possivel ligar ao MySQL: {e}")
    sys.exit(1)

cur = conn.cursor()
print()
print("=" * 60)
print(f"  BD: {creds['database']} @ {creds['host']}:{creds['port']}")
print("=" * 60)

# ── Migracoes aplicadas ────────────────────────────────────────
print("\n── Migracoes em _migrations ──────────────────────────────")
try:
    cur.execute("SELECT filename, applied_at FROM _migrations ORDER BY id")
    rows = cur.fetchall()
    if rows:
        for fn, at in rows:
            print(f"  {str(at)[:19]}  {fn}")
    else:
        print("  (vazia — nenhuma migracao registada)")
except Exception as e:
    print(f"  [ERRO] Tabela _migrations nao existe ou erro: {e}")

# ── Tabelas existentes ─────────────────────────────────────────
print("\n── Tabelas existentes ────────────────────────────────────")
cur.execute("SHOW TABLES")
tables = [r[0] for r in cur.fetchall()]
for t in sorted(tables):
    cur.execute(f"SELECT COUNT(*) FROM `{t}`")
    n = cur.fetchone()[0]
    print(f"  {t:<45} {n:>6} linhas")

# ── Colunas da tabela users ────────────────────────────────────
print("\n── Colunas da tabela users ───────────────────────────────")
EXPECTED_COLS = [
    "id","email","full_name","hashed_password","sso_provider","sso_id",
    "role","is_active","is_pending",
    "is_admin","is_diretor","is_gerente","is_chefe_equipe","is_formador",
    "is_tutor","is_liberador","is_referente","is_trainer","is_team_lead",
    "validated_at","created_at","updated_at","tutor_id","team_id",
]
try:
    cur.execute("SHOW COLUMNS FROM users")
    existing = {r[0] for r in cur.fetchall()}
    for col in EXPECTED_COLS:
        status = "[OK]    " if col in existing else "[FALTA] "
        print(f"  {status} {col}")
    extras = existing - set(EXPECTED_COLS)
    for col in sorted(extras):
        print(f"  [EXTRA]  {col}")
except Exception as e:
    print(f"  [ERRO] Nao foi possivel verificar colunas: {e}")

# ── Stored procedures existentes ──────────────────────────────
print("\n── Stored procedures ─────────────────────────────────────")
try:
    cur.execute(f"SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '{creds['database']}'")
    procs = [r[0] for r in cur.fetchall()]
    if procs:
        for p in procs: print(f"  {p}")
    else:
        print("  (nenhuma)")
except Exception as e:
    print(f"  [ERRO] {e}")

conn.close()
print()
print("=" * 60)
