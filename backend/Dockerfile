# ══════════════════════════════════════════════════════
# STAGE 1 — Dependencies
# Contexto: raiz do projecto (.)
# O migrate.py espera: <project_root>/database/migrations/
# Dentro do container: /app/database/migrations/
#                      /app/backend/  ← WORKDIR
# ══════════════════════════════════════════════════════
FROM python:3.14-slim AS deps

WORKDIR /build

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ══════════════════════════════════════════════════════
# STAGE 2 — Production
# ══════════════════════════════════════════════════════
FROM python:3.14-slim AS production

LABEL org.opencontainers.image.title="Portal TradeHub — Backend" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.description="FastAPI backend — Portal TradeHub"

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Utilizador não-root
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --no-create-home appuser

# Copiar packages Python instalados no stage deps
COPY --from=deps /usr/local/lib/python3.13 /usr/local/lib/python3.13
COPY --from=deps /usr/local/bin /usr/local/bin

# Estrutura esperada pelo migrate.py (parents[2] = /app):
#   /app/database/migrations/   ← ficheiros SQL de migração
#   /app/backend/               ← código FastAPI (WORKDIR)
COPY --chown=appuser:appgroup database/migrations/ /app/database/migrations/
COPY --chown=appuser:appgroup backend/ /app/backend/

WORKDIR /app/backend

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
