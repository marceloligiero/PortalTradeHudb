# Deploy sem Docker — PortalTradeHub

Guia completo para instalar o PortalTradeHub num servidor Linux (Ubuntu 22.04/24.04) **sem Docker**.

---

## Arquitectura

```
Internet → nginx (:80) → uvicorn (:8000, só localhost)
                              ↓
                   FastAPI serve /api/* + frontend/dist (SPA)
                              ↓
                        MySQL 8.0 (:3306, só localhost)
```

- **nginx**: proxy reverso, serve assets estáticos com cache longa
- **uvicorn**: 4 workers, só escuta `127.0.0.1:8000`  
- **MySQL**: base de dados local, só acessível via `localhost`
- **systemd**: gere o processo uvicorn (restart automático, logs via journald)

---

## Ficheiros nesta pasta

| Ficheiro | Descrição |
|----------|-----------|
| `install.sh` | Instalação completa (primeira vez) |
| `update.sh` | Actualização após git pull |
| `tradehub.service` | Unidade systemd do backend |
| `nginx.conf` | Configuração nginx |
| `setup-db.sql` | Criar BD e utilizador MySQL manualmente |
| `env.production.example` | Template para `backend/.env` |

---

## Primeira instalação

### 1. Pré-requisitos no servidor

```bash
# Verificar versões mínimas
python3 --version   # 3.11+
node --version      # 18+
mysql --version     # 8.0+
nginx -v
```

### 2. Clonar o repositório

```bash
sudo git clone https://github.com/yourorg/PortalTradeDataHub.git /opt/tradehub
cd /opt/tradehub
```

### 3. Configurar o `.env` de produção

```bash
# Copiar o template
sudo cp deploy/env.production.example backend/.env

# Gerar a SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Gerar a senha da BD
python3 -c "import secrets; print(secrets.token_urlsafe(24))"

# Editar com os valores reais
sudo nano backend/.env
```

**Campos obrigatórios no `backend/.env`:**

```env
DATABASE_URL=mysql+pymysql://tradehub_user:SENHA_GERADA@localhost:3306/tradehub_db
SECRET_KEY=CHAVE_GERADA_ACIMA
ALLOWED_ORIGINS=http://SEU_HOSTNAME
FRONTEND_URL=http://SEU_HOSTNAME
DEBUG=false
```

### 4. Executar o instalador

```bash
sudo bash deploy/install.sh
```

O script faz **tudo automaticamente**:
- Instala pacotes do sistema
- Cria o utilizador `tradehub`
- Cria o venv Python + instala dependências
- Faz o build do frontend (`npm ci && npm run build`)
- Cria a base de dados MySQL e o utilizador
- Aplica todas as migrações (V001 a V014+)
- Cria o admin inicial (`admin@tradehub.com` / `admin123`)
- Configura o serviço systemd
- Configura o nginx

### 5. Verificar a instalação

```bash
# Estado do backend
sudo systemctl status tradehub

# Teste de saúde
curl http://localhost/api/health

# Logs em tempo real
sudo journalctl -u tradehub -f
```

---

## Actualização após git push

```bash
cd /opt/tradehub
sudo bash deploy/update.sh
```

O script detecta automaticamente o que mudou:
- Se `requirements.txt` mudou → actualiza o venv
- Se `frontend/` mudou → refaz o build
- Se `database/migrations/` tem ficheiros novos → aplica-os
- Sempre reinicia o backend e verifica a saúde

**Opções:**
```bash
sudo bash deploy/update.sh --skip-pull    # não faz git pull
sudo bash deploy/update.sh --skip-build   # não refaz npm build
sudo bash deploy/update.sh --skip-migrate # não corre migrações
```

---

## Gestão do serviço

```bash
# Estado
sudo systemctl status tradehub

# Iniciar / Parar / Reiniciar
sudo systemctl start tradehub
sudo systemctl stop tradehub
sudo systemctl restart tradehub

# Logs
sudo journalctl -u tradehub -f              # em tempo real
sudo journalctl -u tradehub --since "1h ago"
sudo journalctl -u tradehub -n 100

# nginx
sudo nginx -t                               # validar config
sudo systemctl reload nginx
```

---

## Base de dados

### Backup manual

```bash
mysqldump -u tradehub_user -p tradehub_db \
    --single-transaction \
    --routines \
    --triggers \
    > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
mysql -u tradehub_user -p tradehub_db < backup_YYYYMMDD_HHMMSS.sql
```

### Aplicar migração manualmente

```bash
cd /opt/tradehub
sudo -u tradehub /opt/tradehub/backend/.venv/bin/python scripts/run_migrations.py
```

### Ver migrações aplicadas

```bash
mysql -u tradehub_user -p tradehub_db -e "SELECT filename, applied_at FROM _migrations ORDER BY id;"
```

---

## HTTPS com Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado (substituir pelo domínio real)
sudo certbot --nginx -d portaltradedatahub.example.com

# Renovação automática (já configurada pelo certbot)
sudo certbot renew --dry-run
```

---

## Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (depois de configurar SSL)
sudo ufw deny 8000/tcp   # bloquear acesso directo ao uvicorn
sudo ufw deny 3306/tcp   # bloquear acesso directo ao MySQL
sudo ufw enable
sudo ufw status
```

---

## Variáveis de ambiente completas

Ver `deploy/env.production.example` para a lista completa.

**Variáveis opcionais úteis:**

| Variável | Descrição |
|----------|-----------|
| `SMTP_HOST` | Servidor SMTP para emails de recuperação de senha |
| `MICROSOFT_CLIENT_ID` | SSO Microsoft (Entra ID) |
| `FRONTEND_URL` | URL base para links em emails |

---

## Troubleshooting

**Backend não arranca:**
```bash
sudo journalctl -u tradehub -n 50
sudo -u tradehub /opt/tradehub/backend/.venv/bin/python -c "from app.config import settings; print('OK')"
```

**Erro de conexão à BD:**
```bash
mysql -u tradehub_user -p tradehub_db -e "SELECT 1"
grep DATABASE_URL /opt/tradehub/backend/.env
```

**Frontend não carrega (404):**
```bash
ls /opt/tradehub/frontend/dist/
# Se vazio → rebuild
cd /opt/tradehub/frontend && npm ci && npm run build
sudo chown -R tradehub:tradehub /opt/tradehub/frontend/dist
```

**nginx erro:**
```bash
sudo nginx -t
sudo cat /var/log/nginx/tradehub-error.log | tail -20
```
