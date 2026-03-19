@echo off
chcp 65001 >nul
title TradeHub - Dev

set NODE_TLS_REJECT_UNAUTHORIZED=0
set PYTHONHTTPSVERIFY=0
set REQUESTS_CA_BUNDLE=
set PIP_TRUSTED_HOST=pypi.org pypi.python.org files.pythonhosted.org

echo.
echo ========================================
echo  TradeHub - Modo Desenvolvimento
echo ========================================
echo.

:: Verificar backend\.env
if not exist "%~dp0backend\.env" (
    echo  [AVISO] backend\.env nao encontrado!
    echo.
    echo  Corra primeiro: setup-db.bat
    echo  para configurar a base de dados e criar o .env
    echo.
    pause
    exit /b 1
)

:: ============================================================
:: 1. Python venv
:: ============================================================
set VENV_DIR=%~dp0backend\.venv
if exist "%VENV_DIR%\Scripts\activate.bat" (
    echo [1/3] venv Python OK
    goto :pip_check
)

echo [1/3] Criando venv Python...
python -m venv "%VENV_DIR%"
if errorlevel 1 (
    echo  [ERRO] Falha ao criar venv. Instale Python 3.11+ e adicione ao PATH.
    pause
    exit /b 1
)

:pip_check
call "%VENV_DIR%\Scripts\activate.bat"

"%VENV_DIR%\Scripts\python.exe" -c "import uvicorn" >nul 2>&1
if not errorlevel 1 (
    echo       Dependencias Python ja instaladas.
    goto :db_migrate
)

echo       Instalando dependencias Python...
if exist "%~dp0wheels\" goto :pip_offline

echo       A descarregar da internet...
"%VENV_DIR%\Scripts\pip.exe" install -r "%~dp0backend\requirements.txt" --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --timeout 120 --retries 10 --quiet
goto :pip_done

:pip_offline
echo       Usando pacotes locais (wheels\)...
"%VENV_DIR%\Scripts\pip.exe" install --no-index --find-links "%~dp0wheels" -r "%~dp0backend\requirements.txt" --quiet

:pip_done
if errorlevel 1 (
    echo  [ERRO] pip install falhou.
    echo  Se internet bloqueada: corra download-wheels.bat na maquina dev e copie wheels\ para aqui.
    pause
    exit /b 1
)
echo       Dependencias Python instaladas.

:db_migrate
:: ============================================================
:: DB: criar tabelas + correr migracoes pendentes
:: ============================================================
echo       Executando migracoes de base de dados...
"%VENV_DIR%\Scripts\python.exe" "%~dp0scripts\run_migrations.py"
if errorlevel 1 (
    echo  [ERRO] Migracoes falharam. Verifique backend\.env e MySQL.
    pause
    exit /b 1
)

:npm_check
:: ============================================================
:: 2. npm / frontend
:: ============================================================
echo [2/3] Frontend...

:: Se dist ja existe E node_modules existe → modo Vite dev
if exist "%~dp0frontend\dist\index.html" (
    if exist "%~dp0frontend\node_modules\.bin\vite.cmd" (
        echo       dist/ e node_modules OK - modo Vite dev
        goto :run_vite
    )
    echo       dist/ existe - backend serve frontend em :8000
    goto :run_backend_only
)

:: Sem dist — instalar node_modules se preciso + compilar
echo       frontend\dist nao encontrado. A compilar...
cd /d "%~dp0frontend"
if not exist "node_modules\.bin\vite.cmd" (
    echo       Instalando node_modules (pode demorar)...
    npm install --registry http://registry.npmjs.org/
    if errorlevel 1 (
        echo.
        echo  [ERRO] npm install falhou.
        echo  O proxy corporativo pode estar a bloquear o npm.
        echo  Ligue a VPN e tente novamente.
        cd /d "%~dp0"
        pause
        exit /b 1
    )
    echo       node_modules instalados.
)
echo       Compilando frontend (npm run build)...
call npm run build
if errorlevel 1 (
    echo  [ERRO] npm run build falhou.
    cd /d "%~dp0"
    pause
    exit /b 1
)
cd /d "%~dp0"
echo       Frontend compilado em frontend\dist\
goto :run_backend_only

:run_vite
:: ============================================================
:: 3a. Iniciar backend + Vite dev server
:: ============================================================
echo [3/3] Iniciando backend + Vite...

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000.*LISTENING" 2^>nul') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

start "TradeHub Backend" /D "%~dp0" cmd /k call "%~dp0start-backend.bat"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  Backend : http://localhost:8000/api
echo  Frontend: http://localhost:5173
echo.
echo  Feche "TradeHub Backend" para parar.
echo ========================================
echo.

cd /d "%~dp0frontend"
call npm run dev
goto :eof

:run_backend_only
:: ============================================================
:: 3b. Apenas backend (serve frontend/dist em :8000)
:: ============================================================
echo [3/3] Iniciando backend (serve frontend compilado)...

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000.*LISTENING" 2^>nul') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo.
echo ========================================
echo  Aplicacao: http://localhost:8000
echo.
echo  (Para modo Vite: ligue VPN e apague
echo   node_modules\ para reinstalar)
echo ========================================
echo.

call "%~dp0start-backend.bat"
