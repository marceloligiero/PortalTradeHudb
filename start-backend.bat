@echo off
title TradeHub Backend
pushd "%~dp0backend"
"%~dp0.venv\\Scripts\\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
popd
if "%1"=="interactive" pause
