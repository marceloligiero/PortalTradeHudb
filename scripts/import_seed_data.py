"""
import_seed_data.py — Importa dados mestres do Docker para o MySQL local.

Chamado automaticamente pelo iniciar-sem-docker.bat após as migrações.
Usa INSERT IGNORE — não sobrescreve dados existentes.
Só corre se a base de dados estiver vazia (banks = 0 registos).
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SEED_FILE = ROOT / "scripts" / "master_data_seed.sql"
ENV_FILE  = ROOT / "backend" / ".env"


def parse_database_url(env_path: Path) -> dict:
    """Extrai host, port, user, password, db de DATABASE_URL no .env."""
    if not env_path.exists():
        return {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("DATABASE_URL"):
            # mysql+pymysql://user:pass@host:port/db
            m = re.match(
                r"DATABASE_URL\s*=\s*mysql\+pymysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(\S+)",
                line.strip(),
            )
            if m:
                return {
                    "user": m.group(1),
                    "password": m.group(2),
                    "host": m.group(3),
                    "port": int(m.group(4) or 3306),
                    "database": m.group(5),
                }
    return {}


def main():
    if not SEED_FILE.exists():
        print("  [SEED] master_data_seed.sql nao encontrado — a saltar.")
        return 0

    creds = parse_database_url(ENV_FILE)
    if not creds:
        print("  [SEED] Nao foi possivel ler DATABASE_URL — a saltar.")
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
        # Verificar se já tem dados — se sim, saltar
        try:
            cur.execute("SELECT COUNT(*) FROM banks")
            count = cur.fetchone()[0]
            if count > 0:
                print(f"  [SEED] Base de dados ja tem dados ({count} bancos) — a saltar import.")
                conn.close()
                return 0
        except Exception:
            pass  # tabela pode não existir ainda; continuar

        print("  [SEED] Base de dados vazia — a importar dados mestres...")

        sql = SEED_FILE.read_text(encoding="utf-8")

        # Desativar FK checks durante o import
        cur.execute("SET FOREIGN_KEY_CHECKS = 0;")

        # Executar statement a statement
        errors = 0
        statements = [s.strip() for s in sql.split(";") if s.strip()]
        for stmt in statements:
            # Ignorar comentários e diretivas SET de sistema
            if stmt.startswith("--") or stmt.startswith("/*"):
                continue
            try:
                cur.execute(stmt)
            except pymysql.err.ProgrammingError:
                pass  # ignorar diretivas /*!... */ não suportadas
            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"  [SEED] Aviso: {e}")

        cur.execute("SET FOREIGN_KEY_CHECKS = 1;")

    conn.close()

    if errors == 0:
        print("  [SEED] Import concluido com sucesso.")
    else:
        print(f"  [SEED] Import concluido com {errors} avisos (normal para diretivas MySQL).")

    return 0


if __name__ == "__main__":
    sys.exit(main())
