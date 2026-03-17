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

:: Verificar se o build do frontend existe
echo [2/2] Verificando frontend...
if exist "%~dp0frontend\dist\index.html" (
    echo  Build encontrado. Sem necessidade de recompilar.
) else (
    echo.
    echo  AVISO: frontend\dist nao encontrado.
    echo  O backend inicia mas o frontend pode nao carregar.
    echo.
    echo  Para compilar o frontend, execute manualmente:
    echo    cd frontend
    echo    npm install
    echo    npm run build
    echo.
    timeout /t 4 /nobreak >nul
)

:: Iniciar backend (serve API + frontend na porta 8000)
echo  Iniciando backend...
start "TradeHub Backend" /D "%~dp0" cmd /k call "%~dp0start-backend.bat"

timeout /t 5 /nobreak >nul

echo.
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
