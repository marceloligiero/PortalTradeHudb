@echo off
chcp 65001 >nul
title Portal TradeHub — Producao Sem Docker

:: Desativar verificação SSL corporativa (redes com proxy/CA interno)
set NODE_TLS_REJECT_UNAUTHORIZED=0
set PYTHONHTTPSVERIFY=0
set REQUESTS_CA_BUNDLE=
set PIP_TRUSTED_HOST=pypi.org pypi.python.org files.pythonhosted.org

echo.
echo ════════════════════════════════════════════
echo   Portal TradeHub — Arranque (Producao)
echo ════════════════════════════════════════════
echo.

set ROOT=%~dp0
set VENV=%ROOT%backend\.venv
set BACKEND_PORT=8000

:: Forçar rebuild do frontend (passar --rebuild como argumento)
set FORCE_REBUILD=false
for %%a in (%*) do (
    if /I "%%a"=="--rebuild" set FORCE_REBUILD=true
)

:: ────────────────────────────────────────────
:: 1. Verificar backend\.env
:: ────────────────────────────────────────────
if not exist "%ROOT%backend\.env" (
    echo  [AVISO] backend\.env nao encontrado.
    if exist "%ROOT%backend\.env.example" (
        copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
        echo  Criado a partir de .env.example.
        echo  Edite backend\.env e configure:
        echo    DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/tradehub_db
        echo    SECRET_KEY=gerar-com-python-secrets-token-urlsafe-32
        echo    ALLOWED_ORIGINS=http://portaltradedatahub,http://localhost
        echo    DEBUG=false
        notepad "%ROOT%backend\.env"
        echo  Pressione qualquer tecla apos guardar o .env...
        pause >nul
    ) else (
        echo  [ERRO] backend\.env nao encontrado e .env.example tambem nao existe.
        echo  Crie backend\.env com DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS, DEBUG=false
        pause
        exit /b 1
    )
)

:: Garantir que DATABASE_URL aponta a localhost (não ao hostname Docker)
powershell -NoProfile -Command ^
  "(Get-Content '%ROOT%backend\.env') -replace '@tradehub-db:', '@localhost:' | Set-Content '%ROOT%backend\.env'" >nul 2>&1

:: Garantir que DEBUG=false em producao
powershell -NoProfile -Command ^
  "(Get-Content '%ROOT%backend\.env') -replace '^DEBUG=true$', 'DEBUG=false' | Set-Content '%ROOT%backend\.env'" >nul 2>&1

:: ────────────────────────────────────────────
:: 2. Python venv + dependências
:: ────────────────────────────────────────────
echo [1/5] Python venv...

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
    echo       Dependencias Python instaladas.
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
    echo         Continuando arranque...
) else (
    echo       Migracoes OK.
)

:: ────────────────────────────────────────────
:: 4. Dados mestres (se BD vazia)
:: ────────────────────────────────────────────
echo [3/5] Dados mestres...
if exist "%ROOT%scripts\import_seed_data.py" (
    "%VENV%\Scripts\python.exe" "%ROOT%scripts\import_seed_data.py"
) else (
    echo       Sem script de seed — a saltar.
)

:: ────────────────────────────────────────────
:: 5. Frontend — build de producao
:: ────────────────────────────────────────────
echo [4/5] Frontend (build de producao)...

cd /d "%ROOT%frontend"

:: Instalar node_modules se necessario
if not exist "node_modules\.bin\vite.cmd" (
    echo       Instalando node_modules...
    npm install --registry http://registry.npmjs.org/ --quiet
    if errorlevel 1 (
        echo  [ERRO] npm install falhou. Verifique o Node.js.
        cd /d "%ROOT%"
        pause
        exit /b 1
    )
    :: Forcar build quando se instala pela primeira vez
    set FORCE_REBUILD=true
)

:: Construir frontend se dist nao existir ou se --rebuild foi passado
if not exist "%ROOT%frontend\dist\index.html" set FORCE_REBUILD=true

if "%FORCE_REBUILD%"=="true" (
    echo       A compilar frontend React...
    npm run build
    if errorlevel 1 (
        echo  [ERRO] npm run build falhou. Verifique os logs acima.
        cd /d "%ROOT%"
        pause
        exit /b 1
    )
    echo       Build do frontend concluido.
) else (
    echo       Frontend ja compilado (passe --rebuild para recompilar).
)

cd /d "%ROOT%"

:: ────────────────────────────────────────────
:: 6. Parar instância anterior e iniciar backend
:: ────────────────────────────────────────────
echo [5/5] Iniciando backend...

:: Parar instância anterior se existir
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%BACKEND_PORT%.*LISTENING" 2^>nul') do (
    taskkill /PID %%p /F >nul 2>&1
)

:: Iniciar backend em janela separada (SEM --reload em producao)
start "TradeHub Backend" /D "%ROOT%backend" cmd /k (^
    call "%VENV%\Scripts\activate.bat" ^& ^
    python -m uvicorn main:app --host 127.0.0.1 --port %BACKEND_PORT% --workers 1^
)

:: Aguardar o backend arrancar (até 60 segundos)
echo       Aguardando backend arrancar...
set /a TRIES=0
:wait_loop
set /a TRIES+=1
if %TRIES% GTR 30 (
    echo  [ERRO] Backend nao respondeu em 60 segundos.
    echo         Ver janela "TradeHub Backend" para detalhes.
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command ^
  "try { $r=(Invoke-WebRequest 'http://127.0.0.1:%BACKEND_PORT%/api/health' -TimeoutSec 2 -UseBasicParsing).StatusCode; if($r -eq 200){exit 0}else{exit 1} } catch {exit 1}" >nul 2>&1
if errorlevel 1 goto :wait_loop
echo       Backend OK.

:: ────────────────────────────────────────────
:: 7. Port proxy 80 → 8000
:: ────────────────────────────────────────────
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add    v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=%BACKEND_PORT% connectaddress=127.0.0.1 >nul 2>&1
if errorlevel 1 (
    echo  [AVISO] Port proxy 80→%BACKEND_PORT% nao configurado (requer administrador^).
    echo          Aceda via http://localhost:%BACKEND_PORT%
) else (
    echo       Port proxy OK: http://portaltradedatahub → porta %BACKEND_PORT%
)

:: ────────────────────────────────────────────
:: Resumo
:: ────────────────────────────────────────────
echo.
echo ════════════════════════════════════════════
echo   Portal TradeHub — Producao Ativa
echo.
echo   Acesso  : http://portaltradedatahub
echo           : http://localhost:%BACKEND_PORT%
echo   API     : http://localhost:%BACKEND_PORT%/api
echo   Saude   : http://localhost:%BACKEND_PORT%/api/health
echo.
echo   Feche a janela "TradeHub Backend" para parar.
echo   Para recompilar o frontend:
echo     iniciar-sem-docker.bat --rebuild
echo ════════════════════════════════════════════
echo.
echo  Pressione qualquer tecla para fechar esta janela.
echo  (O backend continua a correr na outra janela.)
pause >nul
