# Script para configurar secrets do GitHub Actions para deploy automático na VPS
# Execute este script para adicionar as credenciais ao repositório GitHub

Write-Host "=== Configuração de Deploy Automático ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para configurar o deploy automático, você precisa adicionar estas secrets no GitHub:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse: https://github.com/marceloligiero/PortalTradeHudb/settings/secrets/actions" -ForegroundColor Green
Write-Host ""
Write-Host "2. Clique em 'New repository secret' e adicione cada uma:" -ForegroundColor Green
Write-Host ""
Write-Host "   Nome: VPS_HOST" -ForegroundColor White
Write-Host "   Valor: 72.60.188.172" -ForegroundColor Gray
Write-Host ""
Write-Host "   Nome: VPS_USER" -ForegroundColor White
Write-Host "   Valor: root" -ForegroundColor Gray
Write-Host ""
Write-Host "   Nome: VPS_PASSWORD" -ForegroundColor White
Write-Host "   Valor: Escambal4..." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Salve cada secret" -ForegroundColor Green
Write-Host ""
Write-Host "Após configurar, todo push na branch 'main' fará deploy automático na VPS!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para abrir o navegador na página de secrets..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "https://github.com/marceloligiero/PortalTradeHudb/settings/secrets/actions"
