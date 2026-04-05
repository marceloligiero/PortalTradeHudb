// FASE 4 — Modelo_Dados_PTH_TDH.docx
// node gen_modelo_dados.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  LevelFormat,
} = require('docx');
const fs = require('fs');

const RED    = 'EC0000';
const DARK   = '1A1A1A';
const MID    = '4B4B4B';
const LIGHT  = 'F5F5F5';
const WHITE  = 'FFFFFF';
const BORDER = 'DDDDDD';
const BLUE   = '1E40AF';
const GREEN  = '166534';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function b() { return { style: BorderStyle.SINGLE, size: 1, color: BORDER }; }
function bs() { const x = b(); return { top: x, bottom: x, left: x, right: x }; }
function cell(text, opts = {}) {
  const { fill = WHITE, bold = false, color = DARK, width = 2000, mono = false } = opts;
  return new TableCell({
    borders: bs(), width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold, color, font: mono ? 'Consolas' : 'Arial', size: 19 })] })]
  });
}
function hc(text, width = 2000) { return cell(text, { fill: RED, bold: true, color: WHITE, width }); }
function hcBlue(text, width = 2000) { return cell(text, { fill: '1E3A5F', bold: true, color: WHITE, width }); }

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: RED, font: 'Arial', size: 36 })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: DARK, font: 'Arial', size: 28 })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: MID, font: 'Arial', size: 24 })]
  });
}
function body(text, opts = {}) {
  const { color = DARK, size = 21, bold = false } = opts;
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size, color, bold })]
  });
}
function bullet(text) {
  return new Paragraph({
    spacing: { before: 50, after: 50 },
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color: DARK })]
  });
}
function spacer() { return new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }); }
function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
    spacing: { before: 0, after: 240 }, children: []
  });
}
function pb() { return new Paragraph({ children: [new PageBreak()] }); }
function note(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: `ℹ  ${text}`, font: 'Arial', size: 19, color: '555555', italics: true })]
  });
}

// Build a full table definition with column schema
// cols: [{name, type, nullable, desc, pk, fk}]
function tableSchema(tableName, cols, colWidths = [2400, 2000, 900, 3726]) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: [
          hc('Coluna', colWidths[0]),
          hc('Tipo', colWidths[1]),
          hc('NULL?', colWidths[2]),
          hc('Descrição', colWidths[3]),
        ]
      }),
      ...cols.map(c => new TableRow({
        children: [
          new TableCell({
            borders: bs(), width: { size: colWidths[0], type: WidthType.DXA },
            shading: { fill: c.pk ? 'FFF3CD' : c.fk ? 'EFF6FF' : WHITE, type: ShadingType.CLEAR },
            margins: { top: 70, bottom: 70, left: 120, right: 120 },
            children: [new Paragraph({ children: [
              new TextRun({ text: c.pk ? '🔑 ' : c.fk ? '🔗 ' : '', font: 'Arial', size: 19 }),
              new TextRun({ text: c.name, font: 'Consolas', size: 18, bold: c.pk, color: DARK }),
            ] })]
          }),
          cell(c.type, { width: colWidths[1], mono: true, color: BLUE }),
          cell(c.nullable ? 'SIM' : 'NÃO', { width: colWidths[2], color: c.nullable ? MID : RED }),
          cell(c.desc, { width: colWidths[3] }),
        ]
      }))
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: RED },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: MID },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
          children: [
            new TextRun({ text: 'Trade Data Hub', bold: true, font: 'Arial', size: 18, color: RED }),
            new TextRun({ text: '   |   Modelo de Dados', font: 'Arial', size: 18, color: MID }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER, space: 1 } },
          children: [
            new TextRun({ text: 'Confidencial — Trade Finance · Santander    ', font: 'Arial', size: 16, color: MID }),
            new TextRun({ text: 'Pág. ', font: 'Arial', size: 16, color: MID }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: RED }),
          ]
        })]
      })
    },
    children: [

      // CAPA
      new Paragraph({ spacing: { before: 1600, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'SANTANDER', bold: true, font: 'Arial', size: 72, color: RED })] }),
      new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Trade Finance', font: 'Arial', size: 36, color: MID })] }),
      rule(),
      new Paragraph({ spacing: { before: 400, after: 160 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Modelo de Dados', bold: true, font: 'Arial', size: 52, color: DARK })] }),
      new Paragraph({ spacing: { before: 0, after: 400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'PortalTradeHub + Trade Data Hub', font: 'Arial', size: 32, color: MID })] }),
      new Table({
        width: { size: 7200, type: WidthType.DXA }, alignment: AlignmentType.CENTER,
        columnWidths: [2400, 4800],
        rows: [
          new TableRow({ children: [hc('Versão', 2400), cell('1.0', { width: 4800 })] }),
          new TableRow({ children: [hc('Data', 2400), cell('Março 2026', { width: 4800 })] }),
          new TableRow({ children: [hc('Base de Dados', 2400), cell('MySQL 8.0.39 / utf8mb4_unicode_ci', { width: 4800 })] }),
          new TableRow({ children: [hc('Total de Tabelas', 2400), cell('~42 tabelas operacionais + 7 tabelas DW', { width: 4800 })] }),
        ]
      }),
      pb(),

      // ÍNDICE
      new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-3' }),
      pb(),

      // LEGENDA
      h1('1. Convenções e Legenda'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [1600, 7426],
        rows: [
          new TableRow({ children: [hc('Símbolo', 1600), hc('Significado', 7426)] }),
          new TableRow({ children: [
            new TableCell({ borders: bs(), width: { size: 1600, type: WidthType.DXA },
              shading: { fill: 'FFF3CD', type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: '🔑  PK', font: 'Arial', size: 20, bold: true })] })] }),
            cell('Chave Primária (Primary Key) — coluna id INTEGER AUTO_INCREMENT', { width: 7426 })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders: bs(), width: { size: 1600, type: WidthType.DXA },
              shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: '🔗  FK', font: 'Arial', size: 20, bold: true })] })] }),
            cell('Chave Estrangeira (Foreign Key) — referência a outra tabela', { width: 7426 })
          ] }),
          new TableRow({ children: [
            cell('NULL?', { width: 1600, color: MID }), cell('NÃO = NOT NULL obrigatório | SIM = campo opcional', { width: 7426 })
          ] }),
          new TableRow({ children: [
            cell('server_default', { width: 1600, mono: true, color: BLUE }), cell('Valor calculado pelo servidor MySQL (ex: CURRENT_TIMESTAMP)', { width: 7426 })
          ] }),
        ]
      }),
      spacer(),
      note('Todas as tabelas usam ENGINE=InnoDB com charset utf8mb4 e collation utf8mb4_unicode_ci.'),
      pb(),

      // DIAGRAMA ER TEXTUAL
      h1('2. Diagrama de Relações (Resumo)'),
      body('Grupos de entidades e suas relações principais:', { bold: true }),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [2200, 6826],
        rows: [
          new TableRow({ children: [hc('Grupo', 2200), hc('Relações Principais', 6826)] }),
          new TableRow({ children: [cell('Utilizadores', { width: 2200, bold: true }), cell('users → teams (N:1) | users → users via tutor_id (self-ref) | users → team_members (M2M)', { width: 6826 })] }),
          new TableRow({ children: [cell('Formações', { width: 2200, bold: true }), cell('courses → lessons (1:N) | courses → enrollments → users (M2M) | training_plans → training_plan_courses → courses (M2M)', { width: 6826 })] }),
          new TableRow({ children: [cell('Desafios', { width: 2200, bold: true }), cell('challenges → courses (N:1) | challenge_submissions → challenges (N:1) | challenge_parts/operations → submissions (N:1)', { width: 6826 })] }),
          new TableRow({ children: [cell('Tutoria', { width: 2200, bold: true }), cell('tutoria_errors → tutoria_action_plans (1:N) → tutoria_action_items (1:N) | tutoria_errors → tutoria_learning_sheets (1:1)', { width: 6826 })] }),
          new TableRow({ children: [cell('Erros Internos', { width: 2200, bold: true }), cell('sensos → internal_errors (1:N) → internal_error_action_plans (1:1) → items (1:N)', { width: 6826 })] }),
          new TableRow({ children: [cell('Chamados', { width: 2200, bold: true }), cell('chamados → chamado_comments (1:N)', { width: 6826 })] }),
          new TableRow({ children: [cell('Org. Hierarquia', { width: 2200, bold: true }), cell('org_nodes → org_nodes via parent_id (self-ref) | org_nodes → org_node_members → users (M2M)', { width: 6826 })] }),
          new TableRow({ children: [cell('DW Star Schema', { width: 2200, bold: true }), cell('dw_fact_training → dw_dim_user + dw_dim_course + dw_dim_date | dw_fact_error → dw_dim_error_category + dw_dim_team', { width: 6826 })] }),
        ]
      }),
      pb(),

      // ═══════════ MÓDULO: UTILIZADORES ═══════════
      h1('3. Módulo: Utilizadores e Equipas'),

      h2('3.1 Tabela: users'),
      tableSchema('users', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'Identificador único' },
        { name: 'email', type: 'VARCHAR(255)', nullable: false, desc: 'Email único; usado como login' },
        { name: 'full_name', type: 'VARCHAR(255)', nullable: false, desc: 'Nome completo do utilizador' },
        { name: 'hashed_password', type: 'VARCHAR(255)', nullable: false, desc: 'Hash bcrypt da password' },
        { name: 'role', type: 'VARCHAR(50)', nullable: false, desc: 'ADMIN | MANAGER | TRAINER | TRAINEE | STUDENT' },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, desc: 'Conta activa (soft delete quando False)' },
        { name: 'is_pending', type: 'BOOLEAN', nullable: false, desc: 'Aguarda validação de admin (para TRAINER)' },
        { name: 'is_trainer', type: 'BOOLEAN', nullable: false, desc: 'Pode criar e gerir cursos (Formador)' },
        { name: 'is_tutor', type: 'BOOLEAN', nullable: false, desc: 'Pode fazer tutoria e criar planos de acção' },
        { name: 'is_liberador', type: 'BOOLEAN', nullable: false, desc: 'Pode liberar/aprovar operações' },
        { name: 'is_team_lead', type: 'BOOLEAN', nullable: false, desc: 'Chefe de equipa' },
        { name: 'is_referente', type: 'BOOLEAN', nullable: false, desc: 'Representante do chefe (referente)' },
        { name: 'tutor_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — tutor responsável (auto-referência)' },
        { name: 'team_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → teams.id — equipa principal' },
        { name: 'validated_at', type: 'DATETIME', nullable: true, desc: 'Quando o formador foi aprovado pelo admin' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação (server_default)' },
        { name: 'updated_at', type: 'DATETIME', nullable: true, desc: 'Data da última actualização (onupdate)' },
      ]),
      spacer(),

      h2('3.2 Tabela: teams'),
      tableSchema('teams', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'Identificador único' },
        { name: 'name', type: 'VARCHAR(200)', nullable: false, desc: 'Nome da equipa' },
        { name: 'description', type: 'TEXT', nullable: true, desc: 'Descrição da equipa' },
        { name: 'product_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → products.id (legado — produto principal)' },
        { name: 'department_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → departments.id — departamento' },
        { name: 'manager_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — gestor da equipa' },
        { name: 'node_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → org_nodes.id — nó na hierarquia org.' },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, desc: 'Equipa activa' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
        { name: 'updated_at', type: 'DATETIME', nullable: true, desc: 'Última actualização' },
      ]),
      spacer(),

      h2('3.3 Tabelas de Associação M2M'),
      body('team_members — utilizador ↔ equipa (um utilizador pode pertencer a múltiplas equipas)', { bold: true }),
      tableSchema('team_members', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'team_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → teams.id CASCADE DELETE' },
        { name: 'user_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id CASCADE DELETE' },
        { name: 'role', type: 'VARCHAR(50)', nullable: true, desc: 'Role dentro da equipa (opcional)' },
        { name: 'joined_at', type: 'DATETIME', nullable: false, desc: 'Data de entrada na equipa' },
      ]),
      spacer(),
      body('team_services — equipa ↔ produto/serviço', { bold: true }),
      tableSchema('team_services', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'team_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → teams.id CASCADE DELETE' },
        { name: 'product_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → products.id CASCADE DELETE' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de associação' },
      ]),
      pb(),

      // ═══════════ MÓDULO: DADOS MESTRES ═══════════
      h1('4. Módulo: Dados Mestres'),
      body('Tabelas de referência usadas em todo o sistema para classificação de erros, cursos e planos.'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [hc('Tabela', 3000), hc('Propósito', 6026)] }),
          new TableRow({ children: [cell('banks', { width: 3000, mono: true }), cell('Instituições financeiras (código, nome, país)', { width: 6026 })] }),
          new TableRow({ children: [cell('products', { width: 3000, mono: true }), cell('Serviços/produtos de Trade Finance (código, nome)', { width: 6026 })] }),
          new TableRow({ children: [cell('departments', { width: 3000, mono: true }), cell('Departamentos internos', { width: 6026 })] }),
          new TableRow({ children: [cell('error_impacts', { width: 3000, mono: true }), cell('Tipo de impacto do erro (ALTA/BAIXA com imagem ilustrativa)', { width: 6026 })] }),
          new TableRow({ children: [cell('error_origins', { width: 3000, mono: true }), cell('Origem do erro (Trade_Personas, Trade_Procesos, Terceros...)', { width: 6026 })] }),
          new TableRow({ children: [cell('error_detected_by', { width: 3000, mono: true }), cell('Quem detectou o erro', { width: 6026 })] }),
          new TableRow({ children: [cell('activities', { width: 3000, mono: true }), cell('Actividades/eventos (depende de banco + depto)', { width: 6026 })] }),
          new TableRow({ children: [cell('error_types', { width: 3000, mono: true }), cell('Tipos de erro SWIFT/campo (depende de actividade)', { width: 6026 })] }),
          new TableRow({ children: [cell('tutoria_error_categories', { width: 3000, mono: true }), cell('Hierarquia de categorias de erro (pai/filho, com origem associada)', { width: 6026 })] }),
        ]
      }),
      spacer(),

      h2('4.1 Tabela: banks'),
      tableSchema('banks', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'code', type: 'VARCHAR(10)', nullable: false, desc: 'Código único do banco (ex: BES, CGD)' },
        { name: 'name', type: 'VARCHAR(100)', nullable: false, desc: 'Nome completo da instituição' },
        { name: 'country', type: 'VARCHAR(50)', nullable: false, desc: 'País de origem' },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, desc: 'Banco activo no sistema' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
      ]),
      pb(),

      // ═══════════ MÓDULO: FORMAÇÕES ═══════════
      h1('5. Módulo: Formações'),

      h2('5.1 Tabela: courses'),
      tableSchema('courses', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'title', type: 'VARCHAR(255)', nullable: false, desc: 'Título do curso' },
        { name: 'description', type: 'TEXT', nullable: true, desc: 'Descrição detalhada' },
        { name: 'level', type: 'VARCHAR(20)', nullable: true, desc: 'BEGINNER | INTERMEDIATE | EXPERT' },
        { name: 'course_type', type: 'VARCHAR(30)', nullable: false, desc: 'CURSO | CAPSULA_METODOLOGIA | CAPSULA_FUNCIONALIDADE' },
        { name: 'managed_by_tutor', type: 'BOOLEAN', nullable: false, desc: 'Gerido pelo módulo de tutoria' },
        { name: 'bank_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → banks.id (legado — banco único)' },
        { name: 'product_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → products.id (legado — produto único)' },
        { name: 'created_by', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — criador do curso' },
        { name: 'started_by', type: 'VARCHAR(50)', nullable: true, desc: 'TRAINER | TRAINEE — quem pode iniciar' },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, desc: 'Curso activo' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
      ]),
      spacer(),

      h2('5.2 Tabela: lessons'),
      tableSchema('lessons', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'course_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → courses.id' },
        { name: 'title', type: 'VARCHAR(255)', nullable: false, desc: 'Título da lição' },
        { name: 'description', type: 'TEXT', nullable: true, desc: 'Descrição da lição' },
        { name: 'content', type: 'TEXT', nullable: true, desc: 'Conteúdo HTML da lição' },
        { name: 'lesson_type', type: 'VARCHAR(50)', nullable: false, desc: 'THEORETICAL | PRACTICAL' },
        { name: 'started_by', type: 'VARCHAR(50)', nullable: false, desc: 'TRAINER | TRAINEE — quem inicia' },
        { name: 'order_index', type: 'INTEGER', nullable: false, desc: 'Ordem dentro do curso' },
        { name: 'estimated_minutes', type: 'INTEGER', nullable: false, desc: 'Tempo estimado em minutos (MPU target)' },
        { name: 'video_url', type: 'VARCHAR(500)', nullable: true, desc: 'URL do vídeo de apoio' },
        { name: 'materials_url', type: 'VARCHAR(500)', nullable: true, desc: 'URL dos materiais de estudo' },
      ]),
      spacer(),

      h2('5.3 Tabela: lesson_progress'),
      tableSchema('lesson_progress', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'enrollment_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → enrollments.id' },
        { name: 'lesson_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → lessons.id' },
        { name: 'user_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id (alternativo a enrollment)' },
        { name: 'training_plan_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → training_plans.id (plano associado)' },
        { name: 'is_released', type: 'BOOLEAN', nullable: false, desc: 'Formador liberou esta lição' },
        { name: 'released_by', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — quem liberou' },
        { name: 'released_at', type: 'DATETIME', nullable: true, desc: 'Quando foi liberada' },
        { name: 'started_at', type: 'DATETIME', nullable: true, desc: 'Quando formando iniciou' },
        { name: 'completed_at', type: 'DATETIME', nullable: true, desc: 'Quando formando concluiu' },
        { name: 'paused_at', type: 'DATETIME', nullable: true, desc: 'Momento actual de pausa (se pausado)' },
        { name: 'accumulated_seconds', type: 'INTEGER', nullable: false, desc: 'Total de segundos acumulados (multi-pausa)' },
        { name: 'actual_time_minutes', type: 'INTEGER', nullable: true, desc: 'Tempo real em minutos' },
        { name: 'mpu', type: 'FLOAT', nullable: true, desc: 'Minutos por operação calculado' },
        { name: 'mpu_percentage', type: 'FLOAT', nullable: true, desc: 'MPU como % do target' },
        { name: 'is_approved', type: 'BOOLEAN', nullable: false, desc: 'Formador aprovou a lição' },
        { name: 'is_paused', type: 'BOOLEAN', nullable: false, desc: 'Lição está actualmente pausada' },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, desc: 'NOT_STARTED | RELEASED | IN_PROGRESS | PAUSED | COMPLETED' },
        { name: 'student_confirmed', type: 'BOOLEAN', nullable: false, desc: 'Formando confirmou execução' },
        { name: 'finished_by', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — formador que finalizou' },
      ]),
      spacer(),

      h2('5.4 Tabela: enrollments'),
      tableSchema('enrollments', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'user_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — aluno matriculado' },
        { name: 'course_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → courses.id — curso' },
        { name: 'enrolled_at', type: 'DATETIME', nullable: false, desc: 'Data de matrícula' },
        { name: 'completed_at', type: 'DATETIME', nullable: true, desc: 'Data de conclusão' },
      ]),
      spacer(),

      h2('5.5 Tabela: training_plans'),
      tableSchema('training_plans', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'title', type: 'VARCHAR(255)', nullable: false, desc: 'Título do plano de formação' },
        { name: 'description', type: 'TEXT', nullable: true, desc: 'Descrição' },
        { name: 'created_by', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — quem criou' },
        { name: 'trainer_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — formador principal' },
        { name: 'student_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — aluno (1 por plano)' },
        { name: 'start_date', type: 'DATETIME', nullable: true, desc: 'Data de início do plano' },
        { name: 'end_date', type: 'DATETIME', nullable: true, desc: 'Data limite do plano' },
        { name: 'is_permanent', type: 'BOOLEAN', nullable: false, desc: 'Plano permanente (renova anualmente)' },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, desc: 'Plano activo' },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, desc: 'PENDING | IN_PROGRESS | COMPLETED | DELAYED' },
        { name: 'completed_at', type: 'DATETIME', nullable: true, desc: 'Quando foi finalizado' },
        { name: 'finalized_by', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — quem finalizou' },
      ]),
      pb(),

      // DESAFIOS
      h1('6. Módulo: Desafios'),

      h2('6.1 Tabela: challenges'),
      tableSchema('challenges', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'course_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → courses.id' },
        { name: 'title', type: 'VARCHAR(255)', nullable: false, desc: 'Título do desafio' },
        { name: 'difficulty', type: 'VARCHAR(20)', nullable: false, desc: 'easy | medium | hard' },
        { name: 'challenge_type', type: 'VARCHAR(50)', nullable: false, desc: 'COMPLETE (linha a linha) | SUMMARY (resumido)' },
        { name: 'operations_required', type: 'INTEGER', nullable: false, desc: 'Meta de operações a executar' },
        { name: 'time_limit_minutes', type: 'INTEGER', nullable: false, desc: 'Meta de tempo em minutos' },
        { name: 'target_mpu', type: 'FLOAT', nullable: false, desc: 'MPU alvo para aprovação automática' },
        { name: 'max_errors', type: 'INTEGER', nullable: false, desc: 'Máximo de operações com erro permitidas' },
        { name: 'use_volume_kpi', type: 'BOOLEAN', nullable: false, desc: 'Volume de operações é critério de aprovação' },
        { name: 'use_mpu_kpi', type: 'BOOLEAN', nullable: false, desc: 'MPU é critério de aprovação' },
        { name: 'use_errors_kpi', type: 'BOOLEAN', nullable: false, desc: 'Nº de erros é critério de aprovação' },
        { name: 'kpi_mode', type: 'VARCHAR(20)', nullable: false, desc: 'AUTO (automático) | MANUAL (formador decide)' },
        { name: 'allow_retry', type: 'BOOLEAN', nullable: false, desc: 'Permite nova tentativa após reprovação' },
        { name: 'is_released', type: 'BOOLEAN', nullable: false, desc: 'Desafio liberado para formandos' },
        { name: 'created_by', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — criador' },
      ]),
      spacer(),

      h2('6.2 Tabela: challenge_submissions'),
      tableSchema('challenge_submissions', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'challenge_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → challenges.id' },
        { name: 'user_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — formando' },
        { name: 'training_plan_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → training_plans.id (opcional)' },
        { name: 'submission_type', type: 'VARCHAR(50)', nullable: false, desc: 'COMPLETE | SUMMARY' },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, desc: 'IN_PROGRESS | PENDING_REVIEW | REVIEWED | APPROVED | REJECTED' },
        { name: 'total_operations', type: 'INTEGER', nullable: true, desc: 'Total de operações (SUMMARY)' },
        { name: 'total_time_minutes', type: 'INTEGER', nullable: true, desc: 'Tempo total (SUMMARY)' },
        { name: 'errors_count', type: 'INTEGER', nullable: false, desc: 'Operações com erro' },
        { name: 'error_methodology', type: 'INTEGER', nullable: false, desc: 'Erros de Metodologia' },
        { name: 'error_knowledge', type: 'INTEGER', nullable: false, desc: 'Erros de Conhecimento' },
        { name: 'error_detail', type: 'INTEGER', nullable: false, desc: 'Erros de Detalhe' },
        { name: 'error_procedure', type: 'INTEGER', nullable: false, desc: 'Erros de Procedimento' },
        { name: 'calculated_mpu', type: 'FLOAT', nullable: true, desc: 'MPU calculado (tempo / operações)' },
        { name: 'mpu_vs_target', type: 'FLOAT', nullable: true, desc: '% de target_mpu/calculado_mpu' },
        { name: 'is_approved', type: 'BOOLEAN', nullable: true, desc: 'NULL = pendente | True = aprovado | False = reprovado' },
        { name: 'score', type: 'FLOAT', nullable: true, desc: 'Nota calculada' },
        { name: 'feedback', type: 'TEXT', nullable: true, desc: 'Feedback do formador' },
        { name: 'retry_count', type: 'INTEGER', nullable: false, desc: 'Número de tentativas realizadas' },
      ]),
      pb(),

      // TUTORIA
      h1('7. Módulo: Tutoria'),

      h2('7.1 Tabela: tutoria_errors'),
      tableSchema('tutoria_errors', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'date_occurrence', type: 'DATE', nullable: false, desc: 'Fecha Error — data em que ocorreu o erro' },
        { name: 'date_detection', type: 'DATE', nullable: true, desc: 'Fch Detección — data de detecção' },
        { name: 'date_solution', type: 'DATE', nullable: true, desc: 'Fch Solución — data de resolução' },
        { name: 'bank_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → banks.id — banco cliente' },
        { name: 'office', type: 'VARCHAR(100)', nullable: true, desc: 'Oficina / sucursal' },
        { name: 'reference_code', type: 'VARCHAR(200)', nullable: true, desc: 'Referência da transacção' },
        { name: 'currency', type: 'VARCHAR(10)', nullable: true, desc: 'Divisa da transacção' },
        { name: 'amount', type: 'FLOAT', nullable: true, desc: 'Importe (montante da operação)' },
        { name: 'final_client', type: 'VARCHAR(200)', nullable: true, desc: 'Cliente final da operação' },
        { name: 'impact_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → error_impacts.id' },
        { name: 'origin_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → error_origins.id' },
        { name: 'category_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → tutoria_error_categories.id — Tipología' },
        { name: 'detected_by_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → error_detected_by.id' },
        { name: 'department_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → departments.id' },
        { name: 'activity_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → activities.id — Actividad' },
        { name: 'error_type_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → error_types.id — Tipo Error' },
        { name: 'tutorado_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — quem cometeu o erro (Grabador)' },
        { name: 'created_by_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — quem registou' },
        { name: 'approver_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — Liberador' },
        { name: 'description', type: 'TEXT', nullable: false, desc: 'Descripción incidencia' },
        { name: 'solution', type: 'TEXT', nullable: true, desc: 'Solución documentada' },
        { name: 'impact_level', type: 'VARCHAR(20)', nullable: true, desc: 'ALTA | BAIXA' },
        { name: 'severity', type: 'VARCHAR(20)', nullable: false, desc: 'BAIXA | MEDIA | ALTA | CRITICA' },
        { name: 'status', type: 'VARCHAR(30)', nullable: false, desc: 'REGISTERED | IN_ANALYSIS | PLAN_CREATED | IN_PROGRESS | RESOLVED | CANCELLED' },
        { name: 'is_recurrent', type: 'BOOLEAN', nullable: false, desc: 'Erro recorrente' },
        { name: 'recurrence_count', type: 'INTEGER', nullable: false, desc: 'Contagem de recorrências' },
        { name: 'analysis_5_why', type: 'TEXT', nullable: true, desc: 'Análise dos 5 Porquês' },
        { name: 'tags', type: 'JSON', nullable: true, desc: 'Tags para categorização livre' },
        { name: 'excel_sent', type: 'BOOLEAN', nullable: false, desc: 'Dados enviados para Excel de reporte' },
      ], [2400, 2000, 700, 3926]),
      spacer(),

      h2('7.2 Tabela: tutoria_action_plans (Planos 5W2H)'),
      tableSchema('tutoria_action_plans', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'error_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → tutoria_errors.id (nulo para side-by-side)' },
        { name: 'created_by_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — criador (tutor/admin)' },
        { name: 'tutorado_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — formando alvo' },
        { name: 'analysis_5_why', type: 'TEXT', nullable: true, desc: 'Análise de causa raiz (5 Porquês)' },
        { name: 'immediate_correction', type: 'TEXT', nullable: true, desc: 'Acção correctiva imediata' },
        { name: 'what', type: 'TEXT', nullable: true, desc: '5W2H — O quê' },
        { name: 'why', type: 'TEXT', nullable: true, desc: '5W2H — Porquê' },
        { name: 'where_field', type: 'TEXT', nullable: true, desc: '5W2H — Onde' },
        { name: 'when_deadline', type: 'DATE', nullable: true, desc: '5W2H — Quando' },
        { name: 'who', type: 'TEXT', nullable: true, desc: '5W2H — Quem' },
        { name: 'how', type: 'TEXT', nullable: true, desc: '5W2H — Como' },
        { name: 'how_much', type: 'TEXT', nullable: true, desc: '5W2H — Quanto custa' },
        { name: 'plan_type', type: 'VARCHAR(20)', nullable: true, desc: 'CORRECTIVO | PREVENTIVO | MELHORIA | SEGUIMENTO' },
        { name: 'responsible_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — responsável pelo plano' },
        { name: 'deadline', type: 'DATE', nullable: true, desc: 'Prazo final do plano' },
        { name: 'status', type: 'VARCHAR(30)', nullable: false, desc: 'OPEN | IN_PROGRESS | DONE | RASCUNHO | AGUARDANDO_APROVACAO | APROVADO | CONCLUIDO | DEVOLVIDO' },
        { name: 'side_by_side', type: 'BOOLEAN', nullable: false, desc: 'É uma sessão de acompanhamento presencial' },
        { name: 'approved_by_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — quem aprovou' },
        { name: 'validated_by_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — quem validou' },
      ]),
      pb(),

      // CHAMADOS
      h1('8. Módulo: Chamados (Support Kanban)'),

      h2('8.1 Tabela: chamados'),
      tableSchema('chamados', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'title', type: 'VARCHAR(300)', nullable: false, desc: 'Título do ticket' },
        { name: 'description', type: 'TEXT', nullable: false, desc: 'Descrição detalhada do problema/pedido' },
        { name: 'type', type: 'VARCHAR(20)', nullable: false, desc: 'BUG | MELHORIA | FEATURE | MAINTENANCE' },
        { name: 'priority', type: 'VARCHAR(20)', nullable: false, desc: 'BAIXA | MEDIA | ALTA | CRITICA' },
        { name: 'status', type: 'VARCHAR(30)', nullable: false, desc: 'ABERTO | EM_ANDAMENTO | EM_REVISAO | CONCLUIDO' },
        { name: 'portal', type: 'VARCHAR(30)', nullable: false, desc: 'FORMACOES | TUTORIA | RELATORIOS | DADOS_MESTRES | GERAL' },
        { name: 'created_by_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — quem criou' },
        { name: 'assigned_to_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id — responsável pela resolução' },
        { name: 'admin_notes', type: 'TEXT', nullable: true, desc: 'Notas internas do admin' },
        { name: 'attachments', type: 'JSON', nullable: true, desc: 'Lista de screenshots em base64' },
        { name: 'completed_at', type: 'DATETIME', nullable: true, desc: 'Data de conclusão' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
      ]),
      spacer(),

      h2('8.2 Tabela: chamado_comments'),
      tableSchema('chamado_comments', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'chamado_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → chamados.id CASCADE DELETE' },
        { name: 'author_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — autor do comentário' },
        { name: 'content', type: 'TEXT', nullable: false, desc: 'Conteúdo do comentário' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
      ]),
      pb(),

      // DW STAR SCHEMA
      h1('9. Data Warehouse — Star Schema'),
      body('O DW é populado pelo pipeline ETL e serve os dashboards analíticos. Tabelas prefixadas com dw_.'),
      spacer(),
      note('As tabelas DW não têm foreign keys para as tabelas operacionais — são intencionalmente desacopladas para suportar alterações de schema sem impacto nos relatórios históricos.'),
      spacer(),

      h2('9.1 Tabelas de Dimensão'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [hcBlue('Tabela DW', 3000), hcBlue('Conteúdo e Indexação', 6026)] }),
          new TableRow({ children: [cell('dw_dim_date', { width: 3000, mono: true }), cell('Calendário: date_key (YYYYMMDD), year, quarter, month, week, day_of_week, is_weekend, year_month. Índices: year_month, year, full_date', { width: 6026 })] }),
          new TableRow({ children: [cell('dw_dim_user', { width: 3000, mono: true }), cell('Utilizador: user_id, email, full_name, role, team_name, team_id, is_active, is_trainer, is_tutor. UNIQUE KEY uk_dw_user(user_id)', { width: 6026 })] }),
          new TableRow({ children: [cell('dw_dim_course', { width: 3000, mono: true }), cell('Curso: course_id, title, level, total_lessons, total_challenges, trainer_name. UNIQUE KEY uk_dw_course(course_id)', { width: 6026 })] }),
          new TableRow({ children: [cell('dw_dim_team', { width: 3000, mono: true }), cell('Equipa: team_id, name, manager_name, total_members. UNIQUE KEY uk_dw_team(team_id)', { width: 6026 })] }),
          new TableRow({ children: [cell('dw_dim_error_category', { width: 3000, mono: true }), cell('Categoria de erro: category_id, name, parent_name. UNIQUE KEY uk_dw_error_cat(category_id)', { width: 6026 })] }),
          new TableRow({ children: [cell('dw_dim_status', { width: 3000, mono: true }), cell('Estados de domínio: domain + status_code + status_label. UNIQUE KEY uk_dw_status(domain, status_code)', { width: 6026 })] }),
        ]
      }),
      spacer(),

      h2('9.2 Tabela de Factos: dw_fact_training'),
      tableSchema('dw_fact_training', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK AUTO_INCREMENT' },
        { name: 'date_key', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → dw_dim_date.date_key' },
        { name: 'user_key', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → dw_dim_user.user_key' },
        { name: 'course_key', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → dw_dim_course.course_key' },
        { name: 'certificate_id', type: 'INTEGER', nullable: true, desc: 'Referência ao certificado emitido' },
        { name: 'training_plan_id', type: 'INTEGER', nullable: true, desc: 'Referência ao plano de formação' },
        { name: 'days_to_complete', type: 'INTEGER', nullable: true, desc: 'Dias até conclusão do plano' },
        { name: 'total_hours', type: 'FLOAT', nullable: false, desc: 'Total de horas de formação' },
        { name: 'courses_completed', type: 'INTEGER', nullable: false, desc: 'Cursos concluídos' },
        { name: 'average_mpu', type: 'FLOAT', nullable: false, desc: 'MPU médio do utilizador' },
        { name: 'average_approval_rate', type: 'FLOAT', nullable: false, desc: 'Taxa de aprovação média' },
      ]),
      spacer(),

      h2('9.3 Tabela de Factos: dw_fact_error (tutoria)'),
      tableSchema('dw_fact_error', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK AUTO_INCREMENT' },
        { name: 'date_key', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → dw_dim_date.date_key (data de ocorrência)' },
        { name: 'user_key', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → dw_dim_user.user_key (tutorado)' },
        { name: 'category_key', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → dw_dim_error_category.category_key' },
        { name: 'team_key', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → dw_dim_team.team_key' },
        { name: 'error_id', type: 'INTEGER', nullable: false, desc: 'Referência ao erro operacional (tutoria_errors.id)' },
        { name: 'severity', type: 'VARCHAR(20)', nullable: false, desc: 'BAIXA | MEDIA | ALTA | CRITICA' },
        { name: 'status', type: 'VARCHAR(30)', nullable: false, desc: 'Estado no momento do snapshot' },
        { name: 'is_resolved', type: 'BOOLEAN', nullable: false, desc: 'Erro resolvido (status=RESOLVED)' },
        { name: 'is_recurrent', type: 'BOOLEAN', nullable: false, desc: 'Erro recorrente' },
        { name: 'days_to_resolve', type: 'INTEGER', nullable: true, desc: 'Dias entre ocorrência e resolução' },
      ]),
      pb(),

      // OUTROS
      h1('10. Outros Módulos'),

      h2('10.1 Tabela: certificates'),
      tableSchema('certificates', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'user_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id' },
        { name: 'training_plan_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → training_plans.id' },
        { name: 'certificate_number', type: 'VARCHAR(50)', nullable: false, desc: 'Número único do certificado (formato PTH-YYYYMM-NNNNN)' },
        { name: 'issued_at', type: 'DATETIME', nullable: false, desc: 'Data de emissão' },
        { name: 'student_name', type: 'VARCHAR(255)', nullable: false, desc: 'Nome do formando no momento da emissão' },
        { name: 'training_plan_title', type: 'VARCHAR(255)', nullable: false, desc: 'Título do plano no momento da emissão' },
        { name: 'total_hours', type: 'FLOAT', nullable: false, desc: 'Total de horas de formação' },
        { name: 'average_mpu', type: 'FLOAT', nullable: false, desc: 'MPU médio final' },
        { name: 'average_approval_rate', type: 'FLOAT', nullable: false, desc: 'Taxa de aprovação final' },
        { name: 'is_valid', type: 'BOOLEAN', nullable: false, desc: 'Certificado válido (pode ser revogado)' },
        { name: 'revoked_at', type: 'DATETIME', nullable: true, desc: 'Data de revogação (se aplicável)' },
      ]),
      spacer(),

      h2('10.2 Tabela: ratings'),
      tableSchema('ratings', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'user_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id — formando que avaliou' },
        { name: 'rating_type', type: 'VARCHAR(50)', nullable: false, desc: 'COURSE | LESSON | CHALLENGE | TRAINER | TRAINING_PLAN' },
        { name: 'course_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → courses.id (se tipo=COURSE)' },
        { name: 'lesson_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → lessons.id (se tipo=LESSON)' },
        { name: 'challenge_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → challenges.id (se tipo=CHALLENGE)' },
        { name: 'trainer_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → users.id (se tipo=TRAINER)' },
        { name: 'training_plan_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → training_plans.id (se tipo=PLAN)' },
        { name: 'stars', type: 'INTEGER', nullable: false, desc: '0 a 5 estrelas' },
        { name: 'comment', type: 'TEXT', nullable: true, desc: 'Comentário opcional' },
      ]),
      spacer(),

      h2('10.3 Tabela: org_nodes (Hierarquia Organizacional)'),
      tableSchema('org_nodes', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'name', type: 'VARCHAR(200)', nullable: false, desc: 'Nome do nó (departamento / divisão)' },
        { name: 'description', type: 'TEXT', nullable: true, desc: 'Descrição do nó' },
        { name: 'parent_id', type: 'INTEGER', nullable: true, fk: true, desc: 'FK → org_nodes.id (auto-referência — pai na hierarquia)' },
        { name: 'node_type', type: 'VARCHAR(50)', nullable: true, desc: 'DIVISION | DEPARTMENT | TEAM | OTHER' },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, desc: 'Nó activo' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
      ]),
      spacer(),

      h2('10.4 Tabela: password_reset_tokens'),
      tableSchema('password_reset_tokens', [
        { name: 'id', type: 'INTEGER', nullable: false, pk: true, desc: 'PK' },
        { name: 'user_id', type: 'INTEGER', nullable: false, fk: true, desc: 'FK → users.id' },
        { name: 'token', type: 'VARCHAR(255)', nullable: false, desc: 'Token UUID único; indexado' },
        { name: 'expires_at', type: 'DATETIME', nullable: false, desc: 'Expiração do token (1 hora)' },
        { name: 'used', type: 'BOOLEAN', nullable: false, desc: 'Token já foi utilizado' },
        { name: 'created_at', type: 'DATETIME', nullable: false, desc: 'Data de criação' },
      ]),
      pb(),

      // ÍNDICES E OPTIMIZAÇÃO
      h1('11. Índices e Optimização'),
      body('Índices principais configurados nas tabelas de maior volume:'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 2500, 3526],
        rows: [
          new TableRow({ children: [hc('Tabela', 3000), hc('Coluna(s) Indexada(s)', 2500), hc('Motivo', 3526)] }),
          new TableRow({ children: [cell('users', { width: 3000, mono: true }), cell('email (UNIQUE)', { width: 2500, mono: true }), cell('Login e lookup por email', { width: 3526 })] }),
          new TableRow({ children: [cell('lesson_progress', { width: 3000, mono: true }), cell('enrollment_id, lesson_id, user_id', { width: 2500, mono: true }), cell('Queries de estado de lição (alta frequência)', { width: 3526 })] }),
          new TableRow({ children: [cell('tutoria_errors', { width: 3000, mono: true }), cell('status, tutorado_id, category_id', { width: 2500, mono: true }), cell('Filtros dos dashboards de tutoria', { width: 3526 })] }),
          new TableRow({ children: [cell('challenge_submissions', { width: 3000, mono: true }), cell('challenge_id, user_id, status', { width: 2500, mono: true }), cell('Revisão de submissões pelo formador', { width: 3526 })] }),
          new TableRow({ children: [cell('dw_dim_date', { width: 3000, mono: true }), cell('year_month, year, full_date', { width: 2500, mono: true }), cell('Queries de série temporal nos dashboards', { width: 3526 })] }),
          new TableRow({ children: [cell('dw_fact_training', { width: 3000, mono: true }), cell('date_key, user_key, course_key', { width: 2500, mono: true }), cell('Joins nas queries DW', { width: 3526 })] }),
          new TableRow({ children: [cell('dw_fact_error', { width: 3000, mono: true }), cell('date_key, user_key, category_key', { width: 2500, mono: true }), cell('Queries de análise de erros no DW', { width: 3526 })] }),
          new TableRow({ children: [cell('password_reset_tokens', { width: 3000, mono: true }), cell('token (UNIQUE)', { width: 2500, mono: true }), cell('Verificação de token em reset de password', { width: 3526 })] }),
        ]
      }),
      spacer(),
      note('O MySQL 8.0 com InnoDB usa Buffer Pool de 512MB (configurado no docker-compose). Para ambientes de produção com carga elevada, recomenda-se aumentar para 1-2GB e activar query cache.'),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Modelo_Dados_PTH_TDH.docx', buffer);
  console.log('OK: Modelo_Dados_PTH_TDH.docx created');
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
