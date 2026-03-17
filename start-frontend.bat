@echo off
chcp 65001 >nul
title TradeHub Frontend

:: Bypass SSL corporativo para npm
set NODE_TLS_REJECT_UNAUTHORIZED=0

cd /d "%~dp0frontend"

if not exist "dist\index.html" goto :build

:prodmode
echo ========================================
echo  Frontend (producao):
echo    http://localhost:8000
echo.
echo  O backend/FastAPI serve o frontend.
echo  Inicie o backend com start-all.bat
echo ========================================
echo.
pause >nul
goto :end

:build
echo.
echo  Build de producao nao encontrado.
echo  A compilar frontend (pode demorar)...
echo.

if not exist "node_modules\" (
    echo  Instalando dependencias npm...
    call npm install
    if errorlevel 1 (
        echo.
        echo  [ERRO] npm install falhou.
        echo  Verifique a ligacao a internet.
        pause
        goto :end
    )
)

call npm run build
if errorlevel 1 (
    echo.
    echo  [ERRO] npm run build falhou.
    echo  A tentar modo desenvolvimento...
    call npm run dev
    goto :end
)

echo.
echo  Build concluido!
goto :prodmode

:end
set NODE_TLS_REJECT_UNAUTHORIZED=
pause >nul
