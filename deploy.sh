#!/bin/bash
set -e
echo '=== Deploy Portal TradeHub ==='
cd /var/www/tradehub

echo '[1/4] Git pull...'
git fetch origin main
git reset --hard origin/main

echo '[2/4] Backend dependencies...'
cd backend
source venv/bin/activate
pip install -r requirements.txt -q

echo '[3/4] Frontend build...'
cd ../frontend
npm install --silent
npm run build

echo '[4/4] Restart services...'
pm2 restart tradehub-backend
systemctl reload nginx

echo '=== Deploy completo! ==='
