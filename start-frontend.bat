@echo off
chcp 65001 >nul
title TradeHub Frontend

cd /d "%~dp0frontend"

if not exist "dist\index.html" goto :devmode

echo ========================================
echo  Frontend (producao):
echo    http://localhost:8000
echo.
echo  O backend/FastAPI serve o frontend.
echo  Inicie o backend com start-all.bat
echo ========================================
echo.
pause >nul
goto :end

:devmode
echo.
echo  Nenhum build de producao encontrado.
echo  Iniciando servidor de desenvolvimento Vite...
echo.
call npm run dev

:end
pause >nul
