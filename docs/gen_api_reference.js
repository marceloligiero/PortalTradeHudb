// FASE 3 — Referencia_API_PTH_TDH.docx
// node gen_api_reference.js

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
const GREEN  = '1A7340';
const BLUE   = '0057A8';
const ORANGE = 'C05800';
const PURPLE = '6B21A8';
const BORDER = 'DDDDDD';

function border() { return { style: BorderStyle.SINGLE, size: 1, color: BORDER }; }
function borders() { const b = border(); return { top: b, bottom: b, left: b, right: b }; }
function cell(text, opts = {}) {
  const { fill=WHITE, bold=false, color=DARK, width=2340 } = opts;
  return new TableCell({
    borders: borders(), width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold, color, font: 'Arial', size: 19 })] })]
  });
}
function headerCell(text, width=2340) { return cell(text, { fill: RED, bold: true, color: WHITE, width }); }

const methodColors = { GET: GREEN, POST: BLUE, PUT: ORANGE, PATCH: ORANGE, DELETE: 'CC0000' };
function methodCell(method) {
  const color = methodColors[method] || DARK;
  return new TableCell({
    borders: borders(), width: { size: 900, type: WidthType.DXA },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: method, bold: true, color, font: 'Consolas', size: 18 })]
    })]
  });
}
function pathCell(path, width=4500) {
  return new TableCell({
    borders: borders(), width: { size: width, type: WidthType.DXA },
    shading: { fill: LIGHT, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: path, font: 'Consolas', size: 18, color: DARK })] })]
  });
}
function descCell(text, width=3626) {
  return new TableCell({
    borders: borders(), width: { size: width, type: WidthType.DXA },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 18, color: MID })] })]
  });
}
function authCell(roles, width=1800) {
  const color = roles.includes('ADMIN') && roles.length === 1 ? RED : roles === 'Todos' ? GREEN : DARK;
  return new TableCell({
    borders: borders(), width: { size: width, type: WidthType.DXA },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: roles, font: 'Arial', size: 17, color, bold: roles === 'Todos' })] })]
  });
}
function routeRow(method, path, desc, auth, pathWidth=4500, descWidth=3626) {
  return new TableRow({ children: [methodCell(method), pathCell(path, pathWidth), descCell(desc, descWidth), authCell(auth)] });
}
function routeHeader(pathWidth=4500, descWidth=3626) {
  return new TableRow({ children: [headerCell('Método', 900), headerCell('Endpoint', pathWidth), headerCell('Descrição', descWidth), headerCell('Roles', 1800)] });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, pageBreakBefore: false,
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
function body(text, opts={}) {
  const { color=DARK, size=21, bold=false } = opts;
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size, color, bold })]
  });
}
function spacer() { return new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }); }
function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
    spacing: { before: 0, after: 240 }, children: []
  });
}
function note(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: `ℹ  ${text}`, font: 'Arial', size: 19, color: '555555', italics: true })]
  });
}
function routeTable(rows) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [900, 4500, 3626],
    rows
  });
}
function routeTableFull(rows) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [900, 4500, 1826, 1800],
    rows
  });
}

function makeRouteTable(entries) {
  // entries: [{method, path, desc, auth}]
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [900, 4200, 2126, 1800],
    rows: [
      new TableRow({ children: [headerCell('Método', 900), headerCell('Endpoint', 4200), headerCell('Descrição', 2126), headerCell('Roles', 1800)] }),
      ...entries.map(e => new TableRow({ children: [methodCell(e.method), pathCell(e.path, 4200), descCell(e.desc, 2126), authCell(e.auth)] }))
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
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 15840, height: 11906 }, // A4 landscape
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
          children: [
            new TextRun({ text: 'Trade Data Hub API', bold: true, font: 'Arial', size: 18, color: RED }),
            new TextRun({ text: '   |   Referência de Endpoints', font: 'Arial', size: 18, color: MID }),
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
        children: [new TextRun({ text: 'Referência da API REST', bold: true, font: 'Arial', size: 52, color: DARK })] }),
      new Paragraph({ spacing: { before: 0, after: 400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Trade Data Hub — v1.0', font: 'Arial', size: 32, color: MID })] }),
      new Table({
        width: { size: 7200, type: WidthType.DXA }, alignment: AlignmentType.CENTER,
        columnWidths: [2400, 4800],
        rows: [
          new TableRow({ children: [headerCell('Base URL', 2400), cell('https://api.portaltradedatahub.com/api', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Autenticação', 2400), cell('Bearer JWT (Authorization: Bearer <token>)', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Formato', 2400), cell('application/json (req + resp)', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Versão', 2400), cell('1.0   |   Março 2026', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Rate Limit', 2400), cell('60 req/min por IP (default)', { width: 4800 })] }),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ÍNDICE
      new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }),
      new Paragraph({ children: [new PageBreak()] }),

      // CONVENÇÕES
      h1('1. Convenções'),
      body('Todos os endpoints requerem autenticação JWT via header Authorization: Bearer <token>, excepto os assinalados como Público.'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [1800, 7226],
        rows: [
          new TableRow({ children: [headerCell('Legenda', 1800), headerCell('Significado', 7226)] }),
          new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 1800, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'GET', bold: true, color: GREEN, font: 'Consolas', size: 19 })] })] }),
            cell('Leitura de dados; idempotente; sem side-effects', { width: 7226 })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 1800, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'POST', bold: true, color: BLUE, font: 'Consolas', size: 19 })] })] }),
            cell('Criação de recursos', { width: 7226 })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 1800, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PATCH', bold: true, color: ORANGE, font: 'Consolas', size: 19 })] })] }),
            cell('Actualização parcial de recursos', { width: 7226 })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 1800, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DELETE', bold: true, color: 'CC0000', font: 'Consolas', size: 19 })] })] }),
            cell('Remoção de recursos', { width: 7226 })
          ] }),
        ]
      }),
      spacer(),
      body('Respostas de erro seguem o formato: {"detail": "mensagem de erro"}'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [1600, 7426],
        rows: [
          new TableRow({ children: [headerCell('HTTP Status', 1600), headerCell('Significado', 7426)] }),
          new TableRow({ children: [cell('200 OK', { width: 1600 }), cell('Sucesso (GET, PATCH, DELETE)', { width: 7426 })] }),
          new TableRow({ children: [cell('201 Created', { width: 1600 }), cell('Recurso criado com sucesso (POST)', { width: 7426 })] }),
          new TableRow({ children: [cell('400 Bad Request', { width: 1600 }), cell('Dados inválidos ou regra de negócio violada', { width: 7426 })] }),
          new TableRow({ children: [cell('401 Unauthorized', { width: 1600 }), cell('Token ausente, expirado ou inválido', { width: 7426 })] }),
          new TableRow({ children: [cell('403 Forbidden', { width: 1600 }), cell('Autenticado mas sem permissão para a operação', { width: 7426 })] }),
          new TableRow({ children: [cell('404 Not Found', { width: 1600 }), cell('Recurso não encontrado', { width: 7426 })] }),
          new TableRow({ children: [cell('429 Too Many Requests', { width: 1600 }), cell('Rate limit excedido (60 req/min)', { width: 7426 })] }),
          new TableRow({ children: [cell('500 Internal Server Error', { width: 1600 }), cell('Erro não esperado no servidor', { width: 7426 })] }),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // AUTH
      h1('2. Autenticação (/api/auth)'),
      note('Os endpoints de autenticação não requerem token JWT.'),
      spacer(),
      makeRouteTable([
        { method: 'POST', path: '/api/auth/login', desc: 'Login com email + password. Devolve JWT access token e dados do utilizador.', auth: 'Público' },
        { method: 'POST', path: '/api/auth/register', desc: 'Registo de novo utilizador (role TRAINEE por defeito). Cria conta pendente de activação.', auth: 'Público' },
        { method: 'GET',  path: '/api/auth/me', desc: 'Devolve perfil completo do utilizador autenticado (role, flags, team_id).', auth: 'Todos' },
        { method: 'POST', path: '/api/forgot-password', desc: 'Envia email de recuperação de password com token de 1h.', auth: 'Público' },
        { method: 'POST', path: '/api/reset-password', desc: 'Redefine password usando token recebido por email.', auth: 'Público' },
      ]),
      spacer(),
      h2('Request — POST /api/auth/login'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [2000, 2000, 5026],
        rows: [
          new TableRow({ children: [headerCell('Campo', 2000), headerCell('Tipo', 2000), headerCell('Descrição', 5026)] }),
          new TableRow({ children: [cell('email', { width: 2000 }), cell('string', { width: 2000 }), cell('Email registado', { width: 5026 })] }),
          new TableRow({ children: [cell('password', { width: 2000 }), cell('string', { width: 2000 }), cell('Password em texto plano (transportada em HTTPS)', { width: 5026 })] }),
        ]
      }),
      spacer(),
      h2('Response — POST /api/auth/login'),
      body('{"access_token": "eyJ...", "token_type": "bearer", "user": {"id": 1, "email": "...", "role": "TRAINER", "is_tutor": true, ...}}', { color: '444444', size: 18 }),
      new Paragraph({ children: [new PageBreak()] }),

      // ADMIN
      h1('3. Gestão de Utilizadores (/api/admin)'),
      makeRouteTable([
        { method: 'GET',    path: '/api/admin/users', desc: 'Lista utilizadores com paginação e filtros (?role=, ?search=, ?is_active=)', auth: 'ADMIN, MANAGER' },
        { method: 'POST',   path: '/api/admin/users', desc: 'Cria novo utilizador com qualquer role', auth: 'ADMIN' },
        { method: 'GET',    path: '/api/admin/users/{user_id}', desc: 'Detalhes completos de um utilizador', auth: 'ADMIN' },
        { method: 'PUT',    path: '/api/admin/users/{user_id}', desc: 'Actualiza dados de utilizador (role, flags, team)', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/admin/users/{user_id}', desc: 'Remove utilizador (soft delete — is_active=False)', auth: 'ADMIN' },
        { method: 'GET',    path: '/api/users/unassigned', desc: 'Lista utilizadores sem equipa atribuída', auth: 'ADMIN' },
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // STUDENT
      h1('4. Portal do Estudante (/api/student)'),
      makeRouteTable([
        { method: 'GET', path: '/api/student/stats', desc: 'KPIs do dashboard do estudante: matrículas, planos, certificados, MPU, submissões', auth: 'TRAINEE, STUDENT' },
        { method: 'GET', path: '/api/student/courses', desc: 'Cursos em que o estudante está matriculado', auth: 'TRAINEE, STUDENT' },
        { method: 'GET', path: '/api/student/courses/{course_id}', desc: 'Detalhes de um curso (verificação de matrícula)', auth: 'TRAINEE, STUDENT' },
        { method: 'GET', path: '/api/student/certificates', desc: 'Certificados obtidos pelo estudante', auth: 'TRAINEE, STUDENT' },
      ]),
      spacer(),

      // TRAINER
      h1('5. Portal do Formador (/api/trainer)'),
      makeRouteTable([
        { method: 'GET', path: '/api/trainer/stats', desc: 'KPIs do dashboard do formador: alunos, cursos próprios, submissões pendentes, MPU médio', auth: 'TRAINER, ADMIN' },
        { method: 'GET', path: '/api/trainer/courses/all', desc: 'Todos os cursos disponíveis na plataforma', auth: 'TRAINER, ADMIN' },
      ]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // TRAINING PLANS
      h1('6. Planos de Formação (/api/training-plans)'),
      makeRouteTable([
        { method: 'GET',    path: '/api/training-plans', desc: 'Lista planos (scope por role: ADMIN=todos, TRAINER=seus, STUDENT=atribuídos)', auth: 'Todos' },
        { method: 'POST',   path: '/api/training-plans', desc: 'Cria novo plano de formação', auth: 'TRAINER, ADMIN' },
        { method: 'GET',    path: '/api/training-plans/{plan_id}', desc: 'Detalhes do plano com cursos e atribuições', auth: 'Todos' },
        { method: 'PUT',    path: '/api/training-plans/{plan_id}', desc: 'Actualiza plano (título, datas, cursos)', auth: 'TRAINER, ADMIN' },
        { method: 'DELETE', path: '/api/training-plans/{plan_id}', desc: 'Remove plano (só se PENDING)', auth: 'TRAINER, ADMIN' },
        { method: 'POST',   path: '/api/training-plans/{plan_id}/enroll', desc: 'Matricula estudante no plano', auth: 'TRAINER, ADMIN' },
        { method: 'POST',   path: '/api/training-plans/{plan_id}/finalize', desc: 'Finaliza plano → gera certificado', auth: 'TRAINER, ADMIN' },
      ]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // CHALLENGES
      h1('7. Desafios (/api/challenges)'),
      makeRouteTable([
        { method: 'GET',  path: '/api/challenges', desc: 'Lista desafios disponíveis (filtrado por role)', auth: 'Todos' },
        { method: 'POST', path: '/api/challenges', desc: 'Cria novo desafio associado a um curso', auth: 'TRAINER, ADMIN' },
        { method: 'GET',  path: '/api/challenges/{challenge_id}', desc: 'Detalhes do desafio com critérios KPI', auth: 'Todos' },
        { method: 'POST', path: '/api/challenges/{challenge_id}/release', desc: 'Libera desafio para formandos', auth: 'TRAINER, ADMIN' },
        { method: 'POST', path: '/api/challenges/{challenge_id}/start', desc: 'Formando inicia desafio → cria ChallengeSubmission', auth: 'TRAINEE, STUDENT' },
        { method: 'POST', path: '/api/challenges/{challenge_id}/submit', desc: 'Submete desafio para revisão do formador', auth: 'TRAINEE, STUDENT' },
        { method: 'POST', path: '/api/challenges/{challenge_id}/review', desc: 'Formador revê e aprova/rejeita submissão', auth: 'TRAINER, ADMIN' },
        { method: 'POST', path: '/api/challenges/{challenge_id}/retry', desc: 'Permite nova tentativa ao formando', auth: 'TRAINER, ADMIN' },
      ]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // LESSONS
      h1('8. Lições (/api/lessons)'),
      makeRouteTable([
        { method: 'GET',   path: '/api/lessons/{lesson_id}/progress', desc: 'Estado de progresso da lição para o utilizador actual', auth: 'Todos' },
        { method: 'POST',  path: '/api/lessons/{lesson_id}/release', desc: 'Formador libera lição para formando', auth: 'TRAINER, ADMIN' },
        { method: 'POST',  path: '/api/lessons/{lesson_id}/start', desc: 'Formando inicia lição (registado started_at)', auth: 'TRAINEE, STUDENT' },
        { method: 'POST',  path: '/api/lessons/{lesson_id}/pause', desc: 'Pausa lição (registado paused_at + LessonPause)', auth: 'TRAINEE, STUDENT' },
        { method: 'POST',  path: '/api/lessons/{lesson_id}/resume', desc: 'Retoma lição pausada', auth: 'TRAINEE, STUDENT' },
        { method: 'POST',  path: '/api/lessons/{lesson_id}/complete', desc: 'Formando conclui lição (MPU calculado)', auth: 'TRAINEE, STUDENT' },
        { method: 'POST',  path: '/api/lessons/{lesson_id}/confirm', desc: 'Formando confirma execução da lição', auth: 'TRAINEE, STUDENT' },
        { method: 'POST',  path: '/api/finalization/lesson', desc: 'Formador finaliza lição (aprova ou rejeita)', auth: 'TRAINER, ADMIN' },
      ]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // TUTORIA
      h1('9. Portal de Tutoria (/api/tutoria)'),
      h2('9.1 Categorias de Erro'),
      makeRouteTable([
        { method: 'GET',    path: '/api/tutoria/categories', desc: 'Lista categorias (hierarquia pai/filho)', auth: 'Todos' },
        { method: 'POST',   path: '/api/tutoria/categories', desc: 'Cria nova categoria', auth: 'ADMIN' },
        { method: 'PATCH',  path: '/api/tutoria/categories/{cat_id}', desc: 'Actualiza categoria', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/tutoria/categories/{cat_id}', desc: 'Remove categoria (soft)', auth: 'ADMIN' },
      ]),
      spacer(),
      h2('9.2 Gestão de Erros'),
      makeRouteTable([
        { method: 'GET',    path: '/api/tutoria/errors', desc: 'Lista erros (scope: ADMIN=todos, TRAINER=tutorados, STUDENT=próprios). Filtros: ?status=, ?severity=, ?category_id=', auth: 'Todos' },
        { method: 'POST',   path: '/api/tutoria/errors', desc: 'Regista novo erro de tutoria com todos os campos do formulário Access', auth: 'LIBERADOR, ADMIN' },
        { method: 'GET',    path: '/api/tutoria/errors/{error_id}', desc: 'Detalhes completos do erro com relações (planos, comentários, motivos, refs)', auth: 'Todos' },
        { method: 'PATCH',  path: '/api/tutoria/errors/{error_id}', desc: 'Actualiza dados do erro', auth: 'ADMIN, TRAINER' },
        { method: 'POST',   path: '/api/tutoria/errors/{error_id}/verify', desc: 'Tutor verifica e passa a IN_ANALYSIS', auth: 'TUTOR, ADMIN' },
        { method: 'PATCH',  path: '/api/tutoria/errors/{error_id}/analysis', desc: 'Actualiza análise 5 porquês e campos de resolução', auth: 'TUTOR, ADMIN' },
        { method: 'POST',   path: '/api/tutoria/errors/{error_id}/submit-analysis', desc: 'Liberador submete análise para aprovação', auth: 'LIBERADOR, ADMIN' },
        { method: 'POST',   path: '/api/tutoria/errors/{error_id}/resolve', desc: 'Resolve erro (status → RESOLVED)', auth: 'TUTOR, ADMIN' },
        { method: 'POST',   path: '/api/tutoria/errors/{error_id}/cancel', desc: 'Cancela registo de erro', auth: 'ADMIN' },
        { method: 'POST',   path: '/api/tutoria/errors/{error_id}/confirm-solution', desc: 'Confirma solução implementada', auth: 'TUTOR, ADMIN' },
        { method: 'POST',   path: '/api/tutoria/errors/{error_id}/deactivate', desc: 'Inactiva o registo (não apaga)', auth: 'ADMIN' },
      ]),
      spacer(),
      h2('9.3 Planos de Acção'),
      makeRouteTable([
        { method: 'GET',   path: '/api/tutoria/errors/{error_id}/plans', desc: 'Planos de acção associados a um erro', auth: 'Todos' },
        { method: 'POST',  path: '/api/tutoria/errors/{error_id}/plans', desc: 'Cria plano 5W2H para o erro', auth: 'TUTOR, ADMIN' },
        { method: 'GET',   path: '/api/tutoria/plans/{plan_id}', desc: 'Detalhes do plano com itens e comentários', auth: 'Todos' },
        { method: 'PATCH', path: '/api/tutoria/plans/{plan_id}', desc: 'Actualiza plano (título, datas, análise)', auth: 'TUTOR, ADMIN' },
        { method: 'PATCH', path: '/api/tutoria/plans/{plan_id}/start', desc: 'Inicia execução do plano (→ IN_PROGRESS)', auth: 'TUTOR, ADMIN' },
        { method: 'PATCH', path: '/api/tutoria/plans/{plan_id}/complete', desc: 'Conclui plano (→ COMPLETED)', auth: 'TUTOR, ADMIN' },
        { method: 'POST',  path: '/api/tutoria/plans/{plan_id}/submit', desc: 'Formando submete plano para revisão', auth: 'TRAINEE, STUDENT' },
        { method: 'POST',  path: '/api/tutoria/plans/{plan_id}/approve', desc: 'Tutor aprova plano', auth: 'TUTOR, ADMIN' },
        { method: 'POST',  path: '/api/tutoria/plans/{plan_id}/return', desc: 'Tutor devolve plano para revisão', auth: 'TUTOR, ADMIN' },
        { method: 'GET',   path: '/api/tutoria/plans/{plan_id}/items', desc: 'Lista itens do plano de acção', auth: 'Todos' },
        { method: 'POST',  path: '/api/tutoria/plans/{plan_id}/items', desc: 'Cria item de acção no plano', auth: 'TUTOR, ADMIN' },
        { method: 'PATCH', path: '/api/tutoria/items/{item_id}', desc: 'Actualiza item (estado, notas, prazo)', auth: 'TUTOR, ADMIN' },
      ]),
      spacer(),
      h2('9.4 Fichas de Aprendizagem e Sessões Side-by-Side'),
      makeRouteTable([
        { method: 'GET',   path: '/api/tutoria/learning-sheets', desc: 'Lista fichas de aprendizagem', auth: 'TUTOR, ADMIN' },
        { method: 'POST',  path: '/api/tutoria/learning-sheets', desc: 'Cria nova ficha de aprendizagem', auth: 'TUTOR, ADMIN' },
        { method: 'GET',   path: '/api/tutoria/learning-sheets/mine', desc: 'Fichas do utilizador autenticado', auth: 'Todos' },
        { method: 'POST',  path: '/api/tutoria/learning-sheets/{sheet_id}/submit', desc: 'Formando submete ficha', auth: 'TRAINEE' },
        { method: 'PATCH', path: '/api/tutoria/learning-sheets/{sheet_id}/review', desc: 'Tutor revê e aprova/rejeita ficha', auth: 'TUTOR, ADMIN' },
        { method: 'POST',  path: '/api/tutoria/plans/side-by-side', desc: 'Cria sessão side-by-side de acompanhamento', auth: 'TUTOR, ADMIN' },
        { method: 'GET',   path: '/api/tutoria/capsulas', desc: 'Lista cápsulas de vídeo de tutoria', auth: 'Todos' },
        { method: 'POST',  path: '/api/tutoria/capsulas', desc: 'Cria nova cápsula de vídeo', auth: 'TUTOR, ADMIN' },
        { method: 'PUT',   path: '/api/tutoria/capsulas/{capsula_id}', desc: 'Actualiza cápsula', auth: 'TUTOR, ADMIN' },
        { method: 'DELETE',path: '/api/tutoria/capsulas/{capsula_id}', desc: 'Remove cápsula', auth: 'TUTOR, ADMIN' },
      ]),
      spacer(),
      h2('9.5 Notificações e Comentários'),
      makeRouteTable([
        { method: 'GET',   path: '/api/tutoria/notifications', desc: 'Notificações do utilizador (prazos, actualizações)', auth: 'Todos' },
        { method: 'PATCH', path: '/api/tutoria/notifications/{notif_id}/read', desc: 'Marca notificação como lida', auth: 'Todos' },
        { method: 'PATCH', path: '/api/tutoria/notifications/read-all', desc: 'Marca todas as notificações como lidas', auth: 'Todos' },
        { method: 'GET',   path: '/api/tutoria/errors/{error_id}/comments', desc: 'Comentários do erro', auth: 'Todos' },
        { method: 'POST',  path: '/api/tutoria/errors/{error_id}/comments', desc: 'Adiciona comentário ao erro', auth: 'Todos' },
        { method: 'GET',   path: '/api/tutoria/plans/{plan_id}/comments', desc: 'Comentários do plano', auth: 'Todos' },
        { method: 'POST',  path: '/api/tutoria/plans/{plan_id}/comments', desc: 'Adiciona comentário ao plano', auth: 'Todos' },
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // TEAMS
      h1('10. Equipas (/api/teams)'),
      makeRouteTable([
        { method: 'GET',    path: '/api/teams', desc: 'Lista equipas activas com contagem de membros', auth: 'ADMIN, MANAGER' },
        { method: 'POST',   path: '/api/teams', desc: 'Cria nova equipa', auth: 'ADMIN' },
        { method: 'GET',    path: '/api/teams/{team_id}', desc: 'Detalhes da equipa com gestor e membros', auth: 'ADMIN, MANAGER' },
        { method: 'PATCH',  path: '/api/teams/{team_id}', desc: 'Actualiza equipa (nome, gestor, departamento)', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/teams/{team_id}', desc: 'Remove equipa (soft delete)', auth: 'ADMIN' },
        { method: 'GET',    path: '/api/teams/{team_id}/members', desc: 'Membros da equipa', auth: 'ADMIN, MANAGER' },
        { method: 'POST',   path: '/api/teams/{team_id}/members', desc: 'Adiciona utilizador à equipa', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/teams/{team_id}/members/{user_id}', desc: 'Remove utilizador da equipa', auth: 'ADMIN' },
        { method: 'GET',    path: '/api/teams/{team_id}/services', desc: 'Serviços/produtos associados à equipa', auth: 'ADMIN, MANAGER' },
        { method: 'POST',   path: '/api/teams/{team_id}/services', desc: 'Associa produto/serviço à equipa', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/teams/{team_id}/services/{product_id}', desc: 'Remove associação produto-equipa', auth: 'ADMIN' },
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // RELATÓRIOS
      h1('11. Relatórios (/api/relatorios)'),
      note('Todos os endpoints de relatórios filtram automaticamente o scope por role. ADMIN vê tudo, MANAGER vê a sua equipa, TRAINER vê os seus tutorados.'),
      spacer(),
      makeRouteTable([
        { method: 'GET', path: '/api/relatorios/overview', desc: 'KPIs globais: utilizadores, equipas, planos, certificados, desafios, erros de tutoria', auth: 'Todos' },
        { method: 'GET', path: '/api/relatorios/formacoes', desc: 'Matrículas, taxa de conclusão, taxa de aprovação, MPU médio, certificados, erros por tipologia', auth: 'Todos' },
        { method: 'GET', path: '/api/relatorios/tutoria', desc: 'Total de erros, taxa de resolução, taxa de recorrência, por gravidade, por estado, por plano', auth: 'Todos' },
        { method: 'GET', path: '/api/relatorios/teams', desc: 'Por equipa: membros, erros, planos, taxa de conclusão, MPU', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/relatorios/members', desc: 'Por utilizador: erros, planos, taxa de conclusão, MPU, certificados', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/relatorios/incidents', desc: 'Tabela de incidências com filtros (?date_from=, ?date_to=, ?status=, ?severity=, ?bank_id=)', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/relatorios/incidents/filters', desc: 'Opções disponíveis para os filtros da tabela de incidências', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/relatorios/tutoria/analytics', desc: 'Analytics aprofundada com 10 dimensões de análise', auth: 'ADMIN, MANAGER' },
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // CHAMADOS
      h1('12. Chamados / Suporte (/api/chamados)'),
      makeRouteTable([
        { method: 'GET',    path: '/api/chamados', desc: 'Lista tickets Kanban com filtros (?status=, ?priority=, ?type=)', auth: 'Todos' },
        { method: 'POST',   path: '/api/chamados', desc: 'Cria novo ticket (BUG/FEATURE/IMPROVEMENT/MAINTENANCE)', auth: 'Todos' },
        { method: 'GET',    path: '/api/chamados/{chamado_id}', desc: 'Detalhes do ticket com comentários e anexos', auth: 'Todos' },
        { method: 'PUT',    path: '/api/chamados/{chamado_id}', desc: 'Actualiza ticket (estado, responsável, prioridade)', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/chamados/{chamado_id}', desc: 'Remove ticket', auth: 'ADMIN' },
        { method: 'POST',   path: '/api/chamados/{chamado_id}/comments', desc: 'Adiciona comentário ao ticket', auth: 'Todos' },
        { method: 'PATCH',  path: '/api/chamados/{chamado_id}/move', desc: 'Move ticket para outra coluna Kanban', auth: 'ADMIN' },
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // DATA WAREHOUSE
      h1('13. Data Warehouse (/api/dw)'),
      note('Os endpoints DW servem dados pré-agregados do ETL. Mais performantes para dashboards. Requerem ADMIN ou MANAGER.'),
      spacer(),
      h2('13.1 Formações (DW)'),
      makeRouteTable([
        { method: 'GET', path: '/api/dw/training/by-month', desc: 'Matrículas e conclusões por mês. Query param: ?year=2026', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/training/by-course', desc: 'Top cursos por matrículas. Query param: ?limit=8', auth: 'ADMIN, MANAGER' },
      ]),
      spacer(),
      h2('13.2 Tutoria (DW)'),
      makeRouteTable([
        { method: 'GET', path: '/api/dw/tutoria/by-month', desc: 'Erros registados e resolvidos por mês/ano', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/tutoria/by-category', desc: 'Erros agrupados por categoria de tipologia', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/tutoria/by-trainer', desc: 'Por tutor: erros, resolvidos, dias médios de resolução', auth: 'ADMIN, MANAGER' },
      ]),
      spacer(),
      h2('13.3 Chamados e Erros Internos (DW)'),
      makeRouteTable([
        { method: 'GET', path: '/api/dw/chamados/by-status', desc: 'Tickets de suporte por estado', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/chamados/by-month', desc: 'Tickets de suporte por mês', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/chamados/by-type', desc: 'Tickets por tipo (BUG/FEATURE/IMPROVEMENT)', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/internal-errors/by-month', desc: 'Erros internos por mês', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/internal-errors/by-team', desc: 'Erros internos por equipa', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/dw/teams/overview', desc: 'Resumo de equipas com KPIs agregados', auth: 'ADMIN, MANAGER' },
      ]),
      spacer(),
      h2('13.4 Snapshots e ETL'),
      makeRouteTable([
        { method: 'GET',  path: '/api/dw/snapshot/latest', desc: 'Snapshot mais recente com tendências (delta face ao anterior)', auth: 'ADMIN, MANAGER' },
        { method: 'GET',  path: '/api/dw/snapshot/trend', desc: 'Tendência de snapshots diários. Query param: ?days=30', auth: 'ADMIN, MANAGER' },
        { method: 'POST', path: '/api/dw/etl/run', desc: 'Acciona manualmente o pipeline ETL completo', auth: 'ADMIN' },
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // FEEDBACK
      h1('14. Feedback dos Liberadores (/api/feedback)'),
      makeRouteTable([
        { method: 'GET',  path: '/api/feedback/surveys', desc: 'Lista inquéritos semanais (paginado)', auth: 'TUTOR, ADMIN' },
        { method: 'POST', path: '/api/feedback/surveys', desc: 'Cria novo inquérito semanal', auth: 'TUTOR, ADMIN' },
        { method: 'GET',  path: '/api/feedback/surveys/{survey_id}', desc: 'Detalhes do inquérito com respostas', auth: 'TUTOR, ADMIN' },
        { method: 'POST', path: '/api/feedback/surveys/{survey_id}/close', desc: 'Fecha inquérito a novas respostas', auth: 'TUTOR, ADMIN' },
        { method: 'GET',  path: '/api/feedback/my-pending', desc: 'Inquéritos pendentes para o Liberador actual', auth: 'LIBERADOR' },
        { method: 'POST', path: '/api/feedback/responses', desc: 'Liberador submete resposta ao inquérito', auth: 'LIBERADOR' },
        { method: 'GET',  path: '/api/feedback/dashboard', desc: 'Dashboard agregado de feedback (NPS, scores, tendências)', auth: 'TUTOR, ADMIN' },
      ]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ORG HIERARCHY
      h1('15. Hierarquia Organizacional (/api/org)'),
      makeRouteTable([
        { method: 'GET',    path: '/api/org/tree', desc: 'Árvore hierárquica aninhada (nós → sub-nós → membros)', auth: 'Todos' },
        { method: 'GET',    path: '/api/org/nodes', desc: 'Lista plana de nós organizacionais', auth: 'Todos' },
        { method: 'POST',   path: '/api/org/nodes', desc: 'Cria nó organizacional (departamento / divisão)', auth: 'ADMIN' },
        { method: 'PUT',    path: '/api/org/nodes/{node_id}', desc: 'Actualiza nó (nome, pai, descrição)', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/org/nodes/{node_id}', desc: 'Remove nó (só se sem filhos)', auth: 'ADMIN' },
        { method: 'POST',   path: '/api/org/nodes/{node_id}/members', desc: 'Adiciona utilizador a nó com role', auth: 'ADMIN' },
        { method: 'DELETE', path: '/api/org/nodes/{node_id}/members/{user_id}', desc: 'Remove utilizador do nó', auth: 'ADMIN' },
        { method: 'GET',    path: '/api/org/audit', desc: 'Log de auditoria de alterações na hierarquia', auth: 'ADMIN' },
      ]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // CERTIFICADOS + OUTROS
      h1('16. Certificados e Outros Endpoints'),
      h2('16.1 Certificados (/api/certificates)'),
      makeRouteTable([
        { method: 'GET',  path: '/api/certificates', desc: 'Lista certificados do utilizador actual', auth: 'Todos' },
        { method: 'GET',  path: '/api/certificates/{cert_id}', desc: 'Detalhes do certificado', auth: 'Todos' },
        { method: 'GET',  path: '/api/certificates/{cert_id}/pdf', desc: 'Download do certificado em PDF', auth: 'Todos' },
        { method: 'POST', path: '/api/certificates/generate', desc: 'Gera certificado (chamado automaticamente na finalização)', auth: 'TRAINER, ADMIN' },
      ]),
      spacer(),
      h2('16.2 Stats / KPIs Públicos'),
      makeRouteTable([
        { method: 'GET', path: '/api/stats/kpis', desc: 'KPIs globais da plataforma (utilizadores, cursos, certificados)', auth: 'ADMIN, MANAGER' },
        { method: 'GET', path: '/api/stats/courses/featured', desc: 'Cursos em destaque para a landing page', auth: 'Público' },
        { method: 'GET', path: '/health', desc: 'Health check do servidor', auth: 'Público' },
      ]),
      spacer(),
      h2('16.3 Chat / FAQ'),
      makeRouteTable([
        { method: 'POST', path: '/api/chat/message', desc: 'Envia mensagem ao chatbot FAQ (rule-based)', auth: 'Todos' },
        { method: 'GET',  path: '/api/chat/faqs', desc: 'Lista FAQs configuradas pelo admin', auth: 'Todos' },
        { method: 'POST', path: '/api/chat/faqs', desc: 'Cria nova entrada FAQ', auth: 'ADMIN' },
        { method: 'PATCH',path: '/api/chat/faqs/{faq_id}', desc: 'Actualiza entrada FAQ', auth: 'ADMIN' },
        { method: 'DELETE',path: '/api/chat/faqs/{faq_id}', desc: 'Remove entrada FAQ', auth: 'ADMIN' },
      ]),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Referencia_API_PTH_TDH.docx', buffer);
  console.log('OK: Referencia_API_PTH_TDH.docx created');
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
