# Configurar SSO Microsoft para Grafana

> Tempo estimado: 10–15 minutos
> Pré-requisito: conta de Administrador no Azure Portal (portal.azure.com)
> Custo: 0€ — OAuth2 com Entra ID é gratuito, Grafana OSS é gratuito

---

## Visão Geral

O Grafana OSS suporta OAuth2/OpenID Connect com Microsoft Entra ID (Azure AD) de forma nativa, sem precisar de licença Enterprise.

Fluxo:
```
Utilizador → "Sign in with Microsoft" → Azure login.microsoftonline.com
→ Token OAuth2 → Grafana valida → Utilizador criado/actualizado → Dashboards
```

---

## Passo 1 — Criar App Registration no Azure

1. Aceder a [portal.azure.com](https://portal.azure.com)
2. Navegar para **Microsoft Entra ID** → **App registrations** → **+ New registration**
3. Preencher:
   - **Name:** `TradeHub Grafana`
   - **Supported account types:** `Accounts in this organizational directory only`
   - **Redirect URI:**
     - Type: `Web`
     - URI: `https://SEU_DOMINIO/grafana/login/azuread`
       - Desenvolvimento local: `http://localhost:3001/grafana/login/azuread`
       - Produção: `https://portaltradedatahub.empresa.pt/grafana/login/azuread`
4. Clicar **Register**

---

## Passo 2 — Anotar os IDs necessários

Na página **Overview** da App Registration recém-criada:

| Campo no Azure                   | Variável no .env              |
|----------------------------------|-------------------------------|
| **Application (client) ID**      | `GRAFANA_AZURE_CLIENT_ID`     |
| **Directory (tenant) ID**        | `AZURE_TENANT_ID`             |

---

## Passo 3 — Criar Client Secret

1. No menu lateral: **Certificates & secrets** → **+ New client secret**
2. Preencher:
   - **Description:** `Grafana SSO`
   - **Expires:** 24 months (ou conforme política da empresa)
3. Clicar **Add**
4. Copiar o **Value** (coluna da esquerda) — **não** o Secret ID

> ⚠️ O Value só aparece UMA VEZ. Copiar imediatamente para `GRAFANA_AZURE_CLIENT_SECRET`.

---

## Passo 4 — Configurar API Permissions

1. No menu lateral: **API permissions** → **+ Add a permission**
2. Seleccionar **Microsoft Graph** → **Delegated permissions**
3. Pesquisar e seleccionar:
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
4. Clicar **Add permissions**
5. Clicar **Grant admin consent for [Nome do Tenant]** → confirmar

---

## Passo 5 — (Opcional) Configurar App Roles para mapear roles Grafana

Se quiser que os grupos Azure AD se mapeiem automaticamente para roles Grafana (Admin/Editor/Viewer):

1. No menu lateral: **App roles** → **+ Create app role**
2. Criar os 3 roles:

   | Display name      | Value    | Description                  |
   |-------------------|----------|------------------------------|
   | `Grafana Admin`   | `Admin`  | Acesso total ao Grafana       |
   | `Grafana Editor`  | `Editor` | Pode editar dashboards        |
   | `Grafana Viewer`  | `Viewer` | Só pode ver dashboards        |

3. Navegar para **Enterprise Applications** → `TradeHub Grafana` → **Users and groups**
4. Clicar **+ Add user/group**
5. Atribuir utilizadores ou grupos aos roles criados

> Se não configurar App Roles, todos os utilizadores entram como **Viewer** por defeito (comportamento seguro).

---

## Passo 6 — Actualizar o ficheiro .env

Abrir o ficheiro `.env` na raiz do projecto e preencher:

```env
# Activar SSO
GRAFANA_SSO_ENABLED=true

# IDs do Azure
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAFANA_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAFANA_AZURE_CLIENT_SECRET=valor-copiado-no-passo-3
```

---

## Passo 7 — Reiniciar Grafana

```bash
docker compose restart tradehub-grafana
```

Ou com make:
```bash
make restart-grafana
```

---

## Passo 8 — Verificar

1. Aceder a `http://localhost:3001/grafana/login` (ou `/grafana/login` via nginx)
2. Deve aparecer o botão **"Sign in with Microsoft"**
3. Fazer login com uma conta do tenant configurado
4. Verificar que o utilizador é criado em **Administration → Users**

---

## Mapeamento de Roles

| Configuração Azure AD                    | Role Grafana   |
|------------------------------------------|----------------|
| App Role = `Admin`                       | Admin          |
| App Role = `Editor`                      | Editor         |
| App Role = `Viewer` ou sem App Role      | Viewer         |
| `GF_AUTH_ANONYMOUS_ENABLED=true`         | Viewer anónimo (para iframes React) |

---

## Embedding em iframes (React)

Os dashboards estão embebidos no React via iframe com `GF_AUTH_ANONYMOUS_ENABLED=true`, o que permite visualização sem login. O SSO é para acesso directo ao Grafana `/grafana/`.

Se quiser forçar autenticação também nos iframes, desactivar `GF_AUTH_ANONYMOUS_ENABLED` e usar [Grafana Auth Proxy](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/auth-proxy/) ou tokens de serviço.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Botão Microsoft não aparece | Verificar `GRAFANA_SSO_ENABLED=true` e reiniciar container |
| `invalid_client` no Azure | Verificar `GRAFANA_AZURE_CLIENT_SECRET` — pode ter expirado |
| `redirect_uri_mismatch` | A URI registada no Azure tem de ser exactamente igual, incluindo protocolo e path |
| User criado mas sem role correcto | Verificar App Roles e atribuição em Enterprise Applications |
| Grafana mostra erro 500 | `docker compose logs tradehub-grafana` — procurar erros de auth |

---

## Variáveis de Ambiente — Referência Completa

| Variável                        | Obrigatória | Descrição                                  |
|---------------------------------|-------------|--------------------------------------------|
| `GRAFANA_SSO_ENABLED`           | ✓           | `true` para activar, `false` para desactivar |
| `AZURE_TENANT_ID`               | ✓           | Directory (tenant) ID do Azure             |
| `GRAFANA_AZURE_CLIENT_ID`       | ✓           | Application (client) ID da App Registration |
| `GRAFANA_AZURE_CLIENT_SECRET`   | ✓           | Client Secret Value (não o ID)             |
| `GRAFANA_ADMIN_USER`            | —           | Admin local (fallback, default: `admin`)   |
| `GRAFANA_ADMIN_PASSWORD`        | —           | Password do admin local                    |
| `GRAFANA_DOMAIN`                | —           | Domínio público (default: `localhost`)     |
| `GRAFANA_PORT`                  | —           | Porta exposta no host (default: `3001`)    |
