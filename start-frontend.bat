@echo off
chcp 65001 >nul
title TradeHub Frontend
cd /d "%~dp0frontend"

:: Check if dist/ exists (production build)
if not exist "dist\index.html" goto :devmode

echo.
echo  Starting frontend in PRODUCTION mode (serving dist/ on port 5173)...
echo.
python -m http.server 5173 --directory dist --bind 0.0.0.0
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
