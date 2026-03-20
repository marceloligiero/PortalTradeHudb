@echo off
chcp 65001 >nul
title TradeHub - Deploy Update

echo.
echo ========================================
echo  TradeHub - Actualizar Deploy
echo  Docker (local) + HP (via git pull)
echo ========================================
echo.

cd /d "%~dp0"

:: ============================================================
:: 1. Build frontend
:: ============================================================
echo [1/3] Build frontend...
cd /d "%~dp0frontend"

if not exist "node_modules\.bin\vite.cmd" (
    echo       Instalando node_modules...
    call npm ci
    if errorlevel 1 (
        echo  [ERRO] npm ci falhou.
        pause
        exit /b 1
    )
)

call npm run build
if errorlevel 1 (
    echo  [ERRO] npm run build falhou.
    pause
    exit /b 1
)
cd /d "%~dp0"
echo       Build concluido em frontend\dist\

:: ============================================================
:: 2. Rebuild Docker (esta maquina — se Docker estiver activo)
:: ============================================================
echo [2/3] Rebuild Docker...

docker info >nul 2>&1
if errorlevel 1 (
    echo  [AVISO] Docker nao esta a correr — saltando rebuild Docker.
    goto :push_code
)

:: Copiar dist para o container frontend (sem rebuild de imagem)
docker cp frontend/dist/. tradehub-frontend:/usr/share/nginx/html/ 2>nul
if errorlevel 1 (
    echo  [AVISO] docker cp falhou — tentando rebuild completo...
    docker compose -f docker-compose.yml build --no-cache
    docker compose -f docker-compose.yml up -d
) else (
    docker exec tradehub-frontend nginx -s reload 2>nul
    echo       Frontend actualizado no Docker (hot copy + nginx reload).
)

:: ============================================================
:: 3. Push codigo para o HP (sem dist — HP faz build local)
:: ============================================================
:push_code
echo [3/3] Publicar codigo no git (HP faz build local)...

:: Verificar se ha algo para commitar
git diff --quiet HEAD 2>nul
if not errorlevel 1 (
    echo       Sem alteracoes de codigo — nada a commitar.
    goto :done
)

git add -A
for /f "tokens=*" %%d in ('powershell -command "Get-Date -Format 'yyyy-MM-dd HH:mm'"') do set NOW=%%d

git commit -m "deploy: update [%NOW%]"
if errorlevel 1 (
    echo  [AVISO] git commit falhou ou nada a commitar.
    goto :done
)

git push origin main
if errorlevel 1 (
    echo  [ERRO] git push falhou.
    pause
    exit /b 1
)

echo       Codigo publicado no git.

:: ============================================================
:: Instrucoes
:: ============================================================
:done
echo.
echo ========================================
echo  Deploy concluido!
echo.
echo  Docker (local): http://localhost:80
echo.
echo  Para actualizar o HP (sem Docker):
echo    git pull
echo    iniciar-dev.bat
echo    (ou: .\scripts\deploy-nodocker.ps1)
echo ========================================
echo.
pause
