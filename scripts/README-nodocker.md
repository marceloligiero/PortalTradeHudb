# PortalTradeHub -- Deploy Nativo Windows (sem Docker)

**Nao requer Docker, NSSM, nem acesso Administrador.**

## Pre-requisitos (instalar manualmente)

| Ferramenta | Versao minima | Link |
|---|---|---|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Git | qualquer | https://git-scm.com |
| MySQL | 8.0 | https://dev.mysql.com/downloads/installer/ |
| Nginx for Windows | 1.24+ | https://nginx.org/en/download.html |

> Nginx: extrair para qualquer pasta (ex: `C:\nginx` ou dentro do projeto em `nginx\`).
> Todos devem estar no PATH. Verificar com: `python --version`, `node -v`

---

## Primeira vez (setup completo)

```powershell
cd C:\PortalTradeDataHub
.\scripts\install-nodocker.ps1
```

Se o Nginx nao esta em `C:\nginx`:
```powershell
.\scripts\install-nodocker.ps1 -NginxPath "D:\minha-pasta\nginx"
```

O script faz automaticamente:
1. Verifica pre-requisitos (Python, Node, Git, MySQL, Nginx)
2. Cria e configura `backend\.env` (corrige hostname Docker para localhost)
3. Cria Python venv + instala `requirements.txt`
4. Build do frontend (`npm ci && npm run build`)
5. Gera `nginx-tradehub.conf` (config standalone do Nginx)

---

## Uso diario

### Iniciar
```powershell
.\scripts\start-nodocker.ps1
```
Inicia backend (uvicorn) e frontend (nginx) como processos normais.

### Parar
```powershell
.\scripts\stop-nodocker.ps1
```

### Atualizar apos git push
```powershell
.\scripts\deploy-nodocker.ps1
```
Faz: backup DB > git pull > pip install > npm build > restart

Parametros opcionais:
```powershell
.\scripts\deploy-nodocker.ps1 -SkipBackup   # sem backup
.\scripts\deploy-nodocker.ps1 -SkipPull      # sem git pull
```

---

## Portas

| Servico | Porta | URL |
|---|---|---|
| Frontend (Nginx) | 8080 | http://localhost:8080 |
| Backend (Uvicorn) | 8000 | http://localhost:8000/api |

Para mudar portas:
```powershell
.\scripts\install-nodocker.ps1 -BackendPort "9000" -FrontendPort "3000"
```

---

## Estrutura resultante

```
PortalTradeDataHub\
+-- backend\
|   +-- .venv\              <- Python virtual environment
|   +-- .env                <- DATABASE_URL com localhost
+-- frontend\
|   +-- dist\               <- Build estatico servido pelo Nginx
+-- logs\
|   +-- backend-output.log
|   +-- backend-error.log
|   +-- nginx-error.log
|   +-- nginx-access.log
|   +-- nginx.pid
|   +-- pids.txt            <- PIDs dos processos activos
+-- nginx-tradehub.conf     <- Config Nginx standalone
+-- .nodocker-config        <- Configuracao dos scripts
```

---

## Troubleshooting

**Erro "porta ja em uso":**
```powershell
.\scripts\stop-nodocker.ps1
# ou matar manualmente:
Get-Process -Name "uvicorn","nginx" | Stop-Process -Force
```

**Ver logs em tempo real:**
```powershell
Get-Content logs\backend-error.log -Wait
Get-Content logs\nginx-error.log -Wait
```

**Reinstalar do zero:**
```powershell
.\scripts\stop-nodocker.ps1
Remove-Item backend\.venv -Recurse -Force
Remove-Item frontend\dist -Recurse -Force
Remove-Item .nodocker-config -Force
.\scripts\install-nodocker.ps1
.\scripts\start-nodocker.ps1
```
