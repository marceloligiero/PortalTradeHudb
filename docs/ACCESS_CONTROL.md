# Controlo de Acesso — Portal TradeDataHub

**Classificação:** Confidencial
**Versão:** 1.0
**Data:** 2026-03-15

---

## 1. Modelo de Controlo de Acesso

O sistema utiliza **RBAC (Role-Based Access Control)** implementado via middleware FastAPI (`require_role()`).

---

## 2. Matriz de Permissões

### 2.1 Gestão de Utilizadores

| Operação | ADMIN | MANAGER | TRAINER | TRAINEE/STUDENT |
|----------|:-----:|:-------:|:-------:|:---------------:|
| Listar utilizadores | ✅ | ❌ | ❌ | ❌ |
| Criar utilizador | ✅ | ❌ | ❌ | ❌ |
| Atualizar utilizador | ✅ | ❌ | ❌ | ❌ |
| Desativar utilizador | ✅ | ❌ | ❌ | ❌ |

### 2.2 Formações

| Operação | ADMIN | MANAGER | TRAINER | TRAINEE/STUDENT |
|----------|:-----:|:-------:|:-------:|:---------------:|
| Ver cursos/lições | ✅ | ✅ | ✅ | ✅ |
| Criar/editar cursos | ✅ | ❌ | ✅ | ❌ |
| Submeter desafios | ✅ | ❌ | ✅ | ✅ |
| Ver certificados próprios | ✅ | ✅ | ✅ | ✅ |

### 2.3 Tutoria

| Operação | ADMIN | MANAGER | TRAINER | TRAINEE/STUDENT |
|----------|:-----:|:-------:|:-------:|:---------------:|
| Registar erro | ✅ | ✅ | ✅ | ✅ |
| Verificar/aprovar erro | ✅ | ❌ | ✅ | ❌ |
| Ver todos os erros | ✅ | ❌ | ✅* | ❌ |
| Dashboard de tutoria | ✅ | ❌ | ✅ | ❌ |

*TRAINER vê apenas os seus tutorandos

### 2.4 Erros Internos

| Operação | ADMIN | MANAGER | TRAINER | TRAINEE/STUDENT |
|----------|:-----:|:-------:|:-------:|:---------------:|
| Registar erro interno | ✅ | ✅ | ✅ | ✅ |
| Atualizar action items | ✅ | ❌ | ✅ | ✅* |
| Dashboard global | ✅ | ❌ | ✅ | ❌ |

*TRAINEE pode atualizar apenas os seus próprios itens

### 2.5 Data Warehouse / Relatórios analíticos

| Operação | ADMIN | MANAGER | TRAINER | TRAINEE/STUDENT |
|----------|:-----:|:-------:|:-------:|:---------------:|
| Snapshot diário | ✅ | ✅ | ❌ | ❌ |
| Training by month/course | ✅ | ✅ | ❌ | ❌ |
| Tutoria analytics | ✅ | ✅ | ❌ | ❌ |
| Chamados analytics | ✅ | ✅ | ❌ | ❌ |
| Internal errors analytics | ✅ | ✅ | ❌ | ❌ |
| Trigger ETL | ✅ | ❌ | ❌ | ❌ |

---

## 3. Princípio do Mínimo Privilégio

- Cada role tem acesso apenas ao que é necessário para a sua função
- Os endpoints da API verificam o role em cada request (não apenas no login)
- Tokens expiram em 30 minutos; utilizadores inativos não conseguem autenticar

---

## 4. Gestão de Contas Privilegiadas

- Contas ADMIN devem ser pessoais (não partilhadas)
- Password do admin deve ser alterada no primeiro login
- Usar `python reset_admin_password.py <nova_senha>` para reset seguro (mínimo 12 chars)
- Revisão trimestral das contas ADMIN ativas

---

## 5. Auditoria de Acessos

- Autenticações falhadas são registadas nos logs com email mascarado
- Autenticações bem-sucedidas são registadas por email
- Logs em `backend/logs/` com rotação automática (10MB/5 ficheiros)

---

## 6. Revogação de Acesso

Procedimento ao fim do vínculo laboral:
1. ADMIN desativa o utilizador: `PATCH /api/admin/users/{id}` com `is_active: false`
2. Todos os tokens existentes expiram em 30 minutos (não há blacklist de tokens)
3. Para revogação imediata: alterar `SECRET_KEY` (invalida todos os tokens)
