@echo off
chcp 65001 >nul
title TradeHub - Iniciar

echo ========================================
echo  TradeHub - Iniciando...
echo ========================================
echo.

:: Parar servicos existentes na porta 8000
echo [1/2] Parando servicos existentes...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000.*LISTENING" 2^>nul') do (
    echo       Parando PID %%p ...
    taskkill /PID %%p /F >nul 2>&1
)
taskkill /FI "WINDOWTITLE eq TradeHub Backend*" /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Build do frontend se nao existir
echo [2/2] Verificando build do frontend...
if not exist "%~dp0frontend\dist\index.html" (
    echo  Build nao encontrado. Compilando...
    cd /d "%~dp0frontend"
    call npm ci
    call npm run build
    cd /d "%~dp0"
)

:: Iniciar backend (serve API + frontend na porta 8000)
echo.
echo  Iniciando backend...
start "TradeHub Backend" /D "%~dp0" cmd /k call "%~dp0start-backend.bat"

echo.
timeout /t 5 /nobreak >nul

echo ========================================
echo  Sistema disponivel em:
echo    http://localhost:8000
echo.
echo  API:   http://localhost:8000/api
echo.
echo  O backend esta a correr numa janela
echo  separada. Feche essa janela para parar.
echo ========================================
echo.
pause >nul
