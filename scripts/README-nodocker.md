# PortalTradeHub — Deploy Nativo Windows (sem Docker)

## Pré-requisitos (instalar manualmente)

| Ferramenta | Versão mínima | Link |
|---|---|---|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Git | qualquer | https://git-scm.com |
| MySQL | 8.0 | https://dev.mysql.com/downloads/installer/ |
| Nginx for Windows | 1.24+ | https://nginx.org/en/download.html — extrair para `C:\nginx` |
| NSSM | 2.24+ | https://nssm.cc/download — colocar `nssm.exe` em `C:\Windows\System32\` |

> Todos devem estar no PATH. Verificar com: `python --version`, `node -v`, `nginx -v`, `nssm version`

---

## Primeira vez (setup completo)

```powershell
# PowerShell como Administrador
cd C:\PortalTradeDataHub
.\scripts\install-nodocker.ps1
```

O script faz automaticamente:
1. Verifica pré-requisitos
2. Cria e configura `backend\.env` (DB_HOST ajustado para `localhost`)
3. Cria Python venv + instala `requirements.txt`
4. Build do frontend (`npm ci && npm run build`)
5. Gera e instala o config do Nginx em `C:\nginx\conf\conf.d\tradehub.conf`
6. Regista os serviços Windows via NSSM:
   - `tradehub-backend` — uvicorn na porta 8000
   - `tradehub-nginx`   — Nginx na porta 80
7. Inicia ambos os serviços

**Parâmetros opcionais:**
```powershell
.\scripts\install-nodocker.ps1 -NginxPath "D:\nginx" -BackendPort "8000" -FrontendPort "80"
```

---

## Atualizar após git push

```powershell
.\scripts\deploy-nodocker.ps1
```

Faz: backup DB → git pull → pip install → npm build → restart serviços → health check

**Parâmetros:**
```powershell
.\scripts\deploy-nodocker.ps1 -SkipBackup   # sem backup
.\scripts\deploy-nodocker.ps1 -SkipPull     # sem git pull
```

---

## Comandos úteis

```powershell
# Estado dos serviços
nssm status tradehub-backend
nssm status tradehub-nginx

# Parar tudo
nssm stop tradehub-backend
nssm stop tradehub-nginx

# Iniciar tudo
nssm start tradehub-backend
nssm start tradehub-nginx

# Logs em tempo real
Get-Content logs\backend-stderr.log -Wait
Get-Content logs\nginx-stderr.log -Wait

# Testar backend
curl http://localhost:8000/docs

# Testar nginx
curl http://localhost
```

---

## Estrutura resultante

```
PortalTradeDataHub\
├── backend\
│   ├── .venv\          ← Python virtual environment
│   └── .env            ← DB_HOST=localhost (editado pelo install)
├── frontend\
│   └── dist\           ← Build estático servido pelo Nginx
├── logs\
│   ├── backend-stdout.log
│   ├── backend-stderr.log
│   └── nginx-stderr.log
└── backups\
    └── pre-deploy-*.sql
```

**Serviços Windows registados:**
- `tradehub-backend` → `backend\.venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port 8000`
- `tradehub-nginx`   → `C:\nginx\nginx.exe -p C:\nginx`

Ambos com `Start=SERVICE_AUTO_START` (iniciam com o Windows).
