```bat
@echo off
echo ========================================
echo   Portal Trade DataHub - Iniciar Sistema
echo ========================================
echo.
echo Iniciando Backend e Frontend...
echo.

a start "Backend - Port 8000" cmd /k "cd /d c:\Portal Trade DataHub\backend && python main.py"
timeout /t 5 /nobreak >nul

a start "Frontend - Port 5173" cmd /k "cd /d c:\Portal Trade DataHub\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Servidores Iniciados!
echo ========================================
echo.
echo Backend:  http://192.168.1.78:8000
echo Frontend: http://localhost:5173
echo Docs:     http://192.168.1.78:8000/docs
echo.
echo Login: admin@tradehub.com / admin123
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:5173

echo.
echo Sistema rodando! Feche esta janela quando terminar.
echo.
pause

```