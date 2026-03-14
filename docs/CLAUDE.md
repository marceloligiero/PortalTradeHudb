# CLAUDE.md — Recriar a Landing Page do Zero

> Instruções para Claude Code. Colocar na raiz do projeto PortalTradeHub.

---

## LEIA ISTO PRIMEIRO

Esta tarefa é APENAS sobre a **landing page** (rota `/` para utilizadores não autenticados).

**NÃO tocar em mais NADA.** Não tocar no backend. Não tocar nas páginas autenticadas. Não tocar nos relatórios. Não tocar na tutoria, formações, chamados, admin. APENAS a landing page.

---

## A REGRA MAIS IMPORTANTE

**NÃO APROVEITAR NADA da landing page actual.**

Não reaproveitar componentes. Não reaproveitar estilos. Não reaproveitar layout. Não reaproveitar textos hardcoded. Não "melhorar". Não "refatorar". Não "adaptar".

**APAGAR o componente actual da landing page e CRIAR UM NOVO DO ZERO.**

A landing page actual não existe para ti. Imagina que nunca existiu. Vais construir uma como se fosse a primeira vez que alguém cria uma landing page para este projeto.

---

## O QUE MANTER INTACTO (não alterar)

```
✅ TODO o backend/ (zero alterações)
✅ TODAS as páginas autenticadas (formações, tutoria, relatórios, chamados, admin)
✅ frontend/src/stores/authStore — autenticação
✅ frontend/src/contexts/ThemeContext.tsx — dark/light mode
✅ frontend/src/i18n/ — estrutura existente (adicionar chaves novas, não apagar)
✅ frontend/src/App.tsx — manter routing das páginas autenticadas intacto
✅ frontend/vite.config.ts
✅ frontend/package.json (adicionar deps novas se necessário)
✅ 341 testes do backend
```

## O QUE APAGAR E RECRIAR DO ZERO

```
❌ O componente/página da landing page actual → APAGAR conteúdo, RECRIAR do zero
❌ A navbar da landing (se existir separada) → CRIAR NOVA
❌ O footer da landing (se existir separado) → CRIAR NOVO
❌ Quaisquer componentes usados EXCLUSIVAMENTE pela landing → APAGAR
```

**Antes de apagar:** Ler o componente actual para identificar como o routing funciona (qual ficheiro, qual rota, como distingue autenticado vs não autenticado). Anotar isso. Depois apagar o conteúdo e recriar.

---

## PALETA DE CORES — SANTANDER

```css
:root {
  --red-50: #FFF5F5;
  --red-100: #FFE0E0;
  --red-200: #FFB3B3;
  --red-300: #FF6666;
  --red-400: #FF3333;
  --red-500: #EC0000;    /* SANTANDER RED */
  --red-600: #CC0000;
  --red-700: #990000;
  --red-800: #660000;
  --red-900: #330000;

  --gray-50: #FAFAFA;
  --gray-100: #F5F5F5;
  --gray-200: #E8E8E8;
  --gray-300: #D4D4D4;
  --gray-400: #A3A3A3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;
  --gray-950: #0A0A0A;
}

/* Light mode */
--bg-primary: #FAFAFA;
--bg-card: #FFFFFF;
--text-primary: #0A0A0A;
--text-secondary: #525252;
--gradient-hero: linear-gradient(145deg, #CC0000 0%, #8B0000 40%, #1A0005 100%);

/* Dark mode */
--bg-primary: #0A0A0A;
--bg-card: #171717;
--text-primary: #F5F5F5;
--text-secondary: #A3A3A3;
--gradient-hero: linear-gradient(145deg, #1A0005 0%, #330000 30%, #660000 70%, #8B0000 100%);
```

---

## TIPOGRAFIA

```
Headlines: "Instrument Serif" (Google Fonts) — serif, bold, com personalidade
Body: "DM Sans" (Google Fonts) — sans-serif, limpa, moderna
Mono/Stats: "JetBrains Mono" — para números e badges

PROIBIDO: Inter, Roboto, Arial, system-ui como headline
```

---

## ESTILO VISUAL

**Nível:** Stripe.com × Linear.app × Santander. Award-winning.

**Texturas:** Noise grain subtil (0.03 opacity), gradient mesh no hero, glow vermelho difuso.

**Movimento:** Scroll-triggered fade-in com stagger, count-up nos stats, navbar transparente→glassmorphism ao scroll, hover glow nos cards.

**Layout:** Assimétrico onde impacta. Bento grid para features. Espaço negativo generoso.

**Respeitar:** `prefers-reduced-motion` — desativar animações para quem prefere.

---

## TAREFAS — Executar na Ordem

### TAREFA 1 — Ler a landing actual (NÃO para reaproveitar — para entender o routing)

```bash
# Identificar:
# 1. Qual ficheiro/componente renderiza a landing page
# 2. Como o routing distingue autenticado vs não autenticado
# 3. Quais rotas /login e /register existem
# 4. Se o i18n já tem chaves de landing page

cat frontend/src/App.tsx
ls frontend/src/pages/
grep -r "Landing\|landing\|LandingPage" frontend/src/
```

Anotar o routing. Depois esquecer tudo o resto sobre o ficheiro.

### TAREFA 2 — Instalar dependências (se necessário)

```bash
cd frontend
cat package.json | grep -E "motion|framer|lucide|recharts"

# Instalar o que faltar:
npm install lucide-react clsx tailwind-merge
# Se Motion/Framer Motion não estiver instalado:
npm install motion
```

Adicionar as Google Fonts ao `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### TAREFA 3 — Atualizar Tailwind config

Estender o `tailwind.config` com:

```js
colors: {
  santander: {
    50: '#FFF5F5', 100: '#FFE0E0', 200: '#FFB3B3', 300: '#FF6666',
    400: '#FF3333', 500: '#EC0000', 600: '#CC0000', 700: '#990000',
    800: '#660000', 900: '#330000',
  }
},
fontFamily: {
  display: ['"Instrument Serif"', 'Georgia', 'serif'],
  body: ['"DM Sans"', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

### TAREFA 4 — Apagar a landing actual e criar a nova

**Apagar** o conteúdo do componente da landing page. Se está espalhado por vários ficheiros, consolidar num ficheiro só.

**Criar** estes componentes NOVOS:

```
frontend/src/components/landing/
├── LandingNavbar.tsx
├── HeroSection.tsx
├── SocialProofBar.tsx
├── PillarsSection.tsx
├── FeaturesGrid.tsx
├── StatsSection.tsx
├── HowItWorks.tsx
├── QuoteSection.tsx
├── TechStack.tsx
├── FinalCTA.tsx
└── LandingFooter.tsx
```

E a página que os compõe:
```tsx
// frontend/src/pages/LandingPage.tsx (ou onde o routing aponta)
export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <SocialProofBar />
      <PillarsSection />
      <FeaturesGrid />
      <StatsSection />
      <HowItWorks />
      <QuoteSection />
      <TechStack />
      <FinalCTA />
      <LandingFooter />
    </>
  );
}
```

---

## AS 11 SECÇÕES — Detalhe de cada uma

### 1. NAVBAR (LandingNavbar.tsx)

Fixa no topo. Transparente sobre o hero → glassmorphism ao scroll > 80px.

```
Sobre o hero:     [Logo branco]                    [PT|ES|EN] [Login] [Começar →]
Após scroll:      [Logo vermelho]  bg-white/80 dark:bg-black/60 backdrop-blur-xl
```

- "Começar →": bg-[#EC0000] text-white rounded-full px-5 py-2.5
- "Login": ghost, text-white (hero) ou text-gray-700 (scroll)
- Seletor de idioma: compacto, usa o i18n existente
- Mobile: hamburger → menu fullscreen com overlay gradiente vermelho
- Transição: 300ms ease

### 2. HERO (HeroSection.tsx) — 100vh

```
Background: --gradient-hero + noise grain (0.03) + glow radial vermelho
Height: min-h-screen
Padding: centrado vertical e horizontal

[Badge pill] "Plataforma de formação para trading"
  → bg-white/10 border border-white/20 backdrop-blur text-xs text-white rounded-full px-4 py-1.5

[Headline] "A sua equipa. Pronta para o mercado."
  → font-display text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]
  → A palavra "mercado" pode ter um underline animado ou cor #FF6666

[Subtítulo] "Formações estruturadas, tutoria personalizada, relatórios com insights e suporte integrado — tudo numa plataforma."
  → font-body text-lg md:text-xl text-white/70 max-w-2xl

[CTA Primário] "Começar Agora →"
  → bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold px-8 py-4 rounded-full
  → shadow-[0_0_40px_rgba(236,0,0,0.35)] hover:shadow-[0_0_60px_rgba(236,0,0,0.5)]
  → link para /register

[CTA Secundário] "Iniciar Sessão"
  → border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full
  → link para /login

[Scroll indicator] chevron ↓ animado a pulsar no fundo

Animação stagger:
  - headline: delay 0s, fade-in + slide-up 20px
  - subtítulo: delay 0.2s
  - CTAs: delay 0.4s
  - badge: delay 0.1s
```

### 3. SOCIAL PROOF BAR (SocialProofBar.tsx)

```
Background: bg-white dark:bg-[#111] border-y border-gray-200 dark:border-gray-800
Padding: py-6

Conteúdo: badges horizontais com scroll se necessário

✓ 341 testes validados  ·  ✓ 5 portais integrados  ·  ✓ 3 idiomas  ·  ✓ API REST completa  ·  ✓ CI/CD automatizado

Cada badge: text-sm text-gray-500 font-mono
Separador: · em text-gray-300
Scroll infinito em mobile (CSS animation marquee)
```

### 4. PILARES (PillarsSection.tsx) — Forme · Avalie · Evolua

```
Background: bg-[--bg-primary]
Padding: py-24 md:py-32

Título: "Tudo o que a sua equipa precisa"
  → font-display text-3xl md:text-4xl font-bold text-center

Subtítulo: "Uma plataforma. Três pilares. Resultados reais."
  → font-body text-lg text-[--text-secondary] text-center mb-16

3 cards em grid (grid-cols-1 md:grid-cols-3 gap-8):

Card:
  → bg-white dark:bg-gray-900 rounded-2xl p-8
  → border border-gray-200 dark:border-gray-800
  → hover:border-[#EC0000]/30 hover:shadow-xl hover:shadow-red-500/5
  → transition-all duration-300

Ícone: div w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6
  → ícone Lucide vermelho w-7 h-7

Título card: font-display text-2xl font-bold mb-3
Descrição: font-body text-[--text-secondary] text-base leading-relaxed mb-4
Link: text-[#EC0000] font-medium hover → arrow slide right

Cards:
  1. Ícone: GraduationCap → "Forme" → "Cursos, desafios e certificações para a sua equipa dominar o mercado."
  2. Ícone: BarChart3 → "Avalie" → "Dashboards com KPIs e insights accionáveis para cada decisão."
  3. Ícone: Rocket → "Evolua" → "Tutoria e planos de ação que transformam erros em aprendizagem."

Animação: stagger 0s, 0.15s, 0.3s (fade-in + slide-up ao scroll)
```

### 5. FEATURES GRID (FeaturesGrid.tsx) — 5 portais, bento grid

```
Background: bg-gray-50 dark:bg-[#0A0A0A]
Padding: py-24 md:py-32

Título: "5 portais. Uma plataforma."
  → font-display text-3xl md:text-4xl font-bold text-center mb-16

Layout bento grid assimétrico:
┌────────────────────────────────────┬─────────────────────┐
│  Formações (col-span-2, row-span-2)│  Tutoria             │
│  Grande, destaque                   │                     │
├──────────────┬─────────────────────┼─────────────────────┤
│  Relatórios  │  Chamados           │  Dados Mestres       │
│              │                     │  badge: ADMIN        │
└──────────────┴─────────────────────┴─────────────────────┘

Desktop: grid grid-cols-3 grid-rows-2 gap-4
Mobile: stack vertical

Cada card bento:
  → rounded-2xl overflow-hidden p-8
  → gradiente de fundo subtil ÚNICO por card:
    Formações: bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-gray-900
    Tutoria: bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950
    (etc. — cada um ligeiramente diferente)
  → border border-gray-200 dark:border-gray-800
  → hover: scale(1.02) transition-transform duration-300

Conteúdo de cada card:
  → Ícone Lucide (BookOpen, Users, BarChart3, LifeBuoy, Settings) em vermelho
  → Título: font-display text-xl font-bold
  → Descrição: 2 linhas, font-body text-sm text-[--text-secondary]
  → Badge de roles (se relevante): bg-red-50 text-[#EC0000] text-xs rounded-full px-2 py-0.5

Cards:
  1. BookOpen → "Formações" → "Cursos estruturados, lições, desafios práticos, planos de treino e certificados."
  2. Users → "Tutoria" → "Gestão de erros, planos de ação, acompanhamento personalizado."
  3. BarChart3 → "Relatórios" → "Dashboards com insights, KPIs, tendências e comparações."
  4. LifeBuoy → "Chamados" → "Suporte com Kanban, tracking de tickets e histórico."
  5. Settings → "Dados Mestres" → "Gestão de utilizadores, equipas e categorias." badge: "ADMIN"
```

### 6. STATS (StatsSection.tsx)

```
Background: gradiente escuro (bg-gradient-to-r from-gray-950 via-red-950/40 to-gray-950)
Padding: py-20

4 stats em row (grid-cols-2 md:grid-cols-4 gap-8 text-center):

Cada stat:
  Número: font-display text-5xl md:text-6xl font-bold text-white
  Label: font-body text-sm uppercase tracking-widest text-white/50 mt-2

Stats (adaptar ao conteúdo real do README):
  5 → "Portais Integrados"
  341 → "Testes Validados"
  5 → "Roles de Acesso"
  3 → "Idiomas"

Count-up animation: 0 → valor final em 1.5s easeOut, trigger ao entrar no viewport
Separadores: linha vertical 1px border-white/10 entre stats (desktop only)
```

### 7. COMO FUNCIONA (HowItWorks.tsx)

```
Background: bg-[--bg-primary]
Padding: py-24 md:py-32

Título: "Do registo à evolução em 4 passos"
  → font-display text-3xl md:text-4xl font-bold text-center mb-16

Timeline vertical com linha vermelha:

Desktop: alternar esquerda/direita ao longo da linha
Mobile: tudo à direita da linha

Cada step:
  Número: w-10 h-10 rounded-full bg-[#EC0000] text-white font-mono font-bold flex items-center justify-center
  Título: font-display text-xl font-bold
  Descrição: font-body text-[--text-secondary]
  Linha conectora: w-0.5 bg-[#EC0000]/30 (entre os steps)

Steps:
  ① "Registe-se" → "Crie a sua conta em segundos. Sem complicações."
  ② "Aceda às Formações" → "Cursos estruturados com desafios práticos e certificação."
  ③ "Receba Tutoria" → "Acompanhamento personalizado. Erros viram aprendizagem."
  ④ "Analise e Evolua" → "Dashboards com insights. Veja o progresso da equipa."

Animação: cada step fade-in + slide ao scroll (stagger 0.2s)
```

### 8. QUOTE (QuoteSection.tsx)

```
Background: bg-[#EC0000]
Padding: py-20 md:py-24

Frase: "Não formamos traders. Formamos equipas que vencem."
  → font-display text-3xl md:text-5xl text-white text-center max-w-4xl mx-auto leading-tight

(opcionalmente um CTA pequeno abaixo: "Começar Agora →" ghost branco)
```

### 9. TECH STACK (TechStack.tsx)

```
Background: bg-gray-50 dark:bg-gray-950
Padding: py-16

"Construído com tecnologia de ponta"
  → font-body text-sm uppercase tracking-widest text-[--text-secondary] text-center mb-8

Logos/ícones: React, FastAPI, MySQL, Docker, Tailwind, TypeScript, Zustand
  → SVGs ou texto em font-mono, opacity-30 hover:opacity-100, transition
  → flex justify-center gap-8 md:gap-12, items-center
  → Cada um: grayscale hover:grayscale-0

Subtil — não é secção principal, é credibilidade técnica
```

### 10. CTA FINAL (FinalCTA.tsx)

```
Background: --gradient-hero (mesmo do hero)
Padding: py-24 md:py-32

"Pronto para transformar a sua equipa?"
  → font-display text-3xl md:text-5xl text-white text-center font-bold leading-tight

"Junte-se às equipas que já usam o TradeHub para formar, avaliar e evoluir."
  → font-body text-lg text-white/70 text-center max-w-xl mx-auto mt-4

[Criar Conta →] bg-white text-[#EC0000] font-semibold px-8 py-4 rounded-full mt-8
  → hover:bg-gray-100, shadow-lg

[Iniciar Sessão] text-white/60 text-sm mt-4, link para /login
```

### 11. FOOTER (LandingFooter.tsx)

```
Background: bg-[#0A0A0A] (sempre escuro)
Padding: py-16

4 colunas (desktop), stack (mobile):

TradeHub                Plataforma       Recursos         Legal
"A sua plataforma       Formações        Documentação     Termos de Uso
 de evolução"           Tutoria          API Docs         Privacidade
                        Relatórios       Suporte
[ícones sociais?]       Chamados

──────────────────────────────────────────────────────────
© 2026 TradeHub. Propriedade privada. Todos os direitos reservados.

Links: text-sm text-gray-500 hover:text-white transition
Separador: border-t border-gray-800
Copyright: text-xs text-gray-600
```

---

### TAREFA 5 — i18n

Adicionar chaves `landing.*` nos 3 ficheiros de locale (PT, ES, EN). TODOS os textos visíveis na landing vêm do i18n, NUNCA hardcoded.

### TAREFA 6 — Hooks auxiliares

```
frontend/src/hooks/useInView.ts    → Intersection Observer para trigger de animações
frontend/src/hooks/useCountUp.ts   → Count-up animation para stats
```

---

## VALIDAÇÃO

```
✅ Landing renderiza em / (não autenticado)
✅ Login e Register funcionam a partir dos CTAs
✅ Redirect para portal após login funciona
✅ TODAS as páginas autenticadas continuam iguais e funcionais
✅ Dark mode funciona na landing
✅ i18n funciona nos 3 idiomas
✅ Responsive: 320px, 768px, 1280px
✅ Navbar: transparente→glassmorphism ao scroll
✅ Animações funcionam e respeitam prefers-reduced-motion
✅ Count-up nos stats ao scroll
✅ Cores Santander corretas (#EC0000 como accent)
✅ Tipografia: Instrument Serif headlines + DM Sans body
✅ Lighthouse > 90
✅ Zero erros de consola
✅ 341 testes backend passam
✅ ZERO componentes/estilos da landing antiga reutilizados
```

## NÃO FAZER

```
❌ Reaproveitar QUALQUER coisa da landing actual
❌ Tocar nas páginas autenticadas
❌ Tocar no backend
❌ Usar Inter/Roboto/Arial como headline
❌ Imagens stock externas
❌ Emojis como ícones
❌ Layout simétrico genérico tipo Bootstrap
❌ Gradientes roxos ou azuis
❌ Animações bounce/jello
```
