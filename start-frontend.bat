@echo off
chcp 65001 >nul
title TradeHub Frontend
cd /d "%~dp0frontend"

:: Check if dist/ exists (production build)
if not exist "dist\index.html" goto :devmode

echo.
echo  ============================================
echo   Frontend dist/ found (production build).
echo   The backend (port 8000) already serves the
echo   SPA — access the app at:
echo.
echo     http://localhost:8000
echo.
echo   No separate frontend server needed.
echo  ============================================
echo.
pause
goto :end

:devmode
echo.
echo  No production build found. Starting Vite dev server...
echo.
call npm run dev

:end
echo.
echo [Frontend stopped. Press any key to close.]
pause >nul
