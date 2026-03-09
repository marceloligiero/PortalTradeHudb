#!/bin/bash
cd /var/www/tradehub/backend
source .venv/bin/activate

echo "[Migration] Checking for pending database migrations..."
python -c "
from app.migrate import run_migrations
count = run_migrations()
if count > 0:
    print(f'  Applied {count} migration(s).')
else:
    print('  No pending migrations.')
" 2>&1 || echo "  [WARN] Migration check failed, continuing startup..."

exec uvicorn main:app --host 0.0.0.0 --port 8000
