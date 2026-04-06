@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   Descarregar pacotes Python para deploy offline
echo   (executar na maquina de desenvolvimento)
echo ============================================
echo.

set ROOT=%~dp0
set PKG_DIR=%ROOT%packages-python

if not exist "%PKG_DIR%" mkdir "%PKG_DIR%"

echo Descarregando pacotes de backend\requirements.txt...
echo Destino: %PKG_DIR%
echo.

python -m pip download ^
    -r "%ROOT%backend\requirements.txt" ^
    -d "%PKG_DIR%" ^
    --quiet

if errorlevel 1 (
    echo  [ERRO] Download falhou.
    pause
    exit /b 1
)

echo.
echo  [OK] Pacotes descarregados em: %PKG_DIR%
echo.
echo  Copie a pasta packages-python\ para o servidor HP
echo  na mesma localizacao do projecto, depois execute:
echo    iniciar-sem-docker.bat --rebuild
echo.
pause
