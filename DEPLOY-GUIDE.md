# 🚀 Guia Completo de Deploy - Portal TradeHub

## 📋 Pré-requisitos

1. **VPS Ubuntu** da Hostinger (ou qualquer provider)
2. **Domínio** apontado para o IP da VPS
3. **Conta GitHub** (para versionamento do código)
4. **Acesso SSH** à VPS

---

## Parte 1: Subir Projeto no GitHub

### 1.1 Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique em **New repository**
3. Nome: `portal-tradehub` (ou o que preferir)
4. Deixe como **Private** (recomendado)
5. **NÃO** marque "Initialize with README"
6. Clique em **Create repository**

### 1.2 Preparar Projeto Localmente

Abra o PowerShell no diretório do projeto:

```powershell
cd "C:\Users\ripma\Desktop\Portal Formações\PortalTradeHudb"
```

### 1.3 Inicializar Git e Fazer Push

```powershell
# Inicializar repositório Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Initial commit - Portal TradeHub"

# Adicionar repositório remoto (SUBSTITUA com sua URL do GitHub)
git remote add origin https://github.com/SEU_USUARIO/portal-tradehub.git

# Renomear branch para main
git branch -M main

# Fazer push
git push -u origin main
```

**Se pedir credenciais:**
- Username: seu usuário do GitHub
- Password: use um **Personal Access Token** (não a senha)
  - Crie em: Settings → Developer settings → Personal access tokens → Generate new token

---

## Parte 2: Configurar VPS

### 2.1 Conectar via SSH

```powershell
ssh root@SEU_IP_DA_VPS
```

### 2.2 Executar Setup Inicial

```bash
# Baixar script de setup
cd /root
wget https://raw.githubusercontent.com/SEU_USUARIO/portal-tradehub/main/deploy/setup-vps.sh

# Dar permissão de execução
chmod +x setup-vps.sh

# Executar
./setup-vps.sh
```

**Ou copie manualmente o conteúdo do arquivo `deploy/setup-vps.sh`**

### 2.3 Configurar MySQL

```bash
# Executar configuração segura
sudo mysql_secure_installation
```

Responda:
- `VALIDATE PASSWORD COMPONENT`: **n** (ou **y** se quiser senhas fortes)
- `Remove anonymous users`: **y**
- `Disallow root login remotely`: **y**
- `Remove test database`: **y**
- `Reload privilege tables`: **y**

---

## Parte 3: Deploy da Aplicação

### 3.1 Clonar Repositório

```bash
# Mudar para usuário tradehub
sudo su - tradehub

# Ir para diretório
cd /var/www/tradehub

# Clonar (SUBSTITUA com sua URL)
git clone https://github.com/SEU_USUARIO/portal-tradehub.git .
```

### 3.2 Configurar Banco de Dados

```bash
# Dar permissão de execução nos scripts
chmod +x deploy/*.sh

# Executar configuração do banco
sudo bash deploy/configure-database.sh
```

**⚠️ IMPORTANTE:** Anote a senha do banco de dados!

### 3.3 Configurar Variáveis de Ambiente

```bash
# Editar arquivo .env do backend
nano backend/.env
```

Configure:
```env
DATABASE_URL=mysql+pymysql://tradehub_user:SUA_SENHA@localhost/tradehub_db
SECRET_KEY=sua_chave_secreta_gerada
ALLOWED_ORIGINS=https://seudominio.com,http://seudominio.com
```

```bash
# Editar arquivo .env.production do frontend
nano frontend/.env.production
```

Configure:
```env
VITE_API_URL=https://seudominio.com/api
```

### 3.4 Executar Deploy

```bash
# Atualizar URL do repositório no script
nano deploy/deploy-app.sh
# Altere a linha: REPO_URL="SEU_REPOSITORIO_GIT_AQUI"

# Executar deploy
bash deploy/deploy-app.sh
```

---

## Parte 4: Configurar Nginx e SSL

### 4.1 Configurar Nginx

```bash
# Editar domínio no arquivo de configuração
sudo nano /var/www/tradehub/deploy/nginx-config
# Altere 'seudominio.com' para seu domínio real

# Executar script de configuração
sudo bash deploy/configure-nginx.sh
```

### 4.2 Configurar SSL (HTTPS)

O script acima perguntará se quer configurar SSL. Responda **s** (sim).

Ou faça manualmente:
```bash
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

---

## Parte 5: Iniciar Serviços

```bash
# Como usuário tradehub
sudo su - tradehub
cd /var/www/tradehub

# Iniciar backend com PM2
bash deploy/start-services.sh
```

---

## ✅ Verificações Finais

### Verificar serviços:
```bash
pm2 status          # Backend rodando?
sudo systemctl status nginx    # Nginx ativo?
sudo systemctl status mysql    # MySQL ativo?
```

### Testar API:
```bash
curl http://localhost:8000/docs
```

### Testar site:
Abra o navegador e acesse: `https://seudominio.com`

---

## 🔄 Atualizar Aplicação

Quando fizer alterações no código local:

### No seu computador:
```powershell
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

### Na VPS:
```bash
sudo su - tradehub
cd /var/www/tradehub

# Atualizar código
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Frontend
cd ../frontend
npm install
npm run build

# Reiniciar backend
pm2 restart tradehub-backend

# Recarregar nginx
sudo systemctl reload nginx
```

---

## 🛠️ Comandos Úteis

```bash
# Ver logs do backend
pm2 logs tradehub-backend

# Ver logs do Nginx
sudo tail -f /var/log/nginx/tradehub_error.log

# Reiniciar MySQL
sudo systemctl restart mysql

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status geral
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql
```

---

## 🆘 Troubleshooting

### Backend não inicia:
```bash
cd /var/www/tradehub/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
# Ver erros no terminal
```

### Erro de conexão ao banco:
```bash
# Testar conexão
sudo mysql -u tradehub_user -p tradehub_db
```

### Site não carrega:
```bash
# Verificar logs do Nginx
sudo tail -f /var/log/nginx/tradehub_error.log

# Testar configuração
sudo nginx -t
```

---

## 📞 Suporte

Em caso de dúvidas, verifique:
- Logs do PM2: `pm2 logs`
- Logs do Nginx: `/var/log/nginx/`
- Logs do MySQL: `/var/log/mysql/error.log`
