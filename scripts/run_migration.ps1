# =============================================================================
# run_migration.ps1 — Executa migration_new_modules.sql usando o .env do backend
# Uso: .\scripts\run_migration.ps1 [-EnvFile "C:\caminho\para\.env"]
#
# Exemplos:
#   .\scripts\run_migration.ps1
#   .\scripts\run_migration.ps1 -EnvFile "C:\tradehub\backend\.env"
# =============================================================================

param(
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"

# ── Localizar ficheiros ───────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir     = Split-Path -Parent $ScriptDir
$Migration   = Join-Path $RootDir "database\migration_new_modules.sql"

if (-not $EnvFile) {
    $EnvFile = Join-Path $RootDir "backend\.env"
}

if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Ficheiro .env não encontrado: $EnvFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $Migration)) {
    Write-Host "❌ Script de migração não encontrado: $Migration" -ForegroundColor Red
    exit 1
}

# ── Ler DATABASE_URL do .env ──────────────────────────────────────────────────
$DatabaseUrl = ""
foreach ($line in Get-Content $EnvFile) {
    if ($line -match "^DATABASE_URL=(.+)$") {
        $DatabaseUrl = $matches[1].Trim()
        break
    }
}

if (-not $DatabaseUrl) {
    Write-Host "❌ DATABASE_URL não encontrado em $EnvFile" -ForegroundColor Red
    exit 1
}

# ── Parse da URL: mysql+pymysql://user:pass@host:port/dbname ─────────────────
$url = $DatabaseUrl -replace "^[^:]+://", ""   # remove prefixo driver

$credHost  = $url -split "@"
$credentials = $credHost[0]
$hostDb      = $credHost[1]

# Utilizador e password
if ($credentials -match "^([^:]+):(.*)$") {
    $DbUser = $matches[1]
    $DbPass = $matches[2]
} else {
    $DbUser = $credentials
    $DbPass = ""
}

# Host, porta e nome da base de dados
$hostPart = ($hostDb -split "/")[0]
$DbName   = ($hostDb -split "/")[1] -replace "\?.*$", ""   # remove query string

if ($hostPart -match "^(.+):(\d+)$") {
    $DbHost = $matches[1]
    $DbPort = $matches[2]
} else {
    $DbHost = $hostPart
    $DbPort = "3306"
}

# ── Resumo ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Portal TradeHub — Migração de produção"    -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Host      : $DbHost`:$DbPort"
Write-Host "  Utilizador: $DbUser"
Write-Host "  Base dados: $DbName"
Write-Host "  Script    : $Migration"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Confirmar execução? [s/N]"
if ($confirm -notmatch "^[sS]$") {
    Write-Host "Cancelado." -ForegroundColor Yellow
    exit 0
}

# ── Localizar mysql.exe ───────────────────────────────────────────────────────
$mysqlExe = Get-Command mysql -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $mysqlExe) {
    # Tentativas de localização comuns no Windows
    $candidates = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\wamp64\bin\mysql\mysql8.0\bin\mysql.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $mysqlExe = $c; break }
    }
}

if (-not $mysqlExe) {
    Write-Host "❌ mysql.exe não encontrado. Certifica-te que o MySQL está instalado e no PATH." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "A executar migração..." -ForegroundColor Yellow

# ── Executar migração ─────────────────────────────────────────────────────────
$mysqlArgs = @("-u", $DbUser, "-h", $DbHost, "-P", $DbPort, $DbName)
if ($DbPass) {
    $mysqlArgs += "-p$DbPass"
}

Get-Content $Migration | & $mysqlExe @mysqlArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migração concluída com sucesso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro durante a migração (exit code $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}
