# =============================================================================
# install-nodocker.ps1 -- Instalacao nativa Windows (sem Docker, sem Admin)
# Uso:  .\scripts\install-nodocker.ps1
# Requer apenas: Python 3.11+, Node.js 18+, Git, MySQL 8.0
# O backend FastAPI serve API + frontend numa unica porta
# =============================================================================

param(
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
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  PortalTradeHub -- Instalacao Nativa Windows"           -ForegroundColor Cyan
Write-Host "  Diretorio: $Root"                                      -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# -- 1. Verificar pre-requisitos ---------------------------------------------
Write-Step "1/4" "Verificando pre-requisitos..."

try {
    $pyVer = python --version 2>&1
    if ($pyVer -match "3\.(1[1-9]|[2-9]\d)") { Write-OK "Python: $pyVer" }
    else { Write-Warn "Python encontrado mas versao abaixo de 3.11 recomendada: $pyVer" }
} catch { Write-Fail "Python nao encontrado. Instale em https://python.org e adicione ao PATH." }

try {
    $nodeVer = node --version 2>&1
    Write-OK "Node.js: $nodeVer"
} catch { Write-Fail "Node.js nao encontrado. Instale em https://nodejs.org" }

try {
    $gitVer = git --version 2>&1
    Write-OK "Git: $gitVer"
} catch { Write-Fail "Git nao encontrado. Instale em https://git-scm.com" }

try {
    $mysqlVer = mysql --version 2>&1
    Write-OK "MySQL client: $mysqlVer"
} catch { Write-Warn "mysql nao encontrado no PATH. Backup da DB nao funcionara." }

# -- 2. Configurar .env do backend -------------------------------------------
Write-Step "2/4" "Verificando .env do backend..."

$envFile = Join-Path $Root "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Warn ".env nao encontrado. Criando a partir do exemplo..."
    $envExample = Join-Path $Root "backend\.env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        (Get-Content $envFile) -replace "@tradehub-db:", "@localhost:" -replace "@db:", "@localhost:" | Set-Content $envFile
        Write-Warn "Edite '$envFile' com as credenciais corretas da base de dados"
        notepad $envFile
        Read-Host "Pressione ENTER apos guardar o .env"
    } else {
        Write-Fail "backend\.env e backend\.env.example nao encontrados. Crie o .env manualmente."
    }
} else {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "DATABASE_URL=.*@(tradehub-db|db):") {
        Write-Warn "DATABASE_URL com hostname Docker detectado. Corrigindo para localhost..."
        (Get-Content $envFile) -replace "@tradehub-db:", "@localhost:" -replace "@db:", "@localhost:" | Set-Content $envFile
        Write-OK "DATABASE_URL atualizado para localhost"
    } else {
        Write-OK ".env encontrado"
    }
}

# -- 3. Python venv + dependencias -------------------------------------------
Write-Step "3/4" "Configurando ambiente Python..."

$venvPath = Join-Path $Root "backend\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "  Criando venv em $venvPath..." -ForegroundColor Gray
    python -m venv $venvPath
}
Write-OK "venv pronto"

$pip    = Join-Path $venvPath "Scripts\pip.exe"
$python = Join-Path $venvPath "Scripts\python.exe"
Write-Host "  Instalando dependencias (pode demorar)..." -ForegroundColor Gray
& $pip install --upgrade pip
& $pip install -r (Join-Path $Root "backend\requirements.txt")
if ($LASTEXITCODE -ne 0) { Write-Fail "pip install falhou (codigo $LASTEXITCODE). Verifique o Python e o requirements.txt." }
Write-OK "Dependencias Python instaladas"

# -- 4. Build do frontend ----------------------------------------------------
Write-Step "4/4" "Build do frontend React..."

Push-Location (Join-Path $Root "frontend")
Write-Host "  npm ci..." -ForegroundColor Gray
npm ci
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Fail "npm ci falhou (codigo $LASTEXITCODE). Verifique o Node.js e o package-lock.json." }
Write-Host "  npm run build..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Fail "npm run build falhou (codigo $LASTEXITCODE). Verifique os logs acima." }
Pop-Location
Write-OK "Frontend compilado em frontend\dist"

# Criar pasta de logs
$logsDir = Join-Path $Root "logs"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory $logsDir -Force | Out-Null }

# Guardar configuracao
$configFile = Join-Path $Root ".nodocker-config"
@"
BACKEND_PORT=$BackendPort
VENV_PATH=$venvPath
"@ | Set-Content $configFile -Encoding UTF8

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Instalacao concluida!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Para iniciar:" -ForegroundColor Cyan
Write-Host "    .\scripts\start-nodocker.ps1" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "  Acesso: http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "  (API + Frontend servidos na mesma porta)" -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Green
