# =============================================================================
# start-nodocker.ps1 -- Iniciar o sistema (sem Docker, sem Admin)
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

$BackendPort = $config["BACKEND_PORT"]
$VenvPath    = $config["VENV_PATH"]
$logsDir     = Join-Path $Root "logs"
$pidFile     = Join-Path $logsDir "pids.txt"

if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory $logsDir -Force | Out-Null }

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  PortalTradeHub -- Iniciando..." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Verificar se ja esta rodando
if (Test-Path $pidFile) {
    $oldPidRaw = Get-Content $pidFile -Raw -ErrorAction SilentlyContinue
    $oldPid    = if ($oldPidRaw) { $oldPidRaw.Trim() } else { "" }
    if ($oldPid) {
        $proc = Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Warn "Sistema ja esta rodando (PID $oldPid). Use stop-nodocker.ps1 primeiro."
            exit 1
        }
    }
    Remove-Item $pidFile -Force
}

# Iniciar uvicorn via python -m (mais fiavel que uvicorn.exe directo)
$python     = Join-Path $VenvPath "Scripts\python.exe"
$backendDir = Join-Path $Root "backend"

if (-not (Test-Path $python)) {
    Write-Fail "Python do venv nao encontrado em '$python'. Execute install-nodocker.ps1 primeiro."
}

# Verificar se uvicorn esta instalado
$uvicornCheck = & $python -c "import uvicorn; print('ok')" 2>&1
if ($uvicornCheck -ne 'ok') {
    Write-Fail "uvicorn nao esta instalado no venv. Execute install-nodocker.ps1 novamente."
}

Write-Host "`n  Iniciando uvicorn na porta $BackendPort..." -ForegroundColor Gray
Write-Host "  (API + Frontend servidos na mesma porta)" -ForegroundColor Gray

$proc = Start-Process -FilePath $python `
    -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port $BackendPort --workers 2" `
    -WorkingDirectory $backendDir `
    -RedirectStandardOutput (Join-Path $logsDir "backend-output.log") `
    -RedirectStandardError (Join-Path $logsDir "backend-error.log") `
    -NoNewWindow -PassThru

Start-Sleep -Seconds 3

if (-not $proc.HasExited) {
    Write-OK "Sistema iniciado (PID: $($proc.Id))"
    $proc.Id | Set-Content $pidFile -Encoding UTF8
} else {
    Write-Fail "Falhou ao iniciar. Verifique logs\backend-error.log"
}

# Health check
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-OK "API: healthy"
} catch {
    Write-Warn "API ainda a iniciar (pode demorar alguns segundos)"
}

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($resp.Content -match "index\.html|TradeHub|<div id") {
        Write-OK "Frontend: healthy"
    }
} catch {
    Write-Warn "Frontend ainda a carregar"
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Sistema disponivel em: http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Para parar: .\scripts\stop-nodocker.ps1" -ForegroundColor Cyan
Write-Host "  Logs: Get-Content logs\backend-error.log -Wait" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
