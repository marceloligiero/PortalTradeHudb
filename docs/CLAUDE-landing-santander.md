# CLAUDE.md — Recriar Landing Page do TradeHub (Cores Santander)

> Instruções para Claude Code. Colocar na raiz do projeto PortalTradeHub.

---

## Missão

Recriar a landing page do PortalTradeHub DO ZERO usando as cores oficiais do Santander e Santander Digital Services. A landing page é a primeira coisa que um utilizador não autenticado vê. Deve transmitir profissionalismo, confiança e modernidade — ao nível de uma plataforma enterprise de um grande banco.

**O que NÃO estamos a fazer:** Não estamos a criar uma cópia do site do Santander. Estamos a usar a paleta de cores e a linguagem visual como base para recriar a landing page do TradeHub com o conteúdo e funcionalidades do projeto.

---

## Regras Absolutas

1. **Ler a landing page atual primeiro.** Antes de criar qualquer coisa, ler o componente atual da landing page, entender o conteúdo, os textos, os CTAs e o routing.
2. **Aproveitar o conteúdo existente.** O copy, as features descritas e a estrutura de portais do TradeHub são o conteúdo. Reescrever o visual, não o significado.
3. **Não quebrar o routing.** O React Router v6 existente em `App.tsx` deve continuar a funcionar. A landing page é a rota `/` para utilizadores não autenticados.
4. **Não inventar features.** Só mostrar na landing page funcionalidades que realmente existem no projeto.
5. **Não usar imagens stock externas.** Usar SVGs, gradientes, ícones (Lucide React já deve estar disponível) e CSS art.
6. **Mobile-first.** Responsive em todos os breakpoints.
7. **Dark mode compatível.** Respeitar o ThemeContext existente.

---

## Paleta de Cores Santander — Oficial

Baseada no brand guide oficial do Santander (2018+):

### Cores Primárias

```css
/* ══════════════════════════════════════
   SANTANDER — Paleta Oficial
   Proporção recomendada: 50% branco, 40% vermelho, 5% sky, 5% dark
   ══════════════════════════════════════ */

/* Vermelho Santander — A COR principal */
--santander-red: #EC0000;
--santander-red-hover: #CC0000;
--santander-red-dark: #990000;
--santander-red-light: #FF3333;

/* Branco — Espaço, leveza, simplicidade */
--santander-white: #FFFFFF;

/* Sky — Frescura, tecnologia, modernidade */
--santander-sky: #DEEDF2;
--santander-sky-dark: #B8D4E0;

/* Dark — Texto, contraste */
--santander-dark: #222222;
--santander-dark-secondary: #444444;
--santander-dark-muted: #6D6D6D;
```

### Cores Secundárias (expansão digital)

```css
/* Tons de vermelho (escala completa) */
--santander-red-900: #660000;
--santander-red-800: #8B0000;
--santander-red-700: #990000;
--santander-red-600: #CC0000;
--santander-red-500: #EC0000;  /* Principal */
--santander-red-400: #FF3333;
--santander-red-300: #FF6666;
--santander-red-200: #FF9999;
--santander-red-100: #FFCCCC;
--santander-red-50:  #FFF0F0;

/* Neutros */
--santander-gray-900: #1A1A1A;
--santander-gray-800: #333333;
--santander-gray-700: #4D4D4D;
--santander-gray-600: #6D6D6D;
--santander-gray-500: #888888;
--santander-gray-400: #AAAAAA;
--santander-gray-300: #C2C2C2;
--santander-gray-200: #E0E0E0;
--santander-gray-100: #F0F0F0;
--santander-gray-50:  #F8F8F8;
```

### Aplicação por Modo

```css
/* ── LIGHT MODE (padrão Santander) ─── */
--bg-primary: #FFFFFF;
--bg-secondary: #F8F8F8;
--bg-tertiary: #F0F0F0;
--bg-hero: linear-gradient(135deg, #EC0000 0%, #990000 100%);
--text-primary: #222222;
--text-secondary: #6D6D6D;
--text-on-red: #FFFFFF;
--accent: #EC0000;
--accent-hover: #CC0000;
--border: #E0E0E0;
--card-bg: #FFFFFF;
--card-shadow: 0 2px 12px rgba(0,0,0,0.08);

/* ── DARK MODE ─────────────────────── */
--bg-primary: #111111;
--bg-secondary: #1A1A1A;
--bg-tertiary: #222222;
--bg-hero: linear-gradient(135deg, #8B0000 0%, #440000 100%);
--text-primary: #F0F0F0;
--text-secondary: #AAAAAA;
--text-on-red: #FFFFFF;
--accent: #FF3333;
--accent-hover: #EC0000;
--border: #333333;
--card-bg: #1A1A1A;
--card-shadow: 0 2px 12px rgba(0,0,0,0.3);
```

---

## Tarefas — Executar na Ordem

### TAREFA 1 — Analisar a landing page atual

Ler estes ficheiros na íntegra:

```
frontend/src/App.tsx                           → Routing, qual componente renderiza em /
frontend/src/pages/                            → Procurar: Landing, Home, Welcome, LandingPage
frontend/src/components/                       → Header, Footer, Navbar de landing
frontend/src/i18n/locales/                     → Textos em PT/ES/EN (reutilizar)
frontend/src/contexts/ThemeContext.tsx          → Como o dark/light mode funciona
frontend/src/stores/authStore.ts               → Como saber se user está autenticado
```

Documentar:
- Qual componente é a landing page atual
- Que textos/copy tem
- Que CTAs existem (login, register, etc.)
- Que secções tem
- Que assets usa
- Como o routing distingue autenticado vs não autenticado

Apresentar antes de avançar.

---

### TAREFA 2 — Apagar a landing page antiga e criar do zero

Apagar o conteúdo do componente da landing page (manter o ficheiro, reescrever o conteúdo). Se a landing page está espalhada por vários componentes, consolidar num único componente limpo.

Criar a nova landing page com EXATAMENTE estas secções, nesta ordem:

---

#### SECÇÃO 1 — HERO

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Background: gradiente vermelho Santander (--bg-hero)            │
│                                                                  │
│  [Logo TradeHub — branco]                                        │
│                                                                  │
│  Headline (h1, grande, branco, bold):                            │
│  "A sua plataforma de formação e evolução em trading"            │
│                                                                  │
│  Subtítulo (text-lg, branco/80%):                                │
│  "Formações estruturadas, tutoria personalizada, relatórios      │
│   com insights e suporte integrado — tudo numa única             │
│   plataforma para a sua equipa crescer."                         │
│                                                                  │
│  [CTA Primário: "Começar Agora" → /register]                    │
│  [CTA Secundário: "Iniciar Sessão" → /login]                    │
│                                                                  │
│  (Ilustração SVG abstrata: gráfico de trading estilizado         │
│   ou ondas que remetem à flame do Santander)                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

A headline e subtítulo devem vir dos textos do i18n existentes ou ser adaptados do conteúdo atual. Se o projeto já tem textos de landing em PT/ES/EN, reutilizá-los melhorados.

---

#### SECÇÃO 2 — 3 PILARES (inspirado Bipsync "Capture, Structure, Analyze")

Background: branco (light) ou #1A1A1A (dark)

```
┌──────────────┬──────────────┬──────────────┐
│   🎓 FORME   │  📊 AVALIE   │  🚀 EVOLUA   │
│              │              │              │
│  Cursos e    │  Relatórios  │  Tutoria e   │
│  desafios    │  com KPIs e  │  planos de   │
│  para a sua  │  insights    │  ação que    │
│  equipa      │  accionáveis │  transformam │
│  dominar o   │  para cada   │  erros em    │
│  mercado.    │  decisão.    │  evolução.   │
└──────────────┴──────────────┴──────────────┘
```

Usar ícones SVG (Lucide React) — NÃO emojis. Cards com:
- Ícone em círculo com fundo vermelho Santander claro
- Título bold
- Descrição 2-3 linhas
- Hover: elevação sutil + borda accent

---

#### SECÇÃO 3 — PORTAIS / FEATURES

Background: cinza claro (light) ou #111111 (dark)

Mostrar os 5 portais reais do TradeHub como cards grandes:

```
Portal de Formações    → Cursos, lições, desafios, planos de treino, certificados
Portal de Tutoria      → Gestão de erros, planos de ação, acompanhamento personalizado
Portal de Relatórios   → Dashboards com insights, KPIs, tendências, comparações
Portal de Chamados     → Suporte com Kanban, tracking de tickets, histórico
Portal de Dados Mestres → Gestão de utilizadores, equipas, categorias (ADMIN)
```

Cada card deve ter:
- Ícone SVG representativo
- Nome do portal
- Descrição curta (1-2 linhas)
- Badge com roles que têm acesso (ex: "Todos" ou "ADMIN")

Layout: grid 3+2 em desktop, stack em mobile.

---

#### SECÇÃO 4 — NÚMEROS / STATS

Background: gradiente vermelho escuro (dark red → quase preto)
Texto: branco

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│     5         │    341       │     5        │    24/7      │
│   Portais     │   Testes     │   Idiomas    │   Chatbot    │
│  Integrados   │  Validados   │  PT·ES·EN    │   Integrado  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Números grandes (text-4xl bold), labels em text-sm uppercase. Animação de contagem (count up) ao fazer scroll para esta secção.

Os números devem ser reais — retirados do README:
- 5 portais (Formações, Tutoria, Relatórios, Chamados, Dados Mestres)
- 341 testes automatizados
- 3 idiomas (PT, ES, EN) — ou "Multilingue"
- Chatbot integrado (24/7 ou "IA")
- 5 roles (ADMIN, TRAINER, STUDENT, TRAINEE, MANAGER)

Escolher os 4 mais impressionantes.

---

#### SECÇÃO 5 — COMO FUNCIONA (timeline/steps)

Background: branco (light) ou #1A1A1A (dark)

```
1. Registe-se          → Crie a sua conta em segundos
       │
2. Aceda às Formações  → Cursos estruturados com desafios práticos
       │
3. Evolua com Tutoria  → Acompanhamento personalizado dos seus erros
       │
4. Analise Resultados  → Dashboards com insights para melhoria contínua
```

Timeline vertical em mobile, horizontal em desktop. Linha conectora vermelha Santander. Cada passo tem número em círculo vermelho + título + descrição.

---

#### SECÇÃO 6 — TECNOLOGIA / STACK (opcional, impressiona empresas)

Background: cinza claro

```
"Construído com as melhores tecnologias"

[React] [FastAPI] [MySQL] [Docker] [Tailwind] [TypeScript]
```

Logos/ícones das tecnologias numa barra com opacidade sutil. Hover para revelar. Linha única, scroll horizontal em mobile.

---

#### SECÇÃO 7 — CTA FINAL

Background: vermelho Santander sólido

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  "Pronto para transformar a sua equipa?"             │
│                                                      │
│  Subtítulo: "Junte-se às equipas que já usam o       │
│  TradeHub para formar, avaliar e evoluir."           │
│                                                      │
│  [Criar Conta Gratuita] → /register                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

#### SECÇÃO 8 — FOOTER

Background: #1A1A1A (sempre dark)
Texto: cinza claro

```
┌──────────────────────────────────────────────────────┐
│  TradeHub          Plataforma     Recursos   Legal   │
│  © 2026            Formações      Docs       Termos  │
│                    Tutoria        API        Privacy  │
│                    Relatórios     Suporte             │
│                    Chamados                           │
│                                                      │
│  ─────────────────────────────────────────────────── │
│  Propriedade privada. Todos os direitos reservados.  │
└──────────────────────────────────────────────────────┘
```

---

### TAREFA 3 — Componentes de suporte

#### 3.1 — Navbar da landing page

Fixa no topo, transparente sobre o hero, com background ao scroll:

```
[Logo TradeHub]                    [PT|ES|EN]  [Iniciar Sessão]  [Registar]
```

- Logo branco sobre o hero, cor normal após scroll
- Botão "Registar" = accent (vermelho Santander)
- Botão "Iniciar Sessão" = outline/ghost
- Seletor de idioma compacto (usa i18n existente)
- Navbar transparente → background sólido com blur ao scroll (scroll > 50px)
- Mobile: hamburger menu

#### 3.2 — Botões

```tsx
// Primário (vermelho Santander)
<button className="bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold px-6 py-3 rounded-lg transition-all">
  Começar Agora
</button>

// Secundário (outline branco sobre vermelho, ou outline vermelho sobre branco)
<button className="border-2 border-white text-white hover:bg-white hover:text-[#EC0000] font-semibold px-6 py-3 rounded-lg transition-all">
  Iniciar Sessão
</button>

// Ghost
<button className="text-[#EC0000] hover:bg-[#EC0000]/10 font-semibold px-6 py-3 rounded-lg transition-all">
  Saber Mais
</button>
```

#### 3.3 — Feature Card

```tsx
function FeatureCard({ icon: Icon, title, description, badge }) {
  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 hover:shadow-lg transition-all duration-300">
      <div className="w-12 h-12 rounded-full bg-[#EC0000]/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[#EC0000]" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
      {badge && (
        <span className="inline-block mt-3 text-xs font-medium bg-[#EC0000]/10 text-[#EC0000] px-2 py-1 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}
```

---

### TAREFA 4 — Animações

Usar Motion (Framer Motion) se já instalado no projeto. Caso contrário, usar CSS animations com Intersection Observer.

Verificar primeiro:
```bash
cat frontend/package.json | grep -i "motion\|framer"
```

**Animações a implementar:**
- Hero: fade-in + slide-up do texto (0.5s delay entre headline e subtítulo)
- Pilares: stagger animation dos 3 cards (cada um entra 0.2s após o anterior)
- Features: fade-in on scroll (Intersection Observer)
- Stats: count-up animation dos números (0 → valor final em 2s)
- Timeline: cada step aparece sequencialmente ao scroll
- CTA final: pulse sutil no botão
- Navbar: transição suave de transparente para sólido

**Respeitar `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

### TAREFA 5 — Responsividade

Testar e garantir que funciona em:

```
Mobile:    320px - 639px    → stack vertical, texto menor, hamburger nav
Tablet:    640px - 1023px   → 2 colunas onde aplicável
Desktop:   1024px - 1279px  → layout completo
Large:     1280px+          → max-width container, centrado
```

O hero deve ser impactante em mobile — sem perder legibilidade.

---

### TAREFA 6 — i18n

Se os ficheiros de tradução em `frontend/src/i18n/locales/` já têm textos de landing, reutilizá-los.

Se não têm, criar as chaves necessárias nos 3 idiomas (PT, ES, EN):

```json
{
  "landing": {
    "hero": {
      "headline": "A sua plataforma de formação e evolução em trading",
      "subtitle": "Formações estruturadas, tutoria personalizada, relatórios com insights e suporte integrado.",
      "cta_primary": "Começar Agora",
      "cta_secondary": "Iniciar Sessão"
    },
    "pillars": {
      "train": { "title": "Forme", "description": "Cursos e desafios para a sua equipa dominar o mercado." },
      "evaluate": { "title": "Avalie", "description": "Relatórios com KPIs e insights accionáveis para cada decisão." },
      "evolve": { "title": "Evolua", "description": "Tutoria e planos de ação que transformam erros em evolução." }
    },
    "cta_final": {
      "headline": "Pronto para transformar a sua equipa?",
      "subtitle": "Junte-se às equipas que já usam o TradeHub.",
      "button": "Criar Conta"
    }
  }
}
```

Traduzir para ES e EN.

---

### TAREFA 7 — Validação

1. ✅ A landing page renderiza em `/` para utilizadores não autenticados
2. ✅ O login/register redireciona corretamente
3. ✅ Dark mode funciona (ThemeContext)
4. ✅ i18n funciona nos 3 idiomas
5. ✅ Responsivo em mobile (320px), tablet (768px), desktop (1280px)
6. ✅ Animações funcionam e respeitam prefers-reduced-motion
7. ✅ Navbar transparente → sólida ao scroll
8. ✅ Todos os links/CTAs funcionam
9. ✅ Sem imagens externas quebradas
10. ✅ Lighthouse Performance > 90
11. ✅ Cores consistentes com a paleta Santander
12. ✅ Os outros portais autenticados NÃO foram afetados
13. ✅ Os 341 testes backend continuam a passar

---

## Referência Visual — Princípios Santander

O design do Santander pós-2018 segue estes princípios que devemos replicar:

- **Simplicidade e leveza** — muito espaço branco, poucos elementos por secção
- **Vermelho como acento, não como dominante** — o vermelho marca CTAs, ícones e destaques. O fundo dominante é branco
- **Tipografia limpa** — sans-serif (Inter ou sistema), pesos variados (regular para body, bold para headlines)
- **Cantos arredondados** — rounded-lg a rounded-xl em cards e buttons
- **Ilustrações geométricas** — inspiradas nas curvas da flame do logo Santander
- **Profissionalismo bancário** — nada infantil, nada excessivo, confiança acima de tudo
- **Hierarquia visual clara** — headline > subtítulo > body > label, com espaçamento generoso

**Não copiar:**
- O logo ou a flame do Santander
- Textos ou copy do site do Santander
- Screenshots ou imagens do Santander
- O nome "Santander" em qualquer lugar da interface

---

## Ficheiros que Provavelmente Serão Alterados

```
frontend/src/pages/Landing*.tsx       → Reescrever do zero
frontend/src/components/Navbar*.tsx    → Versão landing (transparente)
frontend/src/components/Footer*.tsx    → Novo footer
frontend/src/App.tsx                   → Verificar routing (não alterar se funciona)
frontend/src/i18n/locales/pt.json     → Adicionar chaves landing.*
frontend/src/i18n/locales/es.json     → Adicionar chaves landing.*
frontend/src/i18n/locales/en.json     → Adicionar chaves landing.*
frontend/src/index.css ou globals.css  → CSS variables Santander
frontend/tailwind.config.*            → Extend com cores Santander
```

**NÃO alterar:**
- Backend (nenhum ficheiro)
- Páginas autenticadas (formações, tutoria, relatórios, chamados, master-data)
- Stores, contexts (a menos que necessário para o ThemeContext)
- Testes
