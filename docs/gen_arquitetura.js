// FASE 2 — Arquitetura_Tecnica_PTH_TDH.docx
// Run: node gen_arquitetura.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  LevelFormat, ExternalHyperlink,
} = require('docx');
const fs = require('fs');

// ─── Palette ──────────────────────────────────────────────────────────────────
const RED    = 'EC0000';
const DARK   = '1A1A1A';
const MID    = '4B4B4B';
const LIGHT  = 'F5F5F5';
const WHITE  = 'FFFFFF';
const BORDER_COLOR = 'DDDDDD';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function border(color = BORDER_COLOR) {
  return { style: BorderStyle.SINGLE, size: 1, color };
}
function borders(color = BORDER_COLOR) {
  const b = border(color);
  return { top: b, bottom: b, left: b, right: b };
}
function cell(text, opts = {}) {
  const { fill = WHITE, bold = false, color = DARK, width = 2340, span = 1 } = opts;
  return new TableCell({
    borders: borders(),
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, bold, color, font: 'Arial', size: 20 })]
    })]
  });
}
function headerCell(text, width = 2340) {
  return cell(text, { fill: RED, bold: true, color: WHITE, width });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: false,
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
  const { bold = false, color = DARK, size = 22 } = opts;
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, bold, color, font: 'Arial', size })]
  });
}
function bullet(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: DARK })]
  });
}
function spacer() {
  return new Paragraph({ spacing: { before: 120, after: 0 }, children: [] });
}
function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
    spacing: { before: 0, after: 240 },
    children: []
  });
}
function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: `ℹ  ${text}`, font: 'Arial', size: 20, color: '555555', italics: true })]
  });
}

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
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
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
          children: [
            new TextRun({ text: 'PortalTradeHub + Trade Data Hub', bold: true, font: 'Arial', size: 18, color: RED }),
            new TextRun({ text: '   |   Arquitectura Técnica', font: 'Arial', size: 18, color: MID }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_COLOR, space: 1 } },
          children: [
            new TextRun({ text: 'Confidencial — Trade Finance · Santander    ', font: 'Arial', size: 16, color: MID }),
            new TextRun({ text: 'Pág. ', font: 'Arial', size: 16, color: MID }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: RED }),
          ]
        })]
      })
    },
    children: [

      // ══════════════════════════ CAPA ═════════════════════════════════════════
      new Paragraph({
        spacing: { before: 2000, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'SANTANDER', bold: true, font: 'Arial', size: 72, color: RED })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Trade Finance', font: 'Arial', size: 36, color: MID })]
      }),
      rule(),
      new Paragraph({
        spacing: { before: 400, after: 160 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Arquitectura Técnica', bold: true, font: 'Arial', size: 52, color: DARK })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'PortalTradeHub + Trade Data Hub', font: 'Arial', size: 32, color: MID })]
      }),
      // Meta info table on cover
      new Table({
        width: { size: 7200, type: WidthType.DXA },
        alignment: AlignmentType.CENTER,
        columnWidths: [2400, 4800],
        rows: [
          new TableRow({ children: [headerCell('Versão', 2400), cell('1.0', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Data', 2400), cell('Março 2026', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Classificação', 2400), cell('Confidencial — Uso Interno', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Âmbito', 2400), cell('Trade Finance · Santander Portugal', { width: 4800 })] }),
          new TableRow({ children: [headerCell('Autor', 2400), cell('Equipa de Desenvolvimento TDH', { width: 4800 })] }),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ ÍNDICE ════════════════════════════════════════
      new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-3' }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 1. INTRODUÇÃO ═════════════════════════════════
      h1('1. Introdução'),
      body('O PortalTradeHub (PTH) é uma plataforma interna desenvolvida para a equipa de Trade Finance do Santander Portugal. Centraliza cinco áreas operacionais críticas: Formações, Tutoria, Relatórios, Dados Mestres e Suporte (Chamados).'),
      spacer(),
      body('O Trade Data Hub (TDH) é o nome da API e camada de dados do sistema — um backend FastAPI que serve tanto o portal web como possíveis integrações futuras. O TDH inclui ainda um Data Warehouse em esquema estrela (star schema) e um pipeline ETL que sincroniza os dados operacionais para análise histórica.'),
      spacer(),
      h2('1.1 Objectivos do Sistema'),
      bullet('Eliminar o uso de ficheiros Excel dispersos para gestão de formações e erros de tutoria'),
      bullet('Proporcionar rastreabilidade completa do ciclo de formação: matrícula → lição → desafio → certificado'),
      bullet('Registar, acompanhar e resolver erros operacionais com ciclo de 6 estados e planos de acção 5W2H'),
      bullet('Disponibilizar dashboards analíticos em tempo real para gestores e administradores'),
      bullet('Centralizar dados mestres (bancos, produtos, equipas, hierarquia) num único ponto de verdade'),
      spacer(),
      h2('1.2 Utilizadores Alvo'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1800, 2000, 5226],
        rows: [
          new TableRow({ children: [headerCell('Role', 1800), headerCell('Nome', 2000), headerCell('Responsabilidades Principais', 5226)] }),
          new TableRow({ children: [cell('ADMIN', { width: 1800 }), cell('Administrador', { width: 2000 }), cell('Gestão total do sistema: utilizadores, dados mestres, relatórios globais, validação de formadores', { width: 5226 })] }),
          new TableRow({ children: [cell('MANAGER', { width: 1800 }), cell('Gestor / Chefe', { width: 2000 }), cell('Supervisão de equipas, acesso a dashboards de equipa, validação de operações', { width: 5226 })] }),
          new TableRow({ children: [cell('TRAINER', { width: 1800 }), cell('Formador', { width: 2000 }), cell('Criação de cursos, lições, desafios, planos de formação; revisão de submissões; tutoria de formandos', { width: 5226 })] }),
          new TableRow({ children: [cell('TRAINEE', { width: 1800 }), cell('Formando', { width: 2000 }), cell('Execução de lições e desafios, submissão de trabalhos, consulta de planos e certificados', { width: 5226 })] }),
          new TableRow({ children: [cell('STUDENT', { width: 1800 }), cell('Estudante', { width: 2000 }), cell('Perfil semelhante a TRAINEE; acesso livre a cursos disponíveis sem plano obrigatório', { width: 5226 })] }),
        ]
      }),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 2. VISÃO GERAL ════════════════════════════════
      h1('2. Visão Geral da Arquitectura'),
      body('O sistema segue uma arquitectura de três camadas clássica, containerizada com Docker Compose:'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2800, 4226],
        rows: [
          new TableRow({ children: [headerCell('Camada', 2000), headerCell('Tecnologia', 2800), headerCell('Responsabilidade', 4226)] }),
          new TableRow({ children: [cell('Apresentação', { width: 2000 }), cell('React 18 + Vite + Nginx', { width: 2800 }), cell('SPA com routing client-side; i18n PT/ES/EN; design system Santander', { width: 4226 })] }),
          new TableRow({ children: [cell('Aplicação', { width: 2000 }), cell('FastAPI (Python 3.13) + Uvicorn', { width: 2800 }), cell('REST API com autenticação JWT; lógica de negócio; ETL; schedulers', { width: 4226 })] }),
          new TableRow({ children: [cell('Dados', { width: 2000 }), cell('MySQL 8.0', { width: 2800 }), cell('Base de dados relacional; tabelas operacionais + DW star schema', { width: 4226 })] }),
        ]
      }),
      spacer(),
      h2('2.1 Diagrama de Arquitectura (Descrição Textual)'),
      body('Utilizador → Nginx (porta 80) → React SPA (Vite build) → Axios → FastAPI (porta 8100) → SQLAlchemy ORM → MySQL 8.0'),
      spacer(),
      body('O Nginx actua como reverse proxy e servidor de ficheiros estáticos. As chamadas à API com prefixo /api/ são proxiadas para o container do backend. O backend FastAPI serve o HTML da SPA para rotas não-API (catch-all), permitindo deep linking do React Router.'),
      spacer(),
      h2('2.2 Separação de Ambientes'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 3513, 3513],
        rows: [
          new TableRow({ children: [headerCell('', 2000), headerCell('DEV', 3513), headerCell('PROD', 3513)] }),
          new TableRow({ children: [cell('Frontend', { width: 2000 }), cell('Vite dev server :5173 (hot reload)', { width: 3513 }), cell('Nginx + build estático (/usr/share/nginx/html)', { width: 3513 })] }),
          new TableRow({ children: [cell('Backend', { width: 2000 }), cell('Uvicorn com reload=True, Swagger /docs activo', { width: 3513 }), cell('Uvicorn multi-worker, Swagger desactivado (H02)', { width: 3513 })] }),
          new TableRow({ children: [cell('Base de Dados', { width: 2000 }), cell('MySQL exposta em 127.0.0.1:3307', { width: 3513 }), cell('MySQL apenas em rede interna Docker', { width: 3513 })] }),
          new TableRow({ children: [cell('Portas externas', { width: 2000 }), cell(':80 (Nginx), :8100 (API), :3307 (DB)', { width: 3513 }), cell(':80 (Nginx), :8100 (API)', { width: 3513 })] }),
        ]
      }),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 3. STACK TECNOLÓGICO ═════════════════════════
      h1('3. Stack Tecnológico'),
      h2('3.1 Frontend'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2600, 1800, 4626],
        rows: [
          new TableRow({ children: [headerCell('Biblioteca / Ferramenta', 2600), headerCell('Versão', 1800), headerCell('Uso', 4626)] }),
          new TableRow({ children: [cell('React', { width: 2600 }), cell('18', { width: 1800 }), cell('Framework SPA, hooks, context API', { width: 4626 })] }),
          new TableRow({ children: [cell('TypeScript', { width: 2600 }), cell('5.x', { width: 1800 }), cell('Tipagem estática em todo o frontend', { width: 4626 })] }),
          new TableRow({ children: [cell('Vite', { width: 2600 }), cell('5.x', { width: 1800 }), cell('Build tool e dev server com HMR', { width: 4626 })] }),
          new TableRow({ children: [cell('Tailwind CSS', { width: 2600 }), cell('3.x', { width: 1800 }), cell('Utility-first CSS; dark mode via dark: classes', { width: 4626 })] }),
          new TableRow({ children: [cell('React Router', { width: 2600 }), cell('6.x', { width: 1800 }), cell('Client-side routing com layouts aninhados', { width: 4626 })] }),
          new TableRow({ children: [cell('Axios', { width: 2600 }), cell('1.x', { width: 1800 }), cell('Cliente HTTP com interceptors JWT e refresh', { width: 4626 })] }),
          new TableRow({ children: [cell('Zustand', { width: 2600 }), cell('4.x', { width: 1800 }), cell('Gestão de estado global (auth, sidebar)', { width: 4626 })] }),
          new TableRow({ children: [cell('react-i18next', { width: 2600 }), cell('14.x', { width: 1800 }), cell('Internacionalização PT/ES/EN', { width: 4626 })] }),
          new TableRow({ children: [cell('@tremor/react', { width: 2600 }), cell('3.x', { width: 1800 }), cell('Componentes de charts (AreaChart, BarChart, DonutChart, BarList)', { width: 4626 })] }),
          new TableRow({ children: [cell('lucide-react', { width: 2600 }), cell('latest', { width: 1800 }), cell('Biblioteca de ícones SVG', { width: 4626 })] }),
          new TableRow({ children: [cell('DOMPurify', { width: 2600 }), cell('3.x', { width: 1800 }), cell('Sanitização XSS de conteúdo HTML', { width: 4626 })] }),
        ]
      }),
      spacer(),
      h2('3.2 Backend'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2600, 1800, 4626],
        rows: [
          new TableRow({ children: [headerCell('Biblioteca / Framework', 2600), headerCell('Versão', 1800), headerCell('Uso', 4626)] }),
          new TableRow({ children: [cell('Python', { width: 2600 }), cell('3.13', { width: 1800 }), cell('Linguagem principal do backend', { width: 4626 })] }),
          new TableRow({ children: [cell('FastAPI', { width: 2600 }), cell('0.115.x', { width: 1800 }), cell('Framework REST API com suporte a async/await', { width: 4626 })] }),
          new TableRow({ children: [cell('Uvicorn', { width: 2600 }), cell('0.34.x', { width: 1800 }), cell('Servidor ASGI de produção', { width: 4626 })] }),
          new TableRow({ children: [cell('SQLAlchemy', { width: 2600 }), cell('2.x', { width: 1800 }), cell('ORM relacional + sessões de base de dados', { width: 4626 })] }),
          new TableRow({ children: [cell('Pydantic', { width: 2600 }), cell('2.x', { width: 1800 }), cell('Validação e serialização de schemas', { width: 4626 })] }),
          new TableRow({ children: [cell('PyJWT', { width: 2600 }), cell('2.x', { width: 1800 }), cell('Tokens JWT (HS256); migrado de python-jose por CVE', { width: 4626 })] }),
          new TableRow({ children: [cell('bcrypt / passlib', { width: 2600 }), cell('latest', { width: 1800 }), cell('Hashing de passwords com rounds configurável', { width: 4626 })] }),
          new TableRow({ children: [cell('slowapi', { width: 2600 }), cell('0.1.x', { width: 1800 }), cell('Rate limiting por IP (default 60/min)', { width: 4626 })] }),
          new TableRow({ children: [cell('GZipMiddleware', { width: 2600 }), cell('(starlette)', { width: 1800 }), cell('Compressão gzip para respostas > 500 bytes', { width: 4626 })] }),
          new TableRow({ children: [cell('pytest', { width: 2600 }), cell('8.x', { width: 1800 }), cell('Framework de testes; 341 testes no total', { width: 4626 })] }),
          new TableRow({ children: [cell('PyMySQL', { width: 2600 }), cell('1.x', { width: 1800 }), cell('Driver MySQL para SQLAlchemy', { width: 4626 })] }),
        ]
      }),
      spacer(),
      h2('3.3 Base de Dados e Infraestrutura'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2600, 1800, 4626],
        rows: [
          new TableRow({ children: [headerCell('Componente', 2600), headerCell('Versão', 1800), headerCell('Notas', 4626)] }),
          new TableRow({ children: [cell('MySQL', { width: 2600 }), cell('8.0.39', { width: 1800 }), cell('Collation utf8mb4_unicode_ci; porta interna 3306; exposta em 127.0.0.1:3307 (DEV)', { width: 4626 })] }),
          new TableRow({ children: [cell('Docker', { width: 2600 }), cell('26.x', { width: 1800 }), cell('Containerização de todos os serviços', { width: 4626 })] }),
          new TableRow({ children: [cell('Docker Compose', { width: 2600 }), cell('2.x', { width: 1800 }), cell('Orquestração local e de produção', { width: 4626 })] }),
          new TableRow({ children: [cell('Nginx', { width: 2600 }), cell('alpine', { width: 1800 }), cell('Reverse proxy + servidor estático; lazy DNS resolver para Docker', { width: 4626 })] }),
          new TableRow({ children: [cell('GitHub Actions', { width: 2600 }), cell('—', { width: 1800 }), cell('CI/CD: lint, testes, build, deploy automático via SSH', { width: 4626 })] }),
        ]
      }),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 4. PORTAIS E MÓDULOS ═════════════════════════
      h1('4. Portais e Módulos do Sistema'),
      h2('4.1 Portal de Formações (/)'),
      body('O portal principal do sistema, acessível a todos os roles. Gere o ciclo completo de aprendizagem.'),
      spacer(),
      h3('Entidades Centrais'),
      bullet('Course — Curso com título, nível (BEGINNER/INTERMEDIATE/EXPERT), tipo (CURSO/CAPSULA_METODOLOGIA/CAPSULA_FUNCIONALIDADE), bancos e produtos associados (M2M)'),
      bullet('Lesson — Lição com conteúdo, tipo (THEORETICAL/PRACTICAL), tempo estimado (MPU), URL de vídeo/materiais'),
      bullet('TrainingPlan — Plano de formação individual atribuído a um estudante com datas e status'),
      bullet('Challenge — Desafio com meta de MPU, volume de operações e critérios de aprovação configuráveis'),
      bullet('ChallengeSubmission — Submissão de um desafio por um formando; inclui KPIs calculados'),
      bullet('Certificate — Certificado PDF gerado após conclusão de plano ou curso'),
      spacer(),
      h3('Fluxo de Execução de Lição'),
      body('1. Formador libera lição (is_released=True) → 2. Formando inicia (started_at registado) → 3. Formando pode pausar/retomar (LessonPause com timestamps) → 4. Formando termina (completed_at, actual_time_minutes, MPU calculado) → 5. Formando confirma (student_confirmed) → 6. Formador finaliza (finished_by)'),
      spacer(),
      h3('Fluxo de Desafio'),
      body('Desafio liberado → Formando executa linha a linha (ChallengePart) ou resumo (SUMMARY) → Submissão criada (IN_PROGRESS) → Formando submete (PENDING_REVIEW) → Formador revê → APPROVED ou REJECTED (com opção de retry)'),
      spacer(),
      h2('4.2 Portal de Tutoria (/tutoria)'),
      body('Regista, acompanha e resolve erros operacionais. Reflecte o workflow do formulário Access legado.'),
      spacer(),
      h3('Ciclo de 6 Estados de um Erro'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
          new TableRow({ children: [headerCell('Estado', 2000), headerCell('Descrição', 7026)] }),
          new TableRow({ children: [cell('REGISTERED', { width: 2000 }), cell('Erro registado pelo tutor; ainda sem análise', { width: 7026 })] }),
          new TableRow({ children: [cell('IN_ANALYSIS', { width: 2000 }), cell('Tutor está a analisar causa raiz', { width: 7026 })] }),
          new TableRow({ children: [cell('PLAN_CREATED', { width: 2000 }), cell('Plano de acção 5W2H criado', { width: 7026 })] }),
          new TableRow({ children: [cell('IN_PROGRESS', { width: 2000 }), cell('Plano em execução', { width: 7026 })] }),
          new TableRow({ children: [cell('RESOLVED', { width: 2000 }), cell('Erro resolvido com solução documentada', { width: 7026 })] }),
          new TableRow({ children: [cell('CANCELLED', { width: 2000 }), cell('Registo cancelado (duplicado ou inválido)', { width: 7026 })] }),
        ]
      }),
      spacer(),
      h3('Funcionalidades Adicionais'),
      bullet('Planos de Acção 5W2H (TutoriaActionPlan) com itens rastreáveis e estado por item'),
      bullet('Fichas de Aprendizagem (LearningSheet) — documentos de boas práticas associados a erros'),
      bullet('Sessões Side-by-Side (SideBySide) — acompanhamento presencial tutor/tutorado'),
      bullet('Senso — erros internos da equipa com registo de motivo e impacto'),
      bullet('Notificações automáticas de prazo vencido (scheduler diário — A.6.1)'),
      bullet('Chatbot FAQ com regras configuráveis pelo admin'),
      spacer(),
      h2('4.3 Portal de Relatórios (/relatorios)'),
      body('Dashboards analíticos em tempo real. Usa dados operacionais directos (via /api/relatorios/*) e dados do DW (via /api/dw/*).'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2400, 6626],
        rows: [
          new TableRow({ children: [headerCell('Dashboard', 2400), headerCell('Conteúdo', 6626)] }),
          new TableRow({ children: [cell('Overview', { width: 2400 }), cell('KPIs globais: utilizadores, cursos, formadores, planos, certificados, desafios', { width: 6626 })] }),
          new TableRow({ children: [cell('Formações', { width: 2400 }), cell('Matrículas, taxa de conclusão, taxa de aprovação, horas de estudo, MPU médio, evolução mensal, cursos top', { width: 6626 })] }),
          new TableRow({ children: [cell('Tutoria', { width: 2400 }), cell('Total de erros, taxa de resolução, taxa de recorrência, por gravidade, por estado, evolução mensal, por categoria, por tutor', { width: 6626 })] }),
          new TableRow({ children: [cell('Equipas', { width: 2400 }), cell('Taxa de conclusão por equipa, erros por equipa, membros, MPU médio', { width: 6626 })] }),
          new TableRow({ children: [cell('Membros', { width: 2400 }), cell('Por utilizador: erros, planos, taxa de conclusão, MPU, certificados; ordenável e pesquisável', { width: 6626 })] }),
          new TableRow({ children: [cell('Incidentes', { width: 2400 }), cell('Tabela de incidências exportável para Excel; filtros avançados por data, estado, gravidade', { width: 6626 })] }),
        ]
      }),
      spacer(),
      h2('4.4 Portal de Dados Mestres (/master-data)'),
      body('CRUD centralizado de todos os dados de referência. Acesso restrito a ADMIN e MANAGER.'),
      spacer(),
      bullet('Bancos (Bank) — instituições financeiras com código e país'),
      bullet('Produtos/Serviços (Product) — serviços de Trade Finance'),
      bullet('Equipas (Team) — grupos de trabalho com gestor, departamento e nó hierárquico'),
      bullet('Utilizadores (User) — gestão completa com roles e flags especiais'),
      bullet('Hierarquia Organizacional (OrgNode/OrgNodeMember) — árvore de departamentos'),
      bullet('Dados Mestres de Erros — Impactos, Origens, Categorias, Departamentos, Actividades, Tipos de Erro'),
      spacer(),
      h2('4.5 Portal de Chamados (/chamados)'),
      body('Kanban de suporte interno para bugs e pedidos de melhoria. Baseado em colunas Kanban com drag-and-drop.'),
      spacer(),
      bullet('Chamado — ticket com título, descrição, prioridade (LOW/MEDIUM/HIGH/CRITICAL), tipo (BUG/FEATURE/IMPROVEMENT/MAINTENANCE), responsável, data limite'),
      bullet('Estados Kanban: OPEN → IN_PROGRESS → IN_REVIEW → DONE → CANCELLED'),
      bullet('Comentários (ChamadoComment) e Anexos (ChamadoAttachment) por ticket'),
      bullet('Notas de Andamento (ChamadoNote) com timestamps'),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 5. BASE DE DADOS ═════════════════════════════
      h1('5. Base de Dados'),
      h2('5.1 Estratégia de Migrações'),
      body('O sistema usa um sistema de migrações próprio inspirado no Flyway. Os ficheiros SQL em database/migrations/ são nomeados com prefixo V00N__ e aplicados automaticamente no arranque do backend (run_migrations() no lifespan).'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2400, 6626],
        rows: [
          new TableRow({ children: [headerCell('Migration', 2400), headerCell('Conteúdo', 6626)] }),
          new TableRow({ children: [cell('V001', { width: 2400 }), cell('Schema inicial unificado: todas as tabelas operacionais', { width: 6626 })] }),
          new TableRow({ children: [cell('V002', { width: 2400 }), cell('Star schema DW: fact_training, dim_user, dim_course, dim_date, dim_error, fact_error', { width: 6626 })] }),
          new TableRow({ children: [cell('V003', { width: 2400 }), cell('Cápsulas side-by-side e tabelas de feedback', { width: 6626 })] }),
          new TableRow({ children: [cell('V004-V008', { width: 2400 }), cell('Hierarquia organizacional (OrgNode, OrgNodeMember), gestores de equipa', { width: 6626 })] }),
          new TableRow({ children: [cell('V009-V010', { width: 2400 }), cell('Correcções de collation (utf8mb4_unicode_ci) e dados bancários', { width: 6626 })] }),
          new TableRow({ children: [cell('V011-V012', { width: 2400 }), cell('Departamento em Team, normalização de níveis de impacto', { width: 6626 })] }),
        ]
      }),
      spacer(),
      h2('5.2 Data Warehouse — Star Schema'),
      body('O DW é populado por um pipeline ETL que corre no arranque e de hora em hora (scheduler assíncrono). Serve os dashboards do portal de Relatórios.'),
      spacer(),
      h3('Tabelas de Factos'),
      bullet('fact_training_summary — por utilizador e curso: matrículas, conclusões, horas, MPU, certificados'),
      bullet('fact_error_summary — por erro de tutoria: categoria, gravidade, estado, dias de resolução'),
      spacer(),
      h3('Tabelas de Dimensão'),
      bullet('dim_user — utilizador com role, equipa, tutor'),
      bullet('dim_course — curso com tipo, banco, produto, criador'),
      bullet('dim_date — calendário com ano, mês, trimestre, dia da semana'),
      bullet('dim_team — equipa com gestor, departamento, produto'),
      bullet('dim_error_category — hierarquia de categorias de erro'),
      spacer(),
      h2('5.3 Configuração MySQL'),
      bullet('Versão: 8.0.39'),
      bullet('Charset: utf8mb4 — suporte a emojis e caracteres especiais'),
      bullet('Collation: utf8mb4_unicode_ci — uniformizado em V009'),
      bullet('Volume persistente: tradehub_mysql_data (Docker named volume)'),
      bullet('Healthcheck: mysqladmin ping a cada 10s; 5 retries; 30s start_period'),
      bullet('Memória limitada: 512MB (Docker deploy.resources.limits)'),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 6. SEGURANÇA ═════════════════════════════════
      h1('6. Segurança'),
      h2('6.1 Autenticação e Autorização'),
      bullet('JWT (HS256) com expiração configurável via SECRET_KEY no .env'),
      bullet('Tokens armazenados no sessionStorage do browser (não localStorage — reduz risco XSS)'),
      bullet('PyJWT em substituição do python-jose (migração após CVE crítico)'),
      bullet('Refresh token implementado via interceptor Axios'),
      bullet('Passwords hasheadas com bcrypt (passlib) com rounds configurável'),
      bullet('Rate limiting por IP: 60 req/min por defeito (slowapi)'),
      spacer(),
      h2('6.2 Headers de Segurança HTTP'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3600, 5426],
        rows: [
          new TableRow({ children: [headerCell('Header', 3600), headerCell('Valor', 5426)] }),
          new TableRow({ children: [cell('X-Content-Type-Options', { width: 3600 }), cell('nosniff', { width: 5426 })] }),
          new TableRow({ children: [cell('X-Frame-Options', { width: 3600 }), cell('DENY', { width: 5426 })] }),
          new TableRow({ children: [cell('Referrer-Policy', { width: 3600 }), cell('strict-origin-when-cross-origin', { width: 5426 })] }),
          new TableRow({ children: [cell('Content-Security-Policy', { width: 3600 }), cell("default-src 'self'; script-src 'self'; frame-ancestors 'none'", { width: 5426 })] }),
          new TableRow({ children: [cell('Strict-Transport-Security', { width: 3600 }), cell('max-age=31536000; includeSubDomains (HTTPS only)', { width: 5426 })] }),
          new TableRow({ children: [cell('Permissions-Policy', { width: 3600 }), cell('camera=(), microphone=(), geolocation=()', { width: 5426 })] }),
        ]
      }),
      spacer(),
      h2('6.3 CORS'),
      bullet('Origins explícitas definidas via ALLOWED_ORIGINS no .env (sem wildcard em produção — H06)'),
      bullet('Regex adicional para localhost e IPs privados 192.168.x.x e 10.x.x.x'),
      bullet('Swagger/Redoc/OpenAPI desactivados em produção (DEBUG=False)'),
      spacer(),
      h2('6.4 Outras Medidas'),
      bullet('MySQL port 3306 bind apenas a 127.0.0.1 (não acessível externamente)'),
      bullet('Sem secrets no código — todas as variáveis sensíveis em .env (não commitado)'),
      bullet('DOMPurify no frontend para sanitização de conteúdo HTML renderizado'),
      bullet('Auditoria OWASP Top 10:2025 realizada em Março 2026 — 13 críticos e 22 altos corrigidos'),
      bullet('Log rotation configurado para ficheiros de log do servidor'),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 7. ETL E DATA WAREHOUSE ══════════════════════
      h1('7. Pipeline ETL e Data Warehouse'),
      h2('7.1 ETL Runner'),
      body('O ficheiro backend/app/etl/etl_runner.py contém a função run_full_etl(db) que orquestra todos os transformadores. É invocada:'),
      bullet('No arranque do backend (lifespan FastAPI)'),
      bullet('A cada hora pelo scheduler assíncrono _etl_scheduler()'),
      bullet('Manualmente via endpoint admin (se configurado)'),
      spacer(),
      h2('7.2 Fluxo ETL'),
      body('1. Leitura das tabelas operacionais (users, enrollments, lesson_progress, training_plans, tutoria_errors, challenge_submissions)'),
      body('2. Transformação e agregação para as dimensões (dim_user, dim_course, dim_date, dim_team)'),
      body('3. Carga nas tabelas de factos (fact_training_summary, fact_error_summary) com UPSERT'),
      body('4. Logging do resultado (linhas processadas, erros, duração)'),
      spacer(),
      note('O ETL é idempotente — pode ser executado múltiplas vezes sem duplicar dados. Usa INSERT ... ON DUPLICATE KEY UPDATE.'),
      spacer(),
      h2('7.3 Endpoints DW (/api/dw/*)'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3600, 5426],
        rows: [
          new TableRow({ children: [headerCell('Endpoint', 3600), headerCell('Dados Devolvidos', 5426)] }),
          new TableRow({ children: [cell('GET /api/dw/tutoria/by-month', { width: 3600 }), cell('Erros e resolvidos por mês/ano', { width: 5426 })] }),
          new TableRow({ children: [cell('GET /api/dw/tutoria/by-category', { width: 3600 }), cell('Erros por categoria de tipologia', { width: 5426 })] }),
          new TableRow({ children: [cell('GET /api/dw/tutoria/by-trainer', { width: 3600 }), cell('Erros, resolvidos e dias médios por tutor', { width: 5426 })] }),
          new TableRow({ children: [cell('GET /api/dw/training/by-month', { width: 3600 }), cell('Matrículas e conclusões por mês (filtro ?year=)', { width: 5426 })] }),
          new TableRow({ children: [cell('GET /api/dw/training/by-course', { width: 3600 }), cell('Top cursos por matrículas (filtro ?limit=)', { width: 5426 })] }),
        ]
      }),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 8. INFRA DOCKER ══════════════════════════════
      h1('8. Infraestrutura Docker'),
      h2('8.1 Serviços'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2400, 2000, 4626],
        rows: [
          new TableRow({ children: [headerCell('Container', 2400), headerCell('Imagem Base', 2000), headerCell('Configuração', 4626)] }),
          new TableRow({ children: [cell('tradehub-db', { width: 2400 }), cell('mysql:8.0.39', { width: 2000 }), cell('Volume persistente; healthcheck; memória 512MB; porta 3307 (DEV only)', { width: 4626 })] }),
          new TableRow({ children: [cell('tradehub-backend', { width: 2400 }), cell('python:3.13-slim', { width: 2000 }), cell('Multi-stage Dockerfile; hot reload DEV; depends_on db (healthy)', { width: 4626 })] }),
          new TableRow({ children: [cell('tradehub-frontend', { width: 2400 }), cell('nginx:alpine', { width: 2000 }), cell('Serve build Vite; lazy DNS resolver para proxy; porta 80', { width: 4626 })] }),
        ]
      }),
      spacer(),
      h2('8.2 Pipeline de Deploy (Produção)'),
      body('O workflow CI/CD do GitHub Actions executa:'),
      bullet('1. Checkout do código'),
      bullet('2. Instalação de dependências Python e npm'),
      bullet('3. Execução dos 341 testes pytest'),
      bullet('4. Build do frontend: npm run build (output: frontend/dist/)'),
      bullet('5. SSH para servidor de produção'),
      bullet('6. docker cp dist/. tradehub-frontend:/usr/share/nginx/html/'),
      bullet('7. nginx -s reload (zero-downtime reload)'),
      bullet('8. Restart do backend se necessário'),
      spacer(),
      note('O frontend é servido directamente do Nginx sem rebuild do container — apenas cópia de ficheiros estáticos e reload de configuração.'),
      spacer(),
      h2('8.3 Variáveis de Ambiente Críticas'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3200, 1600, 4226],
        rows: [
          new TableRow({ children: [headerCell('Variável', 3200), headerCell('Ambiente', 1600), headerCell('Descrição', 4226)] }),
          new TableRow({ children: [cell('SECRET_KEY', { width: 3200 }), cell('Backend', { width: 1600 }), cell('Chave de assinatura JWT (mínimo 32 chars, aleatório)', { width: 4226 })] }),
          new TableRow({ children: [cell('MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD', { width: 3200 }), cell('DB + Backend', { width: 1600 }), cell('Credenciais MySQL (diferentes em prod)', { width: 4226 })] }),
          new TableRow({ children: [cell('DATABASE_URL', { width: 3200 }), cell('Backend', { width: 1600 }), cell('URL SQLAlchemy de conexão à BD', { width: 4226 })] }),
          new TableRow({ children: [cell('ALLOWED_ORIGINS', { width: 3200 }), cell('Backend', { width: 1600 }), cell('Lista de origens CORS permitidas (vírgula separada)', { width: 4226 })] }),
          new TableRow({ children: [cell('DEBUG', { width: 3200 }), cell('Backend', { width: 1600 }), cell('False em produção (desactiva Swagger, activa HSTS)', { width: 4226 })] }),
          new TableRow({ children: [cell('VITE_API_URL', { width: 3200 }), cell('Frontend', { width: 1600 }), cell('URL base da API (ex: http://localhost:8100/api)', { width: 4226 })] }),
          new TableRow({ children: [cell('SMTP_*', { width: 3200 }), cell('Backend', { width: 1600 }), cell('Configuração de email para reset de password', { width: 4226 })] }),
        ]
      }),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 9. DECISÕES ARQUITECTURAIS ═══════════════════
      h1('9. Decisões Arquitecturais (ADRs)'),
      h2('ADR-001: SPA com Backend Separado vs. SSR'),
      body('Decisão: React SPA servida por Nginx; API REST FastAPI separada.'),
      body('Motivo: Permite deploy independente frontend/backend; frontend pode ser actualizado sem reiniciar o backend; hot reload em DEV é mais rápido.'),
      spacer(),
      h2('ADR-002: MySQL vs. PostgreSQL'),
      body('Decisão: MySQL 8.0.'),
      body('Motivo: Familiaridade da equipa de TI do Santander Portugal; compatibilidade com infraestrutura existente.'),
      spacer(),
      h2('ADR-003: DW em Schema Separado (Star Schema)'),
      body('Decisão: Tabelas fact_* e dim_* na mesma base de dados MySQL mas em schema lógico separado (prefixo de nome).'),
      body('Motivo: Evita joins complexos nos endpoints de relatórios; permite caching e indexação optimizada para leitura; desacopla mudanças no esquema operacional do esquema analítico.'),
      spacer(),
      h2('ADR-004: PyJWT em substituição de python-jose'),
      body('Decisão: Migração de python-jose para PyJWT em Março 2026.'),
      body('Motivo: CVE crítico encontrado em python-jose; PyJWT mantido activamente com suporte a HS256.'),
      spacer(),
      h2('ADR-005: Sem Framer Motion'),
      body('Decisão: Animações implementadas com CSS puro (keyframes + variáveis CSS).'),
      body('Motivo: Redução de bundle size; framer-motion é uma dependência pesada (>200KB); CSS animations têm melhor performance em dispositivos lentos.'),
      spacer(),
      h2('ADR-006: i18n com react-i18next (3 línguas)'),
      body('Decisão: Suporte a PT-PT (padrão), ES (espanhol) e EN (inglês).'),
      body('Motivo: O Santander opera em múltiplos mercados; permite expansão futura sem alterações de código; todas as strings visíveis devem passar pelo sistema de tradução.'),
      spacer(),
      h2('ADR-007: Migrações SQL Próprias vs. Alembic'),
      body('Decisão: Sistema próprio de migrações (padrão Flyway) em vez de Alembic.'),
      body('Motivo: Maior controlo sobre SQL exacto aplicado; mais simples para o perfil de alterações do projecto (schema additive, raramente destrutivo); fácil de auditar em produção.'),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════ 10. TESTES ════════════════════════════════════
      h1('10. Testes e Qualidade'),
      h2('10.1 Testes Unitários e Integração (pytest)'),
      body('341 testes pytest cobrem:'),
      bullet('Autenticação e autorização por role'),
      bullet('CRUD de entidades principais (cursos, lições, planos, erros)'),
      bullet('Lógica de negócio: cálculo de MPU, ciclo de estados, geração de certificados'),
      bullet('Endpoints de relatórios e DW'),
      bullet('Validação de schemas Pydantic'),
      spacer(),
      note('Os testes correm contra uma base de dados de teste real (não mocks) para garantir fidelidade — decisão tomada após incidente em que mocks mascararam uma migration quebrada.'),
      spacer(),
      h2('10.2 CI/CD'),
      body('O pipeline GitHub Actions corre os 341 testes em cada push para main/master. Build falha se qualquer teste falhar. Deploy apenas avança se build e testes passarem.'),
      spacer(),
      h2('10.3 Cobertura de Código'),
      body('pytest-cov configurado. Objectivo mínimo: 80% de cobertura nas rotas críticas (auth, tutoria, formações).'),
      spacer(),

      // ══════════════════════════ APÊNDICE ══════════════════════════════════════
      h1('Apêndice A — Estrutura de Directorias'),
      body('PortalTradeDataHub/'),
      body('├── backend/           — FastAPI app, ETL, migrations runner', { color: MID }),
      body('│   ├── app/           — package principal', { color: MID }),
      body('│   │   ├── models.py  — 30+ modelos SQLAlchemy', { color: MID }),
      body('│   │   ├── routers/   — 13 routers FastAPI', { color: MID }),
      body('│   │   ├── routes/    — routers legados (auth, admin, student, trainer...)', { color: MID }),
      body('│   │   ├── schemas/   — schemas Pydantic de request/response', { color: MID }),
      body('│   │   ├── etl/       — pipeline ETL star schema', { color: MID }),
      body('│   │   └── utils/     — email, helpers', { color: MID }),
      body('│   └── tests/         — 341 testes pytest', { color: MID }),
      body('├── frontend/          — React 18 SPA', { color: MID }),
      body('│   ├── src/pages/     — 80+ páginas TSX por portal', { color: MID }),
      body('│   ├── src/components/— componentes reutilizáveis', { color: MID }),
      body('│   │   └── reports/   — KpiCard, ChartCard, RateBar, ReportPageHeader', { color: MID }),
      body('│   ├── src/i18n/      — locales PT/ES/EN', { color: MID }),
      body('│   └── src/stores/    — Zustand (auth, sidebar)', { color: MID }),
      body('├── database/          — migrations SQL V001-V012', { color: MID }),
      body('├── docs/              — documentação técnica', { color: MID }),
      body('└── docker-compose.yml — orquestração DEV + PROD', { color: MID }),
      spacer(),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Arquitetura_Tecnica_PTH_TDH.docx', buffer);
  console.log('OK: Arquitetura_Tecnica_PTH_TDH.docx created');
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
