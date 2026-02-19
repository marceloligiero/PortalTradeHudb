@echo off
REM ========================================
REM  TradeHub Production Server - Stop All
REM ========================================

echo Stopping TradeHub services...

REM Stop Backend (uvicorn/python on port 8000)
echo Stopping Application Server...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%p >NUL 2>&1
)

REM Stop MySQL gracefully
echo Stopping MySQL...
C:\wamp64\bin\mysql\mysql9.1.0\bin\mysqladmin.exe -u root -p"TradeHub2024!" shutdown >NUL 2>&1
if "%ERRORLEVEL%" NEQ "0" (
    taskkill /F /IM mysqld.exe >NUL 2>&1
)

echo.
echo All TradeHub services stopped.
pause
