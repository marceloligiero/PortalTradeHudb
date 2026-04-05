# Relatório de Implementação SSO Microsoft — PTH

## Data: 2026-04-03
## Estado: CONCLUÍDO (pendente configuração de variáveis Azure reais)

---

## Ficheiros modificados

| Ficheiro | Alteração |
|---|---|
| `backend/.env.example` | Adicionadas 4 variáveis `MICROSOFT_*` com placeholders e comentários |
| `backend/requirements.txt` | Adicionado `msal==1.31.0` |
| `backend/app/config.py` | Adicionadas 4 settings SSO com defaults seguros |
| `backend/app/models.py` | `hashed_password` → nullable; novos campos `sso_provider`, `sso_id` |
| `backend/main.py` | Import + registo de `auth_sso.router` com prefix `/api/auth` |
| `frontend/src/App.tsx` | Import + rota `/auth/callback` → `<AuthCallback />` |
| `frontend/src/pages/LoginPage.tsx` | Botão SSO Microsoft adicionado entre form e botão de registo |
| `frontend/public/locales/pt-PT/translation.json` | Chaves `auth.sso.*` |
| `frontend/public/locales/en/translation.json` | Chaves `auth.sso.*` |
| `frontend/public/locales/es/translation.json` | Chaves `auth.sso.*` |

## Ficheiros criados

| Ficheiro | Descrição |
|---|---|
| `backend/app/routes/auth_sso.py` | Router FastAPI com endpoints `/login` e `/callback` |
| `database/migrations/V014__add_sso_fields.sql` | Migration: `sso_provider`, `sso_id`, `hashed_password` nullable |
| `frontend/src/pages/AuthCallback.tsx` | Página intermédia que recebe `?token=` e faz login no store |

---

## Migration executada
- [ ] `V014__add_sso_fields.sql` — aplicada automaticamente no arranque do backend (sistema de auto-migrations)

---

## Variáveis de ambiente adicionadas

```env
MICROSOFT_CLIENT_ID=        # Application (client) ID do Azure
MICROSOFT_TENANT_ID=common  # 'common' ou ID do tenant específico
MICROSOFT_CLIENT_SECRET=    # Client secret gerado no Azure portal
MICROSOFT_REDIRECT_URI=     # Ex: https://portaltradedatahub/api/auth/microsoft/callback
```

---

## Fluxo implementado

```
1. Utilizador clica "Entrar com conta Microsoft"
   └── window.location.href = VITE_API_URL + /auth/microsoft/login

2. GET /api/auth/microsoft/login
   └── msal.initiate_auth_code_flow() → guarda flow dict em memória (10 min TTL)
   └── RedirectResponse → login.microsoftonline.com

3. Utilizador autentica na Microsoft
   └── Microsoft redireciona → GET /api/auth/microsoft/callback?code=...&state=...

4. GET /api/auth/microsoft/callback
   └── Recupera flow dict da cache pelo state
   └── msal.acquire_token_by_auth_code_flow() → access_token Microsoft
   └── GET https://graph.microsoft.com/v1.0/me → email + displayName
   └── Lookup na BD (users.email); cria utilizador se não existir (role=USUARIO)
   └── create_access_token({"sub": user.email}) → JWT PTH
   └── RedirectResponse → FRONTEND_URL/auth/callback?token=<JWT>

5. /auth/callback (React)
   └── GET /api/auth/me com o JWT → dados completos do utilizador
   └── authStore.login(user, token) → sessão iniciada
   └── navigate('/') → dashboard
```

---

## Login local: MANTIDO e funcional ✓

Os endpoints `/api/auth/login` e `/api/auth/register` não foram alterados.

---

## Pendente / Ações manuais necessárias

- [ ] Criar App Registration no [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
  - Platform: Web
  - Redirect URI: `https://portaltradedatahub/api/auth/microsoft/callback`
- [ ] Preencher `MICROSOFT_CLIENT_ID`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_SECRET` no `backend/.env`
- [ ] Preencher `MICROSOFT_REDIRECT_URI` com o URI de redirect registado no Azure
- [ ] Instalar dependência: `pip install msal==1.31.0` (ou rebuild Docker)
- [ ] Rever role padrão dos utilizadores SSO novos (actualmente `USUARIO` sem flags — aguarda validação admin)
- [ ] Para multi-instância Docker: substituir o cache em memória (`_FLOW_CACHE`) por Redis

## Notas de segurança

- CSRF protegido via MSAL `state` parameter (validado por `acquire_token_by_auth_code_flow`)
- Utilizadores SSO inativos (`is_active=False`) são bloqueados antes da emissão do JWT
- JWT emitido tem o mesmo formato e expiração do login local (30 min, `SECRET_KEY` do `.env`)
- `MICROSOFT_CLIENT_SECRET` nunca exposto ao frontend
