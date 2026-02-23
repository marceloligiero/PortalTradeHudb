# ========================================
# TradeHub - Full Windows Setup
# Run from the project root folder
# ========================================

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TradeHub - Full Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) { Write-Host " Running as Administrator" -ForegroundColor Green }
else          { Write-Host " Running as normal user (some steps may be skipped)" -ForegroundColor Yellow }

# --------------------------------------------------------
# 1. MySQL - detect, install service if admin, verify
# --------------------------------------------------------
Write-Host "`n[1/8] MySQL Server..." -ForegroundColor Yellow

$mysqlBinDir = $null
$mysqlBase = Get-ChildItem "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue |
             Where-Object { $_.Name -like "MySQL Server*" } |
             Sort-Object Name -Descending | Select-Object -First 1
if ($mysqlBase) {
    $mysqlBinDir = Join-Path $mysqlBase.FullName "bin"
    Write-Host "      Found: $($mysqlBase.FullName)" -ForegroundColor Green
} else {
    Write-Host "      ERROR: MySQL Server not found in 'C:\Program Files\MySQL\'" -ForegroundColor Red
    Write-Host "      Install MySQL Server first, then re-run this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Ensure mysql CLI is available
$mysqlExe = Join-Path $mysqlBinDir "mysql.exe"
$mysqldExe = Join-Path $mysqlBinDir "mysqld.exe"

# Add to user PATH if needed
$mysqlCli = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCli) {
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
    if ($userPath -notlike "*$mysqlBinDir*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$userPath;$mysqlBinDir", [System.EnvironmentVariableTarget]::User)
        $env:Path += ";$mysqlBinDir"
        Write-Host "      Added MySQL bin to user PATH." -ForegroundColor Green
    }
}

# Check/create MySQL service
$mysqlSvc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $mysqlSvc -and $isAdmin) {
    Write-Host "      No MySQL service found. Registering..." -ForegroundColor Yellow
    # Initialize data directory if needed
    $dataDir = "C:\ProgramData\MySQL\data"
    if (-not (Test-Path $dataDir) -or (Get-ChildItem $dataDir -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0) {
        if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
        Write-Host "      Initializing MySQL data directory..." -ForegroundColor Yellow
        & $mysqldExe --initialize-insecure --basedir="$($mysqlBase.FullName)" --datadir="$dataDir" --console 2>&1 | Out-Null
        Write-Host "      Data directory initialized (root with no password)." -ForegroundColor Green
    }
    # Create my.ini
    $myIni = "[mysqld]`r`nbasedir=$($mysqlBase.FullName -replace '\\','/')`r`ndatadir=$($dataDir -replace '\\','/')`r`nport=3306"
    Set-Content -Path "C:\ProgramData\MySQL\my.ini" -Value $myIni -Encoding ASCII
    # Install service
    & $mysqldExe --install MySQL84 --defaults-file="C:\ProgramData\MySQL\my.ini" 2>&1 | Out-Null
    Set-Service -Name "MySQL84" -StartupType Automatic
    Start-Service -Name "MySQL84"
    $mysqlSvc = Get-Service -Name "MySQL84"
    Write-Host "      MySQL service 'MySQL84' installed, set to Automatic, and started." -ForegroundColor Green
} elseif (-not $mysqlSvc) {
    Write-Host "      WARNING: No MySQL service. Starting MySQL manually in background..." -ForegroundColor Yellow
    $dataDir = "C:\ProgramData\MySQL\data"
    if (-not (Test-Path $dataDir) -or (Get-ChildItem $dataDir -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0) {
        if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
        & $mysqldExe --initialize-insecure --basedir="$($mysqlBase.FullName)" --datadir="$dataDir" --console 2>&1 | Out-Null
    }
    Start-Process -FilePath $mysqldExe -ArgumentList "--basedir=`"$($mysqlBase.FullName)`" --datadir=`"$dataDir`" --port=3306" -WindowStyle Hidden
    Start-Sleep 5
} else {
    if ($mysqlSvc.Status -ne 'Running') {
        if ($isAdmin) {
            Start-Service -Name $mysqlSvc.Name
            Write-Host "      MySQL service '$($mysqlSvc.Name)' started." -ForegroundColor Green
        } else {
            Write-Host "      WARNING: MySQL service '$($mysqlSvc.Name)' is stopped. Ask admin to start it." -ForegroundColor Yellow
        }
    } else {
        Write-Host "      MySQL service '$($mysqlSvc.Name)' is running." -ForegroundColor Green
    }
}

# Verify MySQL connectivity
Start-Sleep 2
$mysqlOk = $false
try {
    $testResult = & $mysqlExe -u root -e "SELECT 1" 2>&1
    if ($testResult -notlike "*ERROR*") { $mysqlOk = $true }
} catch {}

if ($mysqlOk) {
    Write-Host "      MySQL connection verified." -ForegroundColor Green
} else {
    Write-Host "      ERROR: Cannot connect to MySQL. Check if it is running." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# --------------------------------------------------------
# 2. Create database
# --------------------------------------------------------
Write-Host "`n[2/8] Database..." -ForegroundColor Yellow

& $mysqlExe -u root -e "CREATE DATABASE IF NOT EXISTS tradehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | Out-Null
Write-Host "      Database 'tradehub' ready." -ForegroundColor Green

# --------------------------------------------------------
# 3. Backend .env configuration
# --------------------------------------------------------
Write-Host "`n[3/8] Backend .env..." -ForegroundColor Yellow

$backendDir = Join-Path $scriptRoot "backend"
$envFile = Join-Path $backendDir ".env"

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendDir ".env.example") $envFile -ErrorAction SilentlyContinue
}

# Always ensure DATABASE_URL points to local MySQL
$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch "mysql\+pymysql://root@localhost") {
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=mysql+pymysql://root@localhost:3306/tradehub?charset=utf8mb4"
    Set-Content -Path $envFile -Value $envContent.TrimEnd() -Encoding UTF8
    Write-Host "      Updated DATABASE_URL to local MySQL." -ForegroundColor Green
} else {
    Write-Host "      DATABASE_URL already points to local MySQL." -ForegroundColor Green
}

# Generate SECRET_KEY if it's the example value
if ($envContent -match "CHANGE_THIS_TO_A_STRONG_SECRET") {
    $pythonExe = Join-Path $scriptRoot ".venv\Scripts\python.exe"
    if (-not (Test-Path $pythonExe)) { $pythonExe = Join-Path $backendDir "venv\Scripts\python.exe" }
    if (Test-Path $pythonExe) {
        $secretKey = & $pythonExe -c "import secrets; print(secrets.token_urlsafe(32))"
        $envContent = $envContent -replace "SECRET_KEY=.*", "SECRET_KEY=$secretKey"
        Set-Content -Path $envFile -Value $envContent.TrimEnd() -Encoding UTF8
        Write-Host "      Generated new SECRET_KEY." -ForegroundColor Green
    }
}

# --------------------------------------------------------
# 4. Frontend .env configuration
# --------------------------------------------------------
Write-Host "`n[4/8] Frontend .env..." -ForegroundColor Yellow

$frontendDir = Join-Path $scriptRoot "frontend"

# Fix .env.local to point to local backend
$envLocalFile = Join-Path $frontendDir ".env.local"
Set-Content -Path $envLocalFile -Value "VITE_API_BASE_URL=http://localhost:8000" -Encoding UTF8
Write-Host "      .env.local set to http://localhost:8000" -ForegroundColor Green

# Also fix .env
$envFrontFile = Join-Path $frontendDir ".env"
Set-Content -Path $envFrontFile -Value "VITE_API_BASE_URL=http://localhost:8000" -Encoding UTF8
Write-Host "      .env set to http://localhost:8000" -ForegroundColor Green

# --------------------------------------------------------
# 5. Python venv & dependencies
# --------------------------------------------------------
Write-Host "`n[5/8] Python venv & dependencies..." -ForegroundColor Yellow

$pythonExe = Join-Path $scriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
}

if (-not (Test-Path $pythonExe)) {
    Write-Host "      Creating Python venv..." -ForegroundColor Yellow
    $sysPython = Get-Command python -ErrorAction SilentlyContinue
    if ($sysPython) {
        & python -m venv (Join-Path $scriptRoot ".venv")
        $pythonExe = Join-Path $scriptRoot ".venv\Scripts\python.exe"
        & $pythonExe -m pip install --upgrade pip 2>&1 | Out-Null
        & $pythonExe -m pip install -r (Join-Path $backendDir "requirements.txt") 2>&1 | Out-Null
        Write-Host "      Venv created and dependencies installed." -ForegroundColor Green
    } else {
        Write-Host "      ERROR: Python not found. Install Python 3.10+ first." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "      Python venv found: $pythonExe" -ForegroundColor Green
}

# --------------------------------------------------------
# 6. Create database tables & insert initial data
# --------------------------------------------------------
Write-Host "`n[6/8] Database tables & initial data..." -ForegroundColor Yellow

# Create tables via SQLAlchemy
& $pythonExe -c "import sys; sys.path.insert(0, r'$backendDir'); from app.models import *; from app.database import init_db; init_db(); print('      Tables created.')" 2>&1

# Insert initial data (admin user, banks, products)
$initSql = Join-Path $scriptRoot "database\init_mysql.sql"
if (Test-Path $initSql) {
    Get-Content $initSql | & $mysqlExe -u root tradehub 2>&1 | Out-Null
    Write-Host "      Initial data inserted (admin@tradehub.com / admin123)." -ForegroundColor Green
}

# --------------------------------------------------------
# 7. Frontend npm install
# --------------------------------------------------------
Write-Host "`n[7/8] Frontend dependencies..." -ForegroundColor Yellow

$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    Push-Location $frontendDir
    $npmResult = npm install 2>&1 | Select-Object -Last 3
    Pop-Location
    Write-Host "      npm install complete." -ForegroundColor Green
} else {
    Write-Host "      WARNING: Node.js not found. Install Node.js 18+ first." -ForegroundColor Yellow
}

# --------------------------------------------------------
# 8. Create start scripts & auto-start shortcuts
# --------------------------------------------------------
Write-Host "`n[8/8] Creating start scripts..." -ForegroundColor Yellow

# start-backend.bat
$startBackendBat = Join-Path $scriptRoot "start-backend.bat"
$batContent = @"
@echo off
title TradeHub Backend
cd /d "$backendDir"
"$pythonExe" -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
"@
Set-Content -Path $startBackendBat -Value $batContent -Encoding ASCII
Write-Host "      Created: start-backend.bat" -ForegroundColor Green

# start-frontend.bat
$startFrontendBat = Join-Path $scriptRoot "start-frontend.bat"
$batFrontend = @"
@echo off
title TradeHub Frontend
cd /d "$frontendDir"
npm run dev
pause
"@
Set-Content -Path $startFrontendBat -Value $batFrontend -Encoding ASCII
Write-Host "      Created: start-frontend.bat" -ForegroundColor Green

# start-all.bat
$startAllBat = Join-Path $scriptRoot "start-all.bat"
$batAll = @"
@echo off
title TradeHub - Starting All Services
echo Starting TradeHub Backend...
start /min "" "$startBackendBat"
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul
echo Starting TradeHub Frontend...
start /min "" "$startFrontendBat"
echo.
echo ========================================
echo  TradeHub is running!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  Login:    admin@tradehub.com / admin123
echo ========================================
echo.
pause
"@
Set-Content -Path $startAllBat -Value $batAll -Encoding ASCII
Write-Host "      Created: start-all.bat" -ForegroundColor Green

# Auto-start on login (Startup folder shortcut)
$startupFolder = [System.Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "TradeHub.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $startAllBat
$shortcut.WorkingDirectory = $scriptRoot
$shortcut.Description = "TradeHub - Backend & Frontend"
$shortcut.WindowStyle = 7  # Minimized
$shortcut.Save()
Write-Host "      Auto-start shortcut added to Startup folder." -ForegroundColor Green

# Firewall (only if admin)
if ($isAdmin) {
    $rule = Get-NetFirewallRule -DisplayName "TradeHub Application" -ErrorAction SilentlyContinue
    if (-not $rule) {
        New-NetFirewallRule -DisplayName "TradeHub Application" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Any | Out-Null
        Write-Host "      Firewall rule created for port 8000." -ForegroundColor Green
    }
}

# --------------------------------------------------------
# Summary
# --------------------------------------------------------
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " MySQL:    Running (service auto-starts on boot)" -ForegroundColor White
Write-Host " Database: tradehub (tables + admin user created)" -ForegroundColor White
Write-Host " Backend:  .env configured for local MySQL" -ForegroundColor White
Write-Host " Frontend: .env.local configured for localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host " Start everything: .\start-all.bat" -ForegroundColor Yellow
Write-Host " Start backend:    .\start-backend.bat" -ForegroundColor Yellow
Write-Host " Start frontend:   .\start-frontend.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host " Login: admin@tradehub.com / admin123" -ForegroundColor Cyan
Write-Host " Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host " Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
