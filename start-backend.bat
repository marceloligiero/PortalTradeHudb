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
echo  Starting uvicorn on http://0.0.0.0:8000 ...
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000
echo.
echo [Backend stopped. Press any key to close.]
pause >nul
