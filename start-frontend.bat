@echo off
chcp 65001 >nul
title TradeHub Frontend (Dev)

set NODE_TLS_REJECT_UNAUTHORIZED=0

cd /d "%~dp0frontend"

if exist "node_modules\vite" goto :dev

echo.
echo  Instalando dependencias npm (pode demorar)...
call npm install --registry http://registry.npmjs.org/
if errorlevel 1 (
    echo  [ERRO] npm install falhou.
    pause
    goto :end
)

:dev
echo.
echo ========================================
echo  Frontend dev: http://localhost:5173
echo ========================================
echo.
call npm run dev

:end
set NODE_TLS_REJECT_UNAUTHORIZED=
pause >nul
