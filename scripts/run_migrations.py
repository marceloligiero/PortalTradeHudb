"""
run_migrations.py — Aplica TODAS as migrations SQL pendentes + init_db + seed admin.

Chamado pelo iniciar-sem-docker.bat antes de arrancar o backend.

Ordem de execucao:
  1. Criar/verificar tabelas via SQLAlchemy (create_all)
  2. Detectar colunas em falta e adicionar via ALTER TABLE
  3. Criar tabela _migrations se nao existir
  4. Aplicar cada V0XX__*.sql pendente (nao registado em _migrations)
  5. Seed do utilizador admin se a tabela users estiver vazia
"""
import sys
import os
import re
import glob

# ── Path setup ────────────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
MIGRATIONS_DIR = os.path.join(ROOT_DIR, "database", "migrations")
sys.path.insert(0, BACKEND_DIR)

# ── Leitura do .env com suporte a UTF-8, UTF-16 e ANSI (Windows) ─────────────
env_file = os.path.join(BACKEND_DIR, ".env")
if not os.path.exists(env_file):
    print("[ERRO] backend/.env nao encontrado.")
    sys.exit(1)

def _read_env(path):
    for enc in ("utf-8-sig", "utf-16", "utf-8", "cp1252", "latin-1"):
        try:
            text = open(path, encoding=enc).read()
            if text.count("\x00") > len(text) // 4:
                continue
            return text
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""

for line in _read_env(env_file).splitlines():
    line = line.strip().strip("\x00")
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip("'\""))

DATABASE_URL = os.environ.get("DATABASE_URL", "")
is_sqlite    = DATABASE_URL.startswith("sqlite")
is_mysql     = "mysql" in DATABASE_URL

# ── 1. create_all ─────────────────────────────────────────────────────────────
print("[1/5] Criando/verificando tabelas...")
try:
    from app.database import engine, init_db, Base
    import app.models  # noqa: F401
    init_db()
    print("      Tabelas base OK.")
except Exception as e:
    print(f"      [ERRO] {e}")
    sys.exit(1)

# ── 2. Detectar colunas em falta ──────────────────────────────────────────────
print("[2/5] Verificando colunas em falta...")
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
            if is_sqlite:
                break
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
        break

    if missing_any and is_sqlite:
        db_path = DATABASE_URL.replace("sqlite:///./", "").replace("sqlite:///", "").replace("sqlite://", "")
        if not os.path.isabs(db_path):
            db_path = os.path.join(BACKEND_DIR, db_path)
        if os.path.exists(db_path):
            os.remove(db_path)
        init_db()
        print("      SQLite recriado.")
    elif not missing_any:
        print("      Nenhuma coluna em falta.")
    else:
        print("      Colunas verificadas.")
except Exception as e:
    print("      [AVISO] Verificacao de colunas: {}".format(e))

# ── 3 + 4. Migrations SQL pendentes ───────────────────────────────────────────
if not is_mysql:
    print("[3/5] Nao e MySQL — saltando migrations SQL.")
else:
    # Encontrar o executavel mysql
    m = re.match(r"mysql\+pymysql://([^:@]+)(?::([^@]*))?@([^:/]+)(?::(\d+))?/(.+)", DATABASE_URL)
    if not m:
        print("[3/5] URL MySQL invalido — saltando migrations SQL.")
    else:
        db_user = m.group(1)
        db_pass = m.group(2) if m.group(2) is not None else ""
        db_host = m.group(3)
        db_port = m.group(4) or "3306"
        db_name = m.group(5).rstrip("'\"")

        mysql_candidates = [
            "mysql",
            r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
            r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
            r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
            r"C:\xampp\mysql\bin\mysql.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
        ]
        import subprocess
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
            print("[3/5] mysql CLI nao encontrado — saltando migrations SQL.")
            print(f"      Instale o MySQL Client e adicione ao PATH.")
        else:
            import pymysql

            # Criar tabela _migrations se nao existir
            try:
                conn = pymysql.connect(
                    host=db_host, port=int(db_port),
                    user=db_user, password=db_pass,
                    database=db_name, charset="utf8mb4", autocommit=True,
                )
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS _migrations (
                            id           INT AUTO_INCREMENT PRIMARY KEY,
                            filename     VARCHAR(255) NOT NULL UNIQUE,
                            applied_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            checksum     VARCHAR(64) NULL
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """)
                    cur.execute("SELECT filename FROM _migrations")
                    applied = {row[0] for row in cur.fetchall()}
                conn.close()
            except Exception as e:
                print(f"[3/5] Erro ao verificar _migrations: {e}")
                applied = set()

            # Listar todos os ficheiros de migration por ordem
            pattern = os.path.join(MIGRATIONS_DIR, "V[0-9][0-9][0-9]__*.sql")
            migration_files = sorted(glob.glob(pattern))

            pending = [f for f in migration_files if os.path.basename(f) not in applied]

            if not pending:
                print("[3/5] Todas as migrations ja aplicadas.")
            else:
                print(f"[3/5] Aplicando {len(pending)} migration(s) pendente(s)...")
                env_cmd = os.environ.copy()
                env_cmd["MYSQL_PWD"] = db_pass

                for sql_file_path in pending:
                    filename = os.path.basename(sql_file_path)
                    print(f"      → {filename}...", end=" ", flush=True)
                    try:
                        with open(sql_file_path, "r", encoding="utf-8") as f:
                            result = subprocess.run(
                                [mysql_exe, f"-u{db_user}", f"-h{db_host}", f"-P{db_port}", db_name],
                                stdin=f, capture_output=True, text=True,
                                encoding="utf-8", errors="replace",
                                env=env_cmd, timeout=120,
                            )
                        errs = [l for l in result.stderr.splitlines()
                                if l.strip() and "Warning" not in l
                                and "already exists" not in l.lower()
                                and "Duplicate" not in l]
                        if result.returncode != 0 and errs:
                            print("AVISO")
                            for e in errs[:3]:
                                print(f"         {e}")
                        else:
                            print("OK")

                        # Registar migration como aplicada
                        try:
                            conn = pymysql.connect(
                                host=db_host, port=int(db_port),
                                user=db_user, password=db_pass,
                                database=db_name, charset="utf8mb4", autocommit=True,
                            )
                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT IGNORE INTO _migrations (filename) VALUES (%s)",
                                    (filename,),
                                )
                            conn.close()
                        except Exception as e:
                            print(f"         [AVISO] Nao foi possivel registar {filename}: {e}")

                    except Exception as e:
                        print(f"ERRO: {e}")

                print("      Migrations concluidas.")

# ── 5. Seed admin ─────────────────────────────────────────────────────────────
print("[4/5] Verificando utilizador admin...")
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
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("      Admin criado: admin@tradehub.com / admin123")
            print("      IMPORTANTE: alterar a senha apos o primeiro login!")
        else:
            print(f"      {count} utilizador(es) ja existem.")
except Exception as e:
    print(f"      [AVISO] seed admin: {e}")

print("[5/5] Migracoes concluidas.")
