@echo off
chcp 65001 >nul
title TradeHub - Starting All Services

echo ========================================
echo  Starting TradeHub Services...
echo ========================================
echo.

:: ── Stop existing services ──────────────────────────────────────
echo [0/2] Stopping existing services...

:: Kill any process on port 8000 (backend)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000.*LISTENING" 2^>nul') do (
    echo       Stopping backend PID %%p ...
    taskkill /PID %%p /F >nul 2>&1
)

:: Kill any process on port 5173 (frontend)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5173.*LISTENING" 2^>nul') do (
    echo       Stopping frontend PID %%p ...
    taskkill /PID %%p /F >nul 2>&1
)

:: Close any previous TradeHub windows
taskkill /FI "WINDOWTITLE eq TradeHub Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TradeHub Frontend*" /F >nul 2>&1

timeout /t 2 /nobreak >nul
echo       Done.
echo.

:: ── Start services ──────────────────────────────────────────────
echo [1/2] Starting Backend (uvicorn)...
start "TradeHub Backend" /D "%~dp0" cmd /k call "%~dp0start-backend.bat"

echo Waiting for backend to initialize...
timeout /t 6 /nobreak >nul

echo [2/2] Starting Frontend (vite)...
start "TradeHub Frontend" /D "%~dp0" cmd /k call "%~dp0start-frontend.bat"

echo.
echo ========================================
echo  TradeHub is running!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  Login:    admin@tradehub.com / admin123
echo ========================================
echo.
echo Each service is running in its own window.
echo Close this window or press any key to exit.
echo (The services will keep running.)
pause >nul
