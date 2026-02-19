@echo off
REM ========================================
REM  TradeHub Production Server - Start All
REM  Run as Administrator for best results
REM ========================================

echo ============================================
echo  TradeHub Production Server - Starting...
echo ============================================

REM Set paths
set MYSQL_BIN=C:\wamp64\bin\mysql\mysql9.1.0\bin
set MYSQL_INI=C:\wamp64\bin\mysql\mysql9.1.0\my.ini
set APP_DIR=C:\PortalFormações\PortalTradeHudb
set BACKEND_DIR=%APP_DIR%\backend

REM ---- Step 1: Start MySQL ----
echo.
echo [1/2] Starting MySQL Server...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo      MySQL is already running.
) else (
    start "" /B "%MYSQL_BIN%\mysqld.exe" --defaults-file="%MYSQL_INI%"
    echo      Waiting for MySQL to start...
    timeout /t 10 /nobreak >NUL
    "%MYSQL_BIN%\mysql.exe" -u root -p"TradeHub2024!" -e "SELECT 1" >NUL 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo      MySQL started successfully on port 3306.
    ) else (
        echo      ERROR: MySQL failed to start!
        pause
        exit /b 1
    )
)

REM ---- Step 2: Start Backend + Frontend (HTTPS 8443 + HTTP 8000) ----
echo.
echo [2/3] Starting TradeHub HTTPS Server (port 8443)...
cd /d "%BACKEND_DIR%"
set SSL_DIR=%APP_DIR%\ssl\letsencrypt
start "" /B "%BACKEND_DIR%\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8443 --ssl-keyfile "%SSL_DIR%\portalformacoes.duckdns.org-key.pem" --ssl-certfile "%SSL_DIR%\portalformacoes.duckdns.org-chain.pem" --workers 4
echo      HTTPS starting on port 8443...

echo.
echo [3/3] Starting TradeHub HTTP Server (port 8000)...
start "" /B "%BACKEND_DIR%\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
echo      HTTP starting on port 8000...
timeout /t 5 /nobreak >NUL

echo.
echo ============================================
echo  TradeHub Production Server - RUNNING
echo ============================================
echo.
echo  HTTPS: https://portalformacoes.duckdns.org:8443
echo  HTTP:  http://81.193.48.82:8000
echo  API:   https://portalformacoes.duckdns.org:8443/docs
echo  Health: https://portalformacoes.duckdns.org:8443/api/health
echo.
echo  Network Access:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo    https://%%b:8443
        echo    http://%%b:8000
    )
)
echo.
echo  Admin Login: admin@tradehub.com / admin123
echo  (Change the admin password after first login!)
echo.
echo  Press Ctrl+C or close this window to stop.
echo ============================================
pause
