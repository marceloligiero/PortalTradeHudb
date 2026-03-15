# CLAUDE.md — Migrar Relatórios para Grafana com SSO Microsoft

> Instruções para Claude Code. Colocar na raiz do projeto PortalTradeHub.

---

## MISSÃO

Migrar TODOS os relatórios do Portal de Relatórios do TradeHub para **Grafana OSS** com autenticação **SSO Microsoft (Entra ID / Azure AD)**. O processo:

1. Identificar cada relatório existente (backend + frontend)
2. Criar versão equivalente ou melhor em Grafana para cada um
3. Configurar Grafana com SSO Microsoft Entra ID
4. Integrar Grafana na aplicação React
5. Remover os relatórios antigos do frontend

---

## CUSTOS — ZERO

```
Grafana OSS:           GRATUITO (open-source, AGPL-3.0)
SSO Microsoft Entra ID: GRATUITO (incluído no Entra ID Free/P1 que a empresa já tem)
MySQL Datasource:      GRATUITO (built-in no Grafana OSS)
OAuth2 Azure AD:       GRATUITO (built-in no Grafana OSS, NÃO precisa de Enterprise)
Embedding:             GRATUITO (config allow_embedding no Grafana OSS)
Alertas:               GRATUITO (unified alerting no Grafana OSS)

TOTAL: 0€. Tudo open-source + licenças que a empresa já paga (Microsoft 365/Entra ID).
```

**NOTA:** O SSO com Microsoft Entra ID funciona no Grafana OSS via OAuth2/OpenID Connect. NÃO é necessário Grafana Enterprise. O SAML é que requer Enterprise — mas OAuth2 faz exactamente a mesma coisa e é gratuito.

---

## REGRAS

```
1. NÃO tocar no backend Python EXCEPTO para ler queries dos relatórios existentes
2. NÃO quebrar os 341 testes
3. NÃO remover os endpoints de API existentes (/api/relatorios/*, /api/stats, etc.)
4. SÓ remover componentes frontend DEPOIS de validar que Grafana cobre tudo
5. Pedir confirmação antes de apagar ficheiros
6. Secrets (client_id, client_secret, tenant_id) vão em variáveis de ambiente, NUNCA no código
```

---

## FASE 1 — INVENTÁRIO COMPLETO DOS RELATÓRIOS

Antes de criar qualquer coisa, mapear CADA relatório.

### 1.1 — Encontrar endpoints de relatórios no backend

```bash
grep -rn "relatorio\|report\|stats\|dashboard\|overview\|advanced\|knowledge_matrix" \
  backend/app/routes/ backend/app/routers/ --include="*.py"
```

Ler cada ficheiro encontrado. Endpoints conhecidos:
```
GET /api/relatorios/overview
GET /api/relatorios/formacoes
GET /api/relatorios/tutoria
GET /api/relatorios/teams
GET /api/advanced-reports
GET /api/admin/stats
GET /api/admin/reports
GET /api/tutoria/dashboard
GET /api/knowledge_matrix
GET /api/stats
```

### 1.2 — Para CADA endpoint documentar

```
📊 RELATÓRIO #N: [Nome]
  Endpoint: GET /api/...
  Ficheiro: backend/app/routes/[ficheiro].py linha X
  Query/ORM: [descrever o que faz — quais tabelas, JOINs, GROUP BY, filtros]
  Response: { campo1: tipo, campo2: tipo, ... }
  Auth: Bearer / ADMIN / etc.
```

### 1.3 — Encontrar componentes frontend

```bash
find frontend/src/pages -name "*relat*" -o -name "*report*" -o -name "*dashboard*" \
  -o -name "*stats*" -o -name "*overview*" 2>/dev/null

grep -rn "recharts\|Chart\|BarChart\|LineChart\|PieChart" \
  frontend/src/ --include="*.tsx" -l
```

### 1.4 — Para CADA componente documentar

```
🖥️ COMPONENTE #N: [Nome]
  Ficheiro: frontend/src/pages/Relatorios/[ficheiro].tsx
  Rota: /relatorios
  Endpoint(s): GET /api/relatorios/overview
  Visual: tabela / cards / gráfico barras / etc.
  Charts library: recharts / chart.js / nenhuma
```

### 1.5 — Apresentar inventário e aguardar confirmação

```
📋 INVENTÁRIO COMPLETO
═══════════════════════

BACKEND: X endpoints de relatórios
FRONTEND: X componentes/páginas de relatórios
CHARTS LIB: [recharts / chart.js / etc.]

#  | Nome              | Endpoint                  | Frontend         | Tipo
---|-------------------|---------------------------|------------------|------
1  | Overview          | /api/relatorios/overview   | OverviewPage.tsx | Cards
2  | Formações         | /api/relatorios/formacoes  | FormacoesPage.tsx| Tabela
...

Aguardo confirmação para avançar.
```

---

## FASE 2 — ADICIONAR GRAFANA AO DOCKER COMPOSE

### 2.1 — Serviço Grafana no docker-compose.yml

```yaml
  tradehub-grafana:
    container_name: tradehub-grafana
    image: grafana/grafana-oss:11.4.0
    volumes:
      - tradehub_grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      # ── Server ────────────────────────────
      GF_SERVER_HTTP_PORT: "3001"
      GF_SERVER_ROOT_URL: "%(protocol)s://%(domain)s/grafana/"
      GF_SERVER_SERVE_FROM_SUB_PATH: "true"

      # ── SSO Microsoft Entra ID (Azure AD) ─
      GF_AUTH_AZUREAD_ENABLED: "true"
      GF_AUTH_AZUREAD_NAME: "Microsoft"
      GF_AUTH_AZUREAD_ALLOW_SIGN_UP: "true"
      GF_AUTH_AZUREAD_AUTO_LOGIN: "false"
      GF_AUTH_AZUREAD_CLIENT_ID: ${GRAFANA_AZURE_CLIENT_ID}
      GF_AUTH_AZUREAD_CLIENT_SECRET: ${GRAFANA_AZURE_CLIENT_SECRET}
      GF_AUTH_AZUREAD_SCOPES: "openid email profile"
      GF_AUTH_AZUREAD_AUTH_URL: "https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize"
      GF_AUTH_AZUREAD_TOKEN_URL: "https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token"
      GF_AUTH_AZUREAD_API_URL: "https://graph.microsoft.com/oidc/userinfo"
      GF_AUTH_AZUREAD_ALLOWED_ORGANIZATIONS: ${AZURE_TENANT_ID}
      GF_AUTH_AZUREAD_ROLE_ATTRIBUTE_STRICT: "false"
      GF_AUTH_AZUREAD_SKIP_ORG_ROLE_SYNC: "false"
      GF_AUTH_AZUREAD_USE_PKCE: "true"

      # ── Embedding (para iframes no React) ──
      GF_SECURITY_ALLOW_EMBEDDING: "true"
      GF_AUTH_ANONYMOUS_ENABLED: "true"
      GF_AUTH_ANONYMOUS_ORG_ROLE: "Viewer"
      GF_SECURITY_COOKIE_SAMESITE: "lax"

      # ── Admin local (fallback) ─────────────
      GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}

      # ── UI ─────────────────────────────────
      GF_USERS_ALLOW_SIGN_UP: "false"
      GF_ALERTING_ENABLED: "true"
      GF_UNIFIED_ALERTING_ENABLED: "true"
      GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH: "/var/lib/grafana/dashboards/home.json"
    ports:
      - "${GRAFANA_PORT:-3001}:3001"
    depends_on:
      tradehub-db:
        condition: service_healthy
    networks:
      - tradehub-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M
```

Volume:
```yaml
volumes:
  tradehub_grafana_data:
    name: tradehub_grafana_data
```

### 2.2 — Estrutura de ficheiros Grafana

```
grafana/
├── provisioning/
│   ├── datasources/
│   │   └── mysql.yml
│   └── dashboards/
│       └── dashboards.yml
└── dashboards/
    ├── home.json
    ├── formacoes.json
    ├── tutoria.json
    ├── chamados.json
    ├── equipas.json
    ├── erros-internos.json
    └── executive.json
```

### 2.3 — Datasource MySQL (provisioning automático)

```yaml
# grafana/provisioning/datasources/mysql.yml
apiVersion: 1
datasources:
  - name: TradeHub MySQL
    type: mysql
    access: proxy
    url: tradehub-db:3306
    database: ${DB_NAME:-tradehub_db}
    user: ${DB_USER:-root}
    secureJsonData:
      password: ${DB_PASSWORD}
    jsonData:
      maxOpenConns: 5
      maxIdleConns: 2
      connMaxLifetime: 14400
    isDefault: true
    editable: false
```

### 2.4 — Dashboard provisioning

```yaml
# grafana/provisioning/dashboards/dashboards.yml
apiVersion: 1
providers:
  - name: TradeHub
    orgId: 1
    folder: TradeHub
    type: file
    disableDeletion: true
    editable: false
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
```

### 2.5 — Nginx proxy para Grafana

Adicionar ao nginx.conf do `tradehub-frontend`:

```nginx
location /grafana/ {
    proxy_pass http://tradehub-grafana:3001/grafana/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 2.6 — Atualizar .env.example

```env
# ══════════════════════════════════════
# Grafana
# ══════════════════════════════════════
GRAFANA_PORT=3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=DEFINIR_PASSWORD_FORTE

# ══════════════════════════════════════
# Grafana SSO — Microsoft Entra ID (Azure AD)
# ══════════════════════════════════════
# Criar App Registration no Azure Portal:
# 1. portal.azure.com → Microsoft Entra ID → App Registrations → New
# 2. Nome: "TradeHub Grafana"
# 3. Redirect URI: https://SEU_DOMINIO/grafana/login/azuread
# 4. Copiar Application (client) ID → GRAFANA_AZURE_CLIENT_ID
# 5. Copiar Directory (tenant) ID → AZURE_TENANT_ID
# 6. Certificates & secrets → New client secret → copiar Value → GRAFANA_AZURE_CLIENT_SECRET
# 7. API Permissions → Add → Microsoft Graph → Delegated: openid, email, profile, User.Read
# 8. Grant admin consent
#
AZURE_TENANT_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
GRAFANA_AZURE_CLIENT_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
GRAFANA_AZURE_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## FASE 3 — CRIAR DASHBOARDS GRAFANA

Criar um dashboard JSON para cada relatório identificado na FASE 1. Cada dashboard:

- Usa queries SQL **directas ao MySQL** (não usa a API do backend — o Grafana conecta direto à DB)
- Queries baseadas EXCLUSIVAMENTE nas tabelas reais (ler `backend/app/models.py` para nomes exactos)
- Template variables para filtros ($timeRange, $team, $role)
- Auto-refresh 5 minutos
- Dark theme como padrão
- Thresholds com cores

### Mapeamento: Relatório Antigo → Dashboard Grafana

Para CADA relatório identificado na FASE 1, criar o equivalente:

```
Relatório Antigo                    → Dashboard Grafana
═══════════════════════════════════════════════════════
/api/relatorios/overview            → home.json (KPIs globais + tendências + alertas)
/api/relatorios/formacoes           → formacoes.json (certificados, cursos, rankings)
/api/relatorios/tutoria             → tutoria.json (erros, resolução, performance)
/api/relatorios/teams               → equipas.json (comparação, health score)
/api/advanced-reports               → executive.json (ADMIN — insights cruzados)
/api/admin/stats                    → home.json (incorporado nos KPIs)
/api/admin/reports                  → executive.json (incorporado)
/api/tutoria/dashboard              → tutoria.json (incorporado)
/api/knowledge_matrix               → formacoes.json (painel de matriz)
/api/stats                          → home.json (incorporado nos KPIs)
```

**REGRA:** Cada relatório antigo deve ter um equivalente claro no Grafana. Nenhum dado pode ser perdido na migração. O Grafana deve mostrar MAIS do que o antigo (filtros, tendências, comparações).

### Dashboard por dashboard — queries SQL

Para cada dashboard, ler o endpoint backend correspondente, copiar a lógica da query (ORM → SQL), e recriá-la como query Grafana.

**Exemplo de tradução:**

```python
# Backend (ORM SQLAlchemy)
db.query(func.count(Certificate.id)).filter(
    Certificate.issued_at >= start_of_month
).scalar()
```

```sql
-- Grafana (SQL direto)
SELECT COUNT(*) as "Certificados este mês"
FROM certificates
WHERE issued_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
```

**Para CADA relatório:** ler a query ORM no backend → traduzir para SQL → criar painel Grafana.

### Tipos de painéis por relatório

**home.json (Overview):**
- Stat panels: users ativos, cursos, certificados mês, erros abertos, chamados abertos
- Time series: certificados e erros por mês (últimos 12 meses)
- Pie chart: users por role, erros por categoria
- Table: itens pendentes (erros >7 dias, chamados sem resposta)

**formacoes.json:**
- Stat panels: cursos ativos, lições, desafios, certificados mês, taxa conclusão
- Time series: certificados por mês
- Bar chart: top 10 cursos, top trainers
- Pie chart: cursos por nível, desafios por dificuldade

**tutoria.json:**
- Stat panels: erros totais, abertos, resolvidos, taxa resolução, tempo médio
- Bar chart: erros por status (funil)
- Time series: criados vs resolvidos por mês
- Pie chart: erros por categoria
- Table: performance por aluno, performance por trainer

**chamados.json:**
- Stat panels: total, abertos, em progresso, resolvidos
- Time series: volume por semana
- Bar chart: por status
- Table: mais antigos sem resposta

**equipas.json:**
- Bar chart agrupado: métricas por equipa
- Gauge: health score por equipa
- Table: membros com métricas individuais

**erros-internos.json:**
- Stat panels: total, abertos, fichas de aprendizagem
- Time series: erros por mês

**executive.json (ADMIN/MANAGER):**
- KPIs com trend
- Comparação MoM
- Insights cruzados (correlação formação↔erros)
- Alertas activos

---

## FASE 4 — SSO MICROSOFT ENTRA ID

### 4.1 — Configuração no Azure Portal (documentar para o utilizador)

Criar um ficheiro `docs/GRAFANA_SSO_SETUP.md`:

```markdown
# Configurar SSO Microsoft para Grafana

## Pré-requisitos
- Acesso de administrador ao Azure Portal (portal.azure.com)
- Tenant Microsoft Entra ID (antigo Azure AD)

## Passo 1 — Criar App Registration

1. Portal Azure → Microsoft Entra ID → App Registrations → "+ New registration"
2. Nome: "TradeHub Grafana"
3. Supported account types: "Accounts in this organizational directory only"
4. Redirect URI:
   - Type: Web
   - URI: https://SEU_DOMINIO/grafana/login/azuread
5. Clicar "Register"

## Passo 2 — Anotar IDs

Na página Overview da app criada:
- **Application (client) ID** → copiar para GRAFANA_AZURE_CLIENT_ID
- **Directory (tenant) ID** → copiar para AZURE_TENANT_ID

## Passo 3 — Criar Client Secret

1. Certificates & secrets → "+ New client secret"
2. Description: "Grafana SSO"
3. Expires: 24 months (ou conforme política da empresa)
4. Copiar o **Value** (não o Secret ID!) → GRAFANA_AZURE_CLIENT_SECRET

⚠️ O Value só aparece UMA VEZ. Copiar imediatamente.

## Passo 4 — Configurar API Permissions

1. API permissions → "+ Add a permission"
2. Microsoft Graph → Delegated permissions
3. Selecionar: openid, email, profile, User.Read
4. Clicar "Add permissions"
5. Clicar "Grant admin consent for [Tenant Name]"

## Passo 5 — (Opcional) Configurar App Roles para mapear roles Grafana

1. App roles → "+ Create app role"
2. Criar roles:
   - Display name: "Grafana Admin" → Value: "Admin"
   - Display name: "Grafana Editor" → Value: "Editor"  
   - Display name: "Grafana Viewer" → Value: "Viewer"
3. Enterprise Applications → TradeHub Grafana → Users and groups
4. Atribuir users/grupos aos roles

## Passo 6 — Atualizar .env

Copiar os valores para o ficheiro .env do projeto:
```env
AZURE_TENANT_ID=valor-copiado
GRAFANA_AZURE_CLIENT_ID=valor-copiado
GRAFANA_AZURE_CLIENT_SECRET=valor-copiado
```

## Passo 7 — Reiniciar Grafana

```bash
docker compose restart tradehub-grafana
```

Aceder a /grafana/ — deve aparecer botão "Sign in with Microsoft".

## Mapeamento de Roles (opcional)

Se configurou App Roles no passo 5, os users do Azure AD são automaticamente mapeados:
- Azure "Admin" → Grafana Admin
- Azure "Editor" → Grafana Editor
- Azure "Viewer" → Grafana Viewer (padrão)

Se NÃO configurou App Roles, todos entram como Viewer (seguro por defeito).
```

### 4.2 — Configuração no Docker Compose (já incluída na FASE 2)

As variáveis `GF_AUTH_AZUREAD_*` no docker-compose.yml já configuram tudo. O Grafana OSS suporta OAuth2 com Entra ID nativamente — NÃO precisa de Enterprise.

### 4.3 — Fluxo de autenticação

```
User abre /grafana/ 
  → Grafana mostra "Sign in with Microsoft"
  → Redirect para login.microsoftonline.com
  → User faz login com conta Microsoft corporativa
  → Entra ID valida + devolve token
  → Grafana cria/atualiza user com email + role
  → User vê dashboards conforme o seu role
```

Para dashboards embebidos no React (iframe), o anonymous viewer permite ver sem login. Se quiser forçar auth nos iframes também, desativar `GF_AUTH_ANONYMOUS_ENABLED` e usar auth proxy ou token forwarding.

---

## FASE 5 — INTEGRAR GRAFANA NO REACT

### 5.1 — Componente de embedding

Criar `frontend/src/components/GrafanaDashboard.tsx`:

```tsx
interface Props {
  dashboardUid: string;
  panelId?: number;       // para embeber painel individual
  theme?: 'light' | 'dark';
  from?: string;          // "now-30d"
  to?: string;            // "now"
  height?: string;
  variables?: Record<string, string>;
}

// Usa iframe para /grafana/d/{uid} ou /grafana/d-solo/{uid}
// Adiciona ?kiosk para remover header
// Sincroniza tema com ThemeContext
```

### 5.2 — Reescrever página de relatórios

Substituir os componentes antigos por iframes Grafana com tabs:

```
/relatorios           → Tab "Overview" → embebe home.json
/relatorios/formacoes → Tab "Formações" → embebe formacoes.json
/relatorios/tutoria   → Tab "Tutoria" → embebe tutoria.json
/relatorios/chamados  → Tab "Chamados" → embebe chamados.json
/relatorios/equipas   → Tab "Equipas" → embebe equipas.json
/relatorios/executive → Tab "Executivo" → embebe executive.json (ADMIN/MANAGER)
```

Link direto para Grafana: botão "Abrir no Grafana ↗" em cada tab para quem quiser a experiência completa.

---

## FASE 6 — REMOVER RELATÓRIOS ANTIGOS DO FRONTEND

**SÓ DEPOIS de validar que Grafana cobre tudo.**

### 6.1 — Listar o que vai ser removido

```
🗑️ COMPONENTES A REMOVER:
- frontend/src/pages/Relatorios/OverviewPage.tsx → substituído por Grafana home.json
- frontend/src/pages/Relatorios/FormacoesReport.tsx → substituído por formacoes.json
- frontend/src/pages/Relatorios/TutoriaReport.tsx → substituído por tutoria.json
- frontend/src/pages/Relatorios/TeamsReport.tsx → substituído por equipas.json
- frontend/src/components/charts/[vários].tsx → já não usados
- [listar cada ficheiro]

📦 DEPENDÊNCIAS A AVALIAR:
- recharts / chart.js → se já não é importado em NENHUM outro lugar, pode remover do package.json

⚠️ NÃO REMOVER:
- Endpoints de API backend → mantêm para backward compatibility
- Testes do backend → intactos
```

### 6.2 — Aguardar confirmação e executar

---

## FASE 7 — MAKEFILE

Adicionar ao Makefile:

```makefile
grafana-logs:      ## Logs do Grafana
	docker compose logs -f tradehub-grafana

grafana-shell:     ## Shell no Grafana
	docker compose exec tradehub-grafana sh

grafana-restart:   ## Reiniciar Grafana
	docker compose restart tradehub-grafana
```

---

## VALIDAÇÃO

```
✅ GRAFANA
   - Container tradehub-grafana healthy
   - Acessível em /grafana/
   - Datasource MySQL conecta e retorna dados
   - 7 dashboards carregam sem erros SQL
   - Template variables funcionam (filtros)
   - Auto-refresh funciona
   - Dark mode funciona

✅ SSO MICROSOFT
   - Botão "Sign in with Microsoft" aparece na página de login do Grafana
   - Login com conta Microsoft corporativa funciona
   - User é criado automaticamente no Grafana com email correto
   - (Se configurado) Roles do Azure AD mapeiam para roles Grafana
   - Logout funciona
   - docs/GRAFANA_SSO_SETUP.md está completo e correto

✅ EMBEDDING
   - Dashboards embebidos no React via iframe carregam
   - Tema sincroniza (dark/light)
   - Kiosk mode activo (sem header Grafana nos iframes)
   - Tabs de navegação funcionam

✅ MIGRAÇÃO
   - CADA relatório antigo tem equivalente em Grafana
   - Grafana mostra MAIS do que os antigos (filtros, tendências, comparações)
   - Componentes antigos de relatórios removidos
   - Endpoints de API backend intactos
   - 341 testes passam
   - Zero erros de consola

✅ .env.example
   - Variáveis Grafana documentadas
   - Variáveis Azure AD documentadas com instruções
```

---

## RESUMO DO SSO

```
┌─────────────────────────────────────────────────────────┐
│ GRAFANA OSS + Microsoft Entra ID SSO                    │
│                                                         │
│ Custo Grafana:    0€ (open-source)                      │
│ Custo SSO:        0€ (OAuth2 built-in, Entra ID Free)   │
│ Licença Enterprise: NÃO necessária                       │
│                                                         │
│ Protocolo: OAuth2 / OpenID Connect (NÃO SAML)           │
│ Config: variáveis GF_AUTH_AZUREAD_* no Docker Compose   │
│ App Registration: 1x no Azure Portal (5 min setup)      │
│                                                         │
│ Fluxo: User → "Sign in with Microsoft" → Azure login    │
│        → Token → Grafana cria user → Dashboards          │
│                                                         │
│ Roles: Azure AD App Roles → Grafana Admin/Editor/Viewer │
│ Fallback: admin local com password (para emergências)   │
└─────────────────────────────────────────────────────────┘
```
