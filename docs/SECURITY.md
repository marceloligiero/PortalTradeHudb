# Política de Segurança — Portal TradeDataHub

**Classificação:** Interno
**Versão:** 1.0
**Data:** 2026-03-15
**Responsável:** Administrador de Sistemas

---

## 1. Âmbito

Este documento define a política de segurança do Portal TradeDataHub, sistema de gestão de formações, tutoria e relatórios para equipas de trading. Aplica-se a todos os utilizadores, administradores e sistemas que interagem com a plataforma.

---

## 2. Conformidade

A plataforma é desenvolvida e operada em conformidade com:
- **OWASP Top 10:2025** — Prevenção das 10 vulnerabilidades mais críticas em aplicações web
- **GDPR (Regulamento (UE) 2016/679)** — Proteção de dados pessoais dos utilizadores
- **ISO/IEC 27001:2022** — Sistema de gestão de segurança da informação
- **OWASP ASVS 4.0** — Verificação de segurança de aplicações

---

## 3. Autenticação e Autorização

### 3.1 Tokens JWT
- Algoritmo: HS256
- Validade: 30 minutos (configurável via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Armazenamento: `sessionStorage` (não persiste entre sessões do browser)
- Revogação: por logout explícito ou expiração natural

### 3.2 Passwords
- Hash: bcrypt com fator de trabalho ≥ 12 (via `bcrypt.gensalt()`)
- Comprimento mínimo: 12 caracteres (aplicado em `reset_admin_password.py`)
- Transmissão: apenas via HTTPS

### 3.3 Roles e Permissões
| Role | Descrição |
|------|-----------|
| `ADMIN` | Acesso total — gestão de utilizadores, relatórios, dados mestres |
| `MANAGER` | Relatórios e dashboards analíticos (Data Warehouse) |
| `TRAINER` | Gestão de formações, tutoria de trainees |
| `TRAINEE` | Acesso ao portal de aprendizagem |
| `STUDENT` | Acesso a cursos e desafios |

---

## 4. Comunicações

- **Produção**: HTTPS obrigatório (TLS 1.2+)
- **CORS**: origens explicitamente configuradas via `ALLOWED_ORIGINS` (nunca `*`)
- **Headers de segurança** (implementados no nginx e middleware FastAPI):
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`

---

## 5. Proteção de Dados

### 5.1 Dados pessoais armazenados
- Nome, email, role, equipa
- Histórico de submissões e progresso formativo
- Registos de erros de tutoria

### 5.2 Retenção e eliminação
- Utilizadores podem ser desativados (soft delete via `is_active=false`)
- Para eliminação definitiva (direito ao esquecimento GDPR), contactar o administrador

### 5.3 Backups
- Realizados automaticamente antes de cada deploy
- Ver `docs/BACKUP_RECOVERY.md` para política detalhada

---

## 6. Gestão de Vulnerabilidades

- **SAST**: Bandit executado em cada CI (análise estática Python)
- **Dependências**: pip-audit + npm audit em cada CI
- **Revisão**: dependências auditadas semanalmente via Dependabot
- **Divulgação**: vulnerabilidades reportadas via issue privada no GitHub

---

## 7. Reporte de Vulnerabilidades

Para reportar uma vulnerabilidade de segurança:
1. **NÃO** criar um issue público
2. Contactar diretamente o responsável de segurança
3. Aguardar confirmação em até 48 horas
4. Correção será aplicada e divulgada conforme política de divulgação responsável

---

## 8. Revisão

Este documento é revisto anualmente ou após qualquer incidente de segurança significativo.
