rm -f /etc/apt/sources.list.d/*deadsnakes* /etc/apt/sources.list.d/*monarx* 2>/dev/null || true
apt update -y
apt install -y curl wget git vim build-essential software-properties-common ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
apt install -y python3-full python3-pip python3-venv
apt install -y mysql-server
mysql -e "CREATE DATABASE IF NOT EXISTS tradehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true
mysql -e "CREATE USER IF NOT EXISTS 'tradehub_user'@'localhost' IDENTIFIED BY 'TradeHub2026Secure';" || true
mysql -e "GRANT ALL PRIVILEGES ON tradehub_db.* TO 'tradehub_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
apt install -y nginx
npm install -g pm2
mkdir -p /var/www/tradehub
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo 'y' | ufw enable || true
echo "========================================="
echo "Setup VPS concluido!"
echo "========================================="
