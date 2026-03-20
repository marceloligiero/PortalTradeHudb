@echo off
chcp 65001 >nul
title Download Wheels (Python 3.13 Windows)

echo.
echo ========================================
echo  Descarregar wheels para o HP laptop
echo  (Python 3.13, Windows 64-bit)
echo ========================================
echo.

cd /d "%~dp0"

if exist "wheels\" (
    echo  Limpando wheels antigos...
    rmdir /s /q wheels
)

echo  A descarregar pacotes Python (pode demorar)...
echo.

pip download -r backend\requirements.txt ^
    -d wheels ^
    --platform win_amd64 ^
    --python-version 313 ^
    --implementation cp ^
    --only-binary :all:

if errorlevel 1 (
    echo.
    echo  [ERRO] Download falhou.
    echo  Verifique a ligacao a internet nesta maquina.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Wheels guardados em: wheels\
echo.
echo  Proximo passo:
echo    1. Copie a pasta wheels\ para o HP
echo       (USB, partilha de rede, etc.)
echo    2. No HP: git pull
echo    3. No HP: iniciar-dev.bat
echo ========================================
echo.
pause
