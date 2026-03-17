@echo off
chcp 65001 >nul
title TradeHub - Deploy Update

echo.
echo ========================================
echo  TradeHub - Actualizar Deploy
echo  Docker (local) + HP (via git)
echo ========================================
echo.

cd /d "%~dp0"

:: ============================================================
:: 1. Build frontend
:: ============================================================
echo [1/4] Build frontend...
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
    echo  [ERRO] npm run build falhou.
    pause
    exit /b 1
)
cd /d "%~dp0"
echo       Build concluido.

:: ============================================================
:: 2. Rebuild Docker (esta maquina)
:: ============================================================
echo [2/4] Rebuild Docker...

docker info >nul 2>&1
if errorlevel 1 (
    echo  [AVISO] Docker nao esta a correr — saltando rebuild Docker.
    goto :git_push
)

docker compose build --no-cache
if errorlevel 1 (
    echo  [AVISO] docker compose build falhou — continuando.
)

docker compose up -d
if errorlevel 1 (
    echo  [AVISO] docker compose up falhou — continuando.
) else (
    echo       Docker actualizado e a correr.
)

:: ============================================================
:: 3. Commit frontend/dist para HP
:: ============================================================
:git_push
echo [3/4] Publicar dist no git (para HP)...

git add -f frontend/dist/
git diff --cached --quiet
if not errorlevel 1 (
    echo       Sem alteracoes no dist — nada a commitar.
    goto :done
)

for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format 'yyyy-MM-dd HH:mm'"') do set NOW=%%d

git commit -m "deploy: rebuild frontend/dist [%NOW%]"
if errorlevel 1 (
    echo  [ERRO] git commit falhou.
    pause
    exit /b 1
)

git push origin main
if errorlevel 1 (
    echo  [ERRO] git push falhou.
    pause
    exit /b 1
)

echo       dist publicado no git.

:: ============================================================
:: 4. Instrucoes para HP
:: ============================================================
:done
echo [4/4] Concluido!
echo.
echo ========================================
echo  Docker (local): http://localhost:80
echo.
echo  Para actualizar o HP:
echo    git pull
echo    iniciar-dev.bat
echo ========================================
echo.
pause
