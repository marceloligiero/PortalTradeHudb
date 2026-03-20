# Backup e Recuperação — Portal TradeDataHub

**Classificação:** Confidencial
**Versão:** 1.0
**Data:** 2026-03-15

---

## 1. Âmbito

Política de backup e recuperação da base de dados MySQL e ficheiros de configuração do Portal TradeDataHub.

---

## 2. Estratégia de Backup

### 2.1 Backups Automáticos (Pre-Deploy)

O workflow de deploy cria automaticamente um backup antes de cada atualização:

```bash
# Executado em deploy.yml antes do docker compose up
BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups
docker exec tradehub-db mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" tradehub_db > "$BACKUP_FILE"
```

Localização: `/opt/tradehub/backups/`
Retenção: manter os últimos 30 backups (limpeza manual ou via cron)

### 2.2 Backups Manuais

```bash
# Criar backup manual
docker exec tradehub-db mysqldump \
  -uroot -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  tradehub_db > "backups/manual-$(date +%Y%m%d-%H%M%S).sql"
```

### 2.3 Frequência Recomendada

| Tipo | Frequência | Retenção |
|------|-----------|---------|
| Pre-deploy (automático) | Por deploy | 30 backups |
| Diário (manual/cron) | 1x/dia | 7 dias |
| Semanal | 1x/semana | 4 semanas |
| Mensal | 1x/mês | 12 meses |

---

## 3. Configurar Backup Diário via Cron

```bash
# Adicionar ao crontab do servidor (crontab -e)
0 2 * * * cd /opt/tradehub && \
  docker exec tradehub-db mysqldump \
  -uroot -p"$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2)" \
  --single-transaction tradehub_db \
  > "backups/daily-$(date +\%Y\%m\%d).sql" && \
  find backups/ -name "daily-*.sql" -mtime +7 -delete
```

---

## 4. Procedimento de Recuperação

### 4.1 Recuperação Completa

```bash
# 1. Parar o backend
docker compose stop tradehub-backend

# 2. Restaurar o backup
cat backups/<ficheiro>.sql | docker exec -i tradehub-db \
  mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" tradehub_db

# 3. Verificar integridade
docker exec tradehub-db mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" \
  -e "SELECT COUNT(*) FROM tradehub_db.users;"

# 4. Reiniciar
docker compose start tradehub-backend
```

### 4.2 Recuperação Parcial (tabela específica)

```bash
# Extrair apenas a tabela users de um backup
grep -n "Table structure for table \`users\`" backups/<ficheiro>.sql
# Editar o backup para extrair apenas a tabela pretendida
```

---

## 5. RTO e RPO

| Métrica | Objetivo |
|---------|---------|
| **RTO** (Recovery Time Objective) | 2 horas para P1, 8 horas para P2 |
| **RPO** (Recovery Point Objective) | ≤ 24 horas (backup diário) |

---

## 6. Testes de Recuperação

Realizar teste de recuperação completo **trimestralmente**:

1. Criar ambiente de teste isolado
2. Restaurar backup mais recente
3. Executar suite de testes: `pytest tests/ -v`
4. Verificar que todos os 341 testes passam
5. Documentar resultado do teste

---

## 7. Volume Docker

Os dados da base de dados estão no volume Docker `tradehub_db_data`.

```bash
# Ver volumes
docker volume ls | grep tradehub

# Inspecionar volume
docker volume inspect tradehub_db_data

# Backup do volume completo (alternativa ao mysqldump)
docker run --rm \
  -v tradehub_db_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/volume-$(date +%Y%m%d).tar.gz /data
```
