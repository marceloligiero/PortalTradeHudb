"""
import_seed_data.py — Importa dados mestres do Docker para o MySQL local.

Comportamento:
  1a execucao  → limpa TODAS as tabelas mestres (preserva o utilizador ADMIN),
                 depois insere todos os dados do Docker.
  Execucoes seguintes → salta (marcador seed_master_v1 em _migrations),
                        apenas as migrations pendentes sao executadas.

Uso manual:
  python import_seed_data.py           # comportamento normal
  python import_seed_data.py --force   # limpa e re-importa mesmo se ja foi feito
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED_FILE = ROOT / "scripts" / "master_data_seed.sql"
ENV_FILE  = ROOT / "backend" / ".env"

FORCE = "--force" in sys.argv

# Marcador gravado em _migrations para indicar que o seed ja foi aplicado
SEED_MARKER = "seed_master_v1"

# Tabelas a truncar (FK filhos antes de pais).
# A tabela users NAO esta aqui — tratada separadamente para preservar ADMIN.
TRUNCATE_ORDER = [
    "team_members",
    "team_services",
    "org_node_members",
    "org_nodes",
    "teams",
    "activities",
    "departments",
    "chat_faqs",
    "tutoria_error_categories",
    "error_types",
    "error_detected_by",
    "error_origins",
    "error_impacts",
    "products",
    "banks",
]


def _read_env_file(env_path: Path) -> str:
    """Lê o ficheiro .env suportando UTF-8, UTF-16 e ANSI (Windows)."""
    for enc in ("utf-8-sig", "utf-16", "utf-8", "cp1252", "latin-1"):
        try:
            return env_path.read_text(encoding=enc)
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""


def parse_database_url(env_path: Path) -> dict:
    """Extrai host, port, user, password, db de DATABASE_URL no .env."""
    if not env_path.exists():
        return {}
    content = _read_env_file(env_path)
    for line in content.splitlines():
        line = line.strip().strip("\x00")
        if line.startswith("DATABASE_URL"):
            m = re.match(
                r"DATABASE_URL\s*=\s*mysql\+pymysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(\S+)",
                line,
            )
            if m:
                return {
                    "user": m.group(1),
                    "password": m.group(2),
                    "host": m.group(3),
                    "port": int(m.group(4) or 3306),
                    "database": m.group(5).rstrip("'\""),
                }
    return {}


def main():
    if not SEED_FILE.exists():
        print("  [SEED] master_data_seed.sql nao encontrado — a saltar.")
        return 0

    creds = parse_database_url(ENV_FILE)
    if not creds:
        db_url = os.environ.get("DATABASE_URL", "")
        m = re.match(
            r"mysql\+pymysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(\S+)",
            db_url,
        )
        if m:
            creds = {
                "user": m.group(1), "password": m.group(2),
                "host": m.group(3), "port": int(m.group(4) or 3306),
                "database": m.group(5),
            }

    if not creds:
        print(f"  [SEED] Nao foi possivel ler DATABASE_URL (procurado em: {ENV_FILE})")
        return 0

    try:
        import pymysql
    except ImportError:
        print("  [SEED] pymysql nao instalado — a saltar.")
        return 0

    try:
        conn = pymysql.connect(
            host=creds["host"],
            port=creds["port"],
            user=creds["user"],
            password=creds["password"],
            database=creds["database"],
            charset="utf8mb4",
            autocommit=True,
        )
    except Exception as e:
        print(f"  [SEED] Nao foi possivel ligar ao MySQL: {e}")
        return 1

    with conn.cursor() as cur:
        # Verificar se o seed ja foi aplicado (marcador em _migrations)
        already_done = False
        try:
            cur.execute(
                "SELECT COUNT(*) FROM _migrations WHERE filename = %s",
                (SEED_MARKER,),
            )
            already_done = cur.fetchone()[0] > 0
        except Exception:
            pass  # tabela _migrations pode nao existir ainda

        if already_done and not FORCE:
            print("  [SEED] Dados mestres ja importados — a saltar (use --force para re-importar).")
            conn.close()
            return 0

        action = "Re-importando (--force)" if (already_done and FORCE) else "1a execucao"
        print(f"  [SEED] {action} — a limpar tabelas e importar dados do Docker...")

        cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cur.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;")

        # Guardar IDs dos admins antes de limpar
        admin_ids = []
        try:
            cur.execute("SELECT id FROM users WHERE role = 'ADMIN'")
            admin_ids = [r[0] for r in cur.fetchall()]
        except Exception:
            pass

        # Limpar tabelas mestres (sem users)
        for table in TRUNCATE_ORDER:
            try:
                cur.execute(f"TRUNCATE TABLE `{table}`")
            except Exception as e:
                print(f"  [SEED] Aviso ao truncar {table}: {e}")

        # Limpar users NAO-admin (preserva login do admin)
        try:
            cur.execute("DELETE FROM users WHERE role != 'ADMIN'")
        except Exception as e:
            print(f"  [SEED] Aviso ao limpar users: {e}")

        if admin_ids:
            print(f"  [SEED] Admin preservado (id={admin_ids}). Restantes users serao importados do Docker.")

        # Executar o seed
        sql = SEED_FILE.read_text(encoding="utf-8")
        errors = 0
        inserted = 0
        statements = [s.strip() for s in sql.split(";") if s.strip()]
        for stmt in statements:
            first = stmt.lstrip()
            if first.startswith("--") or first.startswith("/*"):
                continue
            try:
                cur.execute(stmt)
                if first.upper().startswith("INSERT"):
                    inserted += cur.rowcount if cur.rowcount > 0 else 0
            except pymysql.err.ProgrammingError:
                pass  # diretivas /*!... */ ignoradas
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  [SEED] Aviso: {e}")

        cur.execute("SET FOREIGN_KEY_CHECKS = 1;")

        # Gravar marcador em _migrations
        try:
            cur.execute(
                "INSERT INTO _migrations (filename, applied_at) VALUES (%s, NOW()) "
                "ON DUPLICATE KEY UPDATE applied_at = NOW()",
                (SEED_MARKER,),
            )
        except Exception:
            pass  # nao bloquear se a tabela nao existir

    conn.close()

    if errors == 0:
        print(f"  [SEED] Import concluido — {inserted} linhas inseridas.")
    else:
        print(f"  [SEED] Import concluido com {errors} avisos — {inserted} linhas inseridas.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
