"""Apply a single SQL migration file against the configured backend DB.
Usage: python scripts/apply_migration.py path/to/migration.sql

This script imports the SQLAlchemy engine from backend.app.database and executes
the SQL in a single transaction. It is meant to be run on the production server
when a DBA wants to apply the new table changes.
"""
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[1]
# Ensure backend is on path
import os
import importlib
sys.path.insert(0, str(repo_root / 'backend'))

from app.database import engine

def apply_sql(path: Path):
    sql = path.read_text(encoding='utf-8')
    with engine.begin() as conn:
        conn.execute(sql)
    print(f"Applied migration: {path}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python scripts/apply_migration.py path/to/migration.sql')
        sys.exit(1)
    path = Path(sys.argv[1])
    if not path.is_file():
        print('File not found:', path)
        sys.exit(1)
    apply_sql(path)
