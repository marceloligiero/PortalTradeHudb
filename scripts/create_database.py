"""
create_database.py — Cria a base de dados MySQL se ainda não existir.

Lê DATABASE_URL de backend/.env.
Usa as credenciais do utilizador da app para criar a BD (requer que o user
já exista no MySQL com permissão para criar bases de dados, OU que o root
esteja acessível sem password via socket auth).

Uso:
  python scripts/create_database.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Force UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / "backend" / ".env"


def read_env(path: Path) -> str:
    for enc in ("utf-8-sig", "utf-16", "utf-8", "cp1252", "latin-1"):
        try:
            text = path.read_text(encoding=enc)
            if text.count("\x00") > len(text) // 4:
                continue
            return text
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""


def parse_url(env_path: Path) -> dict | None:
    if not env_path.exists():
        return None
    for line in read_env(env_path).splitlines():
        line = line.strip().strip("\x00")
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if k.strip() != "DATABASE_URL":
            continue
        url = v.strip().strip("'\"")
        m = re.match(r"mysql\+pymysql://([^:]+):([^@]*)@([^:/]+):?(\d+)?/([^\s?#]+)", url)
        if not m:
            return None
        return {
            "user": m.group(1), "password": m.group(2),
            "host": m.group(3), "port": int(m.group(4) or 3306),
            "database": m.group(5).rstrip("'\""),
        }
    return None


def main() -> int:
    creds = parse_url(ENV_FILE)
    if not creds:
        print(f"[ERRO] Nao foi possivel ler DATABASE_URL em {ENV_FILE}")
        return 1

    try:
        import pymysql
    except ImportError:
        print("[ERRO] pymysql nao instalado.")
        return 1

    db_name = creds["database"]
    print(f"  BD alvo: {db_name} em {creds['host']}:{creds['port']}")

    # Tentar ligar sem selecionar BD (para a poder criar)
    connect_args = dict(
        host=creds["host"], port=creds["port"],
        user=creds["user"], password=creds["password"],
        charset="utf8mb4", autocommit=True,
    )

    conn = None
    try:
        conn = pymysql.connect(**connect_args)
    except pymysql.err.OperationalError as e:
        err_code = e.args[0] if e.args else 0
        if err_code == 1049:
            # "Unknown database" — ligar sem DB e criar
            try:
                conn = pymysql.connect(**connect_args)
            except Exception as e2:
                print(f"  [AVISO] Nao foi possivel ligar: {e2}")
                print("  Crie manualmente a BD no MySQL:")
                print(f"    CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                return 0
        else:
            print(f"  [AVISO] Nao foi possivel ligar ao MySQL: {e}")
            print("  Certifique-se que o MySQL esta a correr e as credenciais estao corretas.")
            print(f"  Crie manualmente: CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4;")
            return 0

    if conn:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.close()
        print(f"  [OK] Base de dados '{db_name}' criada/verificada.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
