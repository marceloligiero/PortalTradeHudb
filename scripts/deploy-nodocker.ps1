# =============================================================================
# deploy-nodocker.ps1 — Atualizar e redesploiar (sem Docker)
# Uso:  .\scripts\deploy-nodocker.ps1 [-SkipBackup] [-SkipPull]
# Pré-requisito: install-nodocker.ps1 já executado uma vez
# =============================================================================

param(
    [switch]$SkipBackup,
    [switch]$SkipPull,
    [string]$NginxPath   = "C:\nginx",
    [string]$NssmExe     = "nssm",
    [string]$BackendPort = "8000"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK($msg)        { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg)      { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)      { Write-Host "  XX  $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PortalTradeHub — Deploy Nativo Windows"               -ForegroundColor Cyan
Write-Host "  Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"      -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan

# ── 1. Backup da base de dados ───────────────────────────────────────────────
Write-Step "1/5" "Backup da base de dados..."

if (-not $SkipBackup) {
    $backupDir = Join-Path $Root "backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory $backupDir -Force | Out-Null }

    # Ler credenciais do .env
    $envFile = Join-Path $Root "backend\.env"
    $dbUser = "root"; $dbPass = ""; $dbName = "tradehub_db"; $dbHost = "localhost"; $dbPort = "3306"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^DB_USER=(.+)")     { $dbUser  = $Matches[1].Trim() }
            if ($_ -match "^DB_PASSWORD=(.+)") { $dbPass  = $Matches[1].Trim() }
            if ($_ -match "^DB_NAME=(.+)")     { $dbName  = $Matches[1].Trim() }
            if ($_ -match "^DB_HOST=(.+)")     { $dbHost  = $Matches[1].Trim() }
            if ($_ -match "^DB_PORT=(.+)")     { $dbPort  = $Matches[1].Trim() }
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

    # Manter apenas os últimos 10 backups
    Get-ChildItem $backupDir -Filter "pre-deploy-*.sql" |
        Sort-Object CreationTime -Descending |
        Select-Object -Skip 10 |
        Remove-Item -Force
} else {
    Write-OK "Backup ignorado (--SkipBackup)"
}

# ── 2. Pull do código ────────────────────────────────────────────────────────
Write-Step "2/5" "Atualizando código..."

if (-not $SkipPull) {
    Push-Location $Root
    git pull origin main 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Pop-Location
    Write-OK "Código atualizado"
} else {
    Write-OK "Pull ignorado (--SkipPull)"
}

# ── 3. Atualizar dependencias + build frontend ───────────────────────────────
Write-Step "3/5" "Atualizando dependencias e compilando frontend..."

# Python deps (só instala se requirements mudou)
$pip = Join-Path $Root "backend\.venv\Scripts\pip.exe"
if (-not (Test-Path $pip)) { Write-Fail "venv nao encontrado. Execute install-nodocker.ps1 primeiro." }

& $pip install -r (Join-Path $Root "backend\requirements.txt") --quiet
Write-OK "Dependencias Python atualizadas"

# Frontend build
Push-Location (Join-Path $Root "frontend")
npm ci --silent
npm run build
Pop-Location
Write-OK "Frontend recompilado"

# Regenerar nginx.conf com caminhos actuais
$distPath = (Join-Path $Root "frontend\dist").Replace("\", "/")
$nginxConf = @"
server {
    listen 80;
    server_name _;
    charset utf-8;

    root "$distPath";
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:$BackendPort/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade `$http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host `$host;
        proxy_set_header   X-Real-IP `$remote_addr;
        proxy_set_header   X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto `$scheme;
        proxy_read_timeout 300s;
        proxy_cache_bypass `$http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|webm)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript;

    add_header X-Frame-Options        "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
"@
$nginxConf | Set-Content "$NginxPath\conf\conf.d\tradehub.conf" -Encoding UTF8

# ── 4. Reiniciar serviços ─────────────────────────────────────────────────────
Write-Step "4/5" "Reiniciando servisos..."

# Backend
Write-Host "  Reiniciando tradehub-backend..." -ForegroundColor Gray
& $NssmExe restart tradehub-backend 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Nginx reload (sem downtime)
Write-Host "  Recarregando Nginx..." -ForegroundColor Gray
& "$NginxPath\nginx.exe" -p $NginxPath -s reload
Start-Sleep -Seconds 1
Write-OK "Serviços reiniciados"

# ── 5. Health check ───────────────────────────────────────────────────────────
Write-Step "5/5" "Verificando saúde..."

Start-Sleep -Seconds 5

$allGood = $true

# Backend health
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { Write-OK "Backend: healthy" }
    else { Write-Warn "Backend: HTTP $($resp.StatusCode)"; $allGood = $false }
} catch {
    # Tenta /docs se /health nao existe
    try {
        $resp2 = Invoke-WebRequest -Uri "http://localhost:$BackendPort/docs" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-OK "Backend: respondendo (HTTP $($resp2.StatusCode))"
    } catch {
        Write-Warn "Backend: nao responde — verifique logs\backend-stderr.log"
        $allGood = $false
    }
}

# Frontend health
try {
    $resp = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { Write-OK "Frontend: healthy" }
    else { Write-Warn "Frontend: HTTP $($resp.StatusCode)"; $allGood = $false }
} catch {
    Write-Warn "Frontend: nao responde — verifique logs\nginx-stderr.log"
    $allGood = $false
}

Write-Host ""
if ($allGood) {
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  Deploy concluido com sucesso!" -ForegroundColor Green
    Write-Host "  http://localhost" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  Deploy com avisos — verifique:" -ForegroundColor Yellow
    Write-Host "    logs\backend-stderr.log" -ForegroundColor Yellow
    Write-Host "    logs\nginx-stderr.log" -ForegroundColor Yellow
    Write-Host "  Logs em tempo real:" -ForegroundColor Yellow
    Write-Host "    Get-Content logs\backend-stderr.log -Wait" -ForegroundColor Yellow
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Red
}
