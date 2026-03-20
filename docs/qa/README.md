# Documentação QA — PortalTradeDataHub

**Data:** 2026-03-20 | **Versão:** 1.0 | **Total de cenários:** 99

Documentação orientada a QA, organizada por role/perfil de utilizador. Cada guia é executável de forma independente sem interpretação adicional.

---

## Ficheiros por Role

| Role | Ficheiro | Cenários | Descrição |
|------|----------|---------|-----------|
| **ADMIN** | [QA_ADMIN.md](QA_ADMIN.md) | 17 | Controlo total: utilizadores, master data, cursos, tutoria completa |
| **TRAINER** | [QA_TRAINER.md](QA_TRAINER.md) | 16 | Formador: cursos, lições, desafios, planos de formação |
| **MANAGER** | [QA_MANAGER.md](QA_MANAGER.md) | 16 | Gestor: relatórios, aprovação tutoria, cancelamento, Excel |
| **TUTOR** | [QA_TUTOR.md](QA_TUTOR.md) | 17 | Tutor: ciclo completo incidências, MELHORIA, fichas, censos |
| **REFERENTE** | [QA_REFERENTE.md](QA_REFERENTE.md) | 16 | Referente: análise, escalamento para chefe, restrições |
| **STUDENT** | [QA_STUDENT.md](QA_STUDENT.md) | 17 | Aluno: formações, registo incidências, fichas, chamados |

---

## Estrutura de cada guia

Cada ficheiro QA contém:

1. **Visão Geral** — objetivo, identificação no sistema, portais acessíveis
2. **Permissões e Restrições** — tabela completa do que é permitido/bloqueado
3. **Fluxos de Frontend** — passo a passo de cada acção disponível
4. **Campos e Validações** — campos obrigatórios/opcionais, regras, mensagens de erro
5. **Cenários de Teste** — positivos, negativos e edge cases com verificações `[ ]`
6. **Checklist de Validação** — lista completa para sign-off por role

---

## Regras de Negócio Críticas (transversais)

| Regra | Comportamento Esperado | Testado em |
|-------|----------------------|------------|
| Campos obrigatórios incidência | Data Erro + Banco + Oficina + Departamento + Descrição | TODOS |
| Cascading Banco→Departamento→Actividad→TipoError | Reset automático ao mudar Banco | TUTOR, STUDENT, MANAGER |
| Plano MELHORIA → só Origen=Trade_Personas | HTTP 400 caso contrário | TUTOR |
| Plano MELHORIA → responsável deve ser Tutor | HTTP 400 caso contrário | TUTOR |
| Score de conclusão: 0–5 | HTTP 400 se <0 ou >5 | TUTOR |
| result_comment: máx. 160 chars | HTTP 400 se >160 | TUTOR |
| Excel de incidências: sempre em Espanhol | Headers ES independente do idioma UI | MANAGER, ADMIN |
| Cancelar incidência: motivo obrigatório | Bloqueado se vazio | TUTOR, MANAGER, ADMIN |
| Referente submete → PENDING_CHIEF_APPROVAL | Sempre escala para chefe | REFERENTE |
| Chefe submete → PENDING_TUTOR_REVIEW | Directo para tutor | MANAGER, TUTOR |
| Aprovar planos (Trade_Personas) → fichas PENDENTE | Auto-criação de learning sheets | TUTOR |

---

## Conformidade Global (2026-03-20)

| Módulo | Conformidade | Estado |
|--------|-------------|--------|
| A.1 Registo | **100%** | ✅ |
| A.2 Análise | **89%** | ↑ (2.16 fixed) |
| A.3 Revisão Tutor | **50%** | ⚠️ excel_sent UI pendente |
| A.4 Execução Planos | **100%** | ✅ |
| A.5 Fichas Aprendizagem | **100%** | ✅ |
| A.6 Regras Gerais | **75%** | ↑ (Excel ES fixed) |
| B. Feedback Liberadores | **0%** | ❌ Módulo não implementado |
| C.1 Cápsulas Formativas | **25%** | ❌ Parcial |
| C.2 Planos Seguimento | **0%** | ❌ Não implementado |
| **TOTAL** | **74%** | Ver [AUDIT_FUNCIONAL.md](../AUDIT_FUNCIONAL.md) |

---

## Utilizadores de Teste

| Role | Email | Password | Flags |
|------|-------|----------|-------|
| ADMIN | admin@tradehub.com | Test1234! | — |
| TRAINER | trainer_test@tradehub.com | Test1234! | is_trainer=True |
| TUTOR | tutor_test@tradehub.com | Test1234! | is_tutor=True |
| STUDENT | student_test@tradehub.com | Test1234! | — |

> Utilizadores MANAGER e REFERENTE devem ser criados pelo ADMIN com os roles/flags correctos.
