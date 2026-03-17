@echo off
chcp 65001 >nul
title TradeHub Backend

:: Procurar venv: primeiro na raiz, depois em backend\
if exist "%~dp0.venv\Scripts\activate.bat" (
    set VENV_DIR=%~dp0.venv
) else if exist "%~dp0backend\.venv\Scripts\activate.bat" (
    set VENV_DIR=%~dp0backend\.venv
) else (
    echo.
    echo [ERRO] Virtualenv nao encontrado.
    echo Caminhos procurados:
    echo   %~dp0.venv
    echo   %~dp0backend\.venv
    echo.
    echo Execute install-nodocker.ps1 ou crie o venv manualmente:
    echo   cd backend ^&^& pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

call "%VENV_DIR%\Scripts\activate.bat"
cd /d "%~dp0backend"

echo.
echo  Iniciando backend em http://0.0.0.0:8000 ...
echo  (API + Frontend na mesma porta)
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000

echo.
echo [Backend parado. Prima qualquer tecla para fechar.]
pause >nul
