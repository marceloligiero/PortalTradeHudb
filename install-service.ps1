# ========================================
# TradeHub - Windows Service Installation
# Run as Administrator!
# ========================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TradeHub - Service Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Configure MySQL for auto-start
Write-Host "`n[1/3] Configuring MySQL for auto-start..." -ForegroundColor Yellow

# Check if wampmysqld64 service exists and reconfigure
$mysqlSvc = Get-Service -Name "wampmysqld64" -ErrorAction SilentlyContinue
if ($mysqlSvc) {
    Set-Service -Name "wampmysqld64" -StartupType Automatic
    Write-Host "      MySQL service 'wampmysqld64' set to Automatic start." -ForegroundColor Green
} else {
    # Create MySQL service
    $mysqlBin = "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysqld.exe"
    $mysqlIni = "C:\wamp64\bin\mysql\mysql9.1.0\my.ini"
    & $mysqlBin --install TradeHubMySQL --defaults-file="$mysqlIni"
    Set-Service -Name "TradeHubMySQL" -StartupType Automatic
    Write-Host "      MySQL service 'TradeHubMySQL' created and set to Automatic." -ForegroundColor Green
}

# 2. Create Windows Task for TradeHub Backend auto-start
Write-Host "`n[2/3] Creating scheduled task for TradeHub Backend..." -ForegroundColor Yellow

$taskName = "TradeHub-Backend"
$backendDir = "C:\PortalFormações\PortalTradeHudb\backend"
$pythonExe = "$backendDir\venv\Scripts\python.exe"
$arguments = "-m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute $pythonExe -Argument $arguments -WorkingDirectory $backendDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Days 9999) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "TradeHub Backend API Server" | Out-Null
Write-Host "      Scheduled task '$taskName' created for auto-start." -ForegroundColor Green

# 3. Configure Windows Firewall
Write-Host "`n[3/3] Configuring Windows Firewall..." -ForegroundColor Yellow

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
