/**
 * gen_fluxogramas.js
 * Gera Fluxogramas_Operacionais_PTH.docx — 21 fluxos operacionais
 * Run: NODE_PATH="/c/Users/ripma/AppData/Roaming/npm/node_modules" node gen_fluxogramas.js
 */

'use strict';
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageOrientation, convertInchesToTwip, TabStopType, TabStopPosition,
  LevelFormat, NumberFormat, TableLayoutType,
} = require('docx');

/* ─── Cores Santander ─────────────────────────────────────────────────────── */
const RED    = 'EC0000';
const DKRED  = '6B0000';
const WHITE  = 'FFFFFF';
const DARK   = '1A1A1A';
const MID    = '4B4B4B';
const LIGHT  = 'F5F5F5';
const BORDER = 'E0E0E0';

// Semantic colours matching the HTML
const COL = {
  green:  { bg: 'E8F5EE', fg: '0D4A33', border: '1A7A55' },
  red:    { bg: 'FCEAEA', fg: '6B1E1E', border: 'C23B3B' },
  blue:   { bg: 'E8F0FC', fg: '132F6B', border: '2563C4' },
  amber:  { bg: 'FDF0DC', fg: '5C3005', border: 'B56A10' },
  gray:   { bg: 'F0EFE9', fg: '2C2B27', border: '6B6860' },
  purple: { bg: 'EEEBFB', fg: '2D1F6B', border: '6B4FCF' },
  coral:  { bg: 'FCEAE5', fg: '5A1D0D', border: 'C44A28' },
};

/* ─── Page setup ──────────────────────────────────────────────────────────── */
const PAGE = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
};
const CONTENT_W = 11906 - 1134 * 2; // ~9638 DXA

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function pageBreak() {
  return new Paragraph({ pageBreakBefore: true, children: [] });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    outlineLevel: 0,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: RED, font: 'Arial' })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    outlineLevel: 1,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: DARK, font: 'Arial' })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    outlineLevel: 2,
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: MID, font: 'Arial' })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20, color: opts.color || MID, font: 'Arial', bold: opts.bold, italic: opts.italic })],
  });
}

function mono(text) {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 18, color: '333333', font: 'Courier New' })],
  });
}

function badge(text, col) {
  const c = COL[col] || COL.gray;
  return new TableCell({
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: c.bg },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: c.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: c.border },
      left:   { style: BorderStyle.SINGLE, size: 4, color: c.border },
      right:  { style: BorderStyle.SINGLE, size: 4, color: c.border },
    },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 16, color: c.fg, font: 'Arial' })],
    })],
  });
}

function statesRow(states) {
  if (!states || !states.length) return [];
  const cells = states.map(s => badge(s.label, s.color));
  return [
    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'Estados / Fases', bold: true, size: 18, color: MID, font: 'Arial' })] }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: cells })],
    }),
    new Paragraph({ spacing: { after: 100 }, children: [] }),
  ];
}

function descBox(text) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 140, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: RED },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [] })],
        }),
        new TableCell({
          width: { size: CONTENT_W - 140, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF5F5' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: RED },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: RED },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.SINGLE, size: 4, color: RED },
          },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text, size: 20, color: DARK, font: 'Arial', italic: true })],
          })],
        }),
      ],
    })],
  });
}

function stepsList(steps) {
  return steps.map((step, i) => new Paragraph({
    spacing: { after: 60 },
    numbering: { reference: 'steps', level: 0 },
    children: [
      new TextRun({ text: `${step.action}`, bold: true, size: 20, color: DARK, font: 'Arial' }),
      step.endpoint ? new TextRun({ text: `  ${step.endpoint}`, size: 18, color: '2563C4', font: 'Courier New' }) : new TextRun({ text: '' }),
      step.note ? new TextRun({ text: `  — ${step.note}`, size: 18, color: MID, font: 'Arial', italic: true }) : new TextRun({ text: '' }),
    ],
  }));
}

function decisionRow(condition, yes, no) {
  const colW = Math.floor(CONTENT_W / 3);
  const makeCell = (txt, col) => {
    const c = col ? COL[col] : { bg: LIGHT, fg: DARK, border: BORDER };
    return new TableCell({
      width: { size: colW, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: c.bg },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: c.border },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: c.border },
        left:   { style: BorderStyle.SINGLE, size: 4, color: c.border },
        right:  { style: BorderStyle.SINGLE, size: 4, color: c.border },
      },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        children: [new TextRun({ text: txt, size: 18, color: c.fg, font: 'Arial' })],
      })],
    });
  };
  return new TableRow({
    children: [makeCell(`❓ ${condition}`, 'amber'), makeCell(`✔ ${yes}`, 'green'), makeCell(`✘ ${no}`, 'red')],
  });
}

function decisionsTable(decisions) {
  if (!decisions || !decisions.length) return [];
  const colW = Math.floor(CONTENT_W / 3);
  return [
    new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'Pontos de Decisão', bold: true, size: 20, color: DARK, font: 'Arial' })] }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Condição', 'Sim / Aprovar', 'Não / Rejeitar'].map(h =>
            new TableCell({
              width: { size: colW, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: DKRED },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, color: WHITE, font: 'Arial' })] })],
            })
          ),
        }),
        ...decisions.map(d => decisionRow(d.condition, d.yes, d.no)),
      ],
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  ];
}

function endpointsTable(endpoints) {
  if (!endpoints || !endpoints.length) return [];
  const methodColor = { GET: '2E8B57', POST: '2563C4', PUT: 'B56A10', PATCH: 'B56A10', DELETE: 'C23B3B' };
  const colW1 = 1400, colW2 = CONTENT_W - 1400;
  return [
    new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'Endpoints Envolvidos', bold: true, size: 20, color: DARK, font: 'Arial' })] }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: endpoints.map(([method, path, desc]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: colW1, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: LIGHT },
              borders: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER }, bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [new Paragraph({ children: [
                new TextRun({ text: method, bold: true, size: 18, color: methodColor[method] || DARK, font: 'Courier New' }),
                new TextRun({ text: `  ${path}`, size: 18, color: '333333', font: 'Courier New' }),
              ] })],
            }),
            new TableCell({
              width: { size: colW2, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: WHITE },
              borders: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER }, bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: desc, size: 18, color: MID, font: 'Arial' })] })],
            }),
          ],
        })
      ),
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  ];
}

function sectionDivider(label) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: RED },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 26, color: WHITE, font: 'Arial' })] })],
      })],
    })],
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   FLOW DEFINITIONS — all 21 flows
══════════════════════════════════════════════════════════════════════════════ */
const FLOWS = [

/* ─── 1. AUTENTICAÇÃO ──────────────────────────────────────────────────────── */
{
  num: '1.1', title: 'Login',
  desc: 'Autenticação com verificação de rate limit, validação de credenciais e tratamento de contas pendentes. O JWT é guardado em sessionStorage após login bem-sucedido.',
  states: [
    { label: 'Rate limit OK', color: 'blue' }, { label: 'Credenciais válidas', color: 'blue' },
    { label: 'JWT emitido', color: 'blue' }, { label: 'Dashboard carregado', color: 'green' },
  ],
  steps: [
    { action: 'Utilizador acede a /login e preenche email + password' },
    { action: 'POST /api/auth/login', endpoint: 'POST /api/auth/login' },
    { action: 'Rate limit verificado (5 req/min)', note: 'Se exceder → HTTP 429' },
    { action: 'Credenciais validadas contra a BD', note: 'Se inválidas → HTTP 401' },
    { action: 'Verificar is_pending', note: 'Se true → banner de aviso, acesso limitado' },
    { action: 'JWT gerado → sessionStorage', note: 'NÃO localStorage — por segurança' },
    { action: 'Redireciona → Dashboard principal' },
  ],
  decisions: [
    { condition: 'Rate limit excedido?', yes: 'Erro 429 — tenta de novo', no: 'Avança para validação' },
    { condition: 'Credenciais válidas?', yes: 'Avança para verificação de estado', no: 'Erro 401 — form limpo' },
    { condition: 'is_pending = true?', yes: 'Banner aviso + acesso restrito', no: 'Acesso completo' },
  ],
  endpoints: [
    ['POST', '/api/auth/login', 'Autenticar utilizador — retorna JWT'],
  ],
},
{
  num: '1.2', title: 'Registo de Utilizador',
  desc: 'Criação de conta com diferenciação por flags. USUARIO obtém acesso imediato; contas com flags elevadas (is_formador, is_tutor, is_liberador, is_gerente, is_chefe_equipe) ficam pendentes até aprovação do ADMIN.',
  states: [
    { label: 'Formulário', color: 'blue' }, { label: 'Email único', color: 'blue' },
    { label: 'USUARIO: activo', color: 'green' }, { label: 'Flags elevadas: pendente', color: 'amber' },
    { label: 'Login disponível', color: 'green' },
  ],
  steps: [
    { action: 'Utilizador acede a /register e preenche: nome, email, password, role, flags de permissão' },
    { action: 'POST /api/auth/register', endpoint: 'POST /api/auth/register' },
    { action: 'Verificar se email já existe', note: 'Se existe → Erro 409' },
    { action: 'Criar utilizador conforme flags:' },
    { action: '→ USUARIO (sem flags elevadas): is_active=true — acesso imediato' },
    { action: '→ is_formador/is_tutor/is_liberador/is_gerente/is_chefe_equipe: is_pending=true — notificação ao ADMIN' },
    { action: 'Redirecionar para /login' },
  ],
  decisions: [
    { condition: 'Email já registado?', yes: 'Erro 409 — pedir outro email', no: 'Avança para criar conta' },
    { condition: 'Tem flags elevadas?', yes: 'is_pending=true, aguarda ADMIN', no: 'is_active=true, acesso imediato' },
  ],
  endpoints: [
    ['POST', '/api/auth/register', 'Criar nova conta de utilizador'],
  ],
},
{
  num: '1.3', title: 'Recuperação de Password',
  desc: 'Fluxo seguro via email. O sistema retorna sempre mensagem de sucesso para não revelar se o email existe na base de dados.',
  states: [
    { label: 'Pedido enviado', color: 'blue' }, { label: 'Email (se existir)', color: 'blue' },
    { label: 'Token validado', color: 'blue' }, { label: 'Password actualizada', color: 'green' },
  ],
  steps: [
    { action: 'Utilizador clica "Esqueci a password" e introduz email' },
    { action: 'POST /api/auth/forgot-password', endpoint: 'POST /api/auth/forgot-password' },
    { action: 'Rate limit verificado (3 req/min)', note: 'Protecção contra enumeração' },
    { action: 'Sistema responde SEMPRE com sucesso (sem revelar se email existe)' },
    { action: 'Se email existe: token gerado na BD, email enviado com link' },
    { action: 'Utilizador clica em /reset-password?token=...' },
    { action: 'POST /api/auth/reset-password', endpoint: 'POST /api/auth/reset-password' },
    { action: 'Token validado (exp + usado=false) → nova password guardada' },
    { action: 'Token marcado como usado → redireciona para /login' },
  ],
  decisions: [
    { condition: 'Rate limit (3 req/min)?', yes: 'Erro 429', no: 'Avança — resposta sempre success' },
    { condition: 'Email existe na BD?', yes: 'Token gerado + email enviado', no: 'Sem acção (silencioso)' },
    { condition: 'Token válido e não expirado?', yes: 'Password actualizada', no: 'Erro — link expirado/inválido' },
  ],
  endpoints: [
    ['POST', '/api/auth/forgot-password', 'Iniciar fluxo de recuperação'],
    ['POST', '/api/auth/reset-password',  'Definir nova password com token válido'],
  ],
},
{
  num: '1.4', title: 'Validação de Formador / Tutor / Liberador (ADMIN)',
  desc: 'ADMIN aprova ou rejeita contas com is_pending=true. Utilizadores aprovados recebem acesso completo; rejeitados têm conta removida.',
  states: [
    { label: 'Lista pendentes', color: 'amber' }, { label: 'Revê perfil', color: 'blue' },
    { label: 'Aprovar', color: 'green' }, { label: 'Rejeitar', color: 'red' }, { label: 'Próximo', color: 'gray' },
  ],
  steps: [
    { action: 'ADMIN acede a /master-data/trainer-validation' },
    { action: 'GET lista de utilizadores com is_pending=true', endpoint: 'GET /api/admin/pending-users' },
    { action: 'ADMIN selecciona utilizador e revê perfil (nome, email, role, equipa)' },
    { action: 'Decisão: APROVAR ou REJEITAR' },
    { action: '→ APROVAR: is_pending=false, is_active=true', note: 'Utilizador recebe notificação' },
    { action: '→ REJEITAR: conta removida da BD', note: 'Utilizador recebe notificação' },
    { action: 'Repetir para próxima conta pendente' },
  ],
  decisions: [
    { condition: 'Existem contas pendentes?', yes: 'Mostrar lista para validação', no: 'Mensagem "nenhuma conta pendente"' },
    { condition: 'ADMIN aprova?', yes: 'is_pending=false → acesso activo', no: 'Conta removida' },
    { condition: 'Mais pendentes?', yes: 'Próximo da lista', no: 'Fim — todas processadas' },
  ],
  endpoints: [
    ['GET',   '/api/admin/pending-users',     'Listar contas com is_pending=true'],
    ['PATCH', '/api/admin/users/:id/approve', 'Aprovar conta pendente'],
    ['DELETE','/api/admin/users/:id',         'Rejeitar e remover conta'],
  ],
},

/* ─── 2. PORTAL DE FORMAÇÕES ──────────────────────────────────────────────── */
{
  num: '2.1', title: 'Criação de Curso',
  desc: 'FORMADOR ou ADMIN cria curso em modo DRAFT, adiciona aulas e desafios, e publica quando pronto para ser incluído em planos de formação.',
  states: [
    { label: 'DRAFT', color: 'amber' }, { label: 'Aulas adicionadas', color: 'blue' },
    { label: 'Desafios adicionados', color: 'blue' }, { label: 'Publicado', color: 'green' },
  ],
  steps: [
    { action: 'FORMADOR/ADMIN acede a /course/new e preenche: título, descrição, nível, banco, produto' },
    { action: 'POST /api/courses — curso criado em estado DRAFT', endpoint: 'POST /api/courses' },
    { action: 'Adicionar lições ao curso (loop)', endpoint: 'POST /api/lessons', note: 'Repetir para cada lição' },
    { action: 'Adicionar desafios (COMPLETO ou SUMÁRIO)', endpoint: 'POST /api/courses/:id/challenges' },
    { action: 'Publicar curso — fica disponível para planos de formação' },
  ],
  decisions: [
    { condition: 'Nível é válido? (Iniciante/Intermédio/Avançado)', yes: 'Curso criado em DRAFT', no: 'Erro de validação' },
    { condition: 'Adicionar mais lições?', yes: 'Preenche nova lição', no: 'Avança para desafios' },
    { condition: 'Adicionar desafios?', yes: 'Cria desafio com operações', no: 'Publica o curso' },
  ],
  endpoints: [
    ['POST', '/api/courses',                    'Criar novo curso (DRAFT)'],
    ['POST', '/api/lessons',                    'Adicionar lição ao curso'],
    ['POST', '/api/courses/:id/challenges',     'Adicionar desafio ao curso'],
    ['PATCH','/api/courses/:id',                'Editar/publicar curso'],
  ],
},
{
  num: '2.2', title: 'Criação de Plano de Formação',
  desc: 'FORMADOR/ADMIN cria plano, associa cursos, atribui a utilizadores. O plano fica ACTIVE até todos os cursos serem concluídos.',
  states: [
    { label: 'DRAFT', color: 'amber' }, { label: 'ACTIVE', color: 'blue' }, { label: 'COMPLETED', color: 'green' },
  ],
  steps: [
    { action: 'FORMADOR/ADMIN acede a /training-plan/new' },
    { action: 'Preenche: título, descrição, prazo, cursos a incluir' },
    { action: 'POST /api/training-plans — plano criado: DRAFT', endpoint: 'POST /api/training-plans' },
    { action: 'Associar cursos ao plano', endpoint: 'POST /api/training-plans/:id/courses' },
    { action: 'Atribuir a estudante(s)', endpoint: 'POST /api/training-plans/:id/assign' },
    { action: 'Plano muda para ACTIVE → visível em /my-plans do estudante' },
    { action: 'Quando todos os cursos concluídos → plano → COMPLETED' },
  ],
  decisions: [
    { condition: 'Estudante completa todos os cursos?', yes: 'Plano → COMPLETED', no: 'Plano permanece ACTIVE' },
  ],
  endpoints: [
    ['POST', '/api/training-plans',              'Criar plano de formação (DRAFT)'],
    ['POST', '/api/training-plans/:id/courses',  'Associar cursos ao plano'],
    ['POST', '/api/training-plans/:id/assign',   'Atribuir plano a estudante'],
  ],
},
{
  num: '2.3', title: 'Execução de Lição (USUARIO)',
  desc: 'Ciclo completo: início, pausa/retoma, conclusão e aprovação pelo FORMADOR. O FORMADOR pode pedir revisão em vez de aprovar.',
  states: [
    { label: 'NOT_STARTED', color: 'gray' }, { label: 'IN_PROGRESS', color: 'blue' },
    { label: 'PAUSED', color: 'amber' }, { label: 'COMPLETED', color: 'blue' }, { label: 'APPROVED', color: 'green' },
  ],
  steps: [
    { action: 'USUARIO acede a /my-lessons e selecciona lição (NOT_STARTED)' },
    { action: 'POST /api/lessons/:id/start — timer inicia, estado: IN_PROGRESS', endpoint: 'POST /api/lessons/:id/start' },
    { action: '(Opcional) USUARIO pode pausar', endpoint: 'POST /api/lessons/:id/pause', note: 'Estado → PAUSED' },
    { action: '(Opcional) Retomar lição pausada', endpoint: 'POST /api/lessons/:id/resume' },
    { action: 'USUARIO termina — POST /api/lessons/:id/finish', endpoint: 'POST /api/lessons/:id/finish', note: 'Estado → COMPLETED' },
    { action: 'Confirmar para revisão do FORMADOR', endpoint: 'POST /api/lessons/:id/confirm' },
    { action: 'FORMADOR aprova a lição', endpoint: 'POST /api/lessons/:id/approve', note: 'Estado → APPROVED' },
  ],
  decisions: [
    { condition: 'USUARIO interrompe?', yes: 'POST pause → PAUSED; depois resume', no: 'Continua até finish' },
    { condition: 'FORMADOR aprova?', yes: 'Estado → APPROVED', no: 'Comentário + revisão → USUARIO retoma' },
  ],
  endpoints: [
    ['POST', '/api/lessons/:id/start',   'Iniciar lição — timer começa'],
    ['POST', '/api/lessons/:id/pause',   'Pausar lição em curso'],
    ['POST', '/api/lessons/:id/resume',  'Retomar lição pausada'],
    ['POST', '/api/lessons/:id/finish',  'Concluir lição — COMPLETED'],
    ['POST', '/api/lessons/:id/confirm', 'Confirmar para revisão do FORMADOR'],
    ['POST', '/api/lessons/:id/approve', 'FORMADOR aprova lição — APPROVED'],
  ],
},
{
  num: '2.4', title: 'Execução de Desafio (USUARIO)',
  desc: 'FORMADOR liberta o desafio; USUARIO executa operação a operação. O MPU (Minutos Por Operação) é calculado automaticamente.',
  states: [
    { label: 'Libertado', color: 'blue' }, { label: 'IN_PROGRESS', color: 'blue' },
    { label: 'Operações registadas', color: 'blue' }, { label: 'PENDING_REVIEW', color: 'amber' },
  ],
  steps: [
    { action: 'FORMADOR liberta desafio para utilizador específico', endpoint: 'POST /api/challenges/:id/release/:student_id' },
    { action: 'USUARIO vê desafio em /my-challenges e clica "Executar"' },
    { action: 'POST start → submissão criada IN_PROGRESS', endpoint: 'POST /api/submit/complete/start/:id/self' },
    { action: 'Para cada operação: registo de linha de submissão', endpoint: 'POST /api/submit/complete/:submissionId/part' },
    { action: 'Após todas as operações: finish → MPU calculado automaticamente' },
    { action: 'Submit-for-review → estado → PENDING_REVIEW', note: 'FORMADOR notificado' },
  ],
  decisions: [
    { condition: 'Mais operações para registar?', yes: 'Registar próxima operação', no: 'Concluir submissão' },
  ],
  endpoints: [
    ['POST', '/api/challenges/:id/release/:student_id',      'FORMADOR liberta desafio para utilizador'],
    ['POST', '/api/submit/complete/start/:id/self',          'Iniciar submissão de desafio'],
    ['POST', '/api/submit/complete/:submissionId/part',      'Registar operação individual'],
    ['POST', '/api/submit/complete/:submissionId/finish',    'Finalizar submissão — calcular MPU'],
    ['POST', '/api/submit/:submissionId/submit-for-review',  'Submeter para revisão — PENDING_REVIEW'],
  ],
},
{
  num: '2.5', title: 'Revisão de Submissão (FORMADOR/ADMIN)',
  desc: 'Análise do MPU calculado vs MPU alvo. Em caso de rejeição, pode ser permitida uma retentativa.',
  states: [
    { label: 'PENDING_REVIEW', color: 'amber' }, { label: 'Analisado', color: 'blue' },
    { label: 'Aprovado', color: 'green' }, { label: 'Rejeitado', color: 'red' },
  ],
  steps: [
    { action: 'FORMADOR/ADMIN acede a /pending-reviews' },
    { action: 'Selecciona submissão PENDING_REVIEW e analisa MPU calculado vs MPU alvo' },
    { action: '→ APROVAR: POST finalize-review (approved: true)', endpoint: 'POST /api/submit/:id/finalize-review', note: 'approved: true' },
    { action: '→ REJEITAR: POST finalize-review (approved: false)', endpoint: 'POST /api/submit/:id/finalize-review', note: 'approved: false' },
    { action: 'Se aprovado: verificar se todos os cursos do plano estão concluídos' },
    { action: 'Se rejeitado: decidir se permite retentativa' },
    { action: '→ Retentativa permitida: POST start-retry', endpoint: 'POST /api/submit/:id/start-retry' },
  ],
  decisions: [
    { condition: 'FORMADOR aprova MPU?', yes: 'Estado → REVIEWED (approved)', no: 'Estado → REVIEWED (rejected)' },
    { condition: 'Todos cursos concluídos?', yes: 'Gerar certificado (→ 2.6)', no: 'Progresso actualizado' },
    { condition: 'Permitir retentativa?', yes: 'Nova execução disponível', no: 'Encerrada sem retentativa' },
  ],
  endpoints: [
    ['POST', '/api/submit/:id/finalize-review', 'Aprovar ou rejeitar submissão'],
    ['POST', '/api/submit/:id/start-retry',     'Permitir nova tentativa de desafio'],
  ],
},
{
  num: '2.6', title: 'Geração de Certificado',
  desc: 'Após todos os cursos finalizados e aprovados, o FORMADOR confirma e o sistema emite o certificado em PDF para download.',
  states: [
    { label: 'Cursos concluídos', color: 'blue' }, { label: 'FORMADOR confirma', color: 'blue' },
    { label: 'Validação OK', color: 'green' }, { label: 'Certificado emitido', color: 'green' }, { label: 'PDF disponível', color: 'green' },
  ],
  steps: [
    { action: 'Todos os cursos do plano estão finalizados e aprovados' },
    { action: 'FORMADOR confirma finalização do plano' },
    { action: 'POST /api/finalization/plan/:id/finalize com generate_certificate: true', endpoint: 'POST /api/finalization/plan/:id/finalize' },
    { action: 'Sistema valida: todas as submissões aprovadas?', note: 'Se não → Erro' },
    { action: 'Certificado criado na BD' },
    { action: 'USUARIO acede a /certificates → Download PDF', endpoint: 'GET /api/certificates/:id' },
  ],
  decisions: [
    { condition: 'FORMADOR confirma finalização?', yes: 'Avança para gerar certificado', no: 'Plano permanece ACTIVE' },
    { condition: 'Todas as submissões aprovadas?', yes: 'Certificado gerado', no: 'Erro — submissões pendentes' },
  ],
  endpoints: [
    ['POST', '/api/finalization/plan/:id/finalize', 'Finalizar plano e gerar certificado'],
    ['GET',  '/api/certificates/:id',               'Obter certificado para download'],
  ],
},

/* ─── 3. PORTAL DE TUTORIA ────────────────────────────────────────────────── */
{
  num: '3.1', title: 'Registo de Erro de Tutoria',
  desc: 'Liberador ou Tutor regista erro. A severidade determina o nível de notificação, de normal a urgente para o ADMIN.',
  states: [
    { label: 'Formulário preenchido', color: 'blue' }, { label: 'Severidade definida', color: 'amber' },
    { label: 'PENDENTE criado', color: 'amber' }, { label: 'Tutor notificado', color: 'blue' },
  ],
  steps: [
    { action: 'LIBERADOR/TUTOR acede a /tutoria/errors/new' },
    { action: 'Preenche: descrição, categoria, severidade, operação, banco, produto' },
    { action: 'Nível de notificação por severidade:', note: 'BAIXA=normal · MÉDIA=prioridade · ALTA=alerta tutor · CRÍTICA=notif. urgente ADMIN' },
    { action: 'POST /api/tutoria/errors — erro criado: PENDENTE', endpoint: 'POST /api/tutoria/errors' },
    { action: 'Tutor atribuído recebe notificação' },
    { action: 'Erro visível em /tutoria/my-errors do tutorado' },
  ],
  decisions: [
    { condition: 'Severidade = CRÍTICA?', yes: 'Notificação urgente ao ADMIN', no: 'Notificação normal ao tutor' },
  ],
  endpoints: [
    ['POST', '/api/tutoria/errors', 'Registar novo erro — estado inicial: PENDENTE'],
  ],
},
{
  num: '3.2', title: 'Ciclo Completo de Erro de Tutoria — 6 Estados',
  desc: 'Da criação à resolução, passando por análise, planos e verificação. Cancelamento possível em qualquer estado (excepto RESOLVIDO).',
  states: [
    { label: 'PENDENTE', color: 'amber' }, { label: 'EM_ANÁLISE', color: 'blue' },
    { label: 'AGUARDA_PLANOS', color: 'amber' }, { label: 'EM_EXECUÇÃO', color: 'blue' },
    { label: 'VERIFICAÇÃO', color: 'amber' }, { label: 'RESOLVIDO', color: 'green' },
  ],
  steps: [
    { action: '1 — PENDENTE: Erro registado por Liberador/Tutor' },
    { action: '2 — EM ANÁLISE: TUTOR analisa e submete ao GERENTE/ADMIN para aprovação' },
    { action: '→ GERENTE/ADMIN rejeita: devolvido para revisão' },
    { action: '3 — AGUARDA PLANOS: Tutor cria plano de acção associado ao erro' },
    { action: '4 — EM EXECUÇÃO: Itens do plano executados um a um' },
    { action: '→ TUTOR/ADMIN rejeita plano: devolvido com comentários' },
    { action: '5 — VERIFICAÇÃO: Tutorado confirma resolução do erro' },
    { action: '6 — RESOLVIDO: TUTOR encerra o erro definitivamente' },
    { action: 'CANCELADO disponível em qualquer estado (excepto RESOLVIDO)' },
  ],
  decisions: [
    { condition: 'GERENTE/ADMIN aprova análise?', yes: 'Avança para AGUARDA_PLANOS', no: 'Devolvido para revisão' },
    { condition: 'TUTOR/ADMIN aprova plano?', yes: 'Avança para VERIFICAÇÃO', no: 'Devolvido com comentários' },
  ],
  endpoints: [
    ['PATCH', '/api/tutoria/errors/:id', 'Actualizar estado do erro de tutoria'],
  ],
},
{
  num: '3.3', title: 'Criação e Aprovação de Plano de Acção',
  desc: 'TUTOR cria plano associado a um erro de tutoria, passando por RASCUNHO → EM_REVISÃO → APROVADO → EM_EXECUÇÃO → CONCLUÍDO.',
  states: [
    { label: 'RASCUNHO', color: 'amber' }, { label: 'EM_REVISÃO', color: 'amber' },
    { label: 'APROVADO', color: 'green' }, { label: 'EM_EXECUÇÃO', color: 'blue' }, { label: 'CONCLUÍDO', color: 'green' },
  ],
  steps: [
    { action: 'TUTOR acede ao erro /tutoria/errors/:id' },
    { action: 'Preenche: título, descrição, data limite, responsável, itens de acção' },
    { action: 'POST /api/errors/:id/plans — RASCUNHO', endpoint: 'POST /api/errors/:id/plans' },
    { action: 'Adicionar itens ao plano (loop)', endpoint: 'POST /api/plans/:id/items' },
    { action: 'Submeter plano para revisão', endpoint: 'POST /api/plans/:id/submit', note: 'Estado → EM_REVISÃO' },
    { action: '→ APROVADO: POST /api/plans/:id/approve', endpoint: 'POST /api/plans/:id/approve' },
    { action: 'Iniciar execução', endpoint: 'PATCH /api/plans/:id/start', note: 'Estado → EM_EXECUÇÃO' },
    { action: 'Concluir plano', endpoint: 'PATCH /api/plans/:id/complete', note: 'Estado → CONCLUÍDO' },
  ],
  decisions: [
    { condition: 'TUTOR/ADMIN aprova plano?', yes: 'Estado → APROVADO', no: 'Devolvido com comentários para revisão' },
  ],
  endpoints: [
    ['POST',  '/api/errors/:id/plans',     'Criar plano de acção (RASCUNHO)'],
    ['POST',  '/api/plans/:id/items',      'Adicionar item ao plano'],
    ['POST',  '/api/plans/:id/submit',     'Submeter para revisão → EM_REVISÃO'],
    ['POST',  '/api/plans/:id/approve',    'Aprovar plano → APROVADO'],
    ['PATCH', '/api/plans/:id/start',      'Iniciar execução → EM_EXECUÇÃO'],
    ['PATCH', '/api/plans/:id/complete',   'Concluir plano → CONCLUÍDO'],
  ],
},
{
  num: '3.4', title: 'Side-by-Side (Treino ao Lado)',
  desc: 'TUTOR observa USUARIO ao vivo, regista MPU por operação. Se necessário, cria erro de tutoria associado à sessão.',
  states: [
    { label: 'Sessão criada', color: 'blue' }, { label: 'Observação em curso', color: 'blue' },
    { label: 'MPU calculado', color: 'blue' }, { label: 'Acção se necessário', color: 'amber' },
  ],
  steps: [
    { action: 'TUTOR identifica USUARIO para supervisão e acede a /tutoria/side-by-side' },
    { action: 'Selecciona: USUARIO + operação + data' },
    { action: 'POST /api/tutoria/plans/side-by-side — plano especial criado', endpoint: 'POST /api/tutoria/plans/side-by-side' },
    { action: 'TUTOR observa ao vivo e regista observações em tempo real' },
    { action: 'MPU calculado: Minutos Por Operação por tarefa' },
    { action: '→ Se acção necessária: criar erro de tutoria associado (→ Fluxo 3.1)' },
    { action: '→ Se sem problemas: sessão arquivada como referência' },
  ],
  decisions: [
    { condition: 'Acção necessária após sessão?', yes: 'Criar erro de tutoria → Fluxo 3.1', no: 'Sessão arquivada como referência' },
  ],
  endpoints: [
    ['POST', '/api/tutoria/plans/side-by-side', 'Criar sessão side-by-side'],
  ],
},
{
  num: '3.5', title: 'Ciclo de Feedback de Liberador',
  desc: 'Survey semanal criada pelo TUTOR. Liberadores avaliam grabadores. TUTOR analisa resultados e cria acções quando há respostas críticas.',
  states: [
    { label: 'Survey criada', color: 'blue' }, { label: 'Liberadores notificados', color: 'blue' },
    { label: 'Respostas submetidas', color: 'blue' }, { label: 'Análise', color: 'blue' }, { label: 'Acções (se crítico)', color: 'red' },
  ],
  steps: [
    { action: 'TUTOR cria survey semanal com lista de perguntas', endpoint: 'POST /api/feedback/surveys' },
    { action: 'Survey activa → liberadores notificados automaticamente' },
    { action: 'LIBERADOR acede → GET /api/feedback/my-pending', endpoint: 'GET /api/feedback/my-pending' },
    { action: 'Submete rating + comentários por grabador' },
    { action: 'TUTOR vê dashboard com análise de sentimento + alertas' },
    { action: '→ Se respostas críticas: POST /api/feedback/actions — criar acções', endpoint: 'POST /api/feedback/actions' },
  ],
  decisions: [
    { condition: 'Surveys pendentes?', yes: 'Liberador responde', no: 'Sem surveys' },
    { condition: 'Respostas críticas?', yes: 'Criar acções atribuídas', no: 'Ciclo concluído' },
  ],
  endpoints: [
    ['POST', '/api/feedback/surveys',  'Criar nova survey de feedback'],
    ['GET',  '/api/feedback/my-pending', 'Obter surveys pendentes (liberador)'],
    ['POST', '/api/feedback/actions',  'Criar acções a partir de feedback crítico'],
  ],
},
{
  num: '3.6', title: 'Registo de Erro Interno (Liberador)',
  desc: 'LIBERADOR regista erro interno com nível de impacto. TUTOR pode criar plano de acção e ficha de aprendizagem associada.',
  states: [
    { label: 'Formulário', color: 'blue' }, { label: 'Impacto definido', color: 'amber' },
    { label: 'Erro registado', color: 'amber' }, { label: 'Plano criado', color: 'blue' }, { label: 'Ficha lida', color: 'green' },
  ],
  steps: [
    { action: 'LIBERADOR acede a /tutoria/internal-errors/new' },
    { action: 'Preenche: descrição, impacto, banco, departamento, actividade, tipo de erro, grabador' },
    { action: 'Nível de impacto: BAIXO (normal) · MÉDIO (notif. tutor) · ALTO (alerta urgente ADMIN+TUTOR)' },
    { action: 'POST /api/internal-errors/errors', endpoint: 'POST /api/internal-errors/errors', note: 'Visível a TUTOR/ADMIN/GERENTE' },
    { action: '→ TUTOR pode criar plano de acção + ficha de aprendizagem associada' },
    { action: 'LIBERADOR lê ficha', endpoint: 'POST /api/learning-sheets/:id/mark-read', note: 'Ficha marcada como lida' },
  ],
  decisions: [
    { condition: 'Impacto = ALTO?', yes: 'Alerta urgente ADMIN + TUTOR', no: 'Notificação normal ou registo silencioso' },
    { condition: 'TUTOR cria plano?', yes: 'Plano + ficha de aprendizagem', no: 'Erro fica pendente à espera de acção' },
  ],
  endpoints: [
    ['POST', '/api/internal-errors/errors',        'Registar erro interno'],
    ['POST', '/api/learning-sheets/:id/mark-read', 'LIBERADOR marca ficha como lida'],
  ],
},

/* ─── 4. PORTAL DE CHAMADOS ───────────────────────────────────────────────── */
{
  num: '4.1', title: 'Ciclo de Vida de um Chamado (Kanban)',
  desc: 'Do registo ao fecho. Suporte a tipos BUG e MELHORIA, prioridades, comentários, revisão e reabertura.',
  states: [
    { label: 'ABERTO', color: 'amber' }, { label: 'EM_ANDAMENTO', color: 'blue' },
    { label: 'EM_REVISÃO', color: 'blue' }, { label: 'CONCLUÍDO', color: 'green' },
  ],
  steps: [
    { action: 'Utilizador autenticado acede a /chamados' },
    { action: 'Preenche: título, descrição, tipo (BUG/MELHORIA), prioridade, portal' },
    { action: 'POST /api/chamados — ticket criado: ABERTO', endpoint: 'POST /api/chamados' },
    { action: 'ADMIN atribui responsável → estado → EM_ANDAMENTO', endpoint: 'PUT /api/chamados/:id' },
    { action: 'Trabalho em curso — comentários adicionados', endpoint: 'POST /api/chamados/:id/comments' },
    { action: 'ADMIN move para EM_REVISÃO' },
    { action: '→ Revisão aprovada: estado → CONCLUÍDO' },
    { action: '→ Revisão falha: estado → ABERTO (reabertura)' },
  ],
  decisions: [
    { condition: 'ADMIN atribui responsável?', yes: 'Estado → EM_ANDAMENTO', no: 'Permanece ABERTO' },
    { condition: 'Revisão aprovada?', yes: 'Estado → CONCLUÍDO', no: 'Estado → ABERTO (reabertura)' },
  ],
  endpoints: [
    ['POST', '/api/chamados',              'Criar novo chamado'],
    ['PUT',  '/api/chamados/:id',          'Actualizar chamado (estado, responsável)'],
    ['POST', '/api/chamados/:id/comments', 'Adicionar comentário ao chamado'],
  ],
},

/* ─── 5. DADOS MESTRES ────────────────────────────────────────────────────── */
{
  num: '5.1', title: 'Gestão de Utilizadores (ADMIN)',
  desc: 'ADMIN pode criar utilizadores com flags especiais (is_tutor, is_liberador, is_team_lead, is_referente), editar ou remover.',
  states: [
    { label: 'Criar', color: 'green' }, { label: 'Editar', color: 'blue' }, { label: 'Apagar', color: 'red' },
  ],
  steps: [
    { action: 'ADMIN acede a /master-data/users' },
    { action: '→ CRIAR: preenche dados + flags (is_tutor, is_liberador, is_team_lead, is_referente)', endpoint: 'POST /api/users' },
    { action: '→ EDITAR: altera role, flags, equipa, estado activo', endpoint: 'PUT /api/users/:id' },
    { action: '→ APAGAR: confirmação + DELETE', endpoint: 'DELETE /api/users/:id' },
    { action: 'Utilizador criado/actualizado/removido com sucesso' },
  ],
  decisions: [
    { condition: 'Operação desejada?', yes: 'Criar/Editar — formulário', no: 'Apagar — confirmar remoção' },
  ],
  endpoints: [
    ['POST',   '/api/users',      'Criar utilizador com role e flags'],
    ['PUT',    '/api/users/:id',  'Actualizar dados, role e flags'],
    ['DELETE', '/api/users/:id',  'Remover utilizador do sistema'],
  ],
},
{
  num: '5.2', title: 'Gestão de Equipas (ADMIN)',
  desc: 'Criar equipa, atribuir gestor, associar serviços/produtos e adicionar ou remover membros.',
  states: [
    { label: 'Equipa criada', color: 'blue' }, { label: 'Gestor atribuído', color: 'blue' },
    { label: 'Serviços associados', color: 'blue' }, { label: 'Membros adicionados', color: 'green' },
  ],
  steps: [
    { action: 'ADMIN acede a /master-data/teams' },
    { action: '→ CRIAR: POST /api/teams — equipa criada', endpoint: 'POST /api/teams' },
    { action: 'Atribuir gestor à equipa', endpoint: 'PATCH /api/teams/:id', note: 'manager_id' },
    { action: 'Associar serviços/produtos', endpoint: 'POST /api/teams/:id/services' },
    { action: 'Adicionar membros à equipa', endpoint: 'POST /api/teams/:id/members' },
    { action: '→ REMOVER membro: confirmar + DELETE', endpoint: 'DELETE /api/teams/:id/members/:user_id' },
  ],
  decisions: [
    { condition: 'Confirma remoção de membro?', yes: 'DELETE membro removido', no: 'Cancelado' },
  ],
  endpoints: [
    ['POST',   '/api/teams',                        'Criar nova equipa'],
    ['PATCH',  '/api/teams/:id',                    'Actualizar equipa (gestor, nome)'],
    ['POST',   '/api/teams/:id/services',           'Associar serviços à equipa'],
    ['POST',   '/api/teams/:id/members',            'Adicionar membro à equipa'],
    ['DELETE', '/api/teams/:id/members/:user_id',   'Remover membro da equipa'],
  ],
},
{
  num: '5.3', title: 'Gestão da Hierarquia Organizacional (ADMIN)',
  desc: 'Criar nós raiz ou filhos, mover na hierarquia, adicionar/remover membros por nó e consultar log de auditoria com timestamps.',
  states: [
    { label: 'Visualiza árvore', color: 'blue' }, { label: 'Cria/Move nó', color: 'blue' },
    { label: 'Gere membros', color: 'blue' }, { label: 'Auditoria', color: 'gray' },
  ],
  steps: [
    { action: 'ADMIN acede a /master-data/org-hierarchy — visualiza árvore' },
    { action: '→ CRIAR NÓ RAIZ: POST /api/org/nodes (parent_id: null)', endpoint: 'POST /api/org/nodes' },
    { action: '→ CRIAR NÓ FILHO: POST /api/org/nodes (parent_id: X)', endpoint: 'POST /api/org/nodes' },
    { action: '→ MOVER NÓ: POST /api/org/nodes/:id/move (new_parent_id)', endpoint: 'POST /api/org/nodes/:id/move' },
    { action: '→ GERIR MEMBROS: POST/DELETE /api/org/nodes/:id/members', endpoint: 'POST /api/org/nodes/:id/members' },
    { action: '→ AUDITORIA: GET /api/org/audit — ver log com timestamps', endpoint: 'GET /api/org/audit' },
  ],
  decisions: [
    { condition: 'Operação desejada?', yes: 'Criar nó raiz / filho / mover', no: 'Gerir membros / consultar auditoria' },
  ],
  endpoints: [
    ['POST',   '/api/org/nodes',               'Criar nó (raiz ou filho)'],
    ['POST',   '/api/org/nodes/:id/move',      'Mover nó para novo pai'],
    ['POST',   '/api/org/nodes/:id/members',   'Adicionar membro ao nó'],
    ['DELETE', '/api/org/nodes/:id/members',   'Remover membro do nó'],
    ['GET',    '/api/org/audit',               'Consultar log de auditoria'],
  ],
},

/* ─── 6. DATA SCOPING ─────────────────────────────────────────────────────── */
{
  num: '6.1', title: 'Árvore de Decisão de Visibilidade de Dados',
  desc: 'Lógica da função get_visible_user_ids() do backend. Determina quais os dados visíveis para cada utilizador em todos os portais.',
  states: [
    { label: 'ADMIN/DIRETOR: tudo', color: 'green' },
    { label: 'GERENTE/CHEFE_EQUIPE: equipa', color: 'blue' },
    { label: 'FORMADOR/USUARIO: só próprios', color: 'amber' },
  ],
  steps: [
    { action: 'Pedido autenticado chega ao backend' },
    { action: 'backend chama get_visible_user_ids(current_user)' },
    { action: '→ is_admin ou is_diretor: retorna NULL (sem filtro) → vê todos os dados' },
    { action: '→ is_gerente ou is_chefe_equipe: encontra equipas onde manager_id=user.id → inclui todos os membros + próprio ID' },
    { action: '→ is_formador: retorna lista de formandos atribuídos (tutor_id=user.id) + próprio ID' },
    { action: '→ USUARIO sem flags: retorna lista=[user.id] → vê apenas os seus próprios dados' },
    { action: 'Query filtrada aplicada → dados retornados ao cliente com scoping correcto' },
  ],
  decisions: [
    { condition: 'is_admin ou is_diretor?', yes: 'NULL — sem filtro, tudo visível', no: 'Verificar GERENTE' },
    { condition: 'is_gerente ou is_chefe_equipe?', yes: 'Equipa gerida visível', no: 'Verificar FORMADOR' },
    { condition: 'is_formador?', yes: 'Formandos atribuídos visíveis', no: 'Apenas dados próprios' },
  ],
  endpoints: [
    ['GET', '(qualquer endpoint de listagem)', 'Scoping aplicado automaticamente pela função get_visible_user_ids()'],
  ],
},

];

/* ══════════════════════════════════════════════════════════════════════════════
   BUILD DOCUMENT
══════════════════════════════════════════════════════════════════════════════ */

const numbering = {
  config: [{
    reference: 'steps',
    levels: [{
      level: 0,
      format: LevelFormat.DECIMAL,
      text: '%1.',
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360, hanging: 360 } } },
    }],
  }],
};

function buildFlow(flow) {
  const elements = [];

  elements.push(
    new Paragraph({ spacing: { before: 160, after: 40 }, children: [
      new TextRun({ text: `Fluxo ${flow.num}`, size: 18, color: RED, font: 'Arial', bold: true }),
    ]}),
    heading2(flow.title),
    descBox(flow.desc),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
    ...statesRow(flow.states),
  );

  // Steps
  elements.push(
    new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'Passo a Passo', bold: true, size: 20, color: DARK, font: 'Arial' })] }),
    ...stepsList(flow.steps),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  );

  // Decisions
  if (flow.decisions && flow.decisions.length) {
    elements.push(...decisionsTable(flow.decisions));
  }

  // Endpoints
  if (flow.endpoints && flow.endpoints.length) {
    elements.push(...endpointsTable(flow.endpoints));
  }

  return elements;
}

const sections = ['1. Autenticação', '2. Portal de Formações', '3. Portal de Tutoria', '4. Portal de Chamados', '5. Dados Mestres', '6. Data Scoping'];
const sectionBreaks = { '1.1': 0, '2.1': 1, '3.1': 2, '4.1': 3, '5.1': 4, '6.1': 5 };

const children = [];

// Cover heading
children.push(
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'PortalTradeHub', size: 14, color: RED, font: 'Arial', bold: true })] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, outlineLevel: 0, spacing: { after: 160 },
    children: [new TextRun({ text: 'Fluxogramas Operacionais', bold: true, size: 40, color: DARK, font: 'Arial' })] }),
  body('21 fluxos cobrindo todos os processos operacionais do PortalTradeHub — da autenticação à visibilidade de dados.', { color: MID }),
  body('Versão: 2026-03-30 · Confidencial', { color: '9B9890', italic: true }),
  new Paragraph({ spacing: { after: 80 }, children: [] }),
);

// Legend
children.push(
  new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'Legenda de Cores', bold: true, size: 20, color: DARK, font: 'Arial' })] }),
);
const legendItems = [
  ['Sucesso / Aprovado / Conclusão', 'green'],
  ['Erro / Rejeição / Cancelado', 'red'],
  ['Em progresso / Informação', 'blue'],
  ['Pendente / Decisão / Espera', 'amber'],
  ['Início / Fim / Neutro', 'gray'],
];
children.push(new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  layout: TableLayoutType.FIXED,
  rows: legendItems.map(([label, col]) => {
    const c = COL[col];
    return new TableRow({ children: [
      new TableCell({
        width: { size: 300, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: c.bg },
        borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c.border }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c.border }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        children: [new Paragraph({ children: [] })],
      }),
      new TableCell({
        width: { size: CONTENT_W - 300, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER }, bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 50, bottom: 50, left: 120, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, color: c.fg, font: 'Arial' })] })],
      }),
    ]});
  }),
}));
children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));

// All flows
let currentSection = -1;
FLOWS.forEach((flow, idx) => {
  const sIdx = sectionBreaks[flow.num];
  if (sIdx !== undefined) {
    if (idx > 0) children.push(pageBreak());
    children.push(
      sectionDivider(sections[sIdx]),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
    );
    currentSection = sIdx;
  } else if (idx > 0) {
    children.push(new Paragraph({
      spacing: { before: 240, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER } },
      children: [],
    }));
  }
  children.push(...buildFlow(flow));
});

const doc = new Document({
  numbering,
  styles: {
    default: { document: { run: { font: 'Arial', size: 20, color: MID } } },
  },
  sections: [{
    properties: {
      page: {
        size: PAGE.size,
        margin: PAGE.margin,
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Fluxogramas_Operacionais_PTH.docx', buf);
  console.log('OK: Fluxogramas_Operacionais_PTH.docx created (21 fluxos)');
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
