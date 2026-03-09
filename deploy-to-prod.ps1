# ============================================================
# Deploy DEV -> PROD  |  Portal TradeHub
# ============================================================
# Este script envia o codigo do servidor de desenvolvimento
# para o servidor de producao via Git + SSH.
#
# Uso:
#   .\deploy-to-prod.ps1                         (usa defaults)
#   .\deploy-to-prod.ps1 -ProdIP 192.168.1.71    (IP customizado)
#   .\deploy-to-prod.ps1 -ProdUser x404388       (user customizado)
#   .\deploy-to-prod.ps1 -SkipBuild              (nao rebuild frontend)
# ============================================================

param(
    [string]$ProdIP   = "192.168.1.71",
    [string]$ProdUser = "x404388",
    [string]$ProdPath = "C:\Portal Formações\PortalTradeHudb",
    [switch]$SkipBuild,
    [switch]$SkipRestart
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step($step, $msg) {
    Write-Host ""
    Write-Host "  [$step] $msg" -ForegroundColor Cyan
    Write-Host "  $('-' * 50)" -ForegroundColor DarkGray
}

function Write-Ok($msg) {
    Write-Host "      OK: $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "      WARN: $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "      ERRO: $msg" -ForegroundColor Red
}

# ── Header ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "    Deploy DEV -> PROD | Portal TradeHub  " -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "    Servidor: $ProdUser@$ProdIP"
Write-Host "    Caminho:  $ProdPath"
Write-Host ""

# ── Step 1: Build Frontend ───────────────────────────────────
if (-not $SkipBuild) {
    Write-Step "1/5" "Build do frontend..."
    
    Push-Location "$ProjectRoot\frontend"
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "      Instalando dependencias..." -ForegroundColor Gray
        npm install --silent 2>&1 | Out-Null
    }
    
    Write-Host "      Executando vite build..." -ForegroundColor Gray
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Build do frontend falhou!"
        Pop-Location
        exit 1
    }
    
    if (Test-Path "dist\index.html") {
        Write-Ok "Frontend compilado com sucesso"
    } else {
        Write-Err "dist/index.html nao encontrado apos build"
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Write-Step "1/5" "Build do frontend... SKIP (--SkipBuild)"
}

# ── Step 2: Commit e Push para GitHub ────────────────────────
Write-Step "2/5" "Commit e push para GitHub..."

Push-Location $ProjectRoot

# Add all changes
git add -A 2>&1 | Out-Null

# Check if there are changes to commit
$status = git status --porcelain 2>&1
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "deploy: production update $timestamp"
    
    git commit -m $commitMsg 2>&1 | Out-Null
    Write-Ok "Commit: $commitMsg"
} else {
    Write-Ok "Nenhuma alteracao para commit"
}

# Push
Write-Host "      Pushing to GitHub..." -ForegroundColor Gray
$pushResult = git push 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Git push falhou: $pushResult"
    Pop-Location
    exit 1
}
Write-Ok "Push para GitHub concluido"

Pop-Location

# ── Step 3: Pull no servidor de producao ─────────────────────
Write-Step "3/5" "Git pull no servidor de producao..."

$sshTarget = "${ProdUser}@${ProdIP}"

# Test SSH connection first
Write-Host "      Testando conexao SSH..." -ForegroundColor Gray
$sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $sshTarget "echo ok" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "SSH com chave falhou. Vai pedir senha..."
}

# Execute git pull on production
$pullCmd = "cd `"$ProdPath`" && git pull origin main"
Write-Host "      Executando git pull..." -ForegroundColor Gray
ssh $sshTarget $pullCmd
if ($LASTEXITCODE -ne 0) {
    Write-Err "Git pull no servidor falhou!"
    Write-Host ""
    Write-Host "  Alternativa: Execute manualmente no servidor:" -ForegroundColor Yellow
    Write-Host "    cd `"$ProdPath`"" -ForegroundColor White
    Write-Host "    git pull origin main" -ForegroundColor White
    Write-Host ""
} else {
    Write-Ok "Codigo atualizado no servidor"
}

# ── Step 4: Instalar dependencias Python no servidor ─────────
Write-Step "4/5" "Verificando dependencias no servidor..."

$pipCmd = @"
cd "$ProdPath\backend"
if (Test-Path "venv\Scripts\activate.ps1") {
    & venv\Scripts\activate.ps1
    pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Write-Host "OK: Dependencias Python instaladas"
} elseif (Test-Path ".venv\Scripts\activate.ps1") {
    & .venv\Scripts\activate.ps1
    pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Write-Host "OK: Dependencias Python instaladas"
} else {
    Write-Host "WARN: Virtualenv nao encontrado"
}
"@

ssh $sshTarget "powershell -Command `"$($pipCmd -replace '"', '\"')`"" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Nao foi possivel verificar dependencias remotamente"
    Write-Host "      Execute no servidor: cd backend && pip install -r requirements.txt" -ForegroundColor Gray
}

# ── Step 5: Reiniciar servicos ───────────────────────────────
if (-not $SkipRestart) {
    Write-Step "5/5" "Reiniciando servicos no servidor..."
    
    $restartCmd = @"
cd "$ProdPath"
# Parar processos nas portas 8000 e 5173
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
# Iniciar backend
Start-Process -FilePath "cmd.exe" -ArgumentList "/k call `"$ProdPath\start-backend.bat`"" -WindowStyle Normal
Start-Sleep -Seconds 5
# Iniciar frontend
Start-Process -FilePath "cmd.exe" -ArgumentList "/k call `"$ProdPath\start-frontend.bat`"" -WindowStyle Normal
Write-Host "Servicos reiniciados"
"@
    
    ssh $sshTarget "powershell -Command `"$($restartCmd -replace '"', '\"')`"" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Reinicio remoto pode ter falhado"
        Write-Host "      Execute no servidor: .\start-all.bat" -ForegroundColor Gray
    } else {
        Write-Ok "Servicos reiniciados no servidor"
    }
} else {
    Write-Step "5/5" "Reiniciar servicos... SKIP (--SkipRestart)"
}

# ── Summary ──────────────────────────────────────────────────
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "    Deploy concluido!                     " -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Write-Host "    Backend:  http://${ProdIP}:8000" -ForegroundColor White
Write-Host "    Frontend: http://${ProdIP}:8000  (servido pelo backend)" -ForegroundColor White
Write-Host ""
Write-Host "  Se SSH nao estiver configurado, execute no servidor:" -ForegroundColor Yellow
Write-Host "    cd `"$ProdPath`"" -ForegroundColor White
Write-Host "    git pull origin main" -ForegroundColor White 
Write-Host "    .\start-all.bat" -ForegroundColor White
Write-Host ""
