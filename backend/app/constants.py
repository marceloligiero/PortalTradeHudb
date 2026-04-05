"""
Constantes de negócio centralizadas.
Evita magic numbers/strings espalhados pelo código.
"""

# ─── Paginação ────────────────────────────────────────────────────────────────
DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100

# ─── Data Warehouse / DW ──────────────────────────────────────────────────────
DW_DEFAULT_LIMIT = 10
DW_MAX_LIMIT = 50
DW_DEFAULT_DAYS = 30
DW_MAX_DAYS = 365

# ─── Chatbot ──────────────────────────────────────────────────────────────────
MAX_CHAT_ERRORS_DISPLAY = 10
MAX_CHAT_STUDENTS_DISPLAY = 15
MAX_CHAT_PLANS_DISPLAY = 10

# ─── Org Hierarchy ────────────────────────────────────────────────────────────
ORG_HIERARCHY_DEFAULT_LIMIT = 100

# ─── Tutoria ──────────────────────────────────────────────────────────────────
MAX_TUTORIA_RECORDS = 50

# ─── Rate Limiting ────────────────────────────────────────────────────────────
RATE_LIMIT_DEFAULT = "60/minute"
PASSWORD_RESET_RATE_LIMIT = "3/minute"

# ─── Schedulers (segundos) ────────────────────────────────────────────────────
ETL_INTERVAL_SECONDS = 300         # 5 minutos — DW actualiza automaticamente
DEADLINE_INTERVAL_SECONDS = 86400  # 24 horas

# ─── Cache HTTP (segundos) ────────────────────────────────────────────────────
CACHE_ASSETS_MAX_AGE = 31536000    # 1 ano (ficheiros com hash Vite)
CACHE_LOCALES_MAX_AGE = 3600       # 1 hora

# ─── HSTS ─────────────────────────────────────────────────────────────────────
HSTS_MAX_AGE = 31536000            # 1 ano

# ─── Database connection pool ─────────────────────────────────────────────────
DB_POOL_SIZE = 10
DB_MAX_OVERFLOW = 20
DB_POOL_RECYCLE_SECONDS = 3600     # 1 hora

# ─── Password reset ───────────────────────────────────────────────────────────
TOKEN_EXPIRY_HOURS = 1
