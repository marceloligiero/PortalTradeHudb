@echo off
title TradeHub - Starting All Services
mkdir "%~dp0logs" 2>nul
echo Starting TradeHub Backend (background, logs -> logs\\backend.log)...
start /b "" cmd /c "%~dp0start-backend.bat > "%~dp0logs\\backend.log" 2>&1"
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul
echo Starting TradeHub Frontend (background, logs -> logs\\frontend.log)...
start /b "" cmd /c "%~dp0start-frontend.bat > "%~dp0logs\\frontend.log" 2>&1"
echo.
echo ========================================
echo  TradeHub is running!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  Login:    admin@tradehub.com / admin123
echo ========================================
echo.
pause
