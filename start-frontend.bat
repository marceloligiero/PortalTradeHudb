@echo off
chcp 65001 >nul
title TradeHub Frontend
cd /d "%~dp0frontend"

:: Check if dist/ exists (production build)
if not exist "dist\index.html" goto :devmode

echo.
echo  Starting frontend in PRODUCTION mode (serving dist/)...
echo.
call npx serve dist -s -l 5173
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
