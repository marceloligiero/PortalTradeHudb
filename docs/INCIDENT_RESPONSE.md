# Resposta a Incidentes — Portal TradeDataHub

**Classificação:** Confidencial
**Versão:** 1.0
**Data:** 2026-03-15

---

## 1. Âmbito

Este procedimento aplica-se a incidentes de segurança que afetem o Portal TradeDataHub, incluindo violações de dados, acessos não autorizados, disponibilidade e integridade do sistema.

---

## 2. Classificação de Incidentes

| Severidade | Descrição | Exemplos | Tempo de Resposta |
|------------|-----------|---------|-------------------|
| **P1 — Crítico** | Sistema comprometido ou dados exfiltrados | Breach de credenciais, ransomware | 1 hora |
| **P2 — Alto** | Perda de disponibilidade ou acesso não autorizado | Downtime >1h, bypass de autenticação | 4 horas |
| **P3 — Médio** | Anomalia detetada sem impacto confirmado | Tentativas de brute force, erros anómalos | 24 horas |
| **P4 — Baixo** | Questão de segurança menor | Configuração subóptima | 72 horas |

---

## 3. Processo de Resposta

### Fase 1 — Deteção e Classificação (0-1h para P1/P2)

1. **Identificar** o incidente via logs, alertas ou reporte do utilizador
2. **Classificar** a severidade (P1-P4)
3. **Notificar** o responsável de segurança imediatamente para P1/P2

### Fase 2 — Contenção

**Para P1 (Crítico):**
```bash
# Parar todos os serviços imediatamente
docker compose down

# Registar o estado para análise forense
docker logs tradehub-backend > incident-$(date +%Y%m%d-%H%M%S)-backend.log
docker logs tradehub-frontend > incident-$(date +%Y%m%d-%H%M%S)-frontend.log
```

**Para violação de credenciais:**
```bash
# Invalidar todos os tokens JWT (alterar SECRET_KEY)
# 1. Gerar nova chave
python -c "import secrets; print(secrets.token_urlsafe(32))"
# 2. Atualizar no .env e reiniciar backend
```

### Fase 3 — Erradicação

1. Identificar a causa raiz
2. Aplicar patch/correção
3. Rever logs para determinar extensão do comprometimento
4. Verificar integridade dos dados via backup

### Fase 4 — Recuperação

1. Restaurar a partir do backup mais recente não comprometido (ver `docs/BACKUP_RECOVERY.md`)
2. Validar integridade do sistema com testes automatizados: `pytest tests/ -v`
3. Monitorizar ativamente nas primeiras 24h após recuperação

### Fase 5 — Pós-Incidente

1. Documentar o incidente (timeline, impacto, ações tomadas)
2. Identificar lacunas nos controlos
3. Implementar melhorias preventivas
4. Atualizar documentação de segurança

---

## 4. Notificação GDPR (Art. 33-34)

Se o incidente envolver dados pessoais:

- **Autoridade de supervisão**: notificar a CNPD (Portugal) em **72 horas** após conhecimento
  - Portal: https://www.cnpd.pt/
- **Titulares dos dados**: notificar se o risco para os direitos e liberdades for elevado (Art. 34)
- **Registo interno**: documentar todos os incidentes (Art. 33(5)), mesmo os não notificados

---

## 5. Contactos de Emergência

| Função | Forma de Contacto |
|--------|------------------|
| Responsável de Segurança | [definir internamente] |
| Administrador de Sistemas | [definir internamente] |
| Responsável de Proteção de Dados (RPD) | [definir internamente] |
| CNPD (violações GDPR) | https://www.cnpd.pt/ |

---

## 6. Evidências a Preservar

- Logs do servidor (backend, frontend, nginx, MySQL)
- Snapshots dos containers no momento do incidente
- Cópias dos ficheiros .env (sem passwords, apenas estrutura)
- Registos de acesso SSH e GitHub Actions
