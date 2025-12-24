#!/usr/bin/env python3
import os
from urllib.parse import urlparse, unquote, parse_qs
import pymysql

# Read DATABASE_URL from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
with open(env_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

db_url = None
for l in lines:
    if l.strip().startswith('DATABASE_URL='):
        db_url = l.strip().split('=', 1)[1]
        break

if not db_url:
    raise SystemExit('DATABASE_URL not found in backend/.env')

# Remove leading quotes/backticks if present
if db_url.startswith('"') and db_url.endswith('"'):
    db_url = db_url[1:-1]
if db_url.startswith("'") and db_url.endswith("'"):
    db_url = db_url[1:-1]

# Expect format: mysql+pymysql://user:pass@host:port/dbname?charset=...
if db_url.startswith('mysql+pymysql://'):
    stripped = db_url[len('mysql+pymysql://'):]
else:
    raise SystemExit('Unsupported DB URL scheme')

# Use urlparse on // + stripped so that netloc is parsed correctly
p = urlparse('//' + stripped)
user = unquote(p.username) if p.username else None
password = unquote(p.password) if p.password else None
host = p.hostname or 'localhost'
port = p.port or 3306
dbname = p.path.lstrip('/') if p.path else None
qs = parse_qs(p.query)
charset = qs.get('charset', ['utf8mb4'])[0]

print(f"Connecting to MySQL {host}:{port} db={dbname} user={user} charset={charset}")

conn = pymysql.connect(host=host, port=port, user=user, password=password, database=dbname, charset=charset)
try:
    with conn.cursor() as cur:
        # Add max_errors to challenges if missing
        cur.execute(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME='challenges' AND COLUMN_NAME='max_errors';",
            (dbname,)
        )
        has = cur.fetchone()[0]
        if not has:
            cur.execute("ALTER TABLE challenges ADD COLUMN max_errors INT NOT NULL DEFAULT 0;")

        # Add errors_count to challenge_submissions if missing
        cur.execute(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME='challenge_submissions' AND COLUMN_NAME='errors_count';",
            (dbname,)
        )
        has2 = cur.fetchone()[0]
        if not has2:
            cur.execute("ALTER TABLE challenge_submissions ADD COLUMN errors_count INT NOT NULL DEFAULT 0;")
    conn.commit()
    print('ALTER TABLE statements executed successfully')
finally:
    conn.close()
