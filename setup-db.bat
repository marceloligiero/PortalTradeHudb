@echo off
chcp 65001 >nul
title TradeHub - Setup Base de Dados

echo.
echo ========================================
echo  TradeHub - Setup MySQL (primeira vez)
echo ========================================
echo.
echo  Este script vai:
echo    1. Criar backend\.env com localhost
echo    2. Recriar a base de dados tradehub_db
echo    3. Criar utilizador tradehub_user
echo.
echo  ATENCAO: apaga dados existentes em tradehub_db!
echo.
set /p CONTINUAR="Continuar? (S/N): "
if /i not "%CONTINUAR%"=="S" exit /b 0

echo.
set /p MYSQL_ROOT_PASS="Password do root MySQL (deixar vazio se nao tiver): "
set /p DB_PASS="Password para tradehub_user [tradehub2024]: "
if "%DB_PASS%"=="" set DB_PASS=tradehub2024

:: ============================================================
:: 1. Criar backend\.env
:: ============================================================
echo.
echo  [1/3] Criando backend\.env...

(
echo DATABASE_URL=mysql+pymysql://tradehub_user:%DB_PASS%@localhost:3306/tradehub_db
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

:: ============================================================
:: 2. Recriar base de dados
:: ============================================================
echo  [2/3] Recriando base de dados...

if "%MYSQL_ROOT_PASS%"=="" (
    set MYSQL_CMD=mysql -u root
) else (
    set MYSQL_CMD=mysql -u root -p%MYSQL_ROOT_PASS%
)

(
echo DROP DATABASE IF EXISTS tradehub_db;
echo CREATE DATABASE tradehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo DROP USER IF EXISTS 'tradehub_user'@'localhost';
echo CREATE USER 'tradehub_user'@'localhost' IDENTIFIED BY '%DB_PASS%';
echo GRANT ALL PRIVILEGES ON tradehub_db.* TO 'tradehub_user'@'localhost';
echo FLUSH PRIVILEGES;
) | %MYSQL_CMD%

if errorlevel 1 (
    echo.
    echo  [ERRO] Falha ao configurar MySQL.
    echo  Verifique se o MySQL esta a correr e a password esta correcta.
    echo.
    echo  Tente manualmente:
    echo    mysql -u root -p
    echo    DROP DATABASE IF EXISTS tradehub_db;
    echo    CREATE DATABASE tradehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    echo    CREATE USER 'tradehub_user'@'localhost' IDENTIFIED BY '%DB_PASS%';
    echo    GRANT ALL PRIVILEGES ON tradehub_db.* TO 'tradehub_user'@'localhost';
    pause
    exit /b 1
)
echo       Base de dados recriada.

:: ============================================================
:: 3. Correr migracoes apos iniciar backend
:: ============================================================
echo  [3/3] Configuracao concluida!
echo.
echo ========================================
echo  Proximo passo:
echo    1. iniciar-dev.bat
echo       (vai criar as tabelas automaticamente)
echo    2. Depois executar migracoes:
echo       %MYSQL_CMD% tradehub_db < database\migrations\V001__initial_unified_schema.sql
echo ========================================
echo.
pause
