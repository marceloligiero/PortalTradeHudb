# =============================================================================
# deploy.ps1 — Deploy manual com backup automático
# Uso: .\scripts\deploy.ps1 [-SkipBackup]
# =============================================================================

param(
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir

Push-Location $RootDir

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Portal TradeHub — Deploy Manual" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Diretório: $RootDir"
Write-Host "  Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Backup da base de dados ───────────────────────────────────────────────
if (-not $SkipBackup) {
    Write-Host "[1/5] Backup da base de dados..." -ForegroundColor Yellow
    $backupDir = Join-Path $RootDir "backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = Join-Path $backupDir "pre-deploy-$timestamp.sql"

    $dbRunning = docker inspect --format='{{.State.Running}}' tradehub-db 2>$null
    if ($dbRunning -eq "true") {
        docker exec tradehub-db mysqldump -uroot -p"$env:MYSQL_ROOT_PASSWORD" tradehub_db 2>$null | Out-File -Encoding utf8 $backupFile
        $size = (Get-Item $backupFile).Length / 1KB
        Write-Host "  ✅ Backup: $backupFile ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DB não está a correr. Backup ignorado." -ForegroundColor Yellow
    }

    # Manter apenas os últimos 10 backups
    Get-ChildItem $backupDir -Filter "pre-deploy-*.sql" | Sort-Object CreationTime -Descending | Select-Object -Skip 10 | Remove-Item -Force
} else {
    Write-Host "[1/5] Backup ignorado (--SkipBackup)" -ForegroundColor Gray
}

# ── 2. Pull do código ────────────────────────────────────────────────────────
Write-Host "[2/5] Pull do código..." -ForegroundColor Yellow
git pull origin main 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  ✅ Código atualizado" -ForegroundColor Green

# ── 3. Build das imagens ─────────────────────────────────────────────────────
Write-Host "[3/5] Build das imagens Docker..." -ForegroundColor Yellow
docker compose -f docker-compose.yml build --no-cache 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  ✅ Build concluído" -ForegroundColor Green

# ── 4. Restart dos containers ────────────────────────────────────────────────
Write-Host "[4/5] Reiniciando containers..." -ForegroundColor Yellow
docker compose -f docker-compose.yml up -d 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "  ✅ Containers reiniciados" -ForegroundColor Green

# ── 5. Health check ──────────────────────────────────────────────────────────
Write-Host "[5/5] Verificando saúde dos serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

$backendHealth = docker inspect --format='{{.State.Health.Status}}' tradehub-backend 2>$null
$frontendRunning = docker inspect --format='{{.State.Running}}' tradehub-frontend 2>$null
$dbHealth = docker inspect --format='{{.State.Health.Status}}' tradehub-db 2>$null

$allGood = $true
foreach ($svc in @(
    @{Name="Database"; Status=$dbHealth; Expected="healthy"},
    @{Name="Backend"; Status=$backendHealth; Expected="healthy"},
    @{Name="Frontend"; Status=$frontendRunning; Expected="true"}
)) {
    if ($svc.Status -eq $svc.Expected) {
        Write-Host "  ✅ $($svc.Name): $($svc.Status)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($svc.Name): $($svc.Status)" -ForegroundColor Red
        $allGood = $false
    }
}

# ── Limpeza ──────────────────────────────────────────────────────────────────
docker image prune -f 2>$null | Out-Null

Write-Host ""
if ($allGood) {
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ⚠️  Deploy com problemas! Verifique os logs:" -ForegroundColor Red
    Write-Host "     docker compose logs --tail 50" -ForegroundColor Yellow
    Write-Host "     Para rollback: .\scripts\rollback.ps1" -ForegroundColor Yellow
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Red
}

Pop-Location
