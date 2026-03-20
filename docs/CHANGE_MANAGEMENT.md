# Gestão de Mudanças — Portal TradeDataHub

**Classificação:** Interno
**Versão:** 1.0
**Data:** 2026-03-15

---

## 1. Âmbito

Este documento define o processo de gestão de mudanças para o Portal TradeDataHub, cobrindo código, configuração, infraestrutura e bases de dados.

---

## 2. Tipos de Mudança

| Tipo | Definição | Exemplos | Aprovação |
|------|-----------|---------|-----------|
| **Standard** | Mudança de rotina, baixo risco, bem documentada | Deploy de nova feature, update de dep | CI/CD automático |
| **Normal** | Mudança planificada, risco moderado | Refactoring, nova integração | Code review + merge em main |
| **Emergency** | Correção crítica urgente (hotfix) | Patch de segurança P1 | ADMIN + deploy imediato |

---

## 3. Processo de Deploy (Standard/Normal)

```
1. Desenvolvimento → branch de feature
2. Pull Request para main
3. CI automático: lint + testes (341) + SAST + audit
4. Code review por pelo menos 1 revisor
5. Merge em main → trigger Build & Push automático
6. Deploy automático via GitHub Actions
7. Verificação pós-deploy (health check)
```

### 3.1 Gatilhos CI/CD

| Evento | Workflow | Ação |
|--------|---------|------|
| push/PR para main ou develop | `ci.yml` | Lint + testes + SAST |
| CI passa em main | `build-and-push.yml` | Build Docker → GHCR |
| Build passa | `deploy.yml` | Deploy via SSH |
| Manual (`workflow_dispatch`) | `deploy.yml` | Deploy manual |

---

## 4. Mudanças de Infraestrutura

Mudanças em `docker-compose.yml`, `nginx.conf`, Dockerfiles ou variáveis de ambiente:

1. Testar em ambiente local primeiro
2. Criar PR com descrição clara do impacto
3. Rever impacto em segurança (headers, portas expostas, volumes)
4. Aprovação do administrador de sistemas antes do merge

---

## 5. Migrações de Base de Dados

O sistema aplica migrações automaticamente via `app/migrate.py` no arranque do backend.

**Regras para migrações:**
- Migrações devem ser **idempotentes** (podem ser re-executadas sem efeito)
- Nunca eliminar colunas sem período de deprecação (pelo menos 1 versão)
- Testar migração num dump da DB de produção antes de fazer deploy

---

## 6. Rollback

### 6.1 Rollback de Código

```bash
# Via GitHub Actions (workflow_dispatch)
# Ou manualmente no servidor:
cd /opt/tradehub
git log --oneline -10  # identificar commit anterior
git checkout <commit-hash>
docker compose build --no-cache
docker compose up -d
```

### 6.2 Rollback de Base de Dados

Ver `docs/BACKUP_RECOVERY.md` — Secção 4. Recuperação Completa.

---

## 7. Janelas de Manutenção

| Período | Tipo de Mudança |
|---------|----------------|
| Seg-Sex 08h-18h | Mudanças normais (durante horário de suporte) |
| Qualquer hora | Mudanças de emergência (P1/P2) |
| Fora de horário laboral | Migrações de DB ou mudanças de alta disponibilidade |

---

## 8. Registo de Mudanças

Todas as mudanças são rastreadas via:
- **Git commits** (histórico completo em `git log`)
- **GitHub Actions** (logs de cada deploy em `github.com/<repo>/actions`)
- **Releases** (tags Git para versões marcadas)

Para mudanças de infraestrutura ou configuração não rastreadas em código (ex: `.env`), registar manualmente no issue tracker.

---

## 9. Comunicação

| Evento | Notificar |
|--------|----------|
| Deploy em produção | Canal de ops (equipa técnica) |
| Incidente P1/P2 | Toda a equipa + gestão |
| Manutenção programada | Utilizadores com >24h de antecedência |
| Nova feature major | Todos os utilizadores |
