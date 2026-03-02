@echo off
chcp 65001 >nul
title TradeHub Frontend
cd /d "%~dp0frontend"
echo.
echo  Starting Vite dev server ...
echo.
call npm run dev
echo.
echo [Frontend stopped. Press any key to close.]
pause >nul
