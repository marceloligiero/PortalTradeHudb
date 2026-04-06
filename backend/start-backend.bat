@echo off
:: Helper chamado pelo iniciar-sem-docker.bat e deploy-zero.bat
:: Activa o venv e arranca o uvicorn em modo producao
call "%~dp0.venv\Scripts\activate.bat"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
