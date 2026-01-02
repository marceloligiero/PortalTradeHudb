# Script para fazer push do projeto para o GitHub
# Execute no PowerShell no diretório raiz do projeto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Push para GitHub - Portal TradeHub   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se git está instalado
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não está instalado!" -ForegroundColor Red
    Write-Host "Baixe em: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit
}

# Verificar se já é um repositório git
if (!(Test-Path ".git")) {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Solicitar URL do repositório se não existir
$remoteUrl = git remote get-url origin 2>$null
if (!$remoteUrl) {
    Write-Host ""
    Write-Host "🔗 Configurar repositório remoto do GitHub" -ForegroundColor Green
    Write-Host "   Exemplo: https://github.com/seuusuario/portal-tradehub.git" -ForegroundColor Gray
    Write-Host ""
    $repoUrl = Read-Host "Digite a URL do repositório GitHub"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Repositório remoto configurado!" -ForegroundColor Green
    } else {
        Write-Host "❌ URL não fornecida. Abortando..." -ForegroundColor Red
        exit
    }
} else {
    Write-Host "✅ Repositório remoto: $remoteUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Preparando commit..." -ForegroundColor Yellow

# Adicionar todos os arquivos
git add .

# Verificar se há mudanças
$status = git status --porcelain
if (!$status) {
    Write-Host "ℹ️  Nenhuma mudança para commitar" -ForegroundColor Cyan
    exit
}

# Solicitar mensagem de commit
Write-Host ""
$commitMessage = Read-Host "Digite a mensagem do commit (Enter para padrão)"
if (!$commitMessage) {
    $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# Fazer commit
git commit -m "$commitMessage"

Write-Host ""
Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow

# Fazer push
try {
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Push concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Acesse: $remoteUrl" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  1. Credenciais inválidas (use Personal Access Token)" -ForegroundColor Gray
    Write-Host "  2. Repositório não existe no GitHub" -ForegroundColor Gray
    Write-Host "  3. Sem permissão de escrita" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Para gerar Personal Access Token:" -ForegroundColor Cyan
    Write-Host "   GitHub → Settings → Developer settings → Personal access tokens → Generate new token" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para sair"
