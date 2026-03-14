# =============================================================================
# rollback.ps1 — Rollback rápido para o commit anterior
# Uso: .\scripts\rollback.ps1 [-Commit <sha>]
# =============================================================================

param(
    [string]$Commit = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir

Push-Location $RootDir

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Portal TradeHub — Rollback" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# ── Determinar commit alvo ───────────────────────────────────────────────────
if (-not $Commit) {
    $Commit = git rev-parse HEAD~1 2>$null
    if (-not $Commit) {
        Write-Host "❌ Não foi possível determinar o commit anterior." -ForegroundColor Red
        exit 1
    }
}

$currentCommit = git rev-parse --short HEAD
$targetShort = $Commit.Substring(0, [Math]::Min(7, $Commit.Length))

Write-Host "  Atual : $currentCommit"
Write-Host "  Alvo  : $targetShort"
Write-Host ""

$confirm = Read-Host "Confirmar rollback para $targetShort? [s/N]"
if ($confirm -notmatch "^[sS]$") {
    Write-Host "Cancelado." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# ── 1. Checkout para o commit anterior ───────────────────────────────────────
Write-Host ""
Write-Host "[1/3] Revertendo código..." -ForegroundColor Yellow
git checkout $Commit -- . 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  ✅ Código revertido para $targetShort" -ForegroundColor Green

# ── 2. Rebuild e restart ─────────────────────────────────────────────────────
Write-Host "[2/3] Rebuild das imagens..." -ForegroundColor Yellow
docker compose -f docker-compose.yml build --no-cache 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
docker compose -f docker-compose.yml up -d 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  ✅ Containers reiniciados" -ForegroundColor Green

# ── 3. Verificação ───────────────────────────────────────────────────────────
Write-Host "[3/3] Verificando..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

$backendHealth = docker inspect --format='{{.State.Health.Status}}' tradehub-backend 2>$null

if ($backendHealth -eq "healthy") {
    Write-Host ""
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ Rollback concluído com sucesso!" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  ⚠️  Backend: $backendHealth — verifique os logs" -ForegroundColor Yellow
}

# ── Restaurar backup DB (opcional) ───────────────────────────────────────────
$backupDir = Join-Path $RootDir "backups"
$latestBackup = Get-ChildItem $backupDir -Filter "pre-deploy-*.sql" -ErrorAction SilentlyContinue | Sort-Object CreationTime -Descending | Select-Object -First 1

if ($latestBackup) {
    Write-Host ""
    Write-Host "  📦 Backup disponível: $($latestBackup.Name)" -ForegroundColor Cyan
    $restoreConfirm = Read-Host "  Restaurar backup da base de dados? [s/N]"
    if ($restoreConfirm -match "^[sS]$") {
        Write-Host "  Restaurando..." -ForegroundColor Yellow
        Get-Content $latestBackup.FullName | docker exec -i tradehub-db mysql -uroot -p"$env:MYSQL_ROOT_PASSWORD" tradehub_db 2>$null
        Write-Host "  ✅ Base de dados restaurada" -ForegroundColor Green
    }
}

Pop-Location
