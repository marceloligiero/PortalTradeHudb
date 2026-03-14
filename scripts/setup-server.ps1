# =============================================================================
# setup-server.ps1 — Setup inicial do servidor Windows para Portal TradeHub
# Uso: .\scripts\setup-server.ps1
# =============================================================================

param(
    [string]$AppPath = "C:\opt\tradehub"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Portal TradeHub — Setup do Servidor"         -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verificar Docker ──────────────────────────────────────────────────────
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "  ❌ Docker não encontrado. Instale o Docker Desktop ou Docker Engine." -ForegroundColor Red
    Write-Host "  📥 https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Gray
    exit 1
}
$dockerVersion = docker --version
Write-Host "  ✅ Docker: $dockerVersion" -ForegroundColor Green

# ── 2. Verificar Docker Compose ──────────────────────────────────────────────
Write-Host "[2/5] Verificando Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>&1
    Write-Host "  ✅ Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker Compose não encontrado." -ForegroundColor Red
    exit 1
}

# ── 3. Verificar Git ─────────────────────────────────────────────────────────
Write-Host "[3/5] Verificando Git..." -ForegroundColor Yellow
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "  ❌ Git não encontrado. Instale o Git for Windows." -ForegroundColor Red
    exit 1
}
$gitVersion = git --version
Write-Host "  ✅ Git: $gitVersion" -ForegroundColor Green

# ── 4. Criar estrutura de diretórios ─────────────────────────────────────────
Write-Host "[4/5] Criando estrutura de diretórios..." -ForegroundColor Yellow
$dirs = @("$AppPath", "$AppPath\backups", "$AppPath\logs")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  📁 Criado: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  📁 Existe: $dir" -ForegroundColor Gray
    }
}

# ── 5. Verificar porta 80 ───────────────────────────────────────────────────
Write-Host "[5/5] Verificando portas..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    $process = Get-Process -Id $port80[0].OwningProcess -ErrorAction SilentlyContinue
    Write-Host "  ⚠️  Porta 80 em uso por: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
    Write-Host "     Pare o processo antes de iniciar o TradeHub." -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Porta 80 disponível" -ForegroundColor Green
}

# ── Resumo ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Servidor pronto!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Próximos passos:" -ForegroundColor White
Write-Host "  1. Clone o repositório:" -ForegroundColor Gray
Write-Host "     git clone https://github.com/marceloligiero/PortalTradeHudb.git $AppPath\app" -ForegroundColor Cyan
Write-Host "  2. Copie e configure os ficheiros .env:" -ForegroundColor Gray
Write-Host "     copy $AppPath\app\.env.example $AppPath\app\.env" -ForegroundColor Cyan
Write-Host "     copy $AppPath\app\backend\.env.example $AppPath\app\backend\.env" -ForegroundColor Cyan
Write-Host "  3. Inicie:" -ForegroundColor Gray
Write-Host "     cd $AppPath\app" -ForegroundColor Cyan
Write-Host "     docker compose -f docker-compose.yml up -d --build" -ForegroundColor Cyan
Write-Host ""
