$commands = @"
cat /etc/nginx/sites-enabled/tradehub
echo '---'
cat /etc/nginx/nginx.conf | grep -A5 'include.*sites-enabled'
"@
$commands | ssh root@72.60.188.172
