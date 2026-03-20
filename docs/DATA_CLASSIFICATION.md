# Classificação de Dados — Portal TradeDataHub

**Classificação:** Interno
**Versão:** 1.0
**Data:** 2026-03-15
**Base legal GDPR:** Contratos de trabalho + Interesse legítimo do responsável pelo tratamento

---

## 1. Categorias de Dados

### 1.1 Dados Pessoais (GDPR Art. 4)

| Campo | Modelo | Classificação | Justificação |
|-------|--------|---------------|-------------|
| `email` | User | Pessoal — Identificativo | Identificação única do utilizador |
| `name` | User | Pessoal | Nome completo |
| `hashed_password` | User | Confidencial | Hash bcrypt de credencial |
| `role` | User | Interno | Nível de acesso à plataforma |
| `team_name` | User | Interno | Equipa de trabalho |

### 1.2 Dados de Atividade (Formações)

| Entidade | Dados | Classificação |
|----------|-------|---------------|
| CourseSubmission | progresso, nota, data | Interno |
| Certificate | data de emissão, aprovação | Interno |
| TrainingPlanAssignment | plano atribuído, estado | Interno |
| ChallengeSubmission | respostas, timestamps | Interno |

### 1.3 Dados de Tutoria e Gestão

| Entidade | Dados | Classificação |
|----------|-------|---------------|
| TutoriaError | descrição do erro, categoria | Confidencial |
| TutoriaActionPlan | plano de ação, itens | Confidencial |
| InternalError | erro interno, ficha aprendizagem | Confidencial |
| Chamado | title, descrição, prioridade | Interno |

---

## 2. Níveis de Classificação

| Nível | Descrição | Acesso |
|-------|-----------|--------|
| **Público** | Sem restrição (não existe nesta aplicação) | Qualquer utilizador |
| **Interno** | Informação de negócio não sensível | Utilizadores autenticados |
| **Confidencial** | Dados pessoais ou de desempenho | Roles com necessidade |
| **Restrito** | Credenciais, chaves, configs produção | ADMIN + ops |

---

## 3. Direitos dos Titulares (GDPR Cap. III)

| Direito | Como Exercer | Prazo |
|---------|-------------|-------|
| Acesso (Art. 15) | Via `GET /api/auth/me` + contacto ADMIN | Imediato + 30 dias |
| Retificação (Art. 16) | Via `PATCH /api/admin/users/{id}` (ADMIN) | 30 dias |
| Apagamento (Art. 17) | Contacto ADMIN → soft delete + purge | 30 dias |
| Portabilidade (Art. 20) | Exportação manual pela ADMIN | 30 dias |
| Oposição (Art. 21) | Contacto ADMIN | 30 dias |

---

## 4. Bases Legais para Tratamento

| Dado | Base Legal | Artigo GDPR |
|------|-----------|-------------|
| Email + Nome | Execução de contrato | Art. 6(1)(b) |
| Progresso formativo | Interesse legítimo do empregador | Art. 6(1)(f) |
| Erros de tutoria | Interesse legítimo (gestão de qualidade) | Art. 6(1)(f) |
| Logs de acesso | Obrigação legal (rastreabilidade) | Art. 6(1)(c) |

---

## 5. Transferências de Dados

- **Sem transferências para fora da UE** (sistema on-premise / VPS EU)
- Chatbot usa API Anthropic (Claude) — dados enviados apenas quando a funcionalidade é usada
  - Assegurar que não são enviados dados pessoais identificáveis nas queries do chatbot

---

## 6. Retenção

| Categoria | Período de Retenção | Ação após expiração |
|-----------|-------------------|---------------------|
| Dados de utilizador ativo | Duração do vínculo laboral | soft-delete |
| Dados de utilizador inativo | 1 ano após inativação | purge manual |
| Logs de aplicação | 90 dias | eliminação automática (log rotation) |
| Backups de DB | 30 dias | eliminação automática |
| Certificados emitidos | Permanente (valor legal) | arquivo |
