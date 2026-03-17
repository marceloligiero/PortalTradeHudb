# =============================================================================
# deploy-nodocker.ps1 -- Atualizar e redesploiar (sem Docker, sem Admin)
# Uso:  .\scripts\deploy-nodocker.ps1 [-SkipBackup] [-SkipPull]
# Pre-requisito: install-nodocker.ps1 ja executado uma vez
# =============================================================================

param(
    [switch]$SkipBackup,
    [switch]$SkipPull
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK($msg)        { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg)      { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)      { Write-Host "  XX  $msg" -ForegroundColor Red; exit 1 }

# Ler configuracao
$configFile = Join-Path $Root ".nodocker-config"
if (-not (Test-Path $configFile)) {
    Write-Fail "Configuracao nao encontrada. Execute install-nodocker.ps1 primeiro."
}

$config = @{}
Get-Content $configFile | ForEach-Object {
    if ($_ -match "^(.+?)=(.+)$") { $config[$Matches[1]] = $Matches[2] }
}

$VenvPath = $config["VENV_PATH"]

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  PortalTradeHub -- Deploy"                              -ForegroundColor Cyan
Write-Host "  Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"      -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# -- 1. Backup da base de dados ----------------------------------------------
Write-Step "1/4" "Backup da base de dados..."

if (-not $SkipBackup) {
    $backupDir = Join-Path $Root "backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory $backupDir -Force | Out-Null }

    $envFile = Join-Path $Root "backend\.env"
    $dbUser = "root"; $dbPass = ""; $dbName = "tradehub_db"; $dbHost = "localhost"; $dbPort = "3306"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^DATABASE_URL=.*://([^:]+):([^@]*)@([^:]+):(\d+)/(.+)") {
                $dbUser = $Matches[1].Trim()
                $dbPass = $Matches[2].Trim()
                $dbHost = $Matches[3].Trim()
                $dbPort = $Matches[4].Trim()
                $dbName = $Matches[5].Trim() -replace "\?.*$", ""
            }
        }
    }

    $timestamp  = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = Join-Path $backupDir "pre-deploy-$timestamp.sql"

    try {
        $env:MYSQL_PWD = $dbPass
        mysqldump -h $dbHost -P $dbPort -u $dbUser $dbName 2>$null | Out-File -Encoding utf8 $backupFile
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
        $size = [math]::Round((Get-Item $backupFile).Length / 1KB, 1)
        Write-OK "Backup: $backupFile ($size KB)"
    } catch {
        Write-Warn "Falha no backup: $_. Continuando..."
    }

    Get-ChildItem $backupDir -Filter "pre-deploy-*.sql" |
        Sort-Object CreationTime -Descending |
        Select-Object -Skip 10 |
        Remove-Item -Force
} else {
    Write-OK "Backup ignorado (-SkipBackup)"
}

# -- 2. Pull do codigo -------------------------------------------------------
Write-Step "2/4" "Atualizando codigo..."

if (-not $SkipPull) {
    Push-Location $Root
    git pull origin main 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Pop-Location
    Write-OK "Codigo atualizado"
} else {
    Write-OK "Pull ignorado (-SkipPull)"
}

# -- 3. Atualizar dependencias + build frontend ------------------------------
Write-Step "3/4" "Atualizando dependencias e compilando frontend..."

$pip = Join-Path $VenvPath "Scripts\pip.exe"
if (-not (Test-Path $pip)) { Write-Fail "venv nao encontrado. Execute install-nodocker.ps1 primeiro." }

$pipSSL = @("--trusted-host", "pypi.org", "--trusted-host", "pypi.python.org", "--trusted-host", "files.pythonhosted.org")
& $pip install -r (Join-Path $Root "backend\requirements.txt") @pipSSL
if ($LASTEXITCODE -ne 0) { Write-Fail "pip install falhou (codigo $LASTEXITCODE)." }
Write-OK "Dependencias Python atualizadas"

$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
Push-Location (Join-Path $Root "frontend")
npm ci
if ($LASTEXITCODE -ne 0) { $env:NODE_TLS_REJECT_UNAUTHORIZED = "1"; Pop-Location; Write-Fail "npm ci falhou (codigo $LASTEXITCODE)." }
npm run build
if ($LASTEXITCODE -ne 0) { $env:NODE_TLS_REJECT_UNAUTHORIZED = "1"; Pop-Location; Write-Fail "npm run build falhou (codigo $LASTEXITCODE)." }
Pop-Location
$env:NODE_TLS_REJECT_UNAUTHORIZED = "1"
Write-OK "Frontend recompilado"

# -- 4. Reiniciar ------------------------------------------------------------
Write-Step "4/4" "Reiniciando..."

& (Join-Path $ScriptDir "stop-nodocker.ps1")
Start-Sleep -Seconds 1
& (Join-Path $ScriptDir "start-nodocker.ps1")

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Deploy concluido!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
