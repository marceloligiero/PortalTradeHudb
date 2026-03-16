# =============================================================================
# install-nodocker.ps1 -- Instalacao nativa Windows (sem Docker)
# Uso:  .\scripts\install-nodocker.ps1
# Requer: Python 3.11+, Node.js 18+, Git, MySQL 8.0, Nginx, NSSM
# =============================================================================

param(
    [string]$NginxPath  = "C:\nginx",
    [string]$NssmExe    = "nssm",
    [string]$BackendPort = "8000",
    [string]$FrontendPort = "80"
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

# -- 0. Admin check ----------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Execute como Administrador (PowerShell > Executar como administrador)" }
Write-OK "A correr como Administrador"

# -- 1. Verificar pre-requisitos ---------------------------------------------
Write-Step "1/7" "Verificando pre-requisitos..."

# Python
try {
    $pyVer = python --version 2>&1
    if ($pyVer -match "3\.(1[1-9]|[2-9]\d)") { Write-OK "Python: $pyVer" }
    else { Write-Warn "Python encontrado mas versao abaixo de 3.11 recomendada: $pyVer" }
} catch { Write-Fail "Python nao encontrado. Instale em https://python.org e adicione ao PATH." }

# Node.js
try {
    $nodeVer = node --version 2>&1
    Write-OK "Node.js: $nodeVer"
} catch { Write-Fail "Node.js nao encontrado. Instale em https://nodejs.org" }

# Git
try {
    $gitVer = git --version 2>&1
    Write-OK "Git: $gitVer"
} catch { Write-Fail "Git nao encontrado. Instale em https://git-scm.com" }

# MySQL (mysqldump para backup -- mysql server pode ja estar como servico Windows)
try {
    $mysqlVer = mysql --version 2>&1
    Write-OK "MySQL client: $mysqlVer"
} catch { Write-Warn "mysql nao encontrado no PATH. Backup da DB nao funcionara. Adicione o bin do MySQL ao PATH." }

# Nginx
if (Test-Path "$NginxPath\nginx.exe") {
    Write-OK "Nginx: $NginxPath\nginx.exe"
} else {
    Write-Fail "Nginx nao encontrado em '$NginxPath'. Baixe em https://nginx.org/en/download.html e extraia para $NginxPath"
}

# NSSM
try {
    $nssmVer = & $NssmExe version 2>&1
    Write-OK "NSSM: encontrado"
} catch {
    Write-Fail "NSSM nao encontrado. Baixe em https://nssm.cc/download e coloque nssm.exe em C:\Windows\System32\ ou passe -NssmExe 'C:\caminho\nssm.exe'"
}

# -- 2. Configurar .env do backend -------------------------------------------
Write-Step "2/7" "Verificando .env do backend..."

$envFile = Join-Path $Root "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Warn ".env nao encontrado. Criando a partir do exemplo..."
    $envExample = Join-Path $Root "backend\.env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Warn "Edite '$envFile' antes de continuar (DATABASE_URL com localhost, SECRET_KEY, etc.)"
        notepad $envFile
        Read-Host "Pressione ENTER apos guardar o .env"
    } else {
        Write-Fail "backend\.env e backend\.env.example nao encontrados. Crie o .env manualmente."
    }
} else {
    # Corrigir DATABASE_URL se ainda tem hostname Docker (db, tradehub-db)
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
Write-Step "3/7" "Configurando ambiente Python..."

$venvPath = Join-Path $Root "backend\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "  Criando venv em $venvPath..." -ForegroundColor Gray
    python -m venv $venvPath
}
Write-OK "venv pronto"

$pip = Join-Path $venvPath "Scripts\pip.exe"
Write-Host "  Instalando dependencias (pode demorar)..." -ForegroundColor Gray
& $pip install --upgrade pip --quiet
& $pip install -r (Join-Path $Root "backend\requirements.txt") --quiet
Write-OK "Dependencias Python instaladas"

# -- 4. Build do frontend ----------------------------------------------------
Write-Step "4/7" "Build do frontend React..."

Push-Location (Join-Path $Root "frontend")
Write-Host "  npm ci..." -ForegroundColor Gray
npm ci --silent
Write-Host "  npm run build..." -ForegroundColor Gray
npm run build
Pop-Location
Write-OK "Frontend compilado em frontend\dist"

# -- 5. Gerar e instalar config do Nginx -------------------------------------
Write-Step "5/7" "Configurando Nginx..."

$distPath = (Join-Path $Root "frontend\dist").Replace("\", "/")

$nginxConf = @"
server {
    listen $FrontendPort;
    server_name _;
    charset utf-8;

    root "$distPath";
    index index.html;

    # SPA fallback
    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # API proxy -> FastAPI (preserva /api prefix)
    location /api {
        proxy_pass         http://127.0.0.1:$BackendPort;
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

    # Cache de assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|webm)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip            on;
    gzip_comp_level 5;
    gzip_types      text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    add_header X-Frame-Options   "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
"@

$confDest = "$NginxPath\conf\conf.d"
if (-not (Test-Path $confDest)) { New-Item -ItemType Directory $confDest -Force | Out-Null }
$nginxConf | Set-Content "$confDest\tradehub.conf" -Encoding UTF8

# Incluir conf.d no nginx.conf principal (se ainda nao inclui)
$nginxMainConf = "$NginxPath\conf\nginx.conf"
if (Test-Path $nginxMainConf) {
    $mainContent = Get-Content $nginxMainConf -Raw
    if ($mainContent -notmatch "conf\.d") {
        $mainContent = $mainContent -replace "(http\s*\{)", "`$1`n    include conf.d/*.conf;"
        $mainContent | Set-Content $nginxMainConf -Encoding UTF8
        Write-OK "nginx.conf atualizado para incluir conf.d"
    }
}

# Testar config
& "$NginxPath\nginx.exe" -t -p $NginxPath
Write-OK "Config Nginx valida"

# -- 6. Registar servicos Windows via NSSM -----------------------------------
Write-Step "6/7" "Registando servicos Windows..."

$uvicorn = Join-Path $venvPath "Scripts\uvicorn.exe"

# --- Servico: tradehub-backend ---
$svcBackend = "tradehub-backend"
$existingBackend = & $NssmExe status $svcBackend 2>&1
if ($existingBackend -notmatch "SERVICE_") {
    & $NssmExe install $svcBackend $uvicorn
    & $NssmExe set $svcBackend AppParameters "main:app --host 127.0.0.1 --port $BackendPort --workers 2"
    & $NssmExe set $svcBackend AppDirectory (Join-Path $Root "backend")
    & $NssmExe set $svcBackend AppEnvironmentExtra "PYTHONPATH=$(Join-Path $Root 'backend')"
    & $NssmExe set $svcBackend Start SERVICE_AUTO_START
    & $NssmExe set $svcBackend AppStdout (Join-Path $Root "logs\backend-stdout.log")
    & $NssmExe set $svcBackend AppStderr (Join-Path $Root "logs\backend-stderr.log")
    & $NssmExe set $svcBackend AppRotateFiles 1
    & $NssmExe set $svcBackend AppRotateBytes 10485760
    Write-OK "Servico '$svcBackend' registado"
} else {
    Write-OK "Servico '$svcBackend' ja existe -- atualizado"
    & $NssmExe set $svcBackend AppParameters "main:app --host 127.0.0.1 --port $BackendPort --workers 2"
    & $NssmExe set $svcBackend AppDirectory (Join-Path $Root "backend")
}

# --- Servico: tradehub-nginx ---
$svcNginx = "tradehub-nginx"
$existingNginx = & $NssmExe status $svcNginx 2>&1
if ($existingNginx -notmatch "SERVICE_") {
    & $NssmExe install $svcNginx "$NginxPath\nginx.exe"
    & $NssmExe set $svcNginx AppParameters "-p $NginxPath"
    & $NssmExe set $svcNginx AppDirectory $NginxPath
    & $NssmExe set $svcNginx Start SERVICE_AUTO_START
    & $NssmExe set $svcNginx AppStdout (Join-Path $Root "logs\nginx-stdout.log")
    & $NssmExe set $svcNginx AppStderr (Join-Path $Root "logs\nginx-stderr.log")
    Write-OK "Servico '$svcNginx' registado"
} else {
    Write-OK "Servico '$svcNginx' ja existe"
}

# Criar pasta de logs
$logsDir = Join-Path $Root "logs"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory $logsDir -Force | Out-Null }

# -- 7. Iniciar servicos -----------------------------------------------------
Write-Step "7/7" "Iniciando servicos..."

foreach ($svc in @($svcBackend, $svcNginx)) {
    $status = & $NssmExe status $svc 2>&1
    if ($status -eq "SERVICE_RUNNING") {
        & $NssmExe restart $svc
    } else {
        & $NssmExe start $svc
    }
    Start-Sleep -Seconds 2
    $newStatus = & $NssmExe status $svc 2>&1
    if ($newStatus -eq "SERVICE_RUNNING") {
        Write-OK "$svc running"
    } else {
        Write-Warn "$svc status: $newStatus - verifique logs em $logsDir"
    }
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Instalacao concluida!" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:$BackendPort/docs" -ForegroundColor Green
Write-Host "  Logs     : $logsDir" -ForegroundColor Green
Write-Host ""
Write-Host "  Para atualizar:" -ForegroundColor Cyan
Write-Host "    .\scripts\deploy-nodocker.ps1" -ForegroundColor Cyan
Write-Host "  Para parar tudo:" -ForegroundColor Cyan
Write-Host "    nssm stop tradehub-backend; nssm stop tradehub-nginx" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
