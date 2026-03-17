@echo off
chcp 65001 >nul
title TradeHub - Dev

:: ============================================================
:: Bypass SSL corporativo
:: ============================================================
set NODE_TLS_REJECT_UNAUTHORIZED=0
set PYTHONHTTPSVERIFY=0
set REQUESTS_CA_BUNDLE=
set PIP_TRUSTED_HOST=pypi.org pypi.python.org files.pythonhosted.org

echo.
echo ========================================
echo  TradeHub - Modo Desenvolvimento
echo ========================================
echo.

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
    echo.
    echo  [ERRO] Falha ao criar venv.
    echo  Instale Python 3.11+ e adicione ao PATH.
    pause
    exit /b 1
)

:pip_check
call "%VENV_DIR%\Scripts\activate.bat"

:: Verificar se uvicorn ja esta instalado
"%VENV_DIR%\Scripts\python.exe" -c "import uvicorn" >nul 2>&1
if not errorlevel 1 (
    echo       Dependencias Python ja instaladas.
    goto :npm_check
)

echo       Instalando dependencias Python...
if exist "%~dp0wheels\" (
    echo       Usando pacotes locais (wheels\)...
    "%VENV_DIR%\Scripts\pip.exe" install ^
        --no-index ^
        --find-links "%~dp0wheels" ^
        -r "%~dp0backend\requirements.txt" ^
        --quiet
) else (
    echo       A descarregar da internet...
    "%VENV_DIR%\Scripts\pip.exe" install -r "%~dp0backend\requirements.txt" ^
        --trusted-host pypi.org ^
        --trusted-host pypi.python.org ^
        --trusted-host files.pythonhosted.org ^
        --timeout 120 --retries 10 --quiet
)
if errorlevel 1 (
    echo.
    echo  [ERRO] pip install falhou.
    echo  Se a internet estiver bloqueada, corra download-wheels.bat
    echo  na maquina de dev e copie a pasta wheels\ para aqui.
    pause
    exit /b 1
)
echo       Dependencias Python instaladas.

:npm_check

:: ============================================================
:: 2. npm install
:: ============================================================
echo [2/3] Dependencias npm...
if exist "%~dp0frontend\node_modules\.bin\vite.cmd" (
    echo       node_modules ja instalados.
    goto :start
)
echo       Instalando node_modules (pode demorar)...
cd /d "%~dp0frontend"
if exist "node_modules\" (
    echo       Limpando node_modules incompleto...
    rmdir /s /q node_modules
)
npm install --registry http://registry.npmjs.org/
if errorlevel 1 (
    echo.
    echo  [ERRO] npm install falhou.
    echo  Verifique a ligacao a internet.
    cd /d "%~dp0"
    pause
    exit /b 1
)
cd /d "%~dp0"
echo       node_modules instalados.

:start

:: ============================================================
:: 3. Iniciar backend + Vite
:: ============================================================
echo [3/3] Iniciando servicos...

:: Matar processo anterior na porta 8000 se existir
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
echo  O Vite abre agora nesta janela.
echo  Feche a janela "TradeHub Backend"
echo  para parar o backend.
echo ========================================
echo.

cd /d "%~dp0frontend"
call npm run dev
