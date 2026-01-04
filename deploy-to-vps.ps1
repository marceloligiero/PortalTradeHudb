# Deploy Automatizado para VPS via PowerShell
# Portal TradeHub - Hostinger VPS

$VPS_IP = "72.60.188.172"
$VPS_USER = "root"
$VPS_PASSWORD = "Escambal4..."
$APP_DIR = "/var/www/tradehub"
$ROOT_DIR = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy Automatizado - Portal TradeHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para executar comando SSH
function Invoke-SSHCommand {
    param([string]$Command)
    
    $SecPassword = ConvertTo-SecureString $VPS_PASSWORD -AsPlainText -Force
    $Credential = New-Object System.Management.Automation.PSCredential ($VPS_USER, $SecPassword)
    
    # Usar cmdkey para armazenar credenciais temporariamente
    $psinfoContent = @"
spawn ssh $VPS_USER@$VPS_IP
expect "password:"
send "$VPS_PASSWORD\r"
expect "$ "
send "$Command\r"
expect "$ "
send "exit\r"
"@
    
    # Executar comando diretamente
    $fullCmd = "echo '$VPS_PASSWORD' | ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP '$Command'"
    Write-Host "Executando: $Command" -ForegroundColor Gray
    
    # No Windows, precisamos usar um método diferente
    # Vamos criar um script temporário
    $tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
    Set-Content -Path $tempScript -Value $Command
    
    return $true
}

Write-Host "📋 Iniciando deploy em $VPS_IP..." -ForegroundColor Yellow
Write-Host ""

Write-Host "INSTRUÇÕES MANUAIS:" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Abra um terminal PowerShell separado e execute os seguintes comandos:" -ForegroundColor White
Write-Host ""
Write-Host "1. Conecte na VPS:" -ForegroundColor Cyan
Write-Host "   ssh root@$VPS_IP" -ForegroundColor White
Write-Host "   Senha: $VPS_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "2. Execute os comandos de setup:" -ForegroundColor Cyan
Write-Host @"
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl wget git vim build-essential python3.11 python3.11-venv python3-pip nodejs npm mysql-server nginx

# Instalar PM2
npm install -g pm2

# Configurar MySQL
mysql -u root << 'EOFMYSQL'
CREATE DATABASE IF NOT EXISTS tradehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'tradehub_user'@'localhost' IDENTIFIED BY 'TradeHub2026SecurePass';
GRANT ALL PRIVILEGES ON tradehub_db.* TO 'tradehub_user'@'localhost';
FLUSH PRIVILEGES;
EOFMYSQL

# Criar diretórios
mkdir -p $APP_DIR
cd $APP_DIR

echo "✅ Setup básico concluído!"
"@ -ForegroundColor White

Write-Host ""
Write-Host "3. Depois volte aqui e pressione ENTER para continuar com upload dos arquivos..." -ForegroundColor Cyan
Read-Host

Write-Host ""
Write-Host "Agora vou preparar os arquivos para upload..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute este comando em outro terminal para enviar os arquivos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "scp -r `"$ROOT_DIR\backend`" root@${VPS_IP}:$APP_DIR/" -ForegroundColor White
Write-Host "scp -r `"$ROOT_DIR\frontend`" root@${VPS_IP}:$APP_DIR/" -ForegroundColor White
Write-Host "scp -r `"$ROOT_DIR\database`" root@${VPS_IP}:$APP_DIR/" -ForegroundColor White
Write-Host ""

Write-Host "Pressione ENTER após enviar os arquivos..." -ForegroundColor Cyan
Read-Host

Write-Host ""
Write-Host "✅ Preparação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximo passo: Configurar a aplicação na VPS" -ForegroundColor Yellow
