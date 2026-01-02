#!/bin/bash
# Script para configurar Nginx

set -e

DOMAIN="seudominio.com"  # ALTERE PARA SEU DOMÍNIO
EMAIL="seu@email.com"    # ALTERE PARA SEU EMAIL

echo "==================================="
echo "Configurando Nginx"
echo "==================================="

# Copiar configuração do Nginx
echo "📝 Copiando configuração do Nginx..."
sudo cp /var/www/tradehub/deploy/nginx-config /etc/nginx/sites-available/tradehub

# Editar domínio no arquivo (se não foi feito manualmente)
sudo sed -i "s/seudominio.com/$DOMAIN/g" /etc/nginx/sites-available/tradehub

# Criar link simbólico
sudo ln -sf /etc/nginx/sites-available/tradehub /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

# Configurar SSL com Certbot
echo ""
echo "🔒 Configurando SSL com Let's Encrypt..."
read -p "Deseja configurar SSL agora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect
    
    # Configurar renovação automática
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    echo "✅ SSL configurado com sucesso!"
else
    echo "⚠️  SSL não configurado. Execute manualmente:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo ""
echo "✅ Nginx configurado!"
echo ""
echo "Acesse: http://$DOMAIN"
