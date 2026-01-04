#!/bin/bash
# Script para corrigir configuração HTTPS do frontend

cd /var/www/tradehub/frontend

# Criar .env com API relativa
cat > .env << 'EOF'
VITE_API_BASE_URL=/api
EOF

echo "Conteúdo do .env:"
cat .env

# Rebuild do frontend
echo ""
echo "Fazendo rebuild..."
npm run build

echo ""
echo "✅ Frontend reconstruído com configuração HTTPS!"
