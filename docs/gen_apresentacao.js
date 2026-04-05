/**
 * gen_apresentacao.js
 * Gera Apresentacao_Executiva_PTH_TDH.pptx — 15 slides para gestão
 * Run: NODE_PATH="/c/Users/ripma/AppData/Roaming/npm/node_modules" node gen_apresentacao.js
 */

'use strict';
const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();

/* ─── Design System Santander ─────────────────────────────────────────────── */
const C = {
  RED:    'EC0000',
  DKRED:  '990011',
  WHITE:  'FFFFFF',
  OFFWHT: 'FCF6F5',
  DARK:   '1A1A1A',
  MID:    '4B4B4B',
  LIGHT:  'F5F5F5',
  BLUE:   '2F3C7E',
  GREEN:  '2E8B57',
  AMBER:  'B7791F',
};

pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 in

/* ─── Master Slide Definitions ─────────────────────────────────────────────── */
// Title slide master
pptx.defineSlideMaster({
  title: 'TITLE',
  background: { color: C.RED },
  objects: [
    { rect: { x: 0, y: 6.8, w: '100%', h: 0.7, fill: { color: C.DKRED } } },
  ],
});

// Content slide master
pptx.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.WHITE },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.RED } } },
    { rect: { x: 0, y: 6.9, w: '100%', h: 0.6,  fill: { color: C.LIGHT } } },
    { text: { text: 'PortalTradeHub · Trade Data Hub', options: { x: 0.3, y: 6.92, w: 8, h: 0.3, fontSize: 8, color: C.MID, fontFace: 'Arial' } } },
    { text: { text: '2026', options: { x: 12.5, y: 6.92, w: 0.8, h: 0.3, fontSize: 8, color: C.MID, fontFace: 'Arial', align: 'right' } } },
  ],
});

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function addSlide(master) {
  return pptx.addSlide({ masterName: master });
}

function sectionBar(slide, text) {
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.05, w: 0.06, h: 0.5, fill: { color: C.RED }, line: { color: C.RED } });
  slide.addText(text, { x: 0.55, y: 1.0, w: 12, h: 0.65, fontSize: 22, bold: true, color: C.DARK, fontFace: 'Arial' });
}

function kpiBox(slide, x, y, value, label, color) {
  color = color || C.RED;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.8, h: 1.4, fill: { color: C.OFFWHT }, line: { color: color, pt: 2 }, rectRadius: 0.1 });
  slide.addText(value, { x, y: y + 0.05, w: 2.8, h: 0.8, fontSize: 32, bold: true, color: color, fontFace: 'Arial', align: 'center' });
  slide.addText(label, { x, y: y + 0.85, w: 2.8, h: 0.45, fontSize: 11, color: C.MID, fontFace: 'Arial', align: 'center' });
}

function bodyText(slide, text, x, y, w, h, opts) {
  slide.addText(text, Object.assign({ x, y, w, h, fontSize: 13, color: C.MID, fontFace: 'Arial', valign: 'top' }, opts || {}));
}

function bullet(text, indent) {
  return { text, options: { bullet: { indent: indent || 15 }, fontSize: 12, color: C.MID, fontFace: 'Arial', paraSpaceAfter: 4 } };
}

function divider(slide, y) {
  slide.addShape(pptx.ShapeType.line, { x: 0.4, y, w: 12.5, h: 0, line: { color: 'E5E5E5', pt: 1 } });
}

function tag(slide, x, y, text, color) {
  color = color || C.RED;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.5, h: 0.3, fill: { color: color }, line: { color: color }, rectRadius: 0.05 });
  slide.addText(text, { x, y, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: C.WHITE, fontFace: 'Arial', align: 'center', valign: 'middle' });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 01 — Capa / Título
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('TITLE');

  // White diagonal accent block
  s.addShape(pptx.ShapeType.rect, { x: 8.5, y: 0, w: 4.83, h: 7.5, fill: { color: C.WHITE }, line: { color: C.WHITE } });
  s.addShape(pptx.ShapeType.rect, { x: 7.8, y: 0, w: 1.0, h: 7.5, fill: { color: C.OFFWHT }, line: { color: C.OFFWHT } });

  // Logo text left
  s.addText('PORTAL\nTRADE HUB', {
    x: 0.6, y: 1.5, w: 7, h: 2.2,
    fontSize: 52, bold: true, color: C.WHITE, fontFace: 'Arial',
    lineSpacingMultiple: 1.1,
  });
  s.addText('+ Trade Data Hub', {
    x: 0.6, y: 3.7, w: 7, h: 0.6,
    fontSize: 22, color: C.OFFWHT, fontFace: 'Arial',
  });

  s.addText('Apresentação Executiva', {
    x: 0.6, y: 4.5, w: 7, h: 0.5,
    fontSize: 16, color: C.OFFWHT, fontFace: 'Arial', italic: true,
  });

  // Right side decorative stats
  const stats = [
    ['5', 'Portais'],
    ['5', 'Roles'],
    ['341', 'Testes'],
    ['12', 'Migrações SQL'],
  ];
  stats.forEach(([v, l], i) => {
    const yy = 1.2 + i * 1.4;
    s.addText(v,  { x: 9.0, y: yy,        w: 3.5, h: 0.8, fontSize: 36, bold: true, color: C.RED,  fontFace: 'Arial', align: 'center' });
    s.addText(l,  { x: 9.0, y: yy + 0.75, w: 3.5, h: 0.4, fontSize: 12, color: C.MID, fontFace: 'Arial', align: 'center' });
  });

  s.addText('Março 2026 · Confidencial', {
    x: 0.6, y: 6.9, w: 7, h: 0.35, fontSize: 9, color: 'FFCCCC', fontFace: 'Arial',
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 02 — Agenda
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Agenda');

  const items = [
    ['01', 'Missão & Contexto',         '03'],
    ['02', 'Arquitectura de Sistema',   '04'],
    ['03', 'Módulos & Portais',         '05'],
    ['04', 'Data Warehouse & BI',       '07'],
    ['05', 'Segurança & Compliance',    '09'],
    ['06', 'Métricas de Qualidade',     '10'],
    ['07', 'Papéis & Permissões',       '11'],
    ['08', 'Deploy & Operações',        '12'],
    ['09', 'Roadmap',                   '13'],
    ['10', 'Próximos Passos',           '14'],
  ];

  items.forEach(([num, title, pg], i) => {
    const col = i < 5 ? 0 : 1;
    const row = i % 5;
    const x = col === 0 ? 0.4 : 6.8;
    const y = 1.85 + row * 0.9;

    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 0.5, h: 0.5, fill: { color: C.RED }, line: { color: C.RED }, rectRadius: 0.05 });
    s.addText(num, { x, y, w: 0.5, h: 0.5, fontSize: 13, bold: true, color: C.WHITE, fontFace: 'Arial', align: 'center', valign: 'middle' });
    s.addText(title, { x: x + 0.6, y: y + 0.05, w: 5.5, h: 0.4, fontSize: 13, color: C.DARK, fontFace: 'Arial' });
    s.addText(`sl. ${pg}`, { x: x + 5.6, y: y + 0.05, w: 0.8, h: 0.4, fontSize: 10, color: C.MID, fontFace: 'Arial', align: 'right' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 03 — Missão & Contexto
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Missão & Contexto');

  // Mission statement box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 1.8, w: 12.5, h: 1.4,
    fill: { color: C.RED }, line: { color: C.RED }, rectRadius: 0.12,
  });
  s.addText(
    '"Centralizar a gestão de formações, tutoria e dados operacionais das equipas de trading, '
    + 'oferecendo dashboards em tempo real e rastreabilidade completa de erros operacionais."',
    { x: 0.6, y: 1.9, w: 12.1, h: 1.2, fontSize: 14, color: C.WHITE, fontFace: 'Arial', italic: true, align: 'center', valign: 'middle' }
  );

  divider(s, 3.4);

  // Context pillars
  const pillars = [
    { title: 'Problema', body: 'Formações dispersas, sem rastreio de progresso. Erros operacionais sem ciclo de tutoria estruturado. Dados mestre inconsistentes entre sistemas.' },
    { title: 'Solução', body: 'Portal único com 5 módulos integrados, DW star-schema para BI, ETL automático, e gestão centralizada de equipas e bancos.' },
    { title: 'Impacto', body: 'Redução de erros operacionais via tutoria 5W2H. Formadores certificados com planos de treino. Relatórios executivos em tempo real.' },
  ];

  pillars.forEach(({ title, body }, i) => {
    const x = 0.4 + i * 4.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 3.6, w: 3.9, h: 2.9, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y: 3.6, w: 3.9, h: 0.45, fill: { color: C.DKRED }, line: { color: C.DKRED } });
    s.addText(title, { x, y: 3.62, w: 3.9, h: 0.42, fontSize: 13, bold: true, color: C.WHITE, fontFace: 'Arial', align: 'center', valign: 'middle' });
    s.addText(body,  { x: x + 0.15, y: 4.15, w: 3.6, h: 2.2, fontSize: 11, color: C.MID, fontFace: 'Arial', valign: 'top', wrap: true });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 04 — Arquitectura de Sistema
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Arquitectura de Sistema');

  // 3-layer diagram (simplified visual)
  const layers = [
    { label: 'FRONTEND',  sub: 'React 18 · TypeScript · Tailwind CSS · Tremor', color: C.BLUE,  y: 1.8 },
    { label: 'BACKEND',   sub: 'FastAPI · Python 3.13 · SQLAlchemy · Pydantic',  color: C.RED,   y: 3.15 },
    { label: 'DADOS',     sub: 'MySQL 8.0 · DW Star Schema · ETL Automático',    color: C.GREEN, y: 4.5  },
  ];

  layers.forEach(({ label, sub, color, y }) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 1.5, y, w: 10.3, h: 1.1, fill: { color }, line: { color }, rectRadius: 0.08 });
    s.addText(label, { x: 1.7, y: y + 0.1, w: 3, h: 0.45, fontSize: 15, bold: true, color: C.WHITE, fontFace: 'Arial' });
    s.addText(sub,   { x: 1.7, y: y + 0.55, w: 9.5, h: 0.4, fontSize: 11, color: C.WHITE, fontFace: 'Arial' });
  });

  // Arrows between layers
  [2.92, 4.27].forEach(y => {
    s.addShape(pptx.ShapeType.line, { x: 6.5, y, w: 0, h: 0.23, line: { color: C.MID, pt: 2 } });
    s.addText('▼', { x: 6.3, y: y + 0.05, w: 0.4, h: 0.2, fontSize: 10, color: C.MID, fontFace: 'Arial', align: 'center' });
  });

  divider(s, 5.75);

  // Infra row
  const infra = ['Nginx (Reverse Proxy)', 'Docker Compose', 'JWT Auth', 'GitHub Actions CI/CD'];
  infra.forEach((item, i) => {
    const x = 0.4 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 5.85, w: 2.9, h: 0.7, fill: { color: C.LIGHT }, line: { color: 'CCCCCC', pt: 1 }, rectRadius: 0.07 });
    s.addText(item, { x, y: 5.85, w: 2.9, h: 0.7, fontSize: 11, color: C.DARK, fontFace: 'Arial', align: 'center', valign: 'middle' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 05 — Módulos & Portais (1/2)
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Módulos & Portais  ·  1/2');

  const portals = [
    {
      num: '01', name: 'Formações', route: '/',
      color: C.RED,
      points: ['Cursos com múltiplas lições (vídeo, texto, quiz)', 'Progresso granular por lição e pausa', 'Planos de treino com cronograma', 'Desafios: Completo e Sumário', 'Certificados automáticos'],
    },
    {
      num: '02', name: 'Tutoria', route: '/tutoria',
      color: C.BLUE,
      points: ['Registo de erros operacionais com 5W2H', 'Ciclo de vida 6 estados (OPEN → CLOSED)', 'Planos de acção com itens e prazos', 'Fichas de aprendizagem e comentários', 'Notificações automáticas'],
    },
    {
      num: '03', name: 'Relatórios', route: '/relatorios',
      color: C.GREEN,
      points: ['6 dashboards: Overview, Formações, Tutoria, Equipas, Membros, Incidentes', 'Gráficos Tremor (area, bar, donut)', 'Export Excel por dashboard', 'Dados do DW em tempo real'],
    },
  ];

  portals.forEach(({ num, name, route, color, points }, i) => {
    const x = 0.4 + i * 4.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 3.9, h: 4.9, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.8, w: 3.9, h: 0.65, fill: { color }, line: { color }, rectRadius: 0 });
    s.addText(`${num} · ${name}`, { x: x + 0.1, y: 1.82, w: 3.7, h: 0.38, fontSize: 14, bold: true, color: C.WHITE, fontFace: 'Arial' });
    s.addText(route, { x: x + 0.1, y: 2.2, w: 3.7, h: 0.22, fontSize: 9, color: C.WHITE, fontFace: 'Arial', italic: true });
    const bullets = points.map(p => bullet('  ' + p));
    s.addText(bullets, { x: x + 0.1, y: 2.55, w: 3.7, h: 3.9, fontFace: 'Arial' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 06 — Módulos & Portais (2/2)
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Módulos & Portais  ·  2/2');

  const portals = [
    {
      num: '04', name: 'Dados Mestres', route: '/master-data',
      color: C.AMBER,
      points: ['Bancos e Produtos', 'Equipas e Membros', 'Hierarquia Organizacional (OrgNode)', 'Dados mestre de erros (Categoria, Subcategoria, Causa)', 'Gestão de utilizadores e roles'],
    },
    {
      num: '05', name: 'Chamados', route: '/chamados',
      color: C.MID,
      points: ['Sistema de tickets interno', 'Comentários por chamado', 'Prioridade e estado', 'Integração com notificações'],
    },
  ];

  portals.forEach(({ num, name, route, color, points }, i) => {
    const x = 0.4 + i * 4.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 3.9, h: 4.9, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.8, w: 3.9, h: 0.65, fill: { color }, line: { color }, rectRadius: 0 });
    s.addText(`${num} · ${name}`, { x: x + 0.1, y: 1.82, w: 3.7, h: 0.38, fontSize: 14, bold: true, color: C.WHITE, fontFace: 'Arial' });
    s.addText(route, { x: x + 0.1, y: 2.2, w: 3.7, h: 0.22, fontSize: 9, color: C.WHITE, fontFace: 'Arial', italic: true });
    const bullets = points.map(p => bullet('  ' + p));
    s.addText(bullets, { x: x + 0.1, y: 2.55, w: 3.7, h: 3.9, fontFace: 'Arial' });
  });

  // Stats strip right side
  s.addShape(pptx.ShapeType.roundRect, { x: 8.6, y: 1.8, w: 4.7, h: 4.9, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.1 });
  s.addText('Totais da Plataforma', { x: 8.7, y: 1.9, w: 4.5, h: 0.4, fontSize: 13, bold: true, color: C.DARK, fontFace: 'Arial', align: 'center' });
  divider(s, 2.4);

  const stats2 = [
    ['~150', 'Endpoints REST'],
    ['30+',  'Modelos ORM'],
    ['12',   'Migrações SQL'],
    ['341',  'Testes pytest'],
    ['8',    'Tabelas DW'],
  ];
  stats2.forEach(([v, l], i) => {
    const y = 2.55 + i * 0.85;
    s.addText(v, { x: 8.7, y,        w: 4.5, h: 0.45, fontSize: 26, bold: true, color: C.RED, fontFace: 'Arial', align: 'center' });
    s.addText(l, { x: 8.7, y: y+0.42, w: 4.5, h: 0.3, fontSize: 10, color: C.MID, fontFace: 'Arial', align: 'center' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 07 — Data Warehouse & BI
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Data Warehouse & BI');

  // Star schema visual (simplified)
  // Fact tables centre
  const cx = 5.5, cy = 4.0;

  // Fact boxes
  [{label:'fact_training', x:4.0,y:3.4},{label:'fact_error',x:6.0,y:3.4}].forEach(({label,x,y})=>{
    s.addShape(pptx.ShapeType.roundRect,{x,y,w:2.5,h:0.8,fill:{color:C.RED},line:{color:C.RED},rectRadius:0.08});
    s.addText(label,{x,y,w:2.5,h:0.8,fontSize:11,bold:true,color:C.WHITE,fontFace:'Arial',align:'center',valign:'middle'});
  });

  // Dim boxes around fact
  const dims = [
    {label:'dim_date',    x:0.4,  y:1.8},
    {label:'dim_user',    x:3.8,  y:1.8},
    {label:'dim_course',  x:7.5,  y:1.8},
    {label:'dim_team',    x:11.0, y:1.8},
    {label:'dim_status',  x:0.4,  y:5.0},
    {label:'dim_error_category', x:4.5, y:5.2},
    {label:'dim_status',  x:8.5,  y:5.0},
  ];
  dims.forEach(({label,x,y})=>{
    s.addShape(pptx.ShapeType.roundRect,{x,y,w:2.2,h:0.65,fill:{color:C.BLUE},line:{color:C.BLUE},rectRadius:0.07});
    s.addText(label,{x,y,w:2.2,h:0.65,fontSize:9,bold:true,color:C.WHITE,fontFace:'Arial',align:'center',valign:'middle'});
  });

  divider(s, 6.1);

  // ETL note
  s.addText('ETL automático no arranque do backend e cada hora via async scheduler. Dados disponíveis em tempo real nos dashboards /relatorios.', {
    x: 0.4, y: 6.15, w: 12.5, h: 0.55, fontSize: 11, color: C.MID, fontFace: 'Arial', italic: true, align: 'center',
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 08 — Data Warehouse — Detalhes
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Data Warehouse — Métricas & Dashboards');

  const dashboards = [
    { name: 'Overview',    kpis: 'Utilizadores activos, Cursos, Erros, Planos' },
    { name: 'Formações',   kpis: 'Taxa conclusão, Progresso, Desafios' },
    { name: 'Tutoria',     kpis: 'Taxa resolução, Recorrência, Por gravidade' },
    { name: 'Equipas',     kpis: 'Membros, Serviços, Erros por equipa' },
    { name: 'Membros',     kpis: 'Ranking conclusão, Dias médios resolução' },
    { name: 'Incidentes',  kpis: 'MTTR, Por categoria, Linha temporal' },
  ];

  dashboards.forEach(({ name, kpis }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 0.4 : 6.8;
    const y = 1.85 + row * 1.5;

    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 1.3, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.3, fill: { color: C.RED }, line: { color: C.RED } });
    s.addText(name,  { x: x + 0.2, y: y + 0.1,  w: 5.5, h: 0.4, fontSize: 14, bold: true, color: C.DARK, fontFace: 'Arial' });
    s.addText(kpis,  { x: x + 0.2, y: y + 0.55, w: 5.5, h: 0.6, fontSize: 11, color: C.MID, fontFace: 'Arial' });
  });

  divider(s, 6.55);
  s.addText('Export Excel disponível em todos os dashboards.  Componentes: Tremor AreaChart, BarChart, DonutChart, BarList.', {
    x: 0.4, y: 6.6, w: 12.5, h: 0.35, fontSize: 10, color: C.MID, fontFace: 'Arial', italic: true,
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 09 — Segurança & Compliance
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Segurança & Compliance');

  // Audit badge
  s.addShape(pptx.ShapeType.roundRect, { x: 9.5, y: 1.8, w: 3.4, h: 1.2, fill: { color: C.GREEN }, line: { color: C.GREEN }, rectRadius: 0.1 });
  s.addText('OWASP Top 10:2025', { x: 9.5, y: 1.85, w: 3.4, h: 0.4, fontSize: 13, bold: true, color: C.WHITE, fontFace: 'Arial', align: 'center' });
  s.addText('Auditoria Completa\n13 críticos · 22 altos corrigidos', { x: 9.5, y: 2.25, w: 3.4, h: 0.65, fontSize: 10, color: C.WHITE, fontFace: 'Arial', align: 'center' });

  const secItems = [
    { cat: 'Autenticação', items: ['JWT em sessionStorage (não localStorage)', 'Rotação de tokens', 'bcrypt para passwords', 'Reset de password via email'] },
    { cat: 'API', items: ['CORS sem wildcard', 'Rate limiting por endpoint', 'Swagger desactivado em produção', 'Validação Pydantic em todos os inputs'] },
    { cat: 'Infra', items: ['MySQL bind 127.0.0.1', 'Secrets via variáveis de ambiente', 'Log rotation activado', 'Docker sem portas expostas desnecessárias'] },
    { cat: 'GDPR', items: ['Dados pessoais cifrados em trânsito (HTTPS)', 'Política de retenção definida', 'Acesso por role mínimo necessário', '7 documentos ISO 27001 criados'] },
  ];

  secItems.forEach(({ cat, items }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 0.4 : 4.7;
    const y = 1.85 + row * 2.2;

    s.addText(cat, { x, y, w: 4.0, h: 0.35, fontSize: 13, bold: true, color: C.RED, fontFace: 'Arial' });
    const bullets = items.map(item => bullet('  ' + item));
    s.addText(bullets, { x, y: y + 0.38, w: 4.0, h: 1.6, fontFace: 'Arial' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 10 — Métricas de Qualidade
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Métricas de Qualidade');

  // KPI boxes row 1
  kpiBox(s, 0.4,  1.85, '341',  'Testes pytest',          C.RED);
  kpiBox(s, 3.35, 1.85, '99%',  'Taxa de Aprovação CI',   C.GREEN);
  kpiBox(s, 6.3,  1.85, '12',   'Migrações SQL (Flyway-style)', C.BLUE);
  kpiBox(s, 9.25, 1.85, 'A+',   'Security Headers Score', C.DKRED);

  // KPI boxes row 2
  kpiBox(s, 0.4,  3.45, '~150', 'Endpoints Documentados', C.MID);
  kpiBox(s, 3.35, 3.45, 'DW',   'Star Schema 8 tabelas',  C.AMBER);
  kpiBox(s, 6.3,  3.45, 'i18n', '3 Idiomas (PT/ES/EN)',   C.BLUE);
  kpiBox(s, 9.25, 3.45, 'JWT',  'Auth Stateless',         C.GREEN);

  divider(s, 5.05);

  // CI/CD pipeline
  s.addText('Pipeline CI/CD', { x: 0.4, y: 5.15, w: 5, h: 0.35, fontSize: 13, bold: true, color: C.DARK, fontFace: 'Arial' });
  const pipeline = ['Push → GitHub Actions', '→ pytest 341 testes', '→ npm run build', '→ docker cp dist/', '→ nginx reload'];
  pipeline.forEach((step, i) => {
    const x = 0.4 + i * 2.4;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 5.55, w: 2.2, h: 0.65, fill: { color: i === 4 ? C.GREEN : C.LIGHT }, line: { color: i === 4 ? C.GREEN : 'CCCCCC', pt: 1 }, rectRadius: 0.06 });
    s.addText(step, { x, y: 5.55, w: 2.2, h: 0.65, fontSize: 10, color: i === 4 ? C.WHITE : C.DARK, fontFace: 'Arial', align: 'center', valign: 'middle' });
    if (i < 4) s.addText('→', { x: x + 2.25, y: 5.7, w: 0.15, h: 0.35, fontSize: 12, color: C.RED, fontFace: 'Arial' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 11 — Papéis & Permissões
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Papéis & Permissões');

  const roles = [
    { role: 'ADMIN',        color: C.RED,   perms: ['Acesso total ao sistema', 'Gestão de utilizadores e flags', 'Configuração de dados mestres', 'Dashboards e relatórios globais'] },
    { role: 'DIRETOR',      color: C.BLUE,  perms: ['Leitura global de todos os dados', 'Dashboards completos (sem edição)', 'Relatórios de todas as equipas', 'Sem acesso a dados mestres'] },
    { role: 'GERENTE',      color: C.GREEN, perms: ['Gestão de equipas e membros', 'Aprovação de planos de treino', 'Relatórios e exportação Excel', 'Visibilidade da sua equipa'] },
    { role: 'CHEFE_EQUIPE', color: C.AMBER, perms: ['Visibilidade da sua equipa', 'Análise de erros da equipa', 'Aprovação de planos de acção', 'Fichas de aprendizagem'] },
    { role: 'FORMADOR',     color: C.MID,   perms: ['Criar/gerir cursos e lições', 'Gerir planos de formação', 'Rever submissões de desafios', 'Certificados dos seus formandos'] },
    { role: 'USUARIO',      color: '6B7280', perms: ['Acesso a cursos atribuídos', 'Execução de lições e desafios', 'Consulta de progresso pessoal', 'Certificados próprios'] },
  ];

  roles.forEach(({ role, color, perms }, i) => {
    const x = 0.4 + (i % 3) * 4.1;
    const y = i < 3 ? 1.85 : 3.85;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.8, h: 1.75, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 3.8, h: 0.4, fill: { color }, line: { color } });
    s.addText(role, { x, y, w: 3.8, h: 0.4, fontSize: 13, bold: true, color: C.WHITE, fontFace: 'Arial', align: 'center', valign: 'middle' });
    const bullets = perms.map(p => bullet('  ' + p));
    s.addText(bullets, { x: x + 0.1, y: y + 0.42, w: 3.6, h: 1.25, fontFace: 'Arial' });
  });

  divider(s, 5.8);

  // Flags
  s.addText('Flags de permissão adicionais (independentes do role):', { x: 0.4, y: 5.88, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.DARK, fontFace: 'Arial' });
  const flags = ['is_tutor', 'is_liberador', 'is_referente', 'is_formador', 'is_chefe_equipe'];
  flags.forEach((f, i) => tag(s, 0.4 + i * 2.0, 6.22, f, C.BLUE));
  s.addText('— o mesmo utilizador pode ter múltiplas flags activas em simultâneo', {
    x: 0.4, y: 6.58, w: 12, h: 0.3, fontSize: 10, color: C.MID, fontFace: 'Arial', italic: true,
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 12 — Deploy & Operações
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Deploy & Operações');

  // Docker services
  s.addText('Serviços Docker', { x: 0.4, y: 1.85, w: 5, h: 0.35, fontSize: 13, bold: true, color: C.DARK, fontFace: 'Arial' });

  const services = [
    { name: 'tradehub-frontend', desc: 'Nginx + React build (porta 80/443)' },
    { name: 'tradehub-backend',  desc: 'FastAPI uvicorn (porta 8100)' },
    { name: 'tradehub-mysql',    desc: 'MySQL 8.0 (bind 127.0.0.1)' },
  ];
  services.forEach(({ name, desc }, i) => {
    const y = 2.3 + i * 0.75;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y, w: 5.8, h: 0.6, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.06 });
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 0.06, h: 0.6, fill: { color: C.RED }, line: { color: C.RED } });
    s.addText(name, { x: 0.6, y: y+0.04, w: 3, h: 0.3, fontSize: 11, bold: true, color: C.DARK, fontFace: 'Arial' });
    s.addText(desc, { x: 0.6, y: y+0.32, w: 5.5, h: 0.24, fontSize: 9, color: C.MID, fontFace: 'Arial' });
  });

  // Environments
  s.addText('Ambientes', { x: 7.0, y: 1.85, w: 5, h: 0.35, fontSize: 13, bold: true, color: C.DARK, fontFace: 'Arial' });

  const envs = [
    { env: 'DEV',  host: 'localhost:5173', note: 'Vite HMR, hot reload' },
    { env: 'PROD', host: 'portaltradedatahub', note: 'Docker Nginx optimizado' },
  ];
  envs.forEach(({ env, host, note }, i) => {
    const y = 2.3 + i * 0.75;
    s.addShape(pptx.ShapeType.roundRect, { x: 7.0, y, w: 5.8, h: 0.6, fill: { color: env === 'PROD' ? 'FFF0F0' : C.OFFWHT }, line: { color: env === 'PROD' ? C.RED : 'E0E0E0', pt: env === 'PROD' ? 2 : 1 }, rectRadius: 0.06 });
    s.addText(env,  { x: 7.2, y: y+0.04, w: 1, h: 0.3, fontSize: 11, bold: true, color: env === 'PROD' ? C.RED : C.DARK, fontFace: 'Arial' });
    s.addText(host, { x: 8.2, y: y+0.04, w: 4.4, h: 0.3, fontSize: 11, color: C.DARK, fontFace: 'Arial' });
    s.addText(note, { x: 7.2, y: y+0.32, w: 5.5, h: 0.24, fontSize: 9, color: C.MID, fontFace: 'Arial' });
  });

  divider(s, 4.2);

  // Deploy steps
  s.addText('Processo de Deploy (Produção)', { x: 0.4, y: 4.3, w: 8, h: 0.35, fontSize: 13, bold: true, color: C.DARK, fontFace: 'Arial' });

  const steps = [
    '1. npm run build  (React → dist/)',
    '2. docker cp dist/.  tradehub-frontend:/usr/share/nginx/html/',
    '3. nginx -s reload',
    '4. Backend: docker restart tradehub-backend  (aplica migrações automaticamente)',
  ];
  steps.forEach((step, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 4.75 + i * 0.46, w: 12.5, h: 0.38, fill: { color: C.LIGHT }, line: { color: 'DDDDDD', pt: 1 }, rectRadius: 0.05 });
    s.addText(step, { x: 0.6, y: 4.77 + i * 0.46, w: 12.2, h: 0.34, fontSize: 11, color: C.DARK, fontFace: 'Arial', fontFaceCode: true });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 13 — Roadmap
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Roadmap');

  const phases = [
    {
      phase: 'Q2 2026', label: 'Em Progresso',
      color: C.RED,
      items: ['Finalizar E2E Playwright (79 testes)', 'Dashboard Membros completo', 'Export PDF de relatórios', 'Push notifications (SSE)'],
    },
    {
      phase: 'Q3 2026', label: 'Planeado',
      color: C.BLUE,
      items: ['App mobile React Native', 'AI chatbot com RAG', 'Integração LMS externo (SCORM)', 'Multi-tenancy por banco'],
    },
    {
      phase: 'Q4 2026', label: 'Visão',
      color: C.MID,
      items: ['Analytics preditivo (ML)', 'Dashboard real-time WebSocket', 'Certificações digitais (blockchain)', 'API pública v2'],
    },
  ];

  phases.forEach(({ phase, label, color, items }, i) => {
    const x = 0.4 + i * 4.2;

    // Timeline connector
    if (i < 2) {
      s.addShape(pptx.ShapeType.line, { x: x + 3.9, y: 2.1, w: 0.3, h: 0, line: { color: 'CCCCCC', pt: 2 } });
      s.addText('→', { x: x + 4.0, y: 2.0, w: 0.3, h: 0.3, fontSize: 14, color: C.MID, fontFace: 'Arial' });
    }

    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 3.9, h: 4.9, fill: { color: C.OFFWHT }, line: { color: color, pt: 2 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.8, w: 3.9, h: 0.85, fill: { color }, line: { color } });
    s.addText(phase, { x, y: 1.85, w: 3.9, h: 0.45, fontSize: 16, bold: true, color: C.WHITE, fontFace: 'Arial', align: 'center' });
    s.addText(label, { x, y: 2.3,  w: 3.9, h: 0.28, fontSize: 10, color: C.WHITE, fontFace: 'Arial', align: 'center', italic: true });

    const bullets = items.map(item => bullet('  ' + item));
    s.addText(bullets, { x: x + 0.15, y: 2.75, w: 3.6, h: 3.8, fontFace: 'Arial' });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 14 — Próximos Passos
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('CONTENT');
  sectionBar(s, 'Próximos Passos');

  const actions = [
    { icon: '🔬', title: 'Validação Técnica',     owner: 'Equipa Dev',    deadline: 'Abril 2026', desc: 'Completar suite E2E Playwright e atingir 95%+ cobertura de testes de integração.' },
    { icon: '📊', title: 'Revisão de Dados',       owner: 'Equipa Data',   deadline: 'Abril 2026', desc: 'Validar ETL com dados reais de produção. Adicionar métricas DW faltantes.' },
    { icon: '🚀', title: 'Deploy Produção v2',      owner: 'DevOps',        deadline: 'Maio 2026',  desc: 'Migrar para ambiente gerido com HTTPS, backups automáticos e monitoring.' },
    { icon: '📱', title: 'Avaliação Mobile',        owner: 'Product Owner', deadline: 'Q3 2026',    desc: 'Definir scope e prioridade da app React Native vs PWA.' },
  ];

  actions.forEach(({ icon, title, owner, deadline, desc }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 0.4 : 6.8;
    const y = 1.85 + row * 2.3;

    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.1, fill: { color: C.OFFWHT }, line: { color: 'E0E0E0', pt: 1 }, rectRadius: 0.1 });
    s.addText(icon, { x, y: y + 0.1, w: 0.7, h: 0.6, fontSize: 22, fontFace: 'Arial', align: 'center' });
    s.addText(title, { x: x + 0.75, y: y + 0.12, w: 3.5, h: 0.38, fontSize: 14, bold: true, color: C.DARK, fontFace: 'Arial' });
    tag(s, x + 4.4, y + 0.1, deadline, C.RED);
    s.addText(`Owner: ${owner}`, { x: x + 0.75, y: y + 0.52, w: 5.0, h: 0.25, fontSize: 9, color: C.MID, fontFace: 'Arial', italic: true });
    s.addText(desc, { x: x + 0.15, y: y + 0.82, w: 5.6, h: 1.1, fontSize: 11, color: C.MID, fontFace: 'Arial', wrap: true });
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDE 15 — Obrigado / Contacts
══════════════════════════════════════════════════════════════════════════════ */
{
  const s = addSlide('TITLE');

  s.addShape(pptx.ShapeType.rect, { x: 8.5, y: 0, w: 4.83, h: 7.5, fill: { color: C.WHITE }, line: { color: C.WHITE } });
  s.addShape(pptx.ShapeType.rect, { x: 7.8, y: 0, w: 1.0,  h: 7.5, fill: { color: C.OFFWHT }, line: { color: C.OFFWHT } });

  s.addText('Obrigado', {
    x: 0.6, y: 1.8, w: 6.8, h: 1.4,
    fontSize: 56, bold: true, color: C.WHITE, fontFace: 'Arial',
  });

  s.addText('PortalTradeHub + Trade Data Hub', {
    x: 0.6, y: 3.3, w: 6.8, h: 0.55,
    fontSize: 18, color: C.OFFWHT, fontFace: 'Arial',
  });

  s.addText('Gestão integrada de formações, tutoria e dados operacionais\npara equipas de trading.', {
    x: 0.6, y: 4.0, w: 6.8, h: 0.9,
    fontSize: 13, color: 'FFCCCC', fontFace: 'Arial', lineSpacingMultiple: 1.3,
  });

  s.addText('Documento confidencial — Março 2026', {
    x: 0.6, y: 6.9, w: 6.8, h: 0.35,
    fontSize: 9, color: 'FF9999', fontFace: 'Arial',
  });

  // Right side summary stats
  const finalStats = [
    ['5', 'Portais'],
    ['~150', 'Endpoints'],
    ['341', 'Testes'],
    ['8', 'Tabelas DW'],
  ];
  finalStats.forEach(([v, l], i) => {
    const yy = 1.5 + i * 1.4;
    s.addText(v, { x: 9.0, y: yy,        w: 3.5, h: 0.75, fontSize: 34, bold: true, color: C.RED,  fontFace: 'Arial', align: 'center' });
    s.addText(l, { x: 9.0, y: yy + 0.72, w: 3.5, h: 0.35, fontSize: 11, color: C.MID, fontFace: 'Arial', align: 'center' });
  });
}

/* ─── Output ──────────────────────────────────────────────────────────────── */
pptx.writeFile({ fileName: 'Apresentacao_Executiva_PTH_TDH.pptx' })
  .then(() => console.log('OK: Apresentacao_Executiva_PTH_TDH.pptx created (15 slides)'))
  .catch(err => { console.error('ERROR:', err.message); process.exit(1); });
