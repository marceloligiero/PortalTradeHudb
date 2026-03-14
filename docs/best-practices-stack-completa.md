# Guia de Melhores Práticas — Stack Completa

> React · Node.js · Tailwind CSS · CSS · FastAPI · MySQL · Animações
>
> Atualizado: Março 2026

---

## Índice

- [1. React](#1-react)
- [2. Node.js](#2-nodejs)
- [3. Tailwind CSS](#3-tailwind-css)
- [4. CSS Moderno](#4-css-moderno)
- [5. FastAPI](#5-fastapi)
- [6. MySQL](#6-mysql)
- [7. Animações — Frameworks e Práticas](#7-animações--frameworks-e-práticas)

---

## 1. React

### 1.1 — Componentes e Arquitetura

**Componentes Funcionais como padrão.** Class components são considerados legacy. Hooks (`useState`, `useEffect`, `useReducer`, `useMemo`, `useCallback`) substituem todos os lifecycle methods de forma mais concisa e reutilizável.

**Princípio da responsabilidade única.** Cada componente deve fazer uma coisa. Se um componente cresce além de ~150 linhas, é sinal para o dividir em sub-componentes.

**Composição sobre herança.** React favorece composição com `children`, render props e custom hooks em vez de herança ou HOCs complexos. HOCs ainda são úteis, mas hooks resolvem a maioria dos casos.

**Estrutura de pastas recomendada:**

```
src/
├── components/        # Componentes reutilizáveis (Button, Modal, Card)
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx
│       └── index.ts
├── features/          # Funcionalidades de domínio (auth, dashboard, settings)
├── hooks/             # Custom hooks partilhados
├── services/          # Chamadas API, integrações
├── utils/             # Funções utilitárias puras
├── types/             # Tipos e interfaces TypeScript
├── contexts/          # Providers de contexto
├── assets/            # Imagens, fontes, ícones
└── App.tsx
```

### 1.2 — State Management

**Regra de ouro: manter o estado o mais perto possível do componente que o usa.**

Hierarquia de decisão:

1. **Estado local** (`useState`, `useReducer`) — para estado de UI de um único componente.
2. **Context API** (`useContext`) — para dados que mudam raramente e precisam ser acedidos globalmente (tema, auth, idioma). Evitar para estado que muda frequentemente porque re-renderiza todos os consumers.
3. **Bibliotecas leves** (Zustand, Jotai, Valtio) — para estado global partilhado com updates frequentes, sem a complexidade do Redux.
4. **Redux Toolkit** — apenas para aplicações grandes com fluxos de estado muito complexos, undo/redo, ou quando a equipa já tem experiência com Redux.
5. **TanStack Query (React Query)** — para "server state" (dados de APIs). Elimina 80% do código de Redux em aplicações típicas. Gere cache, refetch, loading states, error states, paginação e background updates automaticamente.

**Nunca guardar dados derivados no estado.** Se um valor pode ser calculado a partir de outro estado, calcule-o durante o render com `useMemo` em vez de o duplicar.

### 1.3 — Performance

**React Compiler (React 19+).** Automatiza memoization, eliminando 30-60% de re-renders desnecessários. Em projetos novos, ativar antes de qualquer otimização manual.

**Code splitting e lazy loading:**

```tsx
const Dashboard = React.lazy(() => import('./features/Dashboard'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

**Regras de memoization manual (quando o Compiler não está disponível):**

- `React.memo` — para componentes puros que recebem props estáveis.
- `useMemo` — para cálculos caros que dependem de inputs específicos.
- `useCallback` — para funções passadas como props a componentes memorizados.
- Não memoizar tudo — memoização tem custo. Usar apenas quando o profiling mostra re-renders problemáticos.

**Metas de performance (Lighthouse):**

| Métrica | Alvo |
|---------|------|
| First Contentful Paint | < 1.8s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Interaction to Next Paint | < 200ms |
| Lighthouse Performance Score | 90+ |

### 1.4 — React Server Components (RSC)

Estáveis desde React 18, e padrão no Next.js 14+ com o diretório `app/`. Princípios:

- **Server Components** — renderizam no servidor, zero JS enviado ao cliente. Ideal para conteúdo estático, data fetching, e componentes que não precisam de interatividade.
- **Client Components** (`"use client"`) — apenas quando precisam de hooks, event handlers, ou browser APIs.
- **Regra: começar tudo como Server Component e promover a Client Component apenas quando necessário.**
- Usar `Suspense` boundaries para streaming e fallbacks progressivos.

### 1.5 — TypeScript

TypeScript é o padrão de facto para projetos React em 2026. Práticas:

- Tipar **todas** as props com interfaces ou types.
- Usar `as const` para objetos de configuração imutáveis.
- Preferir `unknown` sobre `any`.
- Usar discriminated unions para estados complexos.
- Tipar hooks customizados com return types explícitos.

### 1.6 — Testes

- **Vitest** ou **Jest** para unit tests.
- **React Testing Library** para testes de componentes — testar comportamento, não implementação.
- **Playwright** ou **Cypress** para testes end-to-end.
- Cobertura mínima recomendada: 80% para lógica de negócio, 60% geral.

### 1.7 — Frameworks Recomendados

| Framework | Quando usar |
|-----------|------------|
| **Next.js** | Padrão para a maioria das aplicações. SSR, SSG, ISR, API routes, React Server Components out of the box. |
| **Vite + React Router** | Quando não precisa de SSR. SPAs leves e rápidas. |
| **Remix** | Ênfase em web fundamentals, nested routes, progressive enhancement. |
| **Astro** | Sites com conteúdo estático. Zero JS por defeito, suporta React components. |

---

## 2. Node.js

### 2.1 — Fundamentos Modernos

**ES Modules como padrão.** Em 2026, ESM é a norma. Configurar `"type": "module"` no `package.json` e usar `import/export` em vez de `require/module.exports`.

**Async/Await em todo o lado.** Callback hell e `.then()` chains são padrões legacy. Async/await é obrigatório para legibilidade, manutenção e error handling correto.

```typescript
// ❌ Legacy
function getUser(id, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
}

// ✅ Moderno
async function getUser(id: string): Promise<User> {
  return await db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

**TypeScript.** O padrão para qualquer projeto Node.js sério. Fornece type safety, melhor tooling, e reduz bugs em runtime.

**Node.js LTS.** Sempre usar a versão LTS mais recente (Node 22 em 2026). Verificar compatibilidade antes de atualizar.

### 2.2 — Arquitetura e Estrutura

**Separação de responsabilidades em camadas:**

```
src/
├── controllers/      # Recebem requests, delegam para services
├── services/         # Lógica de negócio (pura, testável)
├── repositories/     # Acesso a dados (queries, ORM)
├── middlewares/      # Auth, validação, error handling, rate limiting
├── routes/           # Definição de rotas
├── models/           # Schemas/entities
├── validators/       # Schemas de validação (Zod, Joi)
├── config/           # Configuração centralizada
├── utils/            # Funções utilitárias
└── index.ts          # Ponto de entrada
```

**Nunca colocar lógica de negócio nos controllers.** Controllers recebem o request, chamam o service, e devolvem a response. Toda a lógica vive nos services.

**Variáveis de ambiente com validação.** Usar `dotenv` + validação com Zod ou Joi no arranque da aplicação. Falhar ruidosamente se uma variável obrigatória está em falta.

### 2.3 — Error Handling

- Centralizar error handling num middleware global.
- Criar classes de erro personalizadas (`NotFoundError`, `ValidationError`, `UnauthorizedError`).
- Nunca deixar promises sem `.catch()` — usar `process.on('unhandledRejection')` como safety net.
- Registar erros com contexto (request ID, user ID, stack trace) usando bibliotecas como Pino ou Winston.
- Nunca expor stack traces em produção.

### 2.4 — Segurança

- **Validar todo o input.** Assumir que todo o input é malicioso.
- **Helmet.js** para headers HTTP seguros.
- **Rate limiting** com `express-rate-limit` ou similar.
- **CORS** configurado corretamente (não usar `*` em produção).
- **SQL injection** — sempre usar prepared statements ou ORM.
- **Dependências** — auditar regularmente com `npm audit` e `snyk`.
- **Secrets** — nunca no código. Usar variáveis de ambiente ou secret managers.

### 2.5 — Performance

- **Não bloquear o Event Loop.** Operações CPU-intensive devem ir para Worker Threads ou serviços separados.
- **Streams** para processar ficheiros grandes ou data volumes.
- **Connection pooling** para bases de dados.
- **Caching** — Redis para dados frequentemente acedidos.
- **Compressão** — ativar gzip/brotli no servidor ou no reverse proxy.
- **Clustering** — usar o módulo `cluster` ou PM2 para usar múltiplos cores.

### 2.6 — Frameworks Recomendados

| Framework | Quando usar |
|-----------|------------|
| **Express.js** | APIs simples a médias. Flexível, enorme ecossistema. |
| **Fastify** | APIs que precisam de máxima performance. Schema validation built-in, 2x mais rápido que Express. |
| **NestJS** | Aplicações grandes e enterprise. Arquitetura opinativa (modules, controllers, services), TypeScript nativo, DI container. |
| **Hono** | APIs ultra-leves, serverless, edge computing. |

### 2.7 — Deploy e Produção

- Docker com multi-stage builds (ver secção de Docker).
- Gunicorn/PM2 para process management (nunca correr `node index.js` diretamente).
- Health check endpoints.
- Graceful shutdown (tratar `SIGTERM`).
- Logging estruturado (JSON) para facilitar parsing por ferramentas de monitorização.
- Testes automatizados no CI/CD antes de cada deploy.

---

## 3. Tailwind CSS

### 3.1 — Versão e Setup (v4)

Tailwind CSS v4 (lançado janeiro 2025) trouxe mudanças significativas:

- **Motor Rust** — builds 5x mais rápidos, incremental builds 100x mais rápidos.
- **Configuração CSS-first** — `@theme` substitui `tailwind.config.js`.
- **Deteção automática de conteúdo** — zero configuração necessária.
- **Cores OKLCH por defeito** — mais vibrantes e uniformes.

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.6 0.2 250);
  --color-brand-600: oklch(0.5 0.22 250);
  --font-sans: "Inter", sans-serif;
  --spacing-header: 4rem;
}
```

### 3.2 — Princípios Fundamentais

**Utility-first, component-second.** Usar classes utilitárias diretamente no markup. Extrair para componentes React (não classes CSS) quando um padrão se repete.

```tsx
// ✅ Extrair padrão repetido num componente React
function Button({ children, variant = "primary" }) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  };
  return (
    <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

**Nunca construir classes dinamicamente:**

```tsx
// ❌ O compilador não vê estas classes
const color = "blue";
<div className={`bg-${color}-500`} />

// ✅ Strings completas sempre visíveis
const bgColor = isActive ? "bg-blue-500" : "bg-gray-500";
<div className={bgColor} />
```

### 3.3 — Organização e Manutenção

- **Usar `cn()` ou `clsx()`** para classes condicionais.
- **Class Variance Authority (CVA)** para variantes de componentes complexas.
- **Prettier plugin** (`prettier-plugin-tailwindcss`) para ordenação automática de classes.
- **Limite de ~10-12 classes por elemento.** Se ultrapassar, extrair para um componente.
- **Design tokens centralizados** no `@theme` — nunca usar hex codes espalhados pelo código.

### 3.4 — Responsive Design

Tailwind segue abordagem **mobile-first**:

```html
<!-- Base: mobile → sm: tablet → lg: desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Container queries (v4)** — responsive ao container, não ao viewport:

```html
<div class="@container">
  <p class="@sm:text-lg @lg:text-2xl">Responsive ao seu container</p>
</div>
```

### 3.5 — Dark Mode

```css
@theme {
  --color-surface: oklch(0.98 0 0);
  --color-text: oklch(0.15 0 0);
}

.dark {
  --color-surface: oklch(0.15 0 0);
  --color-text: oklch(0.95 0 0);
}
```

```html
<div class="bg-surface text-text dark:bg-surface dark:text-text">
```

Trocar tema com uma classe no `<html>` — sem re-renders de componentes.

### 3.6 — Boas Práticas Adicionais

- Não usar `@apply` excessivamente — o time do Tailwind recomenda evitá-lo em v4. Preferir CSS explícito ou componentes React.
- Acessibilidade não é automática — Tailwind não adiciona `alt`, `aria-*`, ou semântica HTML. Isso é responsabilidade do developer.
- Usar `sr-only` para texto acessível invisível.
- Instalar o **Tailwind CSS IntelliSense** no VS Code para autocomplete.

---

## 4. CSS Moderno

### 4.1 — Layout

**CSS Grid** — para layouts bidimensionais (linhas + colunas):

```css
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  min-height: 100vh;
}
```

**Flexbox** — para alinhamento unidimensional:

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
```

**Subgrid** — filhos herdam o grid do pai:

```css
.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

### 4.2 — Custom Properties (CSS Variables)

```css
:root {
  --color-primary: oklch(0.6 0.2 250);
  --radius-md: 0.5rem;
  --spacing-base: 1rem;
  --transition-fast: 150ms ease;
}

.button {
  background: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-base);
  transition: opacity var(--transition-fast);
}
```

### 4.3 — Container Queries

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

### 4.4 — Boas Práticas

- **Mobile-first** — começar com estilos base para mobile, adicionar media queries para ecrãs maiores.
- **Evitar `!important`** — usar especificidade ou `@layer` para controlar cascata.
- **`@layer`** — organizar estilos em camadas com precedência previsível.
- **Unidades relativas** — usar `rem` para tipografia, `%` ou `fr` para layout, `dvh` para viewport height em mobile.
- **`prefers-reduced-motion`** — respeitar preferências de acessibilidade.
- **`prefers-color-scheme`** — para dark mode nativo.
- **Logical properties** — usar `margin-inline`, `padding-block` em vez de `margin-left`, `padding-top` para suporte a RTL.
- **`clamp()`** — para tipografia fluida: `font-size: clamp(1rem, 2.5vw, 2rem)`.

---

## 5. FastAPI

### 5.1 — Setup e Versão

Python 3.12+ é o recomendado para novos projetos em 2026. FastAPI 0.135+ é a versão estável atual.

```bash
pip install "fastapi[standard]"
```

Isto inclui Uvicorn, Pydantic, e outros extras recomendados.

### 5.2 — Estrutura de Projeto

```
app/
├── main.py              # Ponto de entrada, app factory
├── core/
│   ├── config.py        # Settings com pydantic-settings
│   └── security.py      # JWT, hashing, auth helpers
├── routers/
│   ├── users.py         # Endpoints de users
│   └── items.py         # Endpoints de items
├── models/              # SQLAlchemy models (DB)
├── schemas/             # Pydantic schemas (request/response)
├── services/            # Lógica de negócio
├── repositories/        # Queries à base de dados
├── dependencies.py      # Dependency injection
└── db/
    ├── database.py      # Engine, SessionLocal
    └── migrations/      # Alembic migrations
```

### 5.3 — Async vs Sync — Regra Crítica

```python
# ✅ Usar async quando a operação é I/O (DB, API calls, ficheiros async)
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await db.get(User, user_id)

# ✅ Usar sync quando a operação é CPU-bound ou usa libs sync
@router.get("/report")
def generate_report():  # FastAPI corre isto numa threadpool automaticamente
    return create_heavy_report()

# ❌ NUNCA fazer I/O bloqueante dentro de uma função async
@router.get("/bad")
async def bad_endpoint():
    time.sleep(5)  # Bloqueia o event loop inteiro!
```

**Regra:** Se a função não faz `await` em nada, defini-la como `def` (sync), não `async def`.

### 5.4 — Pydantic Schemas

```python
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

**Separar schemas de input e output.** Nunca expor campos sensíveis (password, tokens internos) na response.

### 5.5 — Dependency Injection

FastAPI faz cache de dependências por request por defeito:

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_jwt(token)
    user = await get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401)
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403)
    return user

@router.delete("/users/{id}")
async def delete_user(id: int, admin: User = Depends(require_admin)):
    ...
```

**Encadear dependências** para DRY code. Usar dependências para validação de dados contra a base de dados.

### 5.6 — Error Handling

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

@app.exception_handler(AppException)
async def app_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )
```

### 5.7 — Background Tasks

```python
from fastapi import BackgroundTasks

@router.post("/notify")
async def send_notification(bg: BackgroundTasks):
    bg.add_task(send_email, to="user@example.com")
    return {"status": "queued"}
```

Para tarefas pesadas ou demoradas, usar Celery, ARQ ou TaskIQ em vez de BackgroundTasks.

### 5.8 — Segurança

- CORS configurado com origens específicas (nunca `allow_origins=["*"]` em produção).
- Rate limiting com `slowapi` ou middleware custom.
- Input validation automática via Pydantic (SQL injection prevenido pelo ORM).
- HTTPS obrigatório em produção.
- Headers de segurança via middleware.

### 5.9 — Deploy em Produção

```bash
# Gunicorn + Uvicorn workers (padrão da indústria)
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --max-requests 1000 \
  --max-requests-jitter 50 \
  --preload
```

**Workers = número de cores da CPU.** Async workers não precisam da fórmula `(2 × cores) + 1`.

### 5.10 — Health Check

```python
@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "failed"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "checks": {"database": db_status},
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## 6. MySQL

### 6.1 — Schema Design

**Usar os data types corretos:**

```sql
-- ❌ Desperdício de espaço e performance
CREATE TABLE users (
  id BIGINT,
  name VARCHAR(255),
  created_at VARCHAR(50)
);

-- ✅ Eficiente
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Normalização vs Denormalização:**

- Normalizar para integridade e consistência (OLTP).
- Denormalizar para performance de leitura (reporting, analytics).
- Em aplicações típicas, normalizar até à 3ª forma normal e denormalizar apenas onde o profiling mostra bottleneck.

**Sempre usar InnoDB** — suporta transações, foreign keys, row-level locking, crash recovery.

**utf8mb4** — sempre. Suporta todos os caracteres Unicode incluindo emojis.

### 6.2 — Indexação

**Regras de ouro:**

- Indexar colunas usadas em `WHERE`, `JOIN`, `ORDER BY`.
- Índices compostos: a ordem das colunas importa. A coluna com maior seletividade primeiro.
- Evitar indexar colunas com baixa cardinalidade (ex: `status` com 3 valores possíveis) a menos que combinadas com outras colunas.
- Covering indexes — quando o index contém todas as colunas da query, o MySQL não precisa de ir à tabela.

```sql
-- Index composto para queries frequentes
CREATE INDEX idx_user_status_created 
  ON orders (user_id, status, created_at);

-- Covering index
CREATE INDEX idx_covering 
  ON products (category_id, price, name);
```

**Analisar queries com `EXPLAIN`:**

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 5 AND status = 'active';
```

### 6.3 — Query Performance

- **Evitar `SELECT *`** — selecionar apenas colunas necessárias.
- **Limitar resultados** — sempre usar `LIMIT` em queries de listagem.
- **Evitar queries N+1** — usar JOINs ou subqueries em vez de queries em loop.
- **Prepared statements** — sempre. Previnem SQL injection e melhoram performance por reutilização do query plan.
- **Connection pooling** — usar pools de conexões (típico: min 5, max 20 por serviço).
- **Slow query log** — ativar e monitorizar queries acima de 1 segundo.

```sql
-- Ativar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
```

### 6.4 — Segurança

**Princípio do menor privilégio:**

```sql
-- Criar user específico para a aplicação
CREATE USER 'app_user'@'%' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON app_db.* TO 'app_user'@'%';

-- NUNCA usar root para a aplicação
-- NUNCA dar GRANT ALL
```

**Hardening checklist:**

1. Remover utilizadores anónimos: `DROP USER ''@'localhost';`
2. Remover base de dados `test`: `DROP DATABASE IF EXISTS test;`
3. Desativar login root remoto.
4. Ativar `validate_password` plugin para impor políticas de passwords.
5. Mudar a porta padrão (3306) para reduzir scans automáticos.
6. Ativar SSL/TLS para conexões.
7. Encriptar dados at rest com InnoDB tablespace encryption.
8. Ativar binary logging para auditoria.
9. Configurar `max_connect_errors` e account locking.
10. Apagar o ficheiro `~/.mysql_history` e redirecionar para `/dev/null`.

**MySQL 8.0+ RBAC (Role-Based Access Control):**

```sql
CREATE ROLE 'app_read', 'app_write';
GRANT SELECT ON app_db.* TO 'app_read';
GRANT INSERT, UPDATE, DELETE ON app_db.* TO 'app_write';

-- Atribuir roles a users
GRANT 'app_read', 'app_write' TO 'app_user'@'%';
SET DEFAULT ROLE ALL TO 'app_user'@'%';
```

### 6.5 — Backup e Recovery

- **Backups automáticos diários** — `mysqldump` para small/medium, `mysqlbackup` ou Percona XtraBackup para produção.
- **Binary logs ativos** — permitem point-in-time recovery.
- **Testar restauração regularmente** — um backup que não foi testado não é um backup.
- **Regra 3-2-1** — 3 cópias, 2 tipos de media, 1 offsite.

### 6.6 — Configuração de Performance

Parâmetros chave do `my.cnf`:

```ini
[mysqld]
# Buffer Pool — usar ~70% da RAM disponível
innodb_buffer_pool_size = 4G

# Log file size — maior = melhor performance de escrita, recovery mais lento
innodb_log_file_size = 1G

# Flush — 2 para melhor performance, 1 para máxima durabilidade (ACID)
innodb_flush_log_at_trx_commit = 1

# Conexões
max_connections = 200

# Query cache — DESATIVADO no MySQL 8.0+ (removido)
# Usar cache na camada de aplicação (Redis)

# Temporary tables
tmp_table_size = 256M
max_heap_table_size = 256M
```

---

## 7. Animações — Frameworks e Práticas

### 7.1 — Panorama de Bibliotecas

| Biblioteca | Tipo | Para quem | Bundle Size | Licença |
|-----------|------|-----------|-------------|---------|
| **Motion** (ex-Framer Motion) | Declarativa | Developers React/Vue/JS | ~18kb (tree-shaken) | MIT |
| **GSAP** | Imperativa | Animadores, qualquer framework | ~24kb core | Proprietária (Webflow) |
| **CSS Animations/Transitions** | Nativa | Casos simples | 0kb | N/A |
| **Lottie** (lottie-web) | After Effects → Web | Animações complexas pré-desenhadas | ~50kb | MIT |
| **Three.js** | 3D/WebGL | Experiências 3D, visualizações | ~150kb | MIT |
| **AutoAnimate** | Zero-config | Listas, transições simples | ~2kb | MIT |
| **Spring.js / React Spring** | Physics-based | Animações naturais | ~16kb | MIT |

### 7.2 — Motion (ex-Framer Motion) — Recomendado para React

**Quando usar:** Animações de UI, transições de página, gestos, layout animations, enter/exit animations.

```tsx
import { motion, AnimatePresence } from "motion/react";

// Animação básica
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Conteúdo
</motion.div>

// Variants para estados reutilizáveis
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  hover: { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
};

<motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
  Card
</motion.div>

// AnimatePresence para enter/exit
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Modal
    </motion.div>
  )}
</AnimatePresence>
```

**Vantagens:** API declarativa, integração perfeita com React, layout animations, gesture support, MIT open-source.

### 7.3 — GSAP — Para animações complexas

**Quando usar:** Timelines complexas, scroll-driven animations, SVG morphing, animações de texto, experiências imersivas, projetos multi-framework.

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function HeroSection() {
  const titleRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
        },
      });
    });

    return () => ctx.revert(); // Cleanup obrigatório em React
  }, []);

  return <h1 ref={titleRef}>Hero Title</h1>;
}
```

**Plugins GSAP úteis:**

| Plugin | O que faz |
|--------|-----------|
| ScrollTrigger | Anima com base no scroll position |
| SplitText | Divide texto em chars/words/lines para animar |
| MorphSVG | Transforma shapes SVG |
| Draggable | Drag-and-drop com inércia |
| Flip | Animações de layout (similar a layout animations do Motion) |
| MotionPath | Anima ao longo de paths SVG |

**Atenção:** GSAP é proprietário do Webflow desde 2024. A licença proíbe uso em ferramentas que competem com o Webflow. Para projetos onde a liberdade de licença é crítica, Motion (MIT) é a alternativa segura.

### 7.4 — CSS Nativo — Para casos simples

```css
/* Transição simples */
.button {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Keyframe animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeInUp 0.4s ease-out;
}

/* View Transitions API (nativa do browser, 2025+) */
::view-transition-old(root) {
  animation: fade-out 0.3s ease;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease;
}
```

### 7.5 — Lottie — Animações pré-desenhadas

Para animações complexas criadas no After Effects e exportadas como JSON.

```tsx
import Lottie from "lottie-react";
import animationData from "./animation.json";

<Lottie animationData={animationData} loop={true} style={{ width: 200 }} />;
```

**Quando usar:** Loading animations, ilustrações animadas, ícones animados, onboarding flows. Perfeito para designers que trabalham no After Effects.

### 7.6 — Boas Práticas Gerais de Animação

**Performance:**

- Animar apenas `transform` e `opacity` — são as únicas propriedades que o GPU acelera sem triggering layout/paint.
- Evitar animar `width`, `height`, `top`, `left`, `margin`, `padding` — causam layout recalculation.
- Usar `will-change` com moderação e apenas em elementos que vão ser animados.
- Limitar animações simultâneas a ~50 em dispositivos low-end.

**UX:**

- Animações devem ter propósito (guiar atenção, dar feedback, suavizar transições).
- Durações recomendadas: 200-500ms para UI, até 1000ms para transições de página.
- Respeitar `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// Em React com Motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

**Easing:**

| Tipo | Quando usar | CSS |
|------|------------|-----|
| ease-out | Elementos a entrar | `cubic-bezier(0, 0, 0.2, 1)` |
| ease-in | Elementos a sair | `cubic-bezier(0.4, 0, 1, 1)` |
| ease-in-out | Elementos que se movem | `cubic-bezier(0.4, 0, 0.2, 1)` |
| spring | Interações (Motion) | `{ type: "spring", stiffness: 300, damping: 30 }` |

### 7.7 — Tabela de Decisão

| Cenário | Recomendação |
|---------|-------------|
| Hover, focus, transições simples | CSS nativo |
| Enter/exit de componentes React | Motion |
| Animações de layout em React | Motion |
| Gestos (drag, swipe, pinch) | Motion |
| Timelines complexas com precisão | GSAP |
| Scroll-driven storytelling | GSAP + ScrollTrigger |
| SVG morphing | GSAP + MorphSVG |
| Animações do After Effects | Lottie |
| Listas com add/remove automático | AutoAnimate |
| 3D e WebGL | Three.js |
| Vídeos gerados com React | Remotion |
| Qualquer framework (Vue, Angular, vanilla) | GSAP ou Motion (v11+) |

---

## Referências e Recursos

| Tecnologia | Recurso |
|-----------|---------|
| React | [react.dev](https://react.dev) — documentação oficial |
| React Patterns | [patterns.dev/react](https://patterns.dev/react/react-2026/) |
| Node.js Best Practices | [github.com/goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) |
| Tailwind CSS v4 | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| FastAPI | [fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| FastAPI Best Practices | [github.com/zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) |
| MySQL | [dev.mysql.com/doc](https://dev.mysql.com/doc/refman/8.4/en/) |
| Motion | [motion.dev](https://motion.dev) |
| GSAP | [gsap.com](https://gsap.com) |
| Lottie | [lottiefiles.com](https://lottiefiles.com) |
| CSS Tricks | [css-tricks.com](https://css-tricks.com) |
| Web.dev | [web.dev](https://web.dev) — performance e best practices |
