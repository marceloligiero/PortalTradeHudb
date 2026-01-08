# Deploy PowerShell Script para VPS via SSH
# Executa deploy remoto na VPS Hostinger

param(
    [string]$VpsIp = "72.60.188.172",
    [string]$VpsUser = "root"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy para VPS - Portal TradeHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Instalar plink se não existir (PuTTY command line)
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
if (-not (Test-Path $plinkPath)) {
    $plinkPath = (Get-Command plink -ErrorAction SilentlyContinue).Source
    if (-not $plinkPath) {
        Write-Host "⚠️  plink não encontrado. Usando ssh nativo..." -ForegroundColor Yellow
        $plinkPath = "ssh"
    }
}

Write-Host "📦 Etapa 1: Enviando script de setup..." -ForegroundColor Blue

# Usar scp para enviar o script
$scriptPath = Join-Path $PSScriptRoot "deploy-complete.sh"
Write-Host "Enviando $scriptPath para VPS..."

# Comando para copiar via scp
$scpCmd = "scp `"$scriptPath`" ${VpsUser}@${VpsIp}:/root/deploy-complete.sh"
Write-Host "Executando: $scpCmd" -ForegroundColor Gray

Write-Host ""
Write-Host "🔐 Você precisará digitar a senha da VPS quando solicitado" -ForegroundColor Yellow
Write-Host ""

# Executar scp
Invoke-Expression $scpCmd

Write-Host ""
Write-Host "📦 Etapa 2: Executando setup na VPS..." -ForegroundColor Blue
Write-Host ""

# Executar script remotamente
$sshCmd = "ssh ${VpsUser}@${VpsIp} 'chmod +x /root/deploy-complete.sh && bash /root/deploy-complete.sh'"
Write-Host "Executando setup remoto..." -ForegroundColor Gray

Invoke-Expression $sshCmd

Write-Host ""
Write-Host "✅ Deploy inicial concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Enviar código da aplicação para VPS"
Write-Host "2. Configurar e iniciar serviços"
Write-Host ""
