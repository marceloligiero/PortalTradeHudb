"""
run_migrations.py — Corre init_db (create_all) + V001 migration
Chamado pelo iniciar-dev.bat antes de arrancar o backend.
"""
import sys
import os
import subprocess
import re

# Adicionar backend ao path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)

# Carregar .env do backend manualmente (antes de importar settings)
env_file = os.path.join(BACKEND_DIR, ".env")
if os.path.exists(env_file):
    with open(env_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# -------------------------------------------------------------------
# 1. create_all via SQLAlchemy
# -------------------------------------------------------------------
print("[1/2] Criando/verificando tabelas (SQLAlchemy)...")
try:
    from app.database import engine, init_db
    import app.models  # garante que todos os modelos estao registados
    init_db()
    print("      Tabelas OK.")
except Exception as e:
    print(f"      [ERRO] {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# 2. V001 migration via mysql CLI
# -------------------------------------------------------------------
V001 = os.path.join(ROOT_DIR, "database", "migrations", "V001__initial_unified_schema.sql")

if not os.path.exists(V001):
    print("[2/2] V001 nao encontrado — saltando migracoes SQL.")
    sys.exit(0)

# Extrair credenciais do DATABASE_URL
# formato: mysql+pymysql://user:pass@host:port/dbname
m = re.match(r"mysql\+pymysql://([^:]+):([^@]*)@([^:/]+)(?::(\d+))?/(.+)", DATABASE_URL)
if not m:
    print("[2/2] DATABASE_URL nao e MySQL — saltando migracoes SQL.")
    sys.exit(0)

db_user, db_pass, db_host, db_port, db_name = m.group(1,2,3,4,5)
db_port = db_port or "3306"

# Procurar mysql.exe
mysql_candidates = [
    "mysql",  # PATH
    r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    r"C:\xampp\mysql\bin\mysql.exe",
    r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
]

mysql_exe = None
for candidate in mysql_candidates:
    try:
        result = subprocess.run(
            [candidate, "--version"],
            capture_output=True, timeout=5
        )
        if result.returncode == 0:
            mysql_exe = candidate
            break
    except (FileNotFoundError, subprocess.TimeoutExpired):
        continue

if not mysql_exe:
    print("[2/2] mysql CLI nao encontrado — saltando V001.")
    print("      Para aplicar manualmente:")
    print(f"      mysql -u {db_user} -p {db_name} < {V001}")
    sys.exit(0)

print(f"[2/2] Aplicando V001 migration via {mysql_exe}...")

env_cmd = os.environ.copy()
env_cmd["MYSQL_PWD"] = db_pass  # evita aviso de password na linha de comando

cmd = [
    mysql_exe,
    f"-u{db_user}",
    f"-h{db_host}",
    f"-P{db_port}",
    db_name,
]

try:
    with open(V001, "r", encoding="utf-8") as sql_file:
        result = subprocess.run(
            cmd,
            stdin=sql_file,
            capture_output=True,
            text=True,
            env=env_cmd,
            timeout=120,
        )
    if result.returncode == 0:
        print("      V001 aplicado com sucesso.")
    else:
        # Ignorar avisos de itens ja existentes
        errors = [l for l in result.stderr.splitlines()
                  if l.strip() and "Warning" not in l and "already exists" not in l.lower()]
        if errors:
            print("      Avisos (nao criticos):")
            for e in errors[:5]:
                print(f"        {e}")
        print("      V001 concluido.")
except subprocess.TimeoutExpired:
    print("      [AVISO] Timeout na migration — verificar manualmente.")
except Exception as e:
    print(f"      [AVISO] {e}")

print("Migracoes concluidas.")
