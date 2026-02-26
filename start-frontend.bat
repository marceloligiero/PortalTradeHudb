@echo off
title TradeHub Frontend
pushd "%~dp0frontend"
npm run dev
popd
if "%1"=="interactive" pause
