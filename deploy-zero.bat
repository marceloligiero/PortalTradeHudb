@echo off
chcp 65001 >nul
title Portal TradeHub — Deploy do Zero

:: Desativar verificação SSL corporativa
set NODE_TLS_REJECT_UNAUTHORIZED=0
set PYTHONHTTPSVERIFY=0
set REQUESTS_CA_BUNDLE=
set PIP_TRUSTED_HOST=pypi.org pypi.python.org files.pythonhosted.org
set PIP_INDEX_URL=http://pypi.org/simple/

:: Tentar ler proxy do sistema (Internet Explorer / WinHTTP)
for /f "tokens=3 skip=4" %%p in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2^>nul') do set SYSTEM_PROXY=%%p
if defined SYSTEM_PROXY (
    set http_proxy=http://%SYSTEM_PROXY%
    set https_proxy=http://%SYSTEM_PROXY%
    set PIP_PROXY=http://%SYSTEM_PROXY%
    echo  [INFO] Proxy detectado: %SYSTEM_PROXY%
)

echo.
echo ════════════════════════════════════════════════════════════
echo   Portal TradeHub — Deploy do Zero (novo servidor Windows)
echo ════════════════════════════════════════════════════════════
echo.
echo  Este script faz a instalacao completa de raiz:
echo    1. Verificar prerequisitos (Python, Node.js, MySQL)
echo    2. Criar Python venv + instalar dependencias
echo    3. Verificar / criar base de dados MySQL
echo    4. Aplicar todas as migracoes (V001→V014+)
echo    5. Inserir dados mestres (bancos, produtos, departamentos...)
echo    6. Criar utilizadores de teste (password: test123)
echo    7. Build do frontend React
echo    8. Iniciar o servidor em modo producao
echo.
echo  Prerequisitos necessarios no servidor:
echo    - Python 3.11+  (python --version)
echo    - Node.js 18+   (node --version)
echo    - MySQL 8.0+    (mysql --version)
echo    - backend\.env  configurado com DATABASE_URL e SECRET_KEY
echo ════════════════════════════════════════════════════════════
echo.
echo  Pressione qualquer tecla para continuar ou Ctrl+C para cancelar.
pause >nul

set ROOT=%~dp0
set VENV=%ROOT%backend\.venv
set BACKEND_PORT=8000

:: ────────────────────────────────────────────
:: PASSO 0 — Verificar prerequisitos
:: ────────────────────────────────────────────
echo.
echo [0/7] Verificando prerequisitos...

python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Python nao encontrado. Instale Python 3.11+ e adicione ao PATH.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo       %%v

node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Node.js nao encontrado. Instale Node.js 18+ e adicione ao PATH.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo       Node.js %%v

mysql --version >nul 2>&1
if errorlevel 1 (
    echo  [AVISO] mysql CLI nao encontrado no PATH.
    echo          As migracoes SQL serao aplicadas via Python (pymysql).
    echo          Se houver erros, adicione o diretorio bin do MySQL ao PATH.
) else (
    for /f "tokens=*" %%v in ('mysql --version 2^>^&1') do echo       %%v
)

:: ────────────────────────────────────────────
:: PASSO 1 — backend\.env
:: ────────────────────────────────────────────
echo.
echo [1/7] Configuracao backend\.env...

if not exist "%ROOT%backend\.env" (
    if exist "%ROOT%backend\.env.example" (
        copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
        echo  [AVISO] backend\.env criado a partir do template.
        echo.
        echo  OBRIGATORIO: configure os seguintes campos antes de continuar:
        echo.
        echo    DATABASE_URL=mysql+pymysql://tradehub_user:SENHA@localhost:3306/tradehub_db
        echo    SECRET_KEY=^<gerar com: python -c "import secrets; print(secrets.token_urlsafe(32))"^>
        echo    ALLOWED_ORIGINS=http://portaltradedatahub,http://localhost
        echo    DEBUG=false
        echo.
        notepad "%ROOT%backend\.env"
        echo  Pressione qualquer tecla apos guardar o backend\.env...
        pause >nul
    ) else (
        echo  [ERRO] backend\.env e backend\.env.example nao encontrados.
        pause & exit /b 1
    )
)

:: Garantir DEBUG=false
powershell -NoProfile -Command ^
  "(Get-Content '%ROOT%backend\.env') -replace '^DEBUG=true$', 'DEBUG=false' | Set-Content '%ROOT%backend\.env'" >nul 2>&1
:: Garantir que aponta a localhost (nao ao hostname Docker)
powershell -NoProfile -Command ^
  "(Get-Content '%ROOT%backend\.env') -replace '@tradehub-db:', '@localhost:' | Set-Content '%ROOT%backend\.env'" >nul 2>&1

echo       backend\.env OK (DEBUG=false)

:: ────────────────────────────────────────────
:: PASSO 2 — Python venv + dependencias
:: ────────────────────────────────────────────
echo.
echo [2/7] Python venv + dependencias...

if not exist "%VENV%\Scripts\activate.bat" (
    echo       Criando venv...
    python -m venv "%VENV%"
    if errorlevel 1 (
        echo  [ERRO] Nao foi possivel criar o venv.
        pause & exit /b 1
    )
)

call "%VENV%\Scripts\activate.bat"

echo       Instalando dependencias Python...
"%VENV%\Scripts\pip.exe" install -r "%ROOT%backend\requirements.txt" ^
    --trusted-host pypi.org ^
    --trusted-host pypi.python.org ^
    --trusted-host files.pythonhosted.org ^
    --timeout 120 --retries 5 --quiet
if errorlevel 1 (
    echo  [ERRO] pip install falhou. Verifique a internet.
    pause & exit /b 1
)
echo       Dependencias instaladas.

:: ────────────────────────────────────────────
:: PASSO 3 — Criar base de dados MySQL
:: ────────────────────────────────────────────
echo.
echo [3/7] Base de dados MySQL...

"%VENV%\Scripts\python.exe" "%ROOT%scripts\create_database.py"

:: ────────────────────────────────────────────
:: PASSO 4 — Migracoes
:: ────────────────────────────────────────────
echo.
echo [4/7] Aplicando migracoes (V001 → V014+)...

"%VENV%\Scripts\python.exe" "%ROOT%scripts\run_migrations.py"
if errorlevel 1 (
    echo  [ERRO] Migracoes falharam.
    echo         Verifique se o MySQL esta a correr e o DATABASE_URL esta correto.
    pause & exit /b 1
)

:: ────────────────────────────────────────────
:: PASSO 5+6 — Dados mestres + utilizadores de teste
:: ────────────────────────────────────────────
echo.
echo [5/7] Dados mestres + utilizadores de teste...

"%VENV%\Scripts\python.exe" "%ROOT%scripts\seed_inicial.py"
if errorlevel 1 (
    echo  [AVISO] Seed falhou ou ja foi aplicado anteriormente.
    echo         Use: python scripts\seed_inicial.py --force para re-importar.
)

:: ────────────────────────────────────────────
:: PASSO 7 — Build do frontend
:: ────────────────────────────────────────────
echo.
echo [6/7] Build do frontend React...

cd /d "%ROOT%frontend"

if not exist "node_modules\.bin\vite.cmd" (
    echo       Instalando node_modules...
    npm install --registry http://registry.npmjs.org/ --quiet
    if errorlevel 1 (
        echo  [ERRO] npm install falhou.
        cd /d "%ROOT%"
        pause & exit /b 1
    )
)

echo       A compilar frontend...
npm run build
if errorlevel 1 (
    echo  [ERRO] npm run build falhou.
    cd /d "%ROOT%"
    pause & exit /b 1
)
cd /d "%ROOT%"
echo       Frontend compilado.

:: ────────────────────────────────────────────
:: ARRANQUE — Backend producao
:: ────────────────────────────────────────────
echo.
echo [7/7] Iniciando backend em modo producao...

:: Parar instancia anterior
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%BACKEND_PORT%.*LISTENING" 2^>nul') do (
    taskkill /PID %%p /F >nul 2>&1
)

start "TradeHub Backend" /D "%ROOT%backend" cmd /k "%ROOT%backend\start-backend.bat"

echo       Aguardando backend arrancar...
set /a TRIES=0
:wait_loop
set /a TRIES+=1
if %TRIES% GTR 30 (
    echo  [ERRO] Backend nao respondeu em 60s. Ver janela "TradeHub Backend".
    pause & exit /b 1
)
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command ^
  "try{$r=(Invoke-WebRequest 'http://127.0.0.1:%BACKEND_PORT%/api/health' -TimeoutSec 2 -UseBasicParsing).StatusCode;if($r-eq 200){exit 0}else{exit 1}}catch{exit 1}" >nul 2>&1
if errorlevel 1 goto :wait_loop

:: Port proxy 80 → 8000
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add    v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=%BACKEND_PORT% connectaddress=127.0.0.1 >nul 2>&1

echo.
echo ════════════════════════════════════════════════════════════
echo   Deploy concluido com sucesso!
echo.
echo   Acesso : http://portaltradedatahub
echo          : http://localhost
echo.
echo   Login admin  : admin@tradehub.com   / admin123
echo   Login teste  : trainer@tradehub.com / test123
echo                : student@tradehub.com / test123
echo                : manager@tradehub.com / test123
echo                : tutor@tradehub.com   / test123
echo.
echo   IMPORTANTE: alterar a senha admin apos o primeiro login!
echo.
echo   Para proximos arranques: iniciar-sem-docker.bat
echo   Para recompilar frontend: iniciar-sem-docker.bat --rebuild
echo   Para re-criar utilizadores: python scripts\seed_inicial.py --reset-users
echo ════════════════════════════════════════════════════════════
echo.
pause
