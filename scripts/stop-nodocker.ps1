# =============================================================================
# stop-nodocker.ps1 -- Parar o sistema
# Uso:  .\scripts\stop-nodocker.ps1
# =============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

function Write-OK($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  !!  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  PortalTradeHub -- Parando..." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$pidFile = Join-Path $Root "logs\pids.txt"
$stopped = $false

if (Test-Path $pidFile) {
    $pid = (Get-Content $pidFile).Trim()
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $pid -Force
        Write-OK "Processo (PID $pid) parado"
        $stopped = $true
    } else {
        Write-Warn "Processo (PID $pid) ja nao existe"
    }
    Remove-Item $pidFile -Force
}

# Fallback: parar qualquer uvicorn restante
$uvicornProcs = Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue
if ($uvicornProcs) {
    $uvicornProcs | Stop-Process -Force
    Write-OK "Processos uvicorn restantes parados"
    $stopped = $true
}

if (-not $stopped) {
    Write-Warn "Nenhum processo encontrado para parar"
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Sistema parado." -ForegroundColor Green
Write-Host "  Para iniciar: .\scripts\start-nodocker.ps1" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
