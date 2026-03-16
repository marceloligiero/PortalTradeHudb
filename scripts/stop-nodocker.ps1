# =============================================================================
# stop-nodocker.ps1 -- Parar backend + nginx
# Uso:  .\scripts\stop-nodocker.ps1
# =============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

function Write-OK($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  !!  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  PortalTradeHub -- Parando servicos..." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$pidFile = Join-Path $Root "logs\pids.txt"
$stopped = $false

# Parar pelo PID registado
if (Test-Path $pidFile) {
    Get-Content $pidFile | ForEach-Object {
        if ($_ -match "^(\w+)=(\d+)$") {
            $name = $Matches[1]
            $pid  = [int]$Matches[2]
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                # Para nginx, parar toda a arvore de processos
                if ($name -eq "nginx") {
                    Get-Process -Name "nginx" -ErrorAction SilentlyContinue | Stop-Process -Force
                } else {
                    Stop-Process -Id $pid -Force
                }
                Write-OK "$name (PID $pid) parado"
                $stopped = $true
            } else {
                Write-Warn "$name (PID $pid) ja nao existe"
            }
        }
    }
    Remove-Item $pidFile -Force
}

# Fallback: parar qualquer processo uvicorn/nginx restante do projeto
$uvicornProcs = Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue
if ($uvicornProcs) {
    $uvicornProcs | Stop-Process -Force
    Write-OK "Processos uvicorn restantes parados"
    $stopped = $true
}

# Limpar PID file do nginx
$nginxPidFile = Join-Path $Root "logs\nginx.pid"
if (Test-Path $nginxPidFile) { Remove-Item $nginxPidFile -Force }

if (-not $stopped) {
    Write-Warn "Nenhum servico encontrado para parar"
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Servicos parados." -ForegroundColor Green
Write-Host "  Para iniciar: .\scripts\start-nodocker.ps1" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
