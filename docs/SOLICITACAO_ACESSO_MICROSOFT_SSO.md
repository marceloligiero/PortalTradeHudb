# Solicitação de Acesso — Integração SSO Microsoft (Entra ID)
## PortalTradeHub — Trade Finance · Santander

---

**Para:** Equipa de Identidade e Acessos / Azure Active Directory  
**De:** Equipa de Desenvolvimento — Trade Finance  
**Data:** 2026-04-03  
**Prioridade:** Normal  
**Referência:** Projecto PortalTradeHub — Autenticação Corporativa

---

## 1. Contexto e Justificação

O **PortalTradeHub (PTH)** é o sistema interno de gestão de formações, tutoria e relatórios operacionais da equipa de Trade Finance. Actualmente, os utilizadores autenticam-se com credenciais locais (email + password) geridas pelo sistema.

Pretende-se integrar a autenticação corporativa via **Microsoft Entra ID (Azure AD)** para que os colaboradores possam aceder ao PTH com as suas credenciais institucionais Santander, eliminando a necessidade de gerir palavras-passe separadas.

**Benefícios:**
- Eliminação de passwords locais para colaboradores internos
- Autenticação via MFA corporativo já existente
- Conformidade com políticas de identidade do Grupo Santander
- Gestão centralizada de acessos (offboarding automático)

---

## 2. O que é necessário configurar

### 2.1 — Criar uma App Registration no Azure Portal

Localização: **Azure Portal → Microsoft Entra ID → App registrations → New registration**

| Campo | Valor a preencher |
|-------|-------------------|
| **Name** | `PortalTradeHub-PTH` (ou nome conforme política interna) |
| **Supported account types** | *Accounts in this organizational directory only* (single tenant) |
| **Redirect URI — Platform** | Web |
| **Redirect URI — URL** | `https://portaltradedatahub/api/auth/microsoft/callback` |

> **Nota:** Se o PTH for acessível em múltiplos URLs (ex: homologação + produção), adicionar um Redirect URI por ambiente.

---

### 2.2 — Permissões de API necessárias (Microsoft Graph)

A aplicação precisa apenas de **uma permissão delegada**, de âmbito mínimo:

| API | Permissão | Tipo | Descrição |
|-----|-----------|------|-----------|
| Microsoft Graph | `User.Read` | Delegada | Ler o perfil básico do utilizador autenticado (nome, email, ID) |

> Esta permissão é **padrão e automática** em novas App Registrations — normalmente não requer aprovação adicional do administrador.

**Dados recolhidos via Microsoft Graph (`/v1.0/me`):**
- `mail` ou `userPrincipalName` — email institucional
- `displayName` — nome completo
- `id` — Object ID do utilizador (para referência futura)

O PTH **não acede** a emails, calendários, ficheiros, ou qualquer outro recurso do utilizador.

---

### 2.3 — Gerar um Client Secret

Localização: **App Registration → Certificates & secrets → New client secret**

| Campo | Valor recomendado |
|-------|------------------|
| **Description** | `PTH-Production-2026` |
| **Expires** | 24 meses (ou conforme política interna) |

> O secret só é visível uma vez após criação. Deve ser partilhado de forma segura com a equipa de desenvolvimento (ex: via cofre de segredos corporativo ou canal encriptado).

---

## 3. Informação a fornecer à equipa PTH

Após a configuração, partilhar os seguintes valores:

| Item | Onde encontrar | Para preencher em |
|------|---------------|-------------------|
| **Application (client) ID** | App Registration → Overview | `MICROSOFT_CLIENT_ID` |
| **Directory (tenant) ID** | App Registration → Overview | `MICROSOFT_TENANT_ID` |
| **Client Secret (value)** | Certificates & secrets | `MICROSOFT_CLIENT_SECRET` |
| **Redirect URI confirmado** | Authentication → Redirect URIs | `MICROSOFT_REDIRECT_URI` |

---

## 4. Fluxo de autenticação (para referência técnica)

```
Utilizador clica "Entrar com conta Microsoft"
        │
        ▼
GET /api/auth/microsoft/login
  └── Backend gera URL de autorização (MSAL) e redireciona
        │
        ▼
login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize
  └── Utilizador autentica com credenciais Santander (+ MFA se activado)
  └── Azure valida e redireciona de volta com authorization code
        │
        ▼
GET /api/auth/microsoft/callback?code=...&state=...
  └── Backend troca code por access_token (confidential client — secret nunca exposto ao browser)
  └── Backend chama GET https://graph.microsoft.com/v1.0/me
  └── Backend regista o utilizador na BD local (se novo) ou faz login (se já existe)
  └── Backend emite JWT interno PTH e redireciona para o frontend
        │
        ▼
/auth/callback?token=<JWT-PTH>
  └── Frontend armazena token em sessionStorage e inicia sessão
```

**Protocolo:** OAuth 2.0 Authorization Code Flow com Confidential Client (PKCE opcional)  
**Biblioteca:** [MSAL Python v1.31](https://github.com/AzureAD/microsoft-authentication-library-for-python)  
**Scope solicitado:** `User.Read` (delegado)

---

## 5. Impacto para utilizadores e sistemas existentes

| Aspecto | Impacto |
|---------|---------|
| Login local (email + password) | **Mantido e funcional** — o SSO é uma opção adicional, não substitui |
| Utilizadores existentes | Podem continuar a usar password local **ou** passar a usar SSO (associação automática por email) |
| Utilizadores novos via SSO | Criados automaticamente com role `USUARIO` — aguardam atribuição de perfil pelo ADMIN |
| Offboarding | Utilizador desactivado no Azure AD não consegue renovar sessão PTH (token expira em 30 min) |
| MFA corporativo | Aplicado automaticamente se activo na política do tenant |

---

## 6. Requisitos de rede / firewall

O servidor backend PTH (container Docker `tradehub-backend-prod`) precisa de acesso HTTPS de saída para:

| Endpoint | Porta | Protocolo | Finalidade |
|----------|-------|-----------|------------|
| `login.microsoftonline.com` | 443 | HTTPS | Troca de tokens OAuth2 |
| `graph.microsoft.com` | 443 | HTTPS | Leitura do perfil do utilizador |

> Estes são endpoints públicos Microsoft. Se o servidor estiver numa rede interna com proxy ou firewall de saída, é necessário garantir que estes domínios estão na whitelist.

---

## 7. Checklist de configuração (para a equipa de AD)

- [ ] App Registration criada com nome `PortalTradeHub-PTH`
- [ ] Redirect URI adicionado: `https://portaltradedatahub/api/auth/microsoft/callback`
- [ ] Permissão `User.Read` (Microsoft Graph, Delegada) confirmada
- [ ] Client Secret gerado com validade adequada
- [ ] Application ID, Tenant ID e Client Secret partilhados com equipa PTH
- [ ] (Opcional) Adicionar Redirect URI de homologação: `http://localhost:8100/api/auth/microsoft/callback`
- [ ] (Opcional) Configurar assignment required se se pretender restringir a utilizadores específicos

---

## 8. Contacto

**Equipa de desenvolvimento PTH — Trade Finance**

Para dúvidas técnicas sobre a integração, contactar a equipa responsável pelo projecto PortalTradeHub.
