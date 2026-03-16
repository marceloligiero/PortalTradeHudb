# =============================================================================
# start-nodocker.ps1 -- Iniciar backend + nginx (sem Docker, sem Admin)
# Uso:  .\scripts\start-nodocker.ps1
# =============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

function Write-OK($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  XX  $msg" -ForegroundColor Red; exit 1 }

# Ler configuracao
$configFile = Join-Path $Root ".nodocker-config"
if (-not (Test-Path $configFile)) {
    Write-Fail "Configuracao nao encontrada. Execute install-nodocker.ps1 primeiro."
}

$config = @{}
Get-Content $configFile | ForEach-Object {
    if ($_ -match "^(.+?)=(.+)$") { $config[$Matches[1]] = $Matches[2] }
}

$NginxPath   = $config["NGINX_PATH"]
$NginxConf   = $config["NGINX_CONF"]
$BackendPort = $config["BACKEND_PORT"]
$FrontendPort = $config["FRONTEND_PORT"]
$VenvPath    = $config["VENV_PATH"]
$logsDir     = Join-Path $Root "logs"
$pidFile     = Join-Path $Root "logs\pids.txt"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  PortalTradeHub -- Iniciando..." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Verificar se ja esta rodando
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    $running = $false
    foreach ($line in $pids) {
        if ($line -match "^(\w+)=(\d+)$") {
            $proc = Get-Process -Id $Matches[2] -ErrorAction SilentlyContinue
            if ($proc) { $running = $true }
        }
    }
    if ($running) {
        Write-Warn "Servicos ja parecem estar rodando. Use stop-nodocker.ps1 primeiro."
        Write-Warn "Ou apague $pidFile se os processos nao existem mais."
        exit 1
    } else {
        Remove-Item $pidFile -Force
    }
}

# Iniciar backend (uvicorn)
Write-Host "`n  Iniciando backend (uvicorn porta $BackendPort)..." -ForegroundColor Gray
$uvicorn = Join-Path $VenvPath "Scripts\uvicorn.exe"
$backendDir = Join-Path $Root "backend"
$backendLog = Join-Path $logsDir "backend-output.log"

$backendProc = Start-Process -FilePath $uvicorn `
    -ArgumentList "main:app --host 127.0.0.1 --port $BackendPort --workers 2" `
    -WorkingDirectory $backendDir `
    -RedirectStandardOutput $backendLog `
    -RedirectStandardError (Join-Path $logsDir "backend-error.log") `
    -NoNewWindow -PassThru

Start-Sleep -Seconds 2

if (-not $backendProc.HasExited) {
    Write-OK "Backend iniciado (PID: $($backendProc.Id))"
} else {
    Write-Fail "Backend falhou ao iniciar. Verifique logs\backend-error.log"
}

# Iniciar nginx
Write-Host "  Iniciando Nginx (porta $FrontendPort)..." -ForegroundColor Gray

$nginxProc = Start-Process -FilePath "$NginxPath\nginx.exe" `
    -ArgumentList "-c `"$NginxConf`"" `
    -WorkingDirectory $NginxPath `
    -NoNewWindow -PassThru

Start-Sleep -Seconds 1

# Nginx faz fork, pegar PID do master pelo pidfile
$nginxPidFile = Join-Path $logsDir "nginx.pid"
$nginxPid = $nginxProc.Id
if (Test-Path $nginxPidFile) {
    $nginxPid = (Get-Content $nginxPidFile).Trim()
}

$nginxRunning = Get-Process -Id $nginxPid -ErrorAction SilentlyContinue
if ($nginxRunning) {
    Write-OK "Nginx iniciado (PID: $nginxPid)"
} else {
    Write-Warn "Nginx pode nao ter iniciado. Verifique logs\nginx-error.log"
}

# Guardar PIDs
@"
backend=$($backendProc.Id)
nginx=$nginxPid
"@ | Set-Content $pidFile -Encoding UTF8

# Health check
Write-Host "`n  Verificando..." -ForegroundColor Gray
Start-Sleep -Seconds 3

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-OK "Backend: healthy"
} catch {
    try {
        Invoke-WebRequest -Uri "http://localhost:$BackendPort/docs" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-OK "Backend: respondendo"
    } catch {
        Write-Warn "Backend: nao responde ainda (pode demorar a iniciar)"
    }
}

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$FrontendPort" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-OK "Frontend: healthy"
} catch {
    Write-Warn "Frontend: nao responde"
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Servicos iniciados!" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:$BackendPort/api" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Para parar: .\scripts\stop-nodocker.ps1" -ForegroundColor Cyan
Write-Host "  Logs: Get-Content logs\backend-error.log -Wait" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
