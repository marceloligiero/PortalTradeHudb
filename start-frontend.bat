@echo off
chcp 65001 >nul
title TradeHub Frontend (Dev)

:: Bypass SSL corporativo para npm
set NODE_TLS_REJECT_UNAUTHORIZED=0

cd /d "%~dp0frontend"

if exist "node_modules\" goto :dev

echo.
echo  node_modules nao encontrado. Instalando dependencias...
echo  (pode demorar na primeira vez)
echo.
call npm install
if errorlevel 1 (
    echo.
    echo  [ERRO] npm install falhou.
    echo  Verifique a ligacao a internet.
    pause
    goto :end
)

:dev
echo.
echo ========================================
echo  Iniciando Vite dev server...
echo  http://localhost:5173
echo ========================================
echo.
call npm run dev

:end
set NODE_TLS_REJECT_UNAUTHORIZED=
pause >nul
