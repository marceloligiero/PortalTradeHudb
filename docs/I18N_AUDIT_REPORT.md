# 🌐 i18n Audit Report — Hardcoded Strings in Frontend

**Generated:** 2025-01-XX  
**Scope:** `frontend/src/pages/` and `frontend/src/components/`  
**Pattern:** All UI text NOT wrapped in `t('key')` from `react-i18next`

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total .tsx files audited** | 109 (72 pages + 37 components) |
| **Files with ZERO i18n** | ~30 files |
| **Files with MIXED i18n** (partial `t()` usage) | ~8 files |
| **Files with FULL i18n** (proper `t()` usage) | ~71 files |
| **Language inconsistencies** (mixed PT/ES in same file) | 3 critical files |
| **Estimated hardcoded strings** | 800+ |

### Severity Classification

- 🔴 **CRITICAL** — No i18n at all, many hardcoded strings
- 🟡 **PARTIAL** — Uses `t()` but still has hardcoded strings
- 🟢 **GOOD** — Fully or mostly uses `t()` (may have minor fallbacks)

---

## 🔴 CRITICAL — Files with ZERO i18n (NO `useTranslation`)

### 1. `pages/tutoria/RegisterErrors.tsx` (733 lines)
**Language:** ⚠️ **MIXED Spanish + Portuguese** — MAJOR INCONSISTENCY  
**i18n status:** No `useTranslation` import

#### Hardcoded Spanish strings:
| Location | String | Context |
|----------|--------|---------|
| Recurrence options | `"Puntual"`, `"Recurrente"`, `"Sistémico"` | Select options |
| Typology options | `"Metodología"`, `"Conocimiento"`, `"Detalle"`, `"Procedimiento"` | Select options |
| Page title | `"Ingreso de Incidencias - Cliente"` | Header |
| Section headers | `"Datos de la Transacción y Clasificación"`, `"Detalles de la Incidencia"` | Section titles |
| Form labels | `"Banco (Cliente)"`, `"Seleccionar banco"`, `"Nº o nombre"` | Input labels |
| Form labels | `"Div (Divisa)"`, `"Importe"`, `"Cliente Final"` | Input labels |
| Form labels | `"Tipología Error"`, `"Detectado Por"`, `"Grabador"`, `"Liberador"` | Input labels |
| Form labels | `"Depto"`, `"Evento"`, `"Tipo Error"`, `"Recurrencia"` | Input labels |
| Description | `"Descripción Incidencia"`, `"Describa en detalle lo que ocurrió…"` | Textarea |
| Motives section | `"Motivos del Error"`, `"Agregar motivo por tipología"` | Section |
| Motives | `"Referencia(s) vinculada(s)"`, `"seleccione al menos 1"` | Labels |
| Buttons | `"Salir"`, `"Guardando…"`, `"Guardar"` | Actions |
| Validation | `"Rellene los campos obligatorios *"`, `"Seleccione el grabador *"` | Error msgs |
| Validation | `"Rellene la descripción *"`, `"✓ Listo para guardar"` | Error/success |
| Validation | `"Cada motivo debe tener al menos 1 referencia vinculada."` | Error |
| Dates | `"Fecha Error"`, `"Fch Detección"`, `"Fch Solución"`, `"Datas"` | Labels |

#### Hardcoded Portuguese strings:
| Location | String | Context |
|----------|--------|---------|
| Breadcrumb | `"Tutoria"` | Header |
| Subtitle | `"Registe uma incidência para análise e acompanhamento"` | Header |
| Error msg | `"Preencha obrigatoriamente a descrição e o grabador."` | ⚠️ Mixed: PT text + ES word "grabador" |
| Error msg | `"Erro ao guardar. Tente novamente."` | Alert |
| Success msg | `"Incidência registada!"`, `"A redirecionar…"` | Toast |

---

### 2. `pages/relatorios/IncidentsReport.tsx` (554 lines)
**Language:** ⚠️ **MIXED Portuguese + Spanish** — MAJOR INCONSISTENCY  
**i18n status:** No `useTranslation` import

#### Hardcoded Spanish strings:
| Location | String | Context |
|----------|--------|---------|
| Recurrence labels | `"Puntual"`, `"Recurrente"`, `"Sistémico"` | Badge labels |
| Table headers | `"Fecha error"`, `"Fch Detección"`, `"Oficina"`, `"Cliente"` | Table |
| Table headers | `"Producto"`, `"EVENTO"`, `"Referencia"`, `"Cliente (final)"` | Table |
| Table headers | `"Importe"`, `"Div"`, `"Clasificación"`, `"Origen"` | Table |
| Table headers | `"Tipología del error"`, `"Impacto"`, `"Recurrencia"` | Table |
| Table headers | `"Detectado por"`, `"Descripción incidencia"` | Table |
| Table headers | `"Análisis y Plan de Acción"`, `"Escalado"` | Table |
| Table headers | `"Comentarios reunión"` → `"Comentarios vistos en la reunión"` | Table/Excel |
| Excel headers | `"Importe del evento"`, `"Fecha Detección"` | Export |

#### Hardcoded Portuguese strings:
| Location | String | Context |
|----------|--------|---------|
| Access control | `"Acesso restrito"`, `"Este relatório é exclusivo para…"` | Warning |
| Page title | `"Relatório de Incidências"` | Header |
| KPI labels | `"incidência/s"`, `"alto impacto"` | Stats |
| Filters | `"Filtros"`, `"Exportar Excel"`, `"De"`, `"Até"` | Filter panel |
| Filters | `"Pesquisa livre"`, `"Pesquisar…"`, `"Impacto"`, `"Origem"` | Filter labels |
| Filters | `"Banco"`, `"Departamento"`, `"Detetado por"`, `"Categoria"` | Filter labels |
| Filters | `"Produto"`, `"Recorrência"`, `"Todos/Todas"` | Filter labels |
| Actions | `"Limpar"`, `"Aplicar"`, `"Atualizar"` | Buttons |
| KPI cards | `"Total Incidências"`, `"Alto Impacto"`, `"Baixo Impacto"`, `"Recorrentes"` | Stats |
| Empty state | `"Nenhuma incidência encontrada"`, `"Ajuste os filtros…"` | Empty |
| Results | `"registo/s encontrado/s"` | Count |

---

### 3. `pages/relatorios/RelatoriosLayout.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Portal de Relatórios · Trade Data Hub"` | document.title |
| `"Portal Formações"` | Cleanup title |
| `"Overview"` | Nav link |
| `"Portal de Formações"` | Nav section |
| `"Portal de Tutoria"` | Nav section |
| `"Equipas"` | Nav link |
| `"Minha Equipa"` | Nav link |
| `"Exportações"` | Nav section |
| `"Incidências"` | Nav link |

---

### 4. `pages/tutoria/TutoriaLayout.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Portal de Gestão de Erros"` | document.title |
| `"Portal Formações"` | Cleanup title |
| `"Dashboard"` | Nav link |
| `"Erros"` | Nav link |
| `"Planos de Ação"` | Nav link |
| `"Relatório"` | Nav link |
| `"Meus Erros"` | Nav link (student) |
| `"Meus Planos"` | Nav link (student) |
| `"Minha Evolução"` | Nav link (student) |

---

### 5. `pages/tutoria/TutoriaErrors.tsx` (405 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| SEVERITY_LABEL: `"Baixa"`, `"Média"`, `"Alta"`, `"Crítica"` | Status badges |
| STATUS_LABEL: `"Aberto"`, `"Em Análise"`, `"Plano Criado"`, `"Em Execução"`, `"Concluído"`, `"Verificado"` | Status badges |
| `"Tutoria"` | Breadcrumb |
| `"Erros"` / `"Meus Erros"` | Page title |
| `"erro/s encontrado/s"` | Counter |
| `"Registar Erro"` | Button |
| `"Todos (N)"` | Tab |
| `"Pesquisar por descrição, tutorado ou categoria…"` | Search placeholder |
| `"Filtros"`, `"Gravidade — Todas"`, `"Reincidência — Todas"` | Filter labels |
| `"Reincidentes"`, `"Sem reincidência"`, `"Limpar filtros"` | Filter options |
| `"Não foi possível carregar os erros."` | Error message |
| `"Nenhum erro registado"`, `"Sem resultados…"` | Empty states |
| `"Registar primeiro erro"`, `"Novo erro"` | CTA buttons |
| `"Erro / Tutorado"`, `"Categoria"`, `"Status"`, `"Gravidade"`, `"Planos"` | Table headers |
| `"ª vez"`, `"Reincidência:"` | Badge labels |

---

### 6. `pages/tutoria/ErrorDetail.tsx` (567 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| Same SEVERITY/STATUS/PLAN_STATUS labels as TutoriaErrors | Maps |
| TYPOLOGY_LABEL: `"Metodologia"`, `"Conhecimento"`, `"Detalhe"`, `"Procedimento"` | Badges |
| `"Erro não encontrado"`, `"Voltar"` | Not found |
| `"Erro #N"`, `"ª ocorrência"` | Header |
| `"Mudar Status"`, `"Verificar e Encerrar"` | Buttons |
| `"Plano de Ação"`, `"Voltar aos Erros"` | Navigation |
| `"Detalhes da Ocorrência"` | Section title |
| Metadata: `"Tutorado"`, `"Registado por"`, `"Data"`, `"Categoria"`, `"Serviço"`, `"Gravidade"`, `"Planos"` | Labels |
| `"Análise de Causa Raiz (5 Porquês)"` | Section |
| `"Motivos do Erro (N)"`, `"Planos de Ação (N)"` | Section headers |
| `"Novo Plano"`, `"Nenhum plano de ação criado ainda"`, `"Criar plano de ação"` | CTA |
| `"Plano #N"`, `"Vencido"`, `"ações · N%"` | Plan badges |
| `"Comentários (N)"`, `"Sem comentários ainda"`, `"Anónimo"` | Comments |
| `"Adicionar comentário…"` | Placeholder |
| `"Erro ao verificar"` | Alert |

---

### 7. `pages/tutoria/TutoriaPlans.tsx` (325 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| PLAN_STATUS_LABEL: `"Rascunho"`, `"Ag. Aprovação"`, `"Aprovado"`, `"Em Execução"`, `"Concluído"`, `"Devolvido"` | Badges |
| `"Tutoria"` | Breadcrumb |
| `"Planos de Ação"` / `"Meus Planos de Ação"` | Title |
| `"plano/s encontrado/s"` | Counter |
| `"Todos (N)"` | Tab |
| `"Pesquisar por ação ou tutorado…"` | Placeholder |
| `"Não foi possível carregar os planos."` | Error |
| `"Nenhum plano de ação criado"`, `"Sem resultados…"` | Empty |
| `"Vencido"` | Badge |
| `"Plano de Ação #N"`, `"Prazo:"`, `"ações"`, `"Erro #N"` | Labels |

---

### 8. `pages/tutoria/TutoriaReport.tsx` (~500 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| SEVERITY/PLAN_STATUS labels (duplicate maps) | Constants |
| `"Análise"`, `"Relatório"` | Breadcrumb |
| `"Visão agregada — erros, planos e formandos"` | Subtitle |
| `"Total de erros"`, `"Reincidentes"`, `"% do total"` | KPI cards |
| `"Planos de ação"`, `"concluídos"`, `"Tutorados"` | KPI cards |
| `"Erros CSV"`, `"Planos CSV"` | Export buttons |
| `"Erros por Gravidade"`, `"erros no total"` | Chart titles |
| `"Erros por Categoria"`, `"Top N categorias"` | Charts |
| `"Tutorados com mais erros"` | Chart title |
| `"reinc."`, `"erros"`, `"erro/s reincidente/s"` | Labels |

---

### 9. `pages/tutoria/CreateActionPlan.tsx` (~500 lines)
**Language:** Portuguese (with Spanish spelling errors!)  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| Steps: `"Análise"`, `"Ações"`, `"5W2H"` | Step labels |
| `"Tutoria"`, `"Plano de Ação"`, `"Erro #N"` | Breadcrumb |
| `"Não foi possível carregar o erro."` | Error |
| Validation: `"Preencha a análise de causa raiz…"`, `"Preencha pelo menos uma das ações…"` | Errors |
| `"Plano criado!"`, `"A redirecionar…"` | Success |
| `"Análise de Causa Raiz"`, `"Técnica dos 5 Porquês…"` | Section |
| `"Correção Imediata"`, `"Ação Corretiva"`, `"Ação Preventiva"` | Section |
| 5W2H: `"O quê? (What)"`, `"Por quê? (Why)"`, `"Onde? (Where)"` etc. | Labels |
| ⚠️ `"Seleccionar tutorado"`, `"Seleccionar responsável"` | **Spanish spelling!** (should be PT: "Selecionar") |
| `"Cancelar"`, `"Anterior"`, `"Próximo"`, `"Criar Plano"` | Buttons |
| `"Erro ao guardar. Tente novamente."` | Alert |

---

### 10. `pages/tutoria/PlanDetail.tsx` (905 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| PLAN_STATUS_LABEL, ITEM_STATUS_LABEL, ITEM_TYPE_LABEL maps | Constants |
| `"Plano não encontrado"`, `"Voltar"` | Not found |
| `"Voltar aos Planos"`, `"Plano #N"`, `"Vencido"` | Header |
| `"Tutorado: … · Erro #N"` | Subtitle |
| `"Editar Plano"`, `"Aprovar"`, `"Devolver"` | Buttons |
| `"Submeter para Aprovação"`, `"Re-submeter para Aprovação"` | Buttons |
| `"Validar Conclusão"` | Button |
| `"Motivo da devolução"`, `"Confirmar Devolução"`, `"Cancelar"` | Return form |
| `"Plano Devolvido"` + explanation text | Banner |
| `"Progresso"`, `"de N ações concluídas"` | Progress |
| `"5W2H — Estrutura do Plano"`, `"Guardar"`, `"Cancelar"` | 5W2H section |
| All 5W2H labels: `"O quê? (What)"`, `"Por quê? (Why)"` etc. | Edit form |
| `"Análise 5 Porquês"`, `"Correção Imediata"`, `"Ação Corretiva"`, `"Ação Preventiva"` | Sections |
| Action items: `"Ações (N)"`, `"Adicionar"` | Section header |
| Flow legend: `"Pendente"`, `"Em Andamento"`, `"Concluído"`, `"Devolvido"`, `"recomeçar"` | Legend |
| `"Imediata"`, `"Corretiva"`, `"Preventiva"` | Select options |
| `"Responsável…"`, `"Descrição detalhada da ação…"` | Placeholders |
| `"Nenhuma ação adicionada ainda"` | Empty state |
| Actions: `"Iniciar"`, `"Submeter Evidência"`, `"Concluir"`, `"Devolver"`, `"Reiniciar"` | Buttons |
| `"Evidência submetida"`, `"Comentário do revisor"` | Labels |
| `"Motivo da devolução da ação"`, `"Explique o que precisa ser corrigido…"` | Return form |
| `"Submeter e Concluir"` | Button |
| `"Comentários (N)"`, `"Sem comentários ainda"`, `"Anónimo"` | Comments |
| `"Adicionar comentário…"` | Placeholder |
| `"Erro ao guardar alterações"`, `"Erro na operação"`, `"Erro ao devolver"`, `"Erro ao devolver ação"` | Alerts |

---

### 11. `pages/tutoria/TutoriaCategories.tsx` (454 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Erro ao carregar categorias."` | Error |
| `"Configuração"` | Breadcrumb |
| `"Categorias de Erros"` | Title |
| `"N ativas · N inativas"` | Count |
| `"Nova Categoria"` | Button |
| `"Nome é obrigatório."` | Validation |
| `"Categoria atualizada."`, `"Categoria criada."` | Success |
| `"Erro ao guardar categoria."` | Error |
| `"Categoria desativada."`, `"Categoria ativada."` | Success |
| `"Erro ao alterar estado da categoria."` | Error |
| `"Editar Categoria"`, `"Nova Categoria"` | Modal title |
| `"Nome"`, `"Categoria pai (opcional)"`, `"Descrição (opcional)"` | Labels |
| `"— Nenhuma (nível raiz) —"` | Select option |
| `"Breve descrição da categoria…"` | Placeholder |
| `"Cancelar"`, `"A guardar…"`, `"Guardar"` | Buttons |
| `"Nenhuma categoria criada."`, `"Criar primeira categoria"` | Empty state |
| `"Inativa"`, `"N sub"` | Badges |
| `"Ex: Técnico, Processo…"` | Placeholder |

---

### 12. `pages/tutoria/ChatFAQAdmin.tsx` (573 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| EMOJI_GROUPS labels: `"Frequentes"`, `"Rostos"`, `"Mãos"`, `"Objectos"`, `"Símbolos"` | Tab labels |
| STEPS: `"Palavras-chave"`, `"Respostas"`, `"Configurações"` | Wizard steps |
| Step descriptions: `"Termos de busca…"`, `"Texto de resposta…"`, `"Links, filtros…"` | Descriptions |
| `"Erro ao carregar FAQs"` | Error |
| `"Chatbot"` | Badge |
| `"Perguntas Frequentes"` | Title |
| `"Gere as respostas automáticas do assistente virtual"` | Subtitle |
| `"Nova FAQ"` | Button |
| `"Pesquisar FAQs…"`, `"N resultado/s"` | Search |
| `"Nenhuma FAQ encontrada"`, `"Ainda não há FAQs"` | Empty states |
| `"Tenta outro termo de busca"`, `"Clica em Nova FAQ para começar"` | Helpers |
| `"Eliminar esta FAQ permanentemente?"` | Confirm dialog |
| `"Inativa"` | Badge |
| `"Editar FAQ"`, `"Nova FAQ"` | Modal title |
| `"Passo N de N — label"` | Wizard progress |
| `"Palavras-chave (PT) são obrigatórias"`, `"Resposta (PT) é obrigatória"` | Validation |
| `"Erro ao guardar."` | Error |
| Keyword labels: `"Palavras-chave PT"`, `"ES"`, `"EN"` | Form |
| Tip: `"Escreva uma palavra-chave por linha…"` | Info box |
| `"Resposta PT"`, `"Resposta ES"`, `"Resposta EN"` | Form |
| Tip: `"Use **negrito** com asteriscos…"` | Info box |
| `"URL do material"`, `"Texto do link"`, `"Filtro por role"`, `"Prioridade"` | Labels |
| `"Ver material de apoio"` | Placeholder |
| `"Deixe vazio para todos ou separe por vírgula"` | Helper text |
| `"Menor número = mais prioritário"` | Helper text |
| `"Cancelar"`, `"Anterior"`, `"Próximo"`, `"A guardar…"`, `"Guardar FAQ"` | Buttons |
| `"FAQ guardada!"`, `"A fechar…"` | Success |

---

### 13. `pages/relatorios/Overview.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| Role descriptions: `"Visão global…"`, `"Dados da sua equipa"`, `"Dados dos seus tutorados"`, `"Os seus dados"` | Subtitle |
| `"Overview"` | Breadcrumb |
| `"KPIs cruzados dos portais de Formações e Tutoria"` | Subtitle |
| `"Utilizadores"`, `"equipas"` | KPI |
| `"Planos de Formação"`, `"em curso"` | KPI |
| `"Erros Registados"`, `"críticos"`, `"sem críticos"` | KPI |
| `"Planos de Ação Pendentes"` | KPI |
| `"Certificados Emitidos"` | KPI |
| `"MPU Médio"`, `"min/operação (aprovados)"`, `"sem dados de MPU"` | KPI |
| `"Acesso rápido"` | Section |
| `"Ver relatório de Formações"`, `"Ver relatório de Tutoria"` | Links |

---

### 14. `pages/relatorios/TutoriaDashboard.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| SEVERITY_LABELS, STATUS_LABELS, PLAN_STATUS_LABELS (duplicate maps) | Constants |
| `"Portal de Tutoria"`, `"Relatório de Tutoria"` | Header |
| KPIs: `"Total de Erros"`, `"Taxa de Resolução"`, `"resolvidos"` | Cards |
| `"Taxa de Recorrência"`, `"recorrentes"`, `"Erros Críticos"` | Cards |
| `"Em Aberto"`, `"Planos Concluídos"` | Cards |
| Charts: `"Erros por Severidade"`, `"Erros por Estado"`, `"Planos de Ação por Estado"` | Titles |

---

### 15. `pages/relatorios/FormacoesDashboard.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| PLAN_LABELS map | Constants |
| `"Portal de Formações"`, `"Relatório de Formações"` | Header |
| KPIs: `"Inscrições"`, `"concluídas"`, `"Taxa de Conclusão"` | Cards |
| `"Taxa de Aprovação"`, `"submissões"`, `"Horas de Estudo"` | Cards |
| `"MPU Médio"`, `"min/operação"`, `"Certificados"` | Cards |
| `"Planos por Estado"` | Chart |
| `"Erros por Tipologia (Desafios)"` | Chart |
| Error types: `"Metodologia"`, `"Conhecimento"`, `"Detalhe"`, `"Procedimento"` | Chart labels |

---

### 16. `pages/relatorios/TeamsDashboard.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Portal de Relatórios"` | Breadcrumb |
| `"Relatório por Equipas"` | Title |
| `"Pesquisar equipa ou produto…"` | Placeholder |
| `"Taxa de Conclusão (%)"`, `"Erros por Equipa"` | Chart titles |
| `"Equipa"`, `"Produto"`, `"Manager"` | Table headers |
| `"Nenhuma equipa encontrada"` | Empty state |

---

### 17. `pages/relatorios/MembersDashboard.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| ROLE_LABELS: `"Estudante"`, `"Tutorado"`, `"Tutor"`, `"Manager"` | Labels |
| `"Portal de Relatórios"`, `"Minha Equipa"` | Header |
| KPIs: `"Membros"`, `"Taxa Média"`, `"Total de Erros"`, `"Certificados"` | Cards |
| `"Pesquisar membro…"` | Placeholder |
| `"Membro"`, `"Role"`, `"Planos"` | Table headers |
| `"Nenhum membro encontrado"` | Empty state |

---

### 18. `pages/admin/PortalTutoria.tsx` (537 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| SEVERITY_LABEL, STATUS_LABEL, PLAN_STATUS_LABEL (duplicate maps) | Constants |
| `"A carregar dashboard…"` | Loading |
| `"Portal de Gestão de Erros"` | Badge |
| `"Meu Painel"` / `"Dashboard"` | Title |
| KPIs and all dashboard text (same pattern as other tutoria pages) | Various |

---

### 19. `pages/admin/Teams.tsx` (399 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Gestão de Equipas"` | Title |
| `"Cria equipas, associa um produto/serviço e atribui membros"` | Subtitle |
| `"Nova Equipa"` | Button |
| `"Pesquisar equipas…"` | Placeholder |
| `"Nome obrigatório"` | Validation |
| `"Erro ao guardar"` | Error |
| `"Remover este membro da equipa?"` | Confirm |

---

### 20. `pages/PortalTutoriaPublic.tsx`
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Portal de Tutoria"` | Title |
| `"Área de gestão de erros e planos de ação. Faça login para aceder ao portal."` | Description |
| `"Entrar"` | Button |

---

### 21. `pages/TradeDatahubLanding.tsx` (889 lines)
**Language:** ⚠️ Custom multi-lang (NOT using react-i18next)  
**i18n status:** No `useTranslation` — uses **custom `T` object** with `{pt, es, en}`

This file implements its own i18n system with a `T` constant and `LANGS` array. While it provides translations for all 3 languages, it does NOT integrate with the app's i18n system (`react-i18next`). This means:
- Language selection is isolated (won't sync with app language)
- Translation keys are not in the shared translation files

| Hardcoded (not in T object) | Context |
|------------------------------|---------|
| `"Trade"`, `"Data"`, `"Hub"` | Brand (acceptable) |
| MARQUEE_ITEMS array with PT-only strings like `"Portal de Formações"`, `"Portal de Tutoria"`, `"Análise MPU em Tempo Real"` etc. | Marquee |
| All feature/portal descriptions are in the custom `T` object (covers pt/es/en) | ✅ OK within file scope |

---

### 22. `pages/certificates/CertificateView.tsx` (826 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Erro ao carregar certificado"` | Error |
| `"Carregando certificado..."` | Loading |
| `"Voltar"` | Button |
| `"Certificado não encontrado"` | Not found |
| `"Pular animação →"` | Skip button |

---

## 🟡 PARTIAL — Files Using `t()` BUT With Remaining Hardcoded Strings

### 23. `pages/admin/MasterDataLayout.tsx`
**Language:** Mixed (most in `t()`, some hardcoded PT)

| Uses `t()` | Hardcoded |
|-------------|-----------|
| `t('masterData.banks')`, `.products`, `.teams`, `.categories`, `.faqs` | ❌ `"Portal de Dados Mestres · Trade Data Hub"` (document.title) |
| | ❌ `"Portal Formações"` (cleanup title) |
| | ❌ `"Incidências"` (section header) |
| | ❌ `"Impactos"`, `"Origens"`, `"Detectado Por"`, `"Departamentos"`, `"Eventos"` (nav links) |

---

### 24. `pages/admin/MasterData.tsx` (792 lines)
**Language:** Mixed (heavy `t()` usage but gaps)

| Uses `t()` for | Hardcoded strings |
|-----------------|-------------------|
| Table headers, form labels, buttons, status badges | ❌ TAB_CONFIG titleKeys: `'Impactos'`, `'Origens'`, `'Detectado Por'`, `'Departamentos'`, `'Actividades'` (not i18n keys, just raw PT strings used as keys) |
| | ❌ FAQ form roles: `"Todos"`, `"Formando"`, `"Formador"`, `"Admin"`, `"Manager"` |
| | ❌ `"Erro ao guardar"` (alert) |
| | ❌ `"Erro ao eliminar"` (alert) |
| | ❌ `"Nome…"`, `"Descrição (opcional)…"` (placeholders) |
| | ❌ Fallback strings in `t()`: `t('common.cancel', 'Cancelar')` etc. (minor) |

---

### 25. `pages/LoginPage.tsx` (249 lines)
**Language:** Mostly `t()` but with hardcoded strings

| Uses `t()` for | Hardcoded strings |
|-----------------|-------------------|
| `t('common.welcome')`, `t('auth.loginToContinue')`, `t('auth.password')`, `t('auth.login')`, `t('auth.noAccount')`, `t('auth.register')` | ❌ `"de volta."` (hardcoded Portuguese after `t('common.welcome')`) |
| | ❌ `"Email"` (placeholder, not wrapped) |
| | ❌ `"ou"` (divider text) |
| | ❌ `t('auth.forgotPassword', 'Esqueceu a senha?')` — has PT fallback |

---

### 26. `pages/ForgotPassword.tsx` (332 lines)
**Language:** Mostly `t()` but with hardcoded strings

| Uses `t()` for | Hardcoded strings |
|-----------------|-------------------|
| `t('auth.continue')`, `t('auth.newPassword')`, `t('auth.resetPassword')`, `t('auth.goToLogin')` | ❌ stepMeta titles (hardcoded PT): `"Esqueceu\na senha?"`, `"Nova\npalavra-passe"`, `"Senha\nalterada!"` |
| | ❌ stepMeta sub: `"Insira o seu email para continuar."`, `"Pode agora iniciar sessão…"` |
| | ❌ `"Login"`, `"Voltar"` (button labels) |
| | ❌ `"Email"` (placeholder) |

---

### 27. `pages/admin/Settings.tsx`
**Language:** Uses `t()` for labels but hardcoded default values

| Uses `t()` for | Hardcoded strings |
|-----------------|-------------------|
| All labels, section titles, button text | ❌ Default state values: `siteName: 'Portal de Formações'`, `siteDescription: 'Plataforma de gestão de formações'` |

---

### 28. `pages/admin/Ratings.tsx` (507 lines)
**Language:** Uses `t()` but with hardcoded error messages

| Uses `t()` for | Hardcoded strings |
|-----------------|-------------------|
| Tab labels, rating types, star labels | ❌ `"Erro ao carregar dashboard de avaliações"` |
| | ❌ `"Erro ao carregar avaliações"` |
| | ❌ `"Erro ao carregar resumo de avaliações"` |

---

### 29. `components/layout/Header.tsx` (281 lines)
**Language:** Mostly `t()` but hardcoded nav labels

| Uses `t()` for | Hardcoded strings |
|-----------------|-------------------|
| `t('roles.…')`, `t('common.logout')` | ❌ Nav button labels: `"Formações"`, `"Tutoria"`, `"Relatórios"`, `"Dados Mestres"` |

---

## 🔴 CRITICAL Components — NO i18n

### 30. `components/PlanStatusBadge.tsx` (174 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Concluído"`, `"Em Curso"`, `"Atrasado"`, `"Pausado"`, `"Pendente"` | Status text |
| `"N dias restantes"` | Days info |
| `"N dias de atraso"` | Delay info |

---

### 31. `components/LessonTimer.tsx` (331 lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Concluída"` | Completed label |
| `"Tempo estimado: N min"` | Timer info |
| `"Decorrido: …"` | Timer info |
| `"Tempo excedido por …"` | Warning |
| `"Iniciar"`, `"Pausar"`, `"Retomar"`, `"Finalizar"` | Buttons |
| `"Concluída"`, `"Em Progresso"`, `"Pausada"`, `"Não Iniciada"` | Status badges |
| `"Erro ao iniciar lição"`, `"Erro ao pausar lição"`, `"Erro ao retomar lição"`, `"Erro ao finalizar lição"` | Errors |

---

### 32. `components/ErrorConceptsInput.tsx` (200+ lines)
**Language:** Portuguese  
**i18n status:** No `useTranslation` import

| String | Context |
|--------|---------|
| `"Metodologia"`, `"Conhecimento"`, `"Detalhe"`, `"Procedimento"` | Concept labels |
| `"Erros na forma/método de execução"` | Description |
| `"Erros por falta de conhecimento"` | Description |
| `"Erros de atenção ao detalhe"` | Description |
| `"Erros no procedimento/sequência"` | Description |
| `"Erros por Conceito"` | Header |
| `"Total: N"` | Badge |

---

### 33. `components/ChatBot.tsx` (398 lines)
**Language:** Custom multi-lang (NOT react-i18next)

Uses own `PLACEHOLDER`, `TITLE`, `WELCOME` objects with `{pt, es, en}`. Similar to TradeDatahubLanding — **not integrated with react-i18next**.

| Issue | Context |
|-------|---------|
| ❌ Isolated language system | Doesn't sync with app's `i18n.language` |
| ❌ `"Erro ao contactar o servidor."` fallback (only PT in catch) | Error handler |

---

## 🟢 GOOD — Files With Proper i18n

These files use `useTranslation` and `t()` consistently:

### pages/admin/ (using t())
- Dashboard.tsx, Users.tsx, Courses.tsx, CourseDetail.tsx, CourseForm.tsx
- ChallengeDetail.tsx, ChallengeForm.tsx, LessonDetail.tsx, LessonForm.tsx
- KnowledgeMatrix.tsx, Reports.tsx, TrainerValidation.tsx
- TrainingPlanForm.tsx, TrainingPlans.tsx, AdvancedReports.tsx
- Banks.tsx, Products.tsx

### pages/student/ (using t())
- Dashboard.tsx, Courses.tsx, MyPlans.tsx, MyLessons.tsx, MyChallenges.tsx
- LessonView.tsx, ChallengeExecution.tsx, ChallengeExecutionComplete.tsx
- Certificates.tsx, Reports.tsx

### pages/trainer/ (using t())
- Dashboard.tsx, Courses.tsx, Students.tsx, Reports.tsx
- PendingReviews.tsx, SubmissionReview.tsx, LessonManagement.tsx
- TrainingPlans.tsx, TrainingPlanForm.tsx, TrainingPlanDetail.tsx
- ChallengeExecutionComplete.tsx, ChallengeExecutionSummary.tsx

### Top-level pages (using t())
- RegisterPage.tsx, ResetPassword.tsx, ChallengeResult.tsx, LandingPage.tsx

### Components (using t())
- layout/Sidebar.tsx, layout/Header.tsx (partial), RatingModal.tsx
- plans/TrainingPlanCard.tsx, LanguageSwitcher.tsx

### Components with NO text to translate (utility/UI-only)
- Alert.tsx, Button.tsx, Badge.tsx, Card.tsx, Avatar.tsx, Input.tsx
- Select.tsx, Textarea.tsx, Checkbox.tsx, RadioGroup.tsx, Modal.tsx
- Dropdown.tsx, Tabs.tsx, Toast.tsx, Progress.tsx, Spinner.tsx
- Skeleton.tsx, LoadingSpinner.tsx, StarRating.tsx, RichTextEditor.tsx
- premium/ (AnimatedCounter, AnimatedStatCard, FloatingOrbs, GridBackground, PremiumCard, PremiumHeader, index)
- layout/Layout.tsx

---

## 🔁 Duplicate Status/Label Maps (Code Smell)

The same label maps are duplicated across **9+ files**:

| Map Name | Files |
|----------|-------|
| `SEVERITY_LABEL` | TutoriaErrors, ErrorDetail, TutoriaReport, PortalTutoria, TutoriaDashboard |
| `STATUS_LABEL` | TutoriaErrors, ErrorDetail, PortalTutoria, TutoriaDashboard |
| `PLAN_STATUS_LABEL` | TutoriaPlans, ErrorDetail, TutoriaReport, PlanDetail, PortalTutoria, TutoriaDashboard |
| `ITEM_TYPE_LABEL` | PlanDetail |
| `ITEM_STATUS_LABEL` | PlanDetail |

**Recommendation:** Extract to a shared `constants/labels.ts` and wrap with `t()`.

---

## 🚨 Language Consistency Issues

### CRITICAL: Mixed Spanish + Portuguese in Same File

1. **RegisterErrors.tsx** — UI is mostly **Spanish** but error messages and breadcrumbs are **Portuguese**. Also contains the PT word "grabador" (should be "gravador" in PT or keep all in ES).

2. **IncidentsReport.tsx** — Table headers and Excel exports use **Spanish**, filters/KPIs/actions use **Portuguese**.

3. **CreateActionPlan.tsx** — Body is Portuguese but `"Seleccionar"` uses **Spanish spelling** (PT = "Selecionar").

### Mixed Language in Partially Internationalized Files

4. **LoginPage.tsx** — Uses `t('common.welcome')` but immediately follows with hardcoded `"de volta."` in Portuguese.

5. **ForgotPassword.tsx** — Uses `t()` for some labels but `stepMeta` titles are hardcoded Portuguese.

6. **Header.tsx** — Uses `t()` for role/logout but nav labels (`"Formações"`, `"Tutoria"`, `"Relatórios"`, `"Dados Mestres"`) are hardcoded.

---

## 📋 Prioritized Remediation Plan

### Priority 1 — Fix Language Inconsistencies (CRITICAL)
1. `RegisterErrors.tsx` — Decide on language (PT or ES), wrap all in `t()`
2. `IncidentsReport.tsx` — Decide on language, wrap all in `t()`
3. `CreateActionPlan.tsx` — Fix `"Seleccionar"` typo, wrap in `t()`

### Priority 2 — Internationalize Tutoria Module (30 min each)
4. `TutoriaErrors.tsx`
5. `ErrorDetail.tsx`
6. `TutoriaPlans.tsx`
7. `PlanDetail.tsx`
8. `TutoriaReport.tsx`
9. `TutoriaCategories.tsx`
10. `ChatFAQAdmin.tsx`
11. `TutoriaLayout.tsx`

### Priority 3 — Internationalize Relatórios Module
12. `RelatoriosLayout.tsx`
13. `Overview.tsx`
14. `TutoriaDashboard.tsx`
15. `FormacoesDashboard.tsx`
16. `TeamsDashboard.tsx`
17. `MembersDashboard.tsx`

### Priority 4 — Fix Partially Internationalized Files
18. `LoginPage.tsx` — Wrap `"de volta."`, `"Email"`, `"ou"`
19. `ForgotPassword.tsx` — Wrap `stepMeta` strings
20. `Header.tsx` — Wrap nav labels
21. `MasterDataLayout.tsx` — Wrap `"Incidências"` section items
22. `MasterData.tsx` — Wrap TAB_CONFIG, FAQ roles, error messages
23. `Ratings.tsx` — Wrap error strings
24. `Settings.tsx` — Wrap default values

### Priority 5 — Internationalize Components
25. `PlanStatusBadge.tsx`
26. `LessonTimer.tsx`
27. `ErrorConceptsInput.tsx`

### Priority 6 — Integrate Isolated i18n Systems
28. `TradeDatahubLanding.tsx` — Migrate custom `T` to react-i18next
29. `ChatBot.tsx` — Migrate custom lang objects to react-i18next

### Priority 7 — Extract Duplicate Constants
30. Create shared `constants/tutoriaLabels.ts` with `SEVERITY_LABEL`, `STATUS_LABEL`, `PLAN_STATUS_LABEL` wrapped in `t()`

---

*End of report*
