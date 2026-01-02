Deployment notes — Caddy reverse proxy + systemd
===============================================

This folder contains example config files to expose the local dev services
securely to the public internet via a reverse proxy. It does NOT install
packages or enable services automatically — follow the steps below.

Files added:
- `Caddyfile` — example configuration (replace `yourdomain.example` with your domain)
- `portaltrade.service` — systemd unit example to run `start-all.sh` at boot

Recommended flow (secure, production-like):

1) Use a domain pointing to your machine's public IP
   - Create an A record for `yourdomain.example` → <your-public-ip>
   - This allows automatic TLS via Let's Encrypt when using Caddy.

2) Install Caddy (Debian/Ubuntu example)
   ```bash
   sudo apt update
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo apt-key add -
   echo 'deb [trusted=yes] https://dl.cloudsmith.io/public/caddy/stable/deb/ any-version main' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install -y caddy
   ```

3) Deploy the Caddyfile
   - Edit `deploy/Caddyfile`, set `yourdomain.example` to your domain.
   - Copy it to `/etc/caddy/Caddyfile` (requires sudo):
     ```bash
     sudo mkdir -p /etc/caddy
     sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
     sudo chown root:root /etc/caddy/Caddyfile
     ```

4) Enable and start Caddy
   ```bash
   sudo systemctl enable --now caddy
   sudo systemctl status caddy
   ```

5) Deploy systemd unit for `start-all.sh` (runs backend/frontend at boot)
   - Copy the provided unit file and create directory for logs:
     ```bash
     sudo mkdir -p /var/log/portaltrade
     sudo cp deploy/portaltrade.service /etc/systemd/system/portaltrade.service
     sudo systemctl daemon-reload
     sudo systemctl enable --now portaltrade.service
     sudo systemctl status portaltrade.service
     ```

6) Firewall suggestions (UFW example)
   - Allow only required ports through the firewall and restrict SSH to your IP:
     ```bash
     # replace <YOUR_IP> with your admin IP
     sudo ufw allow from <YOUR_IP> to any port 22 proto tcp
     sudo ufw allow 80/tcp
     sudo ufw allow 443/tcp
     # keep app ports closed to the outside; proxy will access them locally
     sudo ufw deny 5173/tcp
     sudo ufw deny 8000/tcp
     sudo ufw enable
     ```

7) If you cannot use a domain
   - You can use `tls internal` in the `Caddyfile` for the machine IP. Browsers
     will not trust the certificate by default — you'd need to add the Caddy CA
     to client trust stores or use a VPN to access the machine.

Notes & security
----------------
- Do not expose backend ports (8000) directly to the public internet — always
  proxy via Caddy/Nginx so TLS and access controls can be applied.
- Consider enabling `basicauth` in the `Caddyfile` for staging environments.
- Keep the OS and services updated, run fail2ban or similar for SSH protection.
