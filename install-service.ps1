# ========================================
# TradeHub - Windows Service Installation
# Run as Administrator!
# ========================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TradeHub - Service Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Configure MySQL for auto-start
Write-Host "`n[1/4] Configuring MySQL for auto-start..." -ForegroundColor Yellow

# Detect MySQL service (standard installer registers as MySQL80, MySQL81, MySQL90, etc.)
$mysqlSvc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mysqlSvc) {
    Set-Service -Name $mysqlSvc.Name -StartupType Automatic
    if ($mysqlSvc.Status -ne 'Running') {
        Start-Service -Name $mysqlSvc.Name
        Write-Host "      MySQL service '$($mysqlSvc.Name)' started and set to Automatic." -ForegroundColor Green
    } else {
        Write-Host "      MySQL service '$($mysqlSvc.Name)' already running, set to Automatic start." -ForegroundColor Green
    }
} else {
    # Try to find MySQL in default install location and register as service
    $mysqlBase = Get-ChildItem "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue | 
                 Where-Object { $_.Name -like "MySQL Server*" } | 
                 Sort-Object Name -Descending | Select-Object -First 1
    if ($mysqlBase) {
        $mysqlBin = Join-Path $mysqlBase.FullName "bin\mysqld.exe"
        $mysqlIni = Join-Path $mysqlBase.FullName "my.ini"
        # Fallback: my.ini may be in ProgramData
        if (-not (Test-Path $mysqlIni)) {
            $mysqlIni = "C:\ProgramData\MySQL\$($mysqlBase.Name)\my.ini"
        }
        if (Test-Path $mysqlBin) {
            & $mysqlBin --install TradeHubMySQL --defaults-file="$mysqlIni"
            Set-Service -Name "TradeHubMySQL" -StartupType Automatic
            Start-Service -Name "TradeHubMySQL"
            Write-Host "      MySQL service 'TradeHubMySQL' created, started and set to Automatic." -ForegroundColor Green
        } else {
            Write-Host "      ERROR: mysqld.exe not found at $mysqlBin" -ForegroundColor Red
            Write-Host "      Please install MySQL or adjust the path manually." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "      ERROR: MySQL not found in 'C:\Program Files\MySQL\'" -ForegroundColor Red
        Write-Host "      Please install MySQL Server first." -ForegroundColor Red
        exit 1
    }
}

# 2. Ensure mysql CLI is in PATH
Write-Host "`n[2/4] Checking MySQL CLI in PATH..." -ForegroundColor Yellow

$mysqlCli = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCli) {
    $mysqlBinDir = Get-ChildItem "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue |
                   Where-Object { $_.Name -like "MySQL Server*" } |
                   Sort-Object Name -Descending | Select-Object -First 1
    if ($mysqlBinDir) {
        $binPath = Join-Path $mysqlBinDir.FullName "bin"
        [System.Environment]::SetEnvironmentVariable("Path", "$env:Path;$binPath", [System.EnvironmentVariableTarget]::Machine)
        $env:Path += ";$binPath"
        Write-Host "      Added '$binPath' to system PATH." -ForegroundColor Green
    } else {
        Write-Host "      WARNING: Could not find MySQL bin directory to add to PATH." -ForegroundColor Yellow
    }
} else {
    Write-Host "      mysql CLI already available in PATH." -ForegroundColor Green
}

# 3. Create Windows Task for TradeHub Backend auto-start
Write-Host "`n[3/4] Creating scheduled task for TradeHub Backend..." -ForegroundColor Yellow

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$taskName = "TradeHub-Backend"
$backendDir = Join-Path $scriptRoot "backend"
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
$arguments = "-m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute $pythonExe -Argument $arguments -WorkingDirectory $backendDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Days 9999) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "TradeHub Backend API Server" | Out-Null
Write-Host "      Scheduled task '$taskName' created for auto-start." -ForegroundColor Green

# 4. Configure Windows Firewall
Write-Host "`n[4/4] Configuring Windows Firewall..." -ForegroundColor Yellow

# Allow port 8000 inbound
$rule = Get-NetFirewallRule -DisplayName "TradeHub Application" -ErrorAction SilentlyContinue
if (-not $rule) {
    New-NetFirewallRule -DisplayName "TradeHub Application" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Any | Out-Null
    Write-Host "      Firewall rule created for port 8000." -ForegroundColor Green
} else {
    Write-Host "      Firewall rule for port 8000 already exists." -ForegroundColor Green
}

# Allow port 3306 inbound (MySQL - only local by default)
$rule2 = Get-NetFirewallRule -DisplayName "TradeHub MySQL" -ErrorAction SilentlyContinue
if (-not $rule2) {
    New-NetFirewallRule -DisplayName "TradeHub MySQL" -Direction Inbound -Protocol TCP -LocalPort 3306 -Action Allow -Profile Private | Out-Null
    Write-Host "      Firewall rule created for MySQL port 3306 (Private network only)." -ForegroundColor Green
} else {
    Write-Host "      Firewall rule for MySQL already exists." -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " MySQL: Auto-starts on boot (Windows Service)" -ForegroundColor White
Write-Host " Backend: Auto-starts on boot (Scheduled Task)" -ForegroundColor White
Write-Host " Firewall: Port 8000 open for all networks" -ForegroundColor White
Write-Host ""
Write-Host " To start now: .\start-production.bat" -ForegroundColor Yellow
Write-Host " To stop: .\stop-production.bat" -ForegroundColor Yellow
Write-Host ""
