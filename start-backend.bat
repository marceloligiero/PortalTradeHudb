@echo off
chcp 65001 >nul
title TradeHub Backend
cd /d "%~dp0backend"
if not exist "%~dp0.venv\Scripts\activate.bat" (
    echo [ERRO] Virtualenv nao encontrado em .venv\
    pause
    exit /b 1
)
call "%~dp0.venv\Scripts\activate.bat"
echo.
echo  [Migration] Checking for pending database migrations...
python -c "from app.migrate import run_migrations; count = run_migrations(); print(f'  Applied {count} migration(s).' if count else '  No pending migrations.')" 2>nul || echo  [WARN] Migration check failed, continuing...
echo.
echo  Starting uvicorn on http://0.0.0.0:8000 ...
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000
echo.
echo [Backend stopped. Press any key to close.]
pause >nul
