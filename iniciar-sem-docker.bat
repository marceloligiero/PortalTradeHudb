@echo off
chcp 65001 >nul
title Portal TradeHub — Sem Docker

:: Desativar verificação SSL corporativa
set NODE_TLS_REJECT_UNAUTHORIZED=0
set PYTHONHTTPSVERIFY=0
set REQUESTS_CA_BUNDLE=
set PIP_TRUSTED_HOST=pypi.org pypi.python.org files.pythonhosted.org

echo.
echo ════════════════════════════════════════════
echo   Portal TradeHub — Arranque Sem Docker
echo ════════════════════════════════════════════
echo.

set ROOT=%~dp0
set VENV=%ROOT%backend\.venv
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

:: ────────────────────────────────────────────
:: 1. Verificar backend\.env
:: ────────────────────────────────────────────
if not exist "%ROOT%backend\.env" (
    echo  [AVISO] backend\.env nao encontrado.
    if exist "%ROOT%backend\.env.example" (
        copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
        echo  Criado a partir de .env.example.
        echo  Edite backend\.env e configure DATABASE_URL com o seu MySQL local.
        notepad "%ROOT%backend\.env"
        echo  Pressione qualquer tecla apos guardar o .env...
        pause >nul
    ) else (
        echo  Crie o ficheiro backend\.env com:
        echo    DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/tradehub_db
        echo    SECRET_KEY=dev-secret-mudar-em-producao
        echo    ALLOWED_ORIGINS=http://localhost:8000,http://localhost:5173
        echo    DEBUG=true
        pause
        exit /b 1
    )
)

:: Garantir que DATABASE_URL aponta a localhost (não ao hostname Docker)
powershell -NoProfile -Command ^
  "(Get-Content '%ROOT%backend\.env') -replace '@tradehub-db:', '@localhost:' | Set-Content '%ROOT%backend\.env'" >nul 2>&1

:: ────────────────────────────────────────────
:: 2. Python venv + dependências
:: ────────────────────────────────────────────
echo [1/4] Python...

if not exist "%VENV%\Scripts\activate.bat" (
    echo       Criando venv...
    python -m venv "%VENV%"
    if errorlevel 1 (
        echo  [ERRO] Nao foi possivel criar o venv. Instale Python 3.11+ e adicione ao PATH.
        pause
        exit /b 1
    )
)

call "%VENV%\Scripts\activate.bat"

"%VENV%\Scripts\python.exe" -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo       Instalando dependencias Python...
    "%VENV%\Scripts\pip.exe" install -r "%ROOT%backend\requirements.txt" ^
        --trusted-host pypi.org ^
        --trusted-host pypi.python.org ^
        --trusted-host files.pythonhosted.org ^
        --timeout 120 --retries 5 --quiet
    if errorlevel 1 (
        echo  [ERRO] pip install falhou. Verifique a internet ou o Python.
        pause
        exit /b 1
    )
) else (
    echo       Dependencias Python ja instaladas.
)

:: ────────────────────────────────────────────
:: 3. Migrações de base de dados
:: ────────────────────────────────────────────
echo [2/5] Base de dados — migracoes...
"%VENV%\Scripts\python.exe" "%ROOT%scripts\run_migrations.py" 2>nul
if errorlevel 1 (
    echo  [AVISO] Migracao falhou ou script nao encontrado.
    echo         Verifique se o MySQL esta a correr e o DATABASE_URL esta correto.
)
echo       Migracoes OK.

:: ────────────────────────────────────────────
:: 4. Import de dados mestres (se BD vazia)
:: ────────────────────────────────────────────
echo [3/5] Dados mestres...
if exist "%ROOT%scripts\import_seed_data.py" (
    "%VENV%\Scripts\python.exe" "%ROOT%scripts\import_seed_data.py"
) else (
    echo  [AVISO] import_seed_data.py nao encontrado — a saltar.
)

:: ────────────────────────────────────────────
:: 5. Frontend — node_modules + build/dev
:: ────────────────────────────────────────────
echo [4/5] Frontend...

cd /d "%ROOT%frontend"

if not exist "node_modules\.bin\vite.cmd" (
    echo       Instalando node_modules...
    npm install --registry http://registry.npmjs.org/ --quiet
    if errorlevel 1 (
        echo  [ERRO] npm install falhou. Verifique a internet.
        cd /d "%ROOT%"
        pause
        exit /b 1
    )
)

cd /d "%ROOT%"

:: ────────────────────────────────────────────
:: 5. Iniciar backend (janela separada)
:: ────────────────────────────────────────────
echo [5/5] Iniciando servicos...

:: Parar instância anterior se existir
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%BACKEND_PORT%.*LISTENING" 2^>nul') do (
    taskkill /PID %%p /F >nul 2>&1
)

start "TradeHub Backend" /D "%ROOT%backend" cmd /k (^
    call "%VENV%\Scripts\activate.bat" ^& ^
    python -m uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload^
)

:: Aguardar o backend arrancar
echo       Aguardando backend...
:wait_loop
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command ^
  "try { $r=(Invoke-WebRequest 'http://localhost:%BACKEND_PORT%/api/health' -TimeoutSec 2 -UseBasicParsing).StatusCode; if($r -eq 200){exit 0}else{exit 1} } catch {exit 1}" >nul 2>&1
if errorlevel 1 goto :wait_loop
echo       Backend OK: http://localhost:%BACKEND_PORT%

:: ────────────────────────────────────────────
:: 6. Iniciar frontend Vite (na janela actual)
:: ────────────────────────────────────────────
echo.
echo ════════════════════════════════════════════
echo   Frontend : http://localhost:%FRONTEND_PORT%
echo   Backend  : http://localhost:%BACKEND_PORT%/api
echo.
echo   Feche "TradeHub Backend" para parar o backend.
echo   Pressione Ctrl+C aqui para parar o frontend.
echo ════════════════════════════════════════════
echo.

cd /d "%ROOT%frontend"
set DEV_PUBLIC_IP=all
call npm run dev
