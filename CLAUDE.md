# CLAUDE.md — PortalTradeHub

> Ponto de entrada automático do Claude Code.
> Skills do projecto em `.claude/skills/`. Community skills em `.agents/skills/` (1.381 instaladas).
> **Ler a skill relevante ANTES de executar qualquer tarefa.**

---

## Projecto

**PortalTradeHub** — Gestão de formações, tutoria, relatórios e suporte para equipas de trading.
Stack: **FastAPI (Python 3.13) + React 18 + Tailwind CSS + MySQL 8.0 + Docker Compose.**
451 testes. 5 roles: ADMIN, TRAINER, STUDENT, TRAINEE, MANAGER. CI/CD GitHub Actions.
Design System: **Santander** — `#EC0000` primary, `font-headline`, dark/light via `dark:` classes.

---

## Skills do Projecto (ler sempre primeiro)

| # | Skill | Ficheiro | Domínio |
|---|-------|---------|---------|
| 01 | **Documentação** | `.claude/skills/01-documentacao.md` | Docs, README, changelog |
| 02 | **Docker & Deploy** | `.claude/skills/02-docker-deploy.md` | Docker Compose, Windows Server deploy |
| 03 | **GitHub & CI/CD** | `.claude/skills/03-github-cicd.md` | GitHub Actions, branch protection |
| 04 | **Best Practices** | `.claude/skills/04-best-practices.md` | React, FastAPI, MySQL, Tailwind — referência geral |
| 05 | **Landing Page** | `.claude/skills/05-landing-page.md` | Landing page, animações, Santander style |
| 07 | **Data Warehouse** | `.claude/skills/07-data-warehouse.md` | DW star schema, ETL, dashboards |
| 08 | **Segurança Bancária** | `.claude/skills/08-seguranca-banco.md` | OWASP Top 10, GDPR, compliance bancário |
| 09 | **Design System** | `.claude/skills/09-design-system.md` | Cores, fontes, componentes Santander |
| 10 | **Animações** | `.claude/skills/10-animacoes.md` | Motion + GSAP, 13 padrões de animação |

---

## Community Skills — por Domínio

Usar com `/skill-name` ou via ferramenta Skill. Combinam com as skills do projecto.

### Frontend / React / Tailwind
| Skill | Quando usar |
|-------|------------|
| `frontend-design` | Criar/refinar UI, layout, hierarquia visual |
| `tailwind-design-system` | Padrões Tailwind, tokens, variáveis de design |
| `tailwind-patterns` | Classes utilitárias avançadas, customização |
| `web-design-guidelines` | Guidelines gerais de web design |
| `vercel-react-best-practices` | Padrões React modernos, hooks, composição |
| `react-patterns` | Patterns avançados: HOC, context, portals |
| `react-ui-patterns` | Componentes UI: tabelas, modais, forms |
| `responsive-design` | Mobile-first, breakpoints, fluid layouts |
| `web-accessibility` | WCAG, ARIA, a11y em componentes |
| `typescript-pro` | TypeScript avançado, tipos, generics |
| `shadcn` | shadcn/ui — componentes Radix + Tailwind |
| `animate` | Animações CSS/JS, transições, micro-interações |
| `polish` | Refinamento visual final, detalhes de UI |
| `critique` | Revisão crítica de design, UX feedback |
| `i18n-localization` | PT/ES/EN, react-i18next, namespaces |

### Backend / FastAPI / Python
| Skill | Quando usar |
|-------|------------|
| `fastapi-templates` | Estrutura FastAPI, routers, schemas, deps |
| `fastapi-pro` | Padrões avançados FastAPI, middleware, lifespan |
| `python-fastapi-development` | Dev workflow FastAPI + Pydantic |
| `python-pro` | Python idiomático, tipagem, async |
| `python-testing-patterns` | pytest, fixtures, mocks, coverage |
| `api-design-principles` | REST design, versionamento, contratos |
| `api-design` | Modelação de endpoints, request/response |
| `python-performance-optimization` | Profiling, cache, queries N+1 |

### Base de Dados / MySQL
| Skill | Quando usar |
|-------|------------|
| `database-schema-design` | Schema design, normalização, índices |
| `database-design` | Relacionamentos, cardinalidade, ERD |
| `database-migrations-sql-migrations` | Migrations SQL, Flyway-style, rollback |
| `sql-pro` | Queries complexas, CTEs, window functions |
| `database-optimizer` | Performance de queries, EXPLAIN, índices |

### Docker / DevOps / Deploy
| Skill | Quando usar |
|-------|------------|
| `docker-expert` | Dockerfile, multi-stage, compose, redes |
| `deployment-automation` | Pipelines CI/CD, artefactos, rollout |
| `deployment-procedures` | Runbooks de deploy, checklist produção |
| `monitoring-observability` | Logs, métricas, alertas, healthchecks |

### Segurança
| Skill | Quando usar |
|-------|------------|
| `security-best-practices` | OWASP, hardening geral |
| `security-audit` | Revisão de segurança de código |
| `api-security-best-practices` | Auth JWT, rate limiting, validação |
| `web-security-testing` | XSS, CSRF, injection, CORS |

### Qualidade de Código / Testes
| Skill | Quando usar |
|-------|------------|
| `code-review` | Revisão estruturada de PRs |
| `code-review-excellence` | Revisão aprofundada, feedback detalhado |
| `systematic-debugging` | Debug metódico, root cause analysis |
| `test-driven-development` | TDD red-green-refactor cycle |
| `clean-code` | Legibilidade, SOLID, refactoring |
| `performance-optimization` | Optimização frontend e backend |

---

## Mapeamento Tarefa → Skills

| Tarefa | Skills a usar (ordem de prioridade) |
|--------|--------------------------------------|
| Componente React novo | `09-design-system` + `frontend-design` + `tailwind-design-system` + `react-patterns` |
| Página de relatórios/dashboard | `07-data-warehouse` + `frontend-design` + `react-ui-patterns` |
| Landing page / marketing | `05-landing-page` + `09-design-system` + `10-animacoes` + `animate` |
| Endpoint FastAPI novo | `04-best-practices` + `fastapi-templates` + `api-design-principles` |
| Schema / migration SQL | `07-data-warehouse` + `database-schema-design` + `database-migrations-sql-migrations` |
| Docker / deploy produção | `02-docker-deploy` + `docker-expert` + `deployment-procedures` |
| Auditoria segurança | `08-seguranca-banco` + `security-audit` + `api-security-best-practices` |
| CI/CD / GitHub Actions | `03-github-cicd` + `deployment-automation` |
| Animações / transições | `10-animacoes` + `animate` + `polish` |
| Debug de bug complexo | `systematic-debugging` + `code-review` |
| i18n / tradução | `i18n-localization` (verificar `en.json`, `es.json`, `pt-PT.json`) |
| Refactoring / limpeza | `clean-code` + `code-review-excellence` + `performance-optimization` |
| Acessibilidade | `web-accessibility` + `responsive-design` |

---

## Regras Globais (aplicam-se SEMPRE)

1. **Ler antes de escrever** — ler ficheiros existentes antes de alterar qualquer coisa.
2. **341 testes devem continuar a passar** após qualquer alteração de backend.
3. **Pedir confirmação** antes de apagar ficheiros ou fazer destructive operations.
4. **Sem secrets no código** — variáveis de ambiente para tudo sensível.
5. **Dark/light mode** — usar `dark:` classes Tailwind, nunca ternários `isDark`.
6. **i18n PT/ES/EN** — todos os textos visíveis no frontend.
7. **Mobile-first** — design começa no mobile, expande para desktop.
8. **Design System Santander** — `#EC0000` primary, `#CC0000` hover, `font-headline`, sem framer-motion.
9. **Deploy pipeline**: `npm run build` → `docker cp dist/. tradehub-frontend:/usr/share/nginx/html/` → `nginx -s reload`.
