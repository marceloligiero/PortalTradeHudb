@echo off
chcp 65001 >nul
title Deploy DEV to PROD - TradeHub

echo.
echo  ========================================
echo    Deploy DEV -^> PROD  Portal TradeHub
echo  ========================================
echo.

set PROD_IP=192.168.1.71
set PROD_USER=x404388
set PROD_PATH=C:\Portal Formações\PortalTradeHudb

cd /d "%~dp0"

:: ── Step 1: Build Frontend ─────────────────────────────────
echo  [1/4] Building frontend...
cd frontend
if not exist "node_modules\vite" (
    echo        Instalando dependencias...
    call npm install
)
echo        Compilando...
call npm run build
if errorlevel 1 (
    echo        ERRO: Build falhou!
    pause
    exit /b 1
)
if not exist "dist\index.html" (
    echo        ERRO: dist/index.html nao gerado!
    pause
    exit /b 1
)
echo        OK: Frontend compilado
cd ..

:: ── Step 2: Git commit + push ──────────────────────────────
echo.
echo  [2/4] Commit e push para GitHub...
git add -A
git diff --cached --quiet
if errorlevel 1 (
    for /f "tokens=*" %%d in ('powershell -c "Get-Date -Format 'yyyy-MM-dd HH:mm'"') do set TIMESTAMP=%%d
    git commit -m "deploy: production update %TIMESTAMP%"
    echo        OK: Commit criado
) else (
    echo        OK: Sem alteracoes
)
git push
if errorlevel 1 (
    echo        ERRO: Push falhou!
    pause
    exit /b 1
)
echo        OK: Push concluido

:: ── Step 3: Pull no servidor de producao ───────────────────
echo.
echo  [3/4] Git pull no servidor...
echo.
echo  =============================================
echo   Agora execute no SERVIDOR DE PRODUCAO:
echo  =============================================
echo.
echo     cd "%PROD_PATH%"
echo     git pull origin main
echo     .\start-all.bat
echo.
echo  =============================================
echo.

:: ── Step 4: Testar SSH (opcional) ──────────────────────────
echo  [4/4] Tentando pull remoto via SSH...
ssh %PROD_USER%@%PROD_IP% "cd \"%PROD_PATH%\" && git pull origin main" 2>nul
if errorlevel 1 (
    echo        SSH nao disponivel - execute manualmente no servidor
) else (
    echo        OK: Codigo atualizado no servidor
    echo.
    echo  Reiniciando servicos...
    ssh %PROD_USER%@%PROD_IP% "cd \"%PROD_PATH%\" && start /b cmd /k start-all.bat" 2>nul
    if errorlevel 1 (
        echo        Execute no servidor: .\start-all.bat
    ) else (
        echo        OK: Servicos reiniciados
    )
)

echo.
echo  ========================================
echo    Deploy concluido!
echo    Backend:  http://%PROD_IP%:8000
echo  ========================================
echo.
pause
