# Arquitetura do Sistema — Portal TradeDataHub

**Classificação:** Interno
**Versão:** 1.0
**Data:** 2026-03-15

---

## 1. Visão Geral

O Portal TradeDataHub é uma aplicação web composta por três camadas principais, totalmente containerizada com Docker.

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / LAN                        │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS (80/443)
┌─────────────────────▼───────────────────────────────────┐
│              tradehub-frontend (nginx)                   │
│  - React SPA (Vite build)                                │
│  - Proxy /api → tradehub-backend:8000                    │
│  - Headers de segurança CSP, X-Frame, etc.               │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (rede interna Docker)
┌─────────────────────▼───────────────────────────────────┐
│              tradehub-backend (FastAPI)                  │
│  - Python 3.13 + SQLAlchemy 2.0                          │
│  - JWT auth (PyJWT)                                      │
│  - bcrypt password hashing                               │
│  - ETL pipeline (Data Warehouse)                         │
└─────────────────────┬───────────────────────────────────┘
                      │ TCP 3306 (127.0.0.1 only)
┌─────────────────────▼───────────────────────────────────┐
│              tradehub-db (MySQL 8.0)                     │
│  - Porta 3307 exposta apenas em 127.0.0.1                │
│  - Volume persistente: tradehub_db_data                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Componentes

### 2.1 Frontend (React + TypeScript)
- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 5
- **State management**: Zustand (token em `sessionStorage`)
- **UI**: Tailwind CSS + Shadcn/ui
- **i18n**: react-i18next (PT-PT, ES, EN)
- **Segurança**: DOMPurify para sanitização de HTML, axios com interceptors de auth

### 2.2 Backend (FastAPI + Python)
- **Framework**: FastAPI 0.115+
- **ORM**: SQLAlchemy 2.0 (async-ready)
- **Auth**: JWT (PyJWT 2.8.0) + bcrypt
- **Migrations**: sistema automático via `app/migrate.py`
- **Módulos de rotas**:
  - `app/routes/`: admin, auth, courses, challenges, etc.
  - `app/routers/`: tutoria, chamados, internal_errors, stats, dw

### 2.3 Base de Dados (MySQL 8.0)
- Porta 3306 interna (exposta em 127.0.0.1:3307 para administração local)
- Utilizador de aplicação: `tradehub_user` (acesso restrito a `tradehub_db`)
- Root acessível apenas localmente

### 2.4 Grafana (Analytics)
- Versão: OSS
- SSO via Microsoft Entra ID
- Acesso anónimo desabilitado

---

## 3. Redes Docker

| Rede | Tipo | Serviços |
|------|------|----------|
| `tradehub_network` | bridge (interna) | todos |

Nenhum serviço de base de dados tem porta exposta publicamente.

---

## 4. CI/CD Pipeline

```
git push main
    │
    ▼
CI (ci.yml)
├── Backend: lint + testes (341) + Bandit SAST + pip-audit
└── Frontend: lint + type check + build + npm audit
    │
    ▼ (em caso de sucesso)
Build & Push (build-and-push.yml)
└── Build Docker images → GHCR
    │
    ▼ (após build)
Deploy (deploy.yml)
└── SSH → servidor → docker compose up -d
```

---

## 5. Decisões Arquiteturais

| Decisão | Justificação |
|---------|-------------|
| sessionStorage em vez de localStorage para JWT | Evita persistência do token após fecho do browser (XSS mitigation) |
| DOMPurify em todos os pontos de renderização HTML | Prevenção de mXSS (A03 OWASP) |
| PyJWT em vez de python-jose | CVE-2024-33664 (python-jose não mantido ativamente) |
| Swagger desabilitado em produção | Reduz superfície de ataque (H02) |
| MySQL port bound to 127.0.0.1 | Impede acesso externo dieto à DB (H12) |
| appleboy/ssh-action removido | Supply chain — runtime code execution em produção (C12) |
