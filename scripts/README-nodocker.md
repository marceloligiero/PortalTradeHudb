# PortalTradeHub -- Deploy Nativo Windows (sem Docker)

**Nao requer Docker, Nginx, NSSM, nem acesso Administrador.**

O backend FastAPI serve a API e o frontend na mesma porta.

## Pre-requisitos

| Ferramenta | Versao minima | Link |
|---|---|---|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Git | qualquer | https://git-scm.com |
| MySQL | 8.0 | https://dev.mysql.com/downloads/installer/ |

> Todos devem estar no PATH. Verificar com: `python --version`, `node -v`

---

## Primeira vez (setup)

```powershell
cd C:\PortalTradeDataHub
.\scripts\install-nodocker.ps1
```

O script:
1. Verifica pre-requisitos (Python, Node, Git, MySQL)
2. Cria e configura `backend\.env`
3. Cria Python venv + instala dependencias
4. Build do frontend (`npm ci && npm run build`)

---

## Uso diario

```powershell
# Iniciar
.\scripts\start-nodocker.ps1

# Parar
.\scripts\stop-nodocker.ps1
```

Acesso: **http://localhost:8000**

Para mudar a porta:
```powershell
.\scripts\install-nodocker.ps1 -BackendPort "3000"
```

---

## Atualizar apos git push

```powershell
.\scripts\deploy-nodocker.ps1
```

Faz: backup DB > git pull > pip install > npm build > restart

```powershell
.\scripts\deploy-nodocker.ps1 -SkipBackup   # sem backup
.\scripts\deploy-nodocker.ps1 -SkipPull      # sem git pull
```

---

## Estrutura

```
PortalTradeDataHub\
+-- backend\
|   +-- .venv\              <- Python virtual environment
|   +-- .env                <- DATABASE_URL com localhost
+-- frontend\
|   +-- dist\               <- Build estatico (servido pelo FastAPI)
+-- logs\
|   +-- backend-output.log
|   +-- backend-error.log
|   +-- pids.txt            <- PID do processo activo
+-- .nodocker-config        <- Porta e caminhos
```

---

## Troubleshooting

**Porta ja em uso:**
```powershell
.\scripts\stop-nodocker.ps1
```

**Ver logs em tempo real:**
```powershell
Get-Content logs\backend-error.log -Wait
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
