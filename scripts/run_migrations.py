"""
run_migrations.py — Corre init_db (create_all) + detecta colunas em falta + V001
Chamado pelo iniciar-dev.bat antes de arrancar o backend.
"""
import sys
import os
import subprocess
import re

# Adicionar backend ao path
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)

# Carregar .env do backend manualmente (antes de importar settings)
env_file = os.path.join(BACKEND_DIR, ".env")
if not os.path.exists(env_file):
    print("[ERRO] backend/.env nao encontrado. Corra setup-db.bat primeiro.")
    sys.exit(1)

with open(env_file, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

DATABASE_URL = os.environ.get("DATABASE_URL", "")
is_sqlite    = DATABASE_URL.startswith("sqlite")
is_mysql     = "mysql" in DATABASE_URL

# -------------------------------------------------------------------
# 1. create_all (cria tabelas novas)
# -------------------------------------------------------------------
print("[1/4] Criando/verificando tabelas...")
try:
    from app.database import engine, init_db, Base
    import app.models  # noqa: F401 — regista todos os modelos
    init_db()
    print("      Tabelas base OK.")
except Exception as e:
    print(f"      [ERRO] {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# 2. Detectar e adicionar colunas em falta
# -------------------------------------------------------------------
print("[2/4] Verificando colunas em falta...")

try:
    from sqlalchemy import inspect, text

    inspector   = inspect(engine)
    missing_any = False

    for table_name, table in Base.metadata.tables.items():
        if not inspector.has_table(table_name):
            continue
        existing = {c["name"] for c in inspector.get_columns(table_name)}
        for col in table.columns:
            if col.name in existing:
                continue
            missing_any = True

            # SQLite: apagar e recriar directamente (mais simples e seguro)
            if is_sqlite:
                break

            # MySQL: ALTER TABLE com DEFAULT correcto
            try:
                col_type = col.type.compile(dialect=engine.dialect)
                if col.default is not None and col.default.is_scalar:
                    dv = col.default.arg
                    if isinstance(dv, bool):
                        default_val = "1" if dv else "0"
                    elif isinstance(dv, str):
                        default_val = "'{}'".format(dv.replace("'", "''"))
                    elif dv is None:
                        default_val = "NULL"
                    else:
                        default_val = str(dv)
                    sql = "ALTER TABLE `{}` ADD COLUMN `{}` {} DEFAULT {}".format(
                        table_name, col.name, col_type, default_val)
                else:
                    sql = "ALTER TABLE `{}` ADD COLUMN `{}` {} DEFAULT NULL".format(
                        table_name, col.name, col_type)
                with engine.connect() as conn:
                    conn.execute(text(sql))
                    conn.commit()
                print("      + {}.{}".format(table_name, col.name))
            except Exception as e:
                print("      [AVISO] {}.{}: {}".format(table_name, col.name, e))
        else:
            continue
        break  # sai do loop de tabelas se SQLite e houver coluna em falta

    # SQLite com colunas em falta: apagar db e recriar do zero
    if missing_any and is_sqlite:
        db_path = DATABASE_URL.replace("sqlite:///./", "").replace("sqlite:///", "").replace("sqlite://", "")
        if not os.path.isabs(db_path):
            db_path = os.path.join(BACKEND_DIR, db_path)
        if os.path.exists(db_path):
            os.remove(db_path)
            print("      SQLite apagado — recriando com schema completo...")
        init_db()
        print("      SQLite recriado.")
    elif not missing_any:
        print("      Nenhuma coluna em falta.")
    else:
        print("      Colunas verificadas.")

except Exception as e:
    print("      [AVISO] Verificacao de colunas: {}".format(e))

# -------------------------------------------------------------------
# 3. V001 migration via mysql CLI (MySQL apenas)
# -------------------------------------------------------------------
if not is_mysql:
    print("[3/4] Nao e MySQL — saltando V001 SQL.")
else:
    V001 = os.path.join(ROOT_DIR, "database", "migrations", "V001__initial_unified_schema.sql")
    if not os.path.exists(V001):
        print("[3/4] V001 nao encontrado — saltando.")
    else:
        m = re.match(r"mysql\+pymysql://([^:@]+)(?::([^@]*))?@([^:/]+)(?::(\d+))?/(.+)", DATABASE_URL)
        if not m:
            safe_url = DATABASE_URL[:8] + "..." + DATABASE_URL[-20:] if len(DATABASE_URL) > 30 else DATABASE_URL
            print(f"[3/4] URL MySQL invalido — saltando V001. (URL lido: {safe_url!r})")
        else:
            db_user = m.group(1)
            db_pass = m.group(2) if m.group(2) is not None else ""
            db_host = m.group(3)
            db_port = m.group(4) or "3306"
            db_name = m.group(5)

            mysql_candidates = [
                "mysql",
                r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
                r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
                r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
                r"C:\xampp\mysql\bin\mysql.exe",
                r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
            ]

            mysql_exe = None
            for candidate in mysql_candidates:
                try:
                    r = subprocess.run([candidate, "--version"], capture_output=True, timeout=5)
                    if r.returncode == 0:
                        mysql_exe = candidate
                        break
                except (FileNotFoundError, subprocess.TimeoutExpired):
                    continue

            if not mysql_exe:
                print(f"[3/4] mysql CLI nao encontrado — saltando V001.")
                print(f"      Manual: mysql -u {db_user} {db_name} < {V001}")
            else:
                print(f"[3/4] Aplicando V001...")
                env_cmd = os.environ.copy()
                env_cmd["MYSQL_PWD"] = db_pass
                try:
                    with open(V001, "r", encoding="utf-8") as sql_file:
                        result = subprocess.run(
                            [mysql_exe, f"-u{db_user}", f"-h{db_host}", f"-P{db_port}", db_name],
                            stdin=sql_file, capture_output=True, text=True,
                            encoding="utf-8", errors="replace",
                            env=env_cmd, timeout=120,
                        )
                    errs = [l for l in result.stderr.splitlines()
                            if l.strip() and "Warning" not in l and "already exists" not in l.lower()]
                    for e in errs[:5]:
                        print(f"      {e}")
                    print("      V001 concluido.")
                except Exception as e:
                    print(f"      [AVISO] {e}")

# -------------------------------------------------------------------
# 4. Seed admin se nao existirem utilizadores
# -------------------------------------------------------------------
print("[4/4] Verificando utilizador admin...")
try:
    from app.models import User
    from app.auth import get_password_hash
    from sqlalchemy.orm import Session

    with Session(engine) as db:
        count = db.query(User).count()
        if count == 0:
            admin = User(
                email="admin@tradehub.com",
                full_name="Administrador",
                hashed_password=get_password_hash("admin123"),
                role="ADMIN",
                is_active=True,
                is_pending=False,
            )
            db.add(admin)
            db.commit()
            print("      Admin criado: admin@tradehub.com / admin123")
            print("      IMPORTANTE: alterar a senha apos o primeiro login!")
        else:
            print(f"      {count} utilizador(es) ja existem — sem seed.")
except Exception as e:
    print(f"      [AVISO] seed admin: {e}")

print("Migracoes concluidas.")
