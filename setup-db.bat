@echo off
chcp 65001 >nul
title TradeHub - Setup Base de Dados

echo.
echo ========================================
echo  TradeHub - Setup MySQL
echo ========================================
echo.

:: ============================================================
:: 1. Credenciais MySQL
:: ============================================================
set /p MYSQL_ROOT_PASS="Password root MySQL (Enter se nao tiver): "
set /p MYSQL_ROOT_USER="Utilizador root [root]: "
if "%MYSQL_ROOT_USER%"=="" set MYSQL_ROOT_USER=root

if "%MYSQL_ROOT_PASS%"=="" (
    set MYSQL_CMD=mysql -u %MYSQL_ROOT_USER%
    set MYSQL_PWD_FLAG=
) else (
    set MYSQL_CMD=mysql -u %MYSQL_ROOT_USER% -p%MYSQL_ROOT_PASS%
    set MYSQL_PWD_FLAG=-p%MYSQL_ROOT_PASS%
)

:: Testar ligacao
echo.
echo  Testando ligacao ao MySQL...
echo SELECT 1; | %MYSQL_CMD% >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Nao foi possivel ligar ao MySQL.
    echo  Verifique se o servico esta a correr e as credenciais.
    pause
    exit /b 1
)
echo  Ligacao OK.

:: ============================================================
:: 2. Mostrar bases de dados existentes
:: ============================================================
echo.
echo  Bases de dados disponiveis:
echo  --------------------------------
echo SHOW DATABASES; | %MYSQL_CMD% --silent 2>nul | findstr /v "information_schema\|performance_schema\|mysql\|sys"
echo  --------------------------------
echo.

set /p DB_NAME="Nome da base de dados [tradehub_db]: "
if "%DB_NAME%"=="" set DB_NAME=tradehub_db

:: ============================================================
:: 3. Criar DB se nao existir (nao apaga se existir)
:: ============================================================
echo.
echo  [1/2] Preparando base de dados '%DB_NAME%'...

echo CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; | %MYSQL_CMD% >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Nao foi possivel criar a base de dados.
    pause
    exit /b 1
)
echo       Base de dados OK.

:: ============================================================
:: 4. Criar backend\.env com root directo
:: ============================================================
echo  [2/2] Criando backend\.env...

if "%MYSQL_ROOT_PASS%"=="" (
    set DB_URL=mysql+pymysql://%MYSQL_ROOT_USER%:@localhost:3306/%DB_NAME%
) else (
    set DB_URL=mysql+pymysql://%MYSQL_ROOT_USER%:%MYSQL_ROOT_PASS%@localhost:3306/%DB_NAME%
)

(
echo DATABASE_URL=%DB_URL%
echo SECRET_KEY=devsecret-local-mudar-em-producao
echo ALLOWED_ORIGINS=http://localhost:8000,http://localhost:5173,http://127.0.0.1:8000
echo DEBUG=true
echo SMTP_HOST=
echo SMTP_PORT=587
echo SMTP_USER=
echo SMTP_PASSWORD=
echo SMTP_FROM_EMAIL=
) > "%~dp0backend\.env"

echo       backend\.env criado.
echo       URL: %DB_URL%

echo.
echo ========================================
echo  Proximo passo: iniciar-dev.bat
echo  (cria tabelas e corre migracoes)
echo ========================================
echo.
pause
