# ========================================
# TradeHub - Windows Setup (No Admin Required)
# ========================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TradeHub - Setup (User-level)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 1. Check MySQL is running
Write-Host "`n[1/4] Checking MySQL..." -ForegroundColor Yellow

$mysqlSvc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mysqlSvc -and $mysqlSvc.Status -eq 'Running') {
    Write-Host "      MySQL service '$($mysqlSvc.Name)' is running." -ForegroundColor Green
} elseif ($mysqlSvc) {
    Write-Host "      MySQL service '$($mysqlSvc.Name)' found but NOT running." -ForegroundColor Yellow
    Write-Host "      Please ask an admin to start it, or start it from MySQL Installer." -ForegroundColor Yellow
} else {
    Write-Host "      WARNING: No MySQL service found. Make sure MySQL is installed and running." -ForegroundColor Yellow
}

# 2. Ensure mysql CLI is in user PATH
Write-Host "`n[2/4] Checking MySQL CLI in PATH..." -ForegroundColor Yellow

$mysqlCli = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCli) {
    $mysqlBinDir = Get-ChildItem "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue |
                   Where-Object { $_.Name -like "MySQL Server*" } |
                   Sort-Object Name -Descending | Select-Object -First 1
    if ($mysqlBinDir) {
        $binPath = Join-Path $mysqlBinDir.FullName "bin"
        # Add to USER-level PATH (no admin needed)
        $userPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
        if ($userPath -notlike "*$binPath*") {
            [System.Environment]::SetEnvironmentVariable("Path", "$userPath;$binPath", [System.EnvironmentVariableTarget]::User)
            $env:Path += ";$binPath"
            Write-Host "      Added '$binPath' to user PATH." -ForegroundColor Green
        } else {
            Write-Host "      MySQL bin already in user PATH." -ForegroundColor Green
        }
    } else {
        Write-Host "      WARNING: Could not find MySQL bin directory to add to PATH." -ForegroundColor Yellow
    }
} else {
    Write-Host "      mysql CLI already available in PATH." -ForegroundColor Green
}

# 3. Create auto-start shortcut in Windows Startup folder
Write-Host "`n[3/4] Creating auto-start shortcut for TradeHub Backend..." -ForegroundColor Yellow

$backendDir = Join-Path $scriptRoot "backend"
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"

# Also check for .venv at project root
if (-not (Test-Path $pythonExe)) {
    $pythonExe = Join-Path $scriptRoot ".venv\Scripts\python.exe"
}

if (-not (Test-Path $pythonExe)) {
    Write-Host "      WARNING: Python venv not found. Create it first:" -ForegroundColor Yellow
    Write-Host "        cd backend && python -m venv venv && venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
} else {
    Write-Host "      Python venv found: $pythonExe" -ForegroundColor Green
}

$startupFolder = [System.Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "TradeHub-Backend.lnk"

# Create a .bat launcher script
$launcherBat = Join-Path $scriptRoot "start-backend.bat"
$batContent = @"
@echo off
title TradeHub Backend
cd /d "$backendDir"
"$pythonExe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
pause
"@
Set-Content -Path $launcherBat -Value $batContent -Encoding ASCII
Write-Host "      Created launcher: $launcherBat" -ForegroundColor Green

# Create shortcut in Startup folder
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcherBat
$shortcut.WorkingDirectory = $backendDir
$shortcut.Description = "TradeHub Backend API Server"
$shortcut.WindowStyle = 7  # Minimized
$shortcut.Save()
Write-Host "      Startup shortcut created: $shortcutPath" -ForegroundColor Green
Write-Host "      Backend will auto-start on login (minimized)." -ForegroundColor Green

# 4. Firewall note
Write-Host "`n[4/4] Firewall..." -ForegroundColor Yellow
Write-Host "      NOTE: Firewall rules require admin privileges." -ForegroundColor Yellow
Write-Host "      If you need remote access, ask an admin to open ports 8000 and 3306." -ForegroundColor Yellow
Write-Host "      For local-only use, no firewall changes are needed." -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " MySQL: Checked (must be running via installer)" -ForegroundColor White
Write-Host " Backend: Auto-starts on login (Startup shortcut)" -ForegroundColor White
Write-Host " Launcher: .\start-backend.bat" -ForegroundColor White
Write-Host ""
Write-Host " To start now:  .\start-backend.bat" -ForegroundColor Yellow
Write-Host " To remove auto-start: delete shortcut from:" -ForegroundColor Yellow
Write-Host "   $startupFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
