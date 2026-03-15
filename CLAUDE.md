# CLAUDE.md — PortalTradeHub Skills Index

> Este ficheiro é o ponto de entrada. O Claude Code lê automaticamente.
> Todas as skills estão em `.claude/skills/`. Ler a skill relevante ANTES de executar a tarefa.

---

## Projecto

**PortalTradeHub** — Sistema de gestão de formações, tutoria, relatórios e suporte para equipas de trading.  
Stack: FastAPI (Python 3.13) + React + Tailwind + MySQL 8.0 + Docker Compose.  
341 testes. 5 roles (ADMIN, TRAINER, STUDENT, TRAINEE, MANAGER). CI/CD GitHub Actions.

---

## Skills Disponíveis

| Skill | Ficheiro | Quando usar |
|-------|---------|-------------|
| **Documentação** | `.claude/skills/01-documentacao.md` | Documentar o projecto, limpar código morto, recriar README |
| **Docker & Deploy** | `.claude/skills/02-docker-deploy.md` | Dockerizar, criar docker-compose, deploy Windows Server |
| **GitHub & CI/CD** | `.claude/skills/03-github-cicd.md` | Setup repositório, GitHub Actions, pipelines, branch protection |
| **Best Practices** | `.claude/skills/04-best-practices.md` | React, Node, Tailwind, FastAPI, MySQL, animações — referência |
| **Landing Page** | `.claude/skills/05-landing-page.md` | Transformar a landing page com cores Santander e animações |
| **Grafana & Relatórios** | `.claude/skills/06-grafana-relatorios.md` | Migrar relatórios para Grafana com SSO Microsoft |
| **Data Warehouse** | `.claude/skills/07-data-warehouse.md` | Criar DW star schema + ETL + dashboards React modernos |
| **Segurança Bancária** | `.claude/skills/08-seguranca-banco.md` | Auditoria OWASP, GDPR, compliance para deploy em banco |
| **Design System Santander** | `.claude/skills/09-design-system.md` | Cores, fontes, componentes, paleta completa Santander |
| **Animações** | `.claude/skills/10-animacoes.md` | Catálogo de 13 animações com Motion + GSAP |

---

## Como usar

Quando receber uma tarefa, identificar qual skill é relevante e ler o ficheiro ANTES de agir.

Exemplos:
- "Melhora a landing page" → Ler `05-landing-page.md` + `09-design-system.md` + `10-animacoes.md`
- "Prepara para produção no banco" → Ler `08-seguranca-banco.md`
- "Adiciona Grafana" → Ler `06-grafana-relatorios.md`
- "Dockeriza tudo" → Ler `02-docker-deploy.md`
- "Cria relatórios com dashboards modernos" → Ler `07-data-warehouse.md`

Múltiplas skills podem ser combinadas numa única tarefa.

---

## Regras Globais (aplicam-se SEMPRE)

1. **Ler antes de escrever.** Ler ficheiros existentes antes de alterar.
2. **341 testes devem continuar a passar** após qualquer alteração.
3. **Pedir confirmação** antes de apagar ficheiros.
4. **Sem secrets no código.** Variáveis de ambiente para tudo sensível.
5. **Dark/light mode** em tudo o que for frontend.
6. **i18n PT/ES/EN** em todos os textos visíveis.
7. **Mobile-first** em todo o frontend.
