@echo off
chcp 65001 >nul
title Portal TradeHub - Producao Sem Docker

set NODE_TLS_REJECT_UNAUTHORIZED=0
set PYTHONHTTPSVERIFY=0
set REQUESTS_CA_BUNDLE=
set PIP_TRUSTED_HOST=pypi.org pypi.python.org files.pythonhosted.org

echo.
echo ============================================
echo   Portal TradeHub - Arranque (Producao)
echo ============================================
echo.

set ROOT=%~dp0
set VENV=%ROOT%backend\.venv
set BACKEND_PORT=8000

:: Verificar flag --rebuild (arg 1 ou 2)
set FORCE_REBUILD=false
if /I "%~1"=="--rebuild" set FORCE_REBUILD=true
if /I "%~2"=="--rebuild" set FORCE_REBUILD=true

:: ────────────────────────────────────────────
:: 1. Verificar backend\.env
:: ────────────────────────────────────────────
if not exist "%ROOT%backend\.env" goto :sem_env
goto :env_ok

:sem_env
if not exist "%ROOT%backend\.env.example" goto :env_erro
copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
echo  [AVISO] backend\.env criado a partir do template.
echo  Edite backend\.env e configure DATABASE_URL, SECRET_KEY, DEBUG=false
notepad "%ROOT%backend\.env"
echo  Pressione qualquer tecla apos guardar...
pause >nul

:env_ok
powershell -NoProfile -Command "(Get-Content '%ROOT%backend\.env') -replace '@tradehub-db:', '@localhost:' | Set-Content '%ROOT%backend\.env'" >nul 2>&1
powershell -NoProfile -Command "(Get-Content '%ROOT%backend\.env') -replace '^DEBUG=true$', 'DEBUG=false' | Set-Content '%ROOT%backend\.env'" >nul 2>&1
echo  [OK] backend\.env verificado
goto :passo2

:env_erro
echo  [ERRO] backend\.env nao encontrado.
echo  Crie backend\.env com DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS, DEBUG=false
pause
exit /b 1

:: ────────────────────────────────────────────
:: 2. Python venv + dependencias
:: ────────────────────────────────────────────
:passo2
echo.
echo [1/5] Python venv...

if exist "%VENV%\Scripts\activate.bat" goto :venv_ok
echo       Criando venv...
python -m venv "%VENV%"
if errorlevel 1 goto :venv_erro

:venv_ok
call "%VENV%\Scripts\activate.bat"

"%VENV%\Scripts\python.exe" -c "import uvicorn" >nul 2>&1
if not errorlevel 1 goto :deps_ok

echo       Instalando dependencias Python...
"%VENV%\Scripts\pip.exe" install -r "%ROOT%backend\requirements.txt" --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --timeout 120 --retries 5 --quiet
if errorlevel 1 goto :pip_erro
echo       Dependencias instaladas.
goto :passo3

:venv_erro
echo  [ERRO] Nao foi possivel criar o venv. Instale Python 3.11+ e adicione ao PATH.
pause
exit /b 1

:pip_erro
echo  [ERRO] pip install falhou. Verifique a internet ou o Python.
pause
exit /b 1

:deps_ok
echo  [OK] Dependencias Python ja instaladas.

:: ────────────────────────────────────────────
:: 3. Migracoes de base de dados
:: ────────────────────────────────────────────
:passo3
echo.
echo [2/5] Base de dados - migracoes...
"%VENV%\Scripts\python.exe" "%ROOT%scripts\run_migrations.py" 2>nul
if errorlevel 1 goto :migr_aviso
echo  [OK] Migracoes OK.
goto :passo4

:migr_aviso
echo  [AVISO] Migracao falhou. Verifique se o MySQL esta a correr e o DATABASE_URL esta correto.

:: ────────────────────────────────────────────
:: 4. Dados mestres
:: ────────────────────────────────────────────
:passo4
echo.
echo [3/5] Dados mestres...
if not exist "%ROOT%scripts\import_seed_data.py" goto :passo5
"%VENV%\Scripts\python.exe" "%ROOT%scripts\import_seed_data.py"
goto :passo5

:: ────────────────────────────────────────────
:: 5. Frontend - build de producao
:: ────────────────────────────────────────────
:passo5
echo.
echo [4/5] Frontend (build de producao)...

cd /d "%ROOT%frontend"

if exist "node_modules\.bin\vite.cmd" goto :npm_ok
echo       Instalando node_modules...
npm install --registry http://registry.npmjs.org/ --quiet
if errorlevel 1 goto :npm_erro
set FORCE_REBUILD=true

:npm_ok
if not exist "%ROOT%frontend\dist\index.html" set FORCE_REBUILD=true

if "%FORCE_REBUILD%"=="true" goto :do_build
echo  [OK] Frontend ja compilado. Use --rebuild para recompilar.
goto :passo6

:do_build
echo       A compilar frontend React...
npm run build
if errorlevel 1 goto :build_erro
echo  [OK] Build do frontend concluido.
goto :passo6

:npm_erro
echo  [ERRO] npm install falhou. Verifique o Node.js.
cd /d "%ROOT%"
pause
exit /b 1

:build_erro
echo  [ERRO] npm run build falhou. Verifique os logs acima.
cd /d "%ROOT%"
pause
exit /b 1

:: ────────────────────────────────────────────
:: 6. Iniciar backend
:: ────────────────────────────────────────────
:passo6
cd /d "%ROOT%"
echo.
echo [5/5] Iniciando backend...

for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT%.*LISTENING"') do taskkill /PID %%p /F >nul 2>&1

start "TradeHub Backend" /D "%ROOT%backend" cmd /k "%ROOT%backend\start-backend.bat"

echo       Aguardando backend arrancar...
set TRIES=0

:wait_loop
set /a TRIES+=1
if %TRIES% GTR 30 goto :backend_timeout
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "try{$r=(Invoke-WebRequest 'http://127.0.0.1:%BACKEND_PORT%/api/health' -TimeoutSec 2 -UseBasicParsing).StatusCode;if($r -eq 200){exit 0}else{exit 1}}catch{exit 1}" >nul 2>&1
if errorlevel 1 goto :wait_loop
goto :backend_ok

:backend_timeout
echo  [ERRO] Backend nao respondeu em 60 segundos.
echo  Ver janela "TradeHub Backend" para detalhes.
pause
exit /b 1

:backend_ok
echo  [OK] Backend ativo em http://127.0.0.1:%BACKEND_PORT%

:: ────────────────────────────────────────────
:: 7. Port proxy 80 -> 8000
:: ────────────────────────────────────────────
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add    v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=%BACKEND_PORT% connectaddress=127.0.0.1 >nul 2>&1
if errorlevel 1 goto :proxy_aviso
echo  [OK] Port proxy: porta 80 -> %BACKEND_PORT%
goto :resumo

:proxy_aviso
echo  [AVISO] Port proxy nao configurado (requer Administrador).
echo  Aceda via http://localhost:%BACKEND_PORT%

:: ────────────────────────────────────────────
:: Resumo
:: ────────────────────────────────────────────
:resumo
echo.
echo ============================================
echo   Portal TradeHub - Producao Ativa
echo.
echo   Acesso : http://portaltradedatahub
echo          : http://localhost:%BACKEND_PORT%
echo   API    : http://localhost:%BACKEND_PORT%/api
echo   Saude  : http://localhost:%BACKEND_PORT%/api/health
echo.
echo   Feche "TradeHub Backend" para parar o servidor.
echo   Para recompilar: iniciar-sem-docker.bat --rebuild
echo ============================================
echo.
echo  Pressione qualquer tecla para fechar esta janela.
pause >nul
