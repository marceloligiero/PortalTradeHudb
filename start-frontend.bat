@echo off
chcp 65001 >nul
title TradeHub Frontend (Dev)

set NODE_TLS_REJECT_UNAUTHORIZED=0

cd /d "%~dp0frontend"

:: Verificar se vite esta realmente instalado (binario)
if exist "node_modules\.bin\vite.cmd" goto :dev

echo.
echo  Instalando dependencias npm...
echo  (registry HTTP para evitar SSL corporativo)
echo.

:: node_modules incompleto - apagar e reinstalar
if exist "node_modules\" (
    echo  Limpando node_modules incompleto...
    rmdir /s /q node_modules
)

npm install --registry http://registry.npmjs.org/
if errorlevel 1 (
    echo.
    echo  [ERRO] npm install falhou. Verifique a internet.
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
