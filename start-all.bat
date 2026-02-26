@echo off
title TradeHub - Starting All Services
echo Starting TradeHub Backend...
start /min "" "%~dp0start-backend.bat"
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul
echo Starting TradeHub Frontend...
start /min "" "%~dp0start-frontend.bat"
echo.
echo ========================================
echo  TradeHub is running!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  Login:    admin@tradehub.com / admin123
echo ========================================
echo.
pause
