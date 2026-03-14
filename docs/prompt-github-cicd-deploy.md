# Prompt para Agente Opus 4.6 — Setup GitHub + CI/CD + Deploy Profissional

---

> **Como usar:** Cole o prompt abaixo no seu agente (Claude Code, Cursor, Windsurf, etc.) com o projeto aberto no VS Code.

---

## O Prompt

```
Você é um engenheiro DevOps/SRE sénior. A sua missão é transformar este projeto local num repositório GitHub profissional com um pipeline de CI/CD completo e deploy automatizado via Docker para um servidor Windows.

O projeto deve seguir as melhores práticas da indústria em 2026. O resultado final: qualquer push para a branch main testa, builda, e pode deployar automaticamente.

Execute as fases na ordem. Não salte etapas. Peça confirmação antes de alterar ficheiros existentes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — ANÁLISE DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de criar qualquer coisa, percorra o projeto e identifique:

1. Stack tecnológica exata (linguagem, framework, versões)
2. Gestor de pacotes (npm, yarn, pnpm, pip, etc.)
3. Comandos de build, test, lint existentes
4. Estrutura de pastas
5. Ficheiros Docker existentes (se houver)
6. Variáveis de ambiente necessárias
7. Dependências de infraestrutura (DB, cache, etc.)
8. Se já existe .git inicializado

Apresente o resumo antes de avançar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — PREPARAR O REPOSITÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 2.1 — Inicializar Git (se necessário)

```bash
git init
git branch -M main
```

### 2.2 — .gitignore completo

Criar um .gitignore profissional adaptado à stack. DEVE incluir:

```gitignore
# ══════════════════════════════════════
# Dependências
# ══════════════════════════════════════
node_modules/
__pycache__/
*.pyc
.venv/
venv/
vendor/

# ══════════════════════════════════════
# Ambiente
# ══════════════════════════════════════
.env
.env.local
.env.*.local
!.env.example

# ══════════════════════════════════════
# Build / Output
# ══════════════════════════════════════
dist/
build/
.next/
out/
*.egg-info/

# ══════════════════════════════════════
# Logs
# ══════════════════════════════════════
logs/
*.log
npm-debug.log*

# ══════════════════════════════════════
# IDE
# ══════════════════════════════════════
.vscode/settings.json
.vscode/launch.json
.idea/
*.swp
*.swo
*~

# ══════════════════════════════════════
# OS
# ══════════════════════════════════════
.DS_Store
Thumbs.db
desktop.ini

# ══════════════════════════════════════
# Docker (volumes locais)
# ══════════════════════════════════════
docker-volumes/

# ══════════════════════════════════════
# Testes / Cobertura
# ══════════════════════════════════════
coverage/
.nyc_output/
htmlcov/
.pytest_cache/

# ══════════════════════════════════════
# Temporários
# ══════════════════════════════════════
*.tmp
*.bak
*.bkp
```

Adaptar à stack real do projeto.

### 2.3 — .editorconfig

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.py]
indent_size = 4

[Makefile]
indent_style = tab
```

### 2.4 — .env.example

Ficheiro com TODAS as variáveis de ambiente necessárias, sem valores reais:

```env
# ══════════════════════════════════════
# [NOME DO PROJETO]
# Copiar para .env e preencher
# NUNCA commitar o .env com valores reais
# ══════════════════════════════════════

NODE_ENV=development
APP_PORT=8080
APP_SECRET=GERAR_SECRET_AQUI

DB_HOST=localhost
DB_PORT=3306
DB_NAME=app
DB_USER=app
DB_PASSWORD=DEFINIR_AQUI
```

### 2.5 — Estrutura de branches

O projeto vai usar **trunk-based development simplificado**:

```
main          → produção (protegida, só recebe merges via PR)
develop       → desenvolvimento ativo
feature/*     → features novas (branch de develop, merge para develop)
hotfix/*      → correções urgentes (branch de main, merge para main + develop)
release/*     → preparação de release (opcional)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — GITHUB ACTIONS: CI/CD PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Criar a pasta `.github/` com a seguinte estrutura:

```
.github/
├── workflows/
│   ├── ci.yml              # Testes + Lint (roda em todo push/PR)
│   ├── build-and-push.yml  # Build Docker + Push para registry (só main)
│   └── deploy.yml          # Deploy para servidor (manual ou automático)
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
└── dependabot.yml
```

### 3.1 — ci.yml (Integração Contínua)

```yaml
# ══════════════════════════════════════════════════════
# CI — Testes, Lint, Type Check
# Roda em TODOS os pushes e PRs
# ══════════════════════════════════════════════════════
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup [runtime]
        uses: actions/setup-node@v4  # ou setup-python, etc.
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run typecheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: lint
    services:
      db:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping -h localhost"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup [runtime]
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DB_HOST: localhost
          DB_PORT: 3306
          DB_USER: root
          DB_PASSWORD: test
          DB_NAME: test_db

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

ADAPTAR 100% à stack real:
- Se Python → `setup-python`, `pip install`, `pytest`
- Se tem frontend + backend → jobs separados com matrix ou jobs paralelos
- Se tem E2E → job adicional com Playwright/Cypress

### 3.2 — build-and-push.yml (Build e Push de Imagem Docker)

```yaml
# ══════════════════════════════════════════════════════
# Build & Push — Imagem Docker
# Roda APENAS quando CI passa na main
# ══════════════════════════════════════════════════════
name: Build & Push

on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

permissions:
  contents: read
  packages: write

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
```

NOTA: Usa o **GitHub Container Registry (ghcr.io)** — gratuito para repos públicos, incluído no plano para privados. Alternativas: Docker Hub, AWS ECR, Azure ACR.

### 3.3 — deploy.yml (Deploy para Servidor Windows)

```yaml
# ══════════════════════════════════════════════════════
# Deploy — Servidor Windows
# Trigger manual OU automático após build
# ══════════════════════════════════════════════════════
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Ambiente de deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - staging
          - production

  workflow_run:
    workflows: ["Build & Push"]
    types: [completed]

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy to ${{ github.event.inputs.environment || 'production' }}
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}
    timeout-minutes: 15
    environment:
      name: ${{ github.event.inputs.environment || 'production' }}
      url: ${{ vars.APP_URL }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          script: |
            cd ${{ vars.DEPLOY_PATH }}

            # Pull a nova imagem
            docker login ghcr.io -u ${{ github.actor }} -p ${{ secrets.GHCR_TOKEN }}
            docker compose pull

            # Backup do estado atual (para rollback)
            docker compose exec -T [projeto]-db mysqldump -u root -p${{ secrets.DB_ROOT_PASSWORD }} ${{ vars.DB_NAME }} > backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || true

            # Deploy com zero downtime
            docker compose up -d --no-deps --build [projeto]-app

            # Verificar health
            echo "Aguardando health check..."
            for i in $(seq 1 30); do
              if curl -sf http://localhost:${{ vars.APP_PORT }}/health > /dev/null 2>&1; then
                echo "✅ Deploy concluído com sucesso!"
                exit 0
              fi
              echo "Tentativa $i/30..."
              sleep 2
            done

            echo "❌ Health check falhou! Fazendo rollback..."
            docker compose rollback 2>/dev/null || docker compose up -d
            exit 1

      - name: Notify success
        if: success()
        run: echo "✅ Deploy para ${{ github.event.inputs.environment || 'production' }} concluído"

      - name: Notify failure
        if: failure()
        run: echo "❌ Deploy falhou. Verificar logs."
```

ALTERNATIVA para servidores sem SSH (Windows puro):
- Usar **self-hosted runner** do GitHub Actions no servidor Windows
- O runner executa os comandos Docker diretamente sem precisar de SSH

Self-hosted runner setup:
```yaml
jobs:
  deploy:
    runs-on: [self-hosted, windows, production]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy
        shell: pwsh
        run: |
          Set-Location $env:DEPLOY_PATH
          docker compose pull
          docker compose up -d --no-deps [projeto]-app

          # Health check
          $maxRetries = 30
          for ($i = 1; $i -le $maxRetries; $i++) {
            try {
              $response = Invoke-WebRequest -Uri "http://localhost:$env:APP_PORT/health" -TimeoutSec 3
              if ($response.StatusCode -eq 200) {
                Write-Host "✅ Deploy OK"
                exit 0
              }
            } catch {
              Write-Host "Tentativa $i/$maxRetries..."
              Start-Sleep -Seconds 2
            }
          }
          Write-Host "❌ Health check falhou"
          exit 1
```

### 3.4 — dependabot.yml (Atualização automática de dependências)

```yaml
version: 2
updates:
  # Dependências da aplicação
  - package-ecosystem: "npm"  # ou pip, cargo, etc.
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "automated"
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
      - "automated"

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "monthly"
    labels:
      - "docker"
      - "automated"
```

### 3.5 — PULL_REQUEST_TEMPLATE.md

```markdown
## Descrição
<!-- O que esta PR faz e porquê -->

## Tipo de mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Refactor
- [ ] Documentação
- [ ] CI/CD

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada (se aplicável)
- [ ] Sem secrets hardcoded
- [ ] Self-review feito

## Screenshots (se aplicável)
```

### 3.6 — Issue Templates

**bug_report.md:**
```markdown
---
name: Bug Report
about: Reportar um bug
labels: bug
---

## Descrição do Bug
<!-- O que aconteceu -->

## Comportamento Esperado
<!-- O que deveria acontecer -->

## Passos para Reproduzir
1.
2.
3.

## Ambiente
- OS:
- Browser:
- Versão:
```

**feature_request.md:**
```markdown
---
name: Feature Request
about: Sugerir uma nova funcionalidade
labels: enhancement
---

## Descrição
<!-- O que gostaria que existisse -->

## Problema que resolve
<!-- Que problema esta feature resolve -->

## Alternativas consideradas
<!-- Já pensou noutras soluções? -->
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 4 — SEGURANÇA E SECRETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 4.1 — GitHub Secrets necessários

Liste TODOS os secrets que precisam ser configurados no GitHub:

```
📋 SECRETS A CONFIGURAR NO GITHUB
═══════════════════════════════════

Repository Settings → Secrets and variables → Actions

Secrets (valores sensíveis):
  - SERVER_HOST          → IP ou hostname do servidor Windows
  - SERVER_USER          → Utilizador SSH do servidor
  - SERVER_SSH_KEY       → Chave SSH privada (ed25519)
  - SERVER_PORT          → Porta SSH (default: 22)
  - GHCR_TOKEN           → Token para pull de imagens no servidor
  - DB_ROOT_PASSWORD     → Password root do MySQL

Variables (valores não sensíveis):
  - APP_URL              → URL da aplicação
  - APP_PORT             → Porta da aplicação (ex: 8080)
  - DEPLOY_PATH          → Caminho no servidor (ex: C:\Apps\[projeto])
  - DB_NAME              → Nome da base de dados
```

### 4.2 — Environments do GitHub

Configurar dois environments:

**staging:**
- Sem aprovação manual
- Secrets próprios (servidor de staging)

**production:**
- Aprovação manual obrigatória (pelo menos 1 reviewer)
- Deployment branches: só `main`
- Wait timer: 5 minutos (tempo para cancelar)
- Secrets de produção

### 4.3 — Branch Protection Rules (para main)

```
Repository Settings → Branches → Add rule → main

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale PR approvals on new pushes
✅ Require status checks to pass before merging
   ✅ Require branches to be up to date
   Status checks: "Lint & Type Check", "Tests"
✅ Require conversation resolution before merging
✅ Do not allow bypassing the above settings
❌ Allow force pushes (NUNCA em main)
❌ Allow deletions (NUNCA em main)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 5 — DOCKER PARA DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se ainda não existem ficheiros Docker, criá-los agora. Se já existem do prompt anterior, verificar que estão corretos.

### Checklist Docker obrigatório:
- ✅ Dockerfile multi-stage (deps → build → production)
- ✅ docker-compose.yml com todos os serviços
- ✅ docker-compose.override.yml para dev local
- ✅ .dockerignore otimizado
- ✅ .env.example com todas as variáveis
- ✅ Health checks em todos os serviços
- ✅ Container names com prefixo do projeto
- ✅ Volumes nomeados com prefixo do projeto
- ✅ Rede Docker isolada
- ✅ Memory limits em todos os containers
- ✅ Non-root user no Dockerfile
- ✅ Imagens com versão fixa (nunca :latest em base images)

### docker-compose.yml deve referenciar imagens do GHCR em produção:

```yaml
services:
  [projeto]-app:
    image: ghcr.io/[owner]/[repo]:latest  # Em produção, usa a imagem do registry
    # build: . ← comentar ou remover em produção
```

### Criar docker-compose.prod.yml (override para produção):

```yaml
# ══════════════════════════════════════════════════════
# Produção — usar com: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# ══════════════════════════════════════════════════════
services:
  [projeto]-app:
    image: ghcr.io/[owner]/[repo]:latest
    build: !reset null
    volumes: !reset []
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 6 — SCRIPTS DE DEPLOY PARA WINDOWS SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Criar uma pasta `scripts/` na raiz com scripts PowerShell para o servidor:

### scripts/setup-server.ps1 (primeira vez no servidor)

```powershell
# ══════════════════════════════════════════════════════
# Setup inicial do servidor Windows
# Executar UMA VEZ no primeiro deploy
# ══════════════════════════════════════════════════════
param(
    [string]$ProjectPath = "C:\Apps\[projeto]",
    [string]$GhcrToken,
    [string]$GhcrUser
)

$ErrorActionPreference = "Stop"

Write-Host "═══ Setup do Servidor ═══" -ForegroundColor Cyan

# 1. Verificar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não encontrado. Instale o Docker Desktop ou Docker Engine." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker encontrado: $(docker --version)" -ForegroundColor Green

# 2. Verificar Docker Compose
docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Compose não encontrado." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker Compose encontrado" -ForegroundColor Green

# 3. Criar pasta do projeto
if (-not (Test-Path $ProjectPath)) {
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
    Write-Host "✅ Pasta criada: $ProjectPath" -ForegroundColor Green
}

# 4. Login no GitHub Container Registry
Write-Host "Fazendo login no GHCR..."
echo $GhcrToken | docker login ghcr.io -u $GhcrUser --password-stdin
Write-Host "✅ Login GHCR OK" -ForegroundColor Green

# 5. Verificar portas
$port = [PORTA_DA_APP]
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️ Porta $port já em uso! Alterar APP_PORT no .env" -ForegroundColor Yellow
} else {
    Write-Host "✅ Porta $port disponível" -ForegroundColor Green
}

Write-Host "`n═══ Setup concluído! ═══" -ForegroundColor Cyan
Write-Host "Próximos passos:"
Write-Host "1. cd $ProjectPath"
Write-Host "2. git clone [URL] ."
Write-Host "3. copy .env.example .env"
Write-Host "4. Editar .env com valores de produção"
Write-Host "5. docker compose pull"
Write-Host "6. docker compose up -d"
```

### scripts/deploy.ps1 (deploy manual no servidor)

```powershell
# ══════════════════════════════════════════════════════
# Deploy manual — executar no servidor Windows
# ══════════════════════════════════════════════════════
param(
    [switch]$SkipBackup,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "═══ Deploy Iniciado ═══" -ForegroundColor Cyan

# 1. Backup da DB
if (-not $SkipBackup) {
    Write-Host "Criando backup da base de dados..."
    $backupDir = ".\backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
    docker compose exec -T [projeto]-db mysqldump -u root -p"$env:DB_ROOT_PASSWORD" $env:DB_NAME > "$backupDir\backup_$timestamp.sql" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup criado: backup_$timestamp.sql" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backup falhou (DB pode estar vazia)" -ForegroundColor Yellow
    }
}

# 2. Pull da nova imagem
Write-Host "Pulling nova imagem..."
docker compose pull
Write-Host "✅ Pull concluído" -ForegroundColor Green

# 3. Capturar imagem atual (para rollback)
$currentImage = docker compose images [projeto]-app --format "{{.Repository}}:{{.Tag}}" 2>$null

# 4. Deploy
Write-Host "Atualizando containers..."
docker compose up -d --no-deps [projeto]-app
Write-Host "✅ Container atualizado" -ForegroundColor Green

# 5. Health check
Write-Host "Verificando health..."
$maxRetries = 30
$healthy = $false
for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$env:APP_PORT/health" -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Write-Host "  Tentativa $i/$maxRetries..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if ($healthy) {
    Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "Versão: $(docker compose images [projeto]-app --format '{{.Tag}}')" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Health check falhou!" -ForegroundColor Red
    if ($currentImage -and -not $Force) {
        Write-Host "Fazendo rollback para $currentImage..." -ForegroundColor Yellow
        docker compose up -d --no-deps [projeto]-app
        Write-Host "Rollback concluído. Verificar logs: docker compose logs -f [projeto]-app" -ForegroundColor Yellow
    }
    exit 1
}

# 6. Limpeza de imagens antigas
Write-Host "Limpando imagens antigas..."
docker image prune -f --filter "label=org.opencontainers.image.source=https://github.com/[owner]/[repo]" 2>$null
Write-Host "✅ Limpeza concluída" -ForegroundColor Green
```

### scripts/rollback.ps1 (rollback rápido)

```powershell
# ══════════════════════════════════════════════════════
# Rollback — reverter para a versão anterior
# ══════════════════════════════════════════════════════
param(
    [string]$Tag  # Tag específica para rollback (opcional)
)

$ErrorActionPreference = "Stop"

Write-Host "═══ Rollback ═══" -ForegroundColor Yellow

if ($Tag) {
    Write-Host "Rollback para tag: $Tag"
    $image = "ghcr.io/[owner]/[repo]:$Tag"
} else {
    Write-Host "Rollback para a imagem anterior..."
    # Listar as 2 imagens mais recentes
    $images = docker images "ghcr.io/[owner]/[repo]" --format "{{.Tag}}" | Select-Object -First 2
    if ($images.Count -lt 2) {
        Write-Host "❌ Não há imagem anterior para rollback" -ForegroundColor Red
        exit 1
    }
    $image = "ghcr.io/[owner]/[repo]:$($images[1])"
}

Write-Host "Imagem: $image"

# Atualizar docker-compose para usar a imagem específica
docker compose up -d --no-deps [projeto]-app

Write-Host "✅ Rollback concluído" -ForegroundColor Green
Write-Host "Verificar: docker compose logs -f [projeto]-app" -ForegroundColor Cyan
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 7 — COMMIT INICIAL E PUSH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 7.1 — Verificar que NÃO há secrets no repositório

Antes do primeiro push, verificar:

```bash
# Procurar por possíveis secrets
grep -r "password\|secret\|token\|api_key\|apikey\|private_key" --include="*.ts" --include="*.js" --include="*.py" --include="*.json" --include="*.yml" --include="*.yaml" . | grep -v node_modules | grep -v .git
```

Se encontrar secrets hardcoded, remover antes de commitar.

### 7.2 — Criar repositório no GitHub

Instruções para o utilizador:

```
1. Ir a github.com → New Repository
2. Nome: [nome-do-projeto]
3. Visibilidade: Private (recomendado para projetos comerciais)
4. NÃO inicializar com README (já temos)
5. Criar
```

### 7.3 — Primeiro commit

```bash
# Adicionar remote
git remote add origin git@github.com:[owner]/[repo].git

# Commit inicial
git add .
git commit -m "feat: setup inicial do projeto com CI/CD

- Estrutura de projeto
- Dockerfile multi-stage
- Docker Compose (dev + prod)
- GitHub Actions (CI + Build + Deploy)
- Branch protection e templates
- Scripts de deploy para Windows Server
- Documentação completa"

# Push
git push -u origin main
```

### 7.4 — Criar branch develop

```bash
git checkout -b develop
git push -u origin develop
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 8 — DOCUMENTAÇÃO DE DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Atualizar o README.md com uma secção de deploy completa, e criar/atualizar o DEPLOY.md.

O DEPLOY.md deve cobrir:

1. **Pré-requisitos do servidor** (Docker, Git, portas disponíveis)
2. **Setup inicial** (clone, .env, primeiro deploy)
3. **Deploy automático** (como o CI/CD funciona, o que é automático)
4. **Deploy manual** (como usar os scripts PowerShell)
5. **Rollback** (como reverter para a versão anterior)
6. **Monitorização** (logs, health checks)
7. **Backup e restore** da base de dados
8. **Troubleshooting** (problemas comuns e soluções)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 9 — RELATÓRIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RELATÓRIO DE SETUP GITHUB + CI/CD
══════════════════════════════════════

📁 REPOSITÓRIO:
   - URL: github.com/[owner]/[repo]
   - Branches: main (protegida), develop
   - Visibilidade: Private/Public

🔄 CI/CD PIPELINE:
   - ci.yml → Lint + Type Check + Tests (todo push/PR)
   - build-and-push.yml → Docker build + push GHCR (main, após CI)
   - deploy.yml → Deploy para servidor (automático ou manual)
   - dependabot.yml → Updates semanais de dependências

🐳 DOCKER:
   - Registry: ghcr.io/[owner]/[repo]
   - Tags: latest, SHA do commit, semver
   - Build cache: GitHub Actions cache

🔒 SEGURANÇA:
   - Branch protection em main
   - Secrets no GitHub (X configurados)
   - Environment protection para produção
   - Dependabot ativo
   - Zero secrets no código

📜 SCRIPTS:
   - scripts/setup-server.ps1 (setup inicial)
   - scripts/deploy.ps1 (deploy manual com backup + rollback)
   - scripts/rollback.ps1 (rollback rápido)

📝 DOCUMENTAÇÃO:
   - README.md atualizado
   - DEPLOY.md completo
   - PR template
   - Issue templates

⚠️ AÇÕES MANUAIS NECESSÁRIAS:
   - [ ] Criar repositório no GitHub
   - [ ] Configurar secrets no GitHub
   - [ ] Configurar environments (staging, production)
   - [ ] Configurar branch protection rules
   - [ ] Instalar Docker no servidor Windows
   - [ ] Executar setup-server.ps1 no servidor
   - [ ] Fazer primeiro deploy manual
   - [ ] Verificar que o pipeline funciona end-to-end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS GERAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Adaptar TUDO à stack real do projeto.
- NUNCA commitar .env com valores reais.
- NUNCA usar :latest em FROM do Dockerfile (versão fixa).
- Pin de versões em TODAS as GitHub Actions (usar @v4, não @main).
- Permissões mínimas em todos os workflows.
- Concurrency groups para evitar deploys simultâneos.
- Timeout em todos os jobs.
- O pipeline deve funcionar para: push → test → build → deploy, com cada etapa dependente da anterior.
- SEMPRE peça confirmação antes de alterar ficheiros existentes.
```
