// FASE 5 — Manual_PTH.docx + Manual_TDH.docx
// node gen_manuais.js

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
const WHITE  = 'FFFFFF';
const LIGHT  = 'F8F8F8';
const BORDER = 'E0E0E0';
const GREEN  = '166534';
const AMBER  = '92400E';
const BLUE   = '1E3A5F';

function b() { return { style: BorderStyle.SINGLE, size: 1, color: BORDER }; }
function bs() { const x = b(); return { top: x, bottom: x, left: x, right: x }; }
function cell(text, opts = {}) {
  const { fill = WHITE, bold = false, color = DARK, width = 2000 } = opts;
  return new TableCell({
    borders: bs(), width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold, color, font: 'Arial', size: 20 })] })]
  });
}
function hc(text, width = 2000) { return cell(text, { fill: RED, bold: true, color: WHITE, width }); }

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, color: RED, font: 'Arial', size: 36 })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true, color: DARK, font: 'Arial', size: 28 })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, color: MID, font: 'Arial', size: 24 })]
  });
}
function body(text, opts = {}) {
  const { color = DARK, size = 22, bold = false } = opts;
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size, color, bold })]
  });
}
function bullet(text, opts = {}) {
  const { color = DARK, size = 22 } = opts;
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size, color })]
  });
}
function step(n, text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    numbering: { reference: 'numbers', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: DARK })]
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
function tip(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: `💡  ${text}`, font: 'Arial', size: 20, color: GREEN, italics: true })]
  });
}
function warning(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: `⚠  ${text}`, font: 'Arial', size: 20, color: AMBER, italics: true })]
  });
}
function callout(title, text, fill = 'FFF8E1') {
  return new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: b(), bottom: b(), left: { style: BorderStyle.SINGLE, size: 12, color: RED }, right: b() },
      width: { size: 9026, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, font: 'Arial', size: 22, color: RED })] }),
        new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text, font: 'Arial', size: 20, color: DARK })] }),
      ]
    })] })]
  });
}

const numbering = {
  config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]
};
const styles = {
  default: { document: { run: { font: 'Arial', size: 22 } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 36, bold: true, font: 'Arial', color: RED },
      paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 28, bold: true, font: 'Arial', color: DARK },
      paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 24, bold: true, font: 'Arial', color: MID },
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
  ]
};

function makeHeader(subtitle) {
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } },
      children: [
        new TextRun({ text: 'PortalTradeHub', bold: true, font: 'Arial', size: 18, color: RED }),
        new TextRun({ text: `   |   ${subtitle}`, font: 'Arial', size: 18, color: MID }),
      ]
    })]
  });
}
function makeFooter() {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER, space: 1 } },
      children: [
        new TextRun({ text: 'Confidencial — Trade Finance · Santander    ', font: 'Arial', size: 16, color: MID }),
        new TextRun({ text: 'Pág. ', font: 'Arial', size: 16, color: MID }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: RED }),
      ]
    })]
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MANUAL PTH — PORTAL DE FORMAÇÕES
// ═══════════════════════════════════════════════════════════════════════
const pthDoc = new Document({
  numbering, styles,
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: { default: makeHeader('Manual do Utilizador') },
    footers: { default: makeFooter() },
    children: [

      // CAPA
      new Paragraph({ spacing: { before: 1800, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'SANTANDER', bold: true, font: 'Arial', size: 72, color: RED })] }),
      new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Trade Finance', font: 'Arial', size: 36, color: MID })] }),
      rule(),
      new Paragraph({ spacing: { before: 400, after: 160 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Manual do Utilizador', bold: true, font: 'Arial', size: 52, color: DARK })] }),
      new Paragraph({ spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'PortalTradeHub', font: 'Arial', size: 38, color: RED, bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Portal de Formações e Tutoria', font: 'Arial', size: 30, color: MID })] }),
      new Table({
        width: { size: 7200, type: WidthType.DXA }, alignment: AlignmentType.CENTER,
        columnWidths: [2400, 4800],
        rows: [
          new TableRow({ children: [hc('Versão', 2400), cell('1.0', { width: 4800 })] }),
          new TableRow({ children: [hc('Data', 2400), cell('Março 2026', { width: 4800 })] }),
          new TableRow({ children: [hc('Idioma', 2400), cell('Português (PT)', { width: 4800 })] }),
          new TableRow({ children: [hc('Destinatários', 2400), cell('Formandos, Formadores, Gestores, Administradores', { width: 4800 })] }),
        ]
      }),
      pb(),

      // ÍNDICE
      new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-3' }),
      pb(),

      // 1. INTRODUÇÃO
      h1('1. Introdução'),
      body('O PortalTradeHub é a plataforma digital de formação da equipa de Trade Finance do Santander Portugal. Centraliza a gestão de cursos, lições, desafios práticos, planos de formação individuais e emissão de certificados num único ambiente.'),
      spacer(),
      body('Este manual destina-se a todos os utilizadores da plataforma. Cada secção está indicada com o(s) perfil(is) a que se aplica.'),
      spacer(),

      h2('1.1 Perfis de Utilizador'),
      body('O acesso é controlado por flags individuais — o mesmo utilizador pode ter vários papéis activos em simultâneo.'),
      spacer(),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [2200, 6826],
        rows: [
          new TableRow({ children: [hc('Perfil (role)', 2200), hc('O que pode fazer', 6826)] }),
          new TableRow({ children: [cell('ADMIN', { width: 2200, bold: true, color: RED }), cell('Acesso total: utilizadores, dados mestres, validação de contas, relatórios globais', { width: 6826 })] }),
          new TableRow({ children: [cell('DIRETOR', { width: 2200, bold: true }), cell('Leitura de todos os dados (dashboards globais, relatórios, equipas) sem edição', { width: 6826 })] }),
          new TableRow({ children: [cell('GERENTE', { width: 2200, bold: true }), cell('Gestão de equipas, aprovação de planos, exportação de relatórios de equipa', { width: 6826 })] }),
          new TableRow({ children: [cell('CHEFE_EQUIPE', { width: 2200, bold: true }), cell('Visibilidade da sua equipa, aprovação de planos de acção, análise de erros', { width: 6826 })] }),
          new TableRow({ children: [cell('FORMADOR', { width: 2200, bold: true }), cell('Criar cursos, lições e desafios; gerir planos de formação; rever submissões', { width: 6826 })] }),
          new TableRow({ children: [cell('USUARIO', { width: 2200, bold: true }), cell('Acesso a cursos atribuídos, execução de lições e desafios, certificados pessoais', { width: 6826 })] }),
        ]
      }),
      spacer(),
      body('Flags de permissão adicionais (independentes do role principal):', { bold: true }),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [2200, 6826],
        rows: [
          new TableRow({ children: [hc('Flag', 2200), hc('Permissão adicional', 6826)] }),
          new TableRow({ children: [cell('is_tutor', { width: 2200 }), cell('Acesso ao portal de tutoria — análise de erros, planos 5W2H, fichas de aprendizagem', { width: 6826 })] }),
          new TableRow({ children: [cell('is_liberador', { width: 2200 }), cell('Pode registar erros operacionais no portal de tutoria', { width: 6826 })] }),
          new TableRow({ children: [cell('is_referente', { width: 2200 }), cell('Representante do chefe de equipa na análise de incidências', { width: 6826 })] }),
        ]
      }),
      spacer(),

      h2('1.2 Acesso à Plataforma'),
      step(1, 'Abra o browser e aceda ao endereço da plataforma fornecido pelo administrador.'),
      step(2, 'Introduza o seu email e password na página de login.'),
      step(3, 'Clique em "Entrar". Será redireccionado para o seu dashboard personalizado.'),
      spacer(),
      tip('Se não se recordar da password, clique em "Esqueci a minha password" e siga as instruções enviadas por email.'),
      warning('A sessão expira após inactividade prolongada. Guarde os seus dados antes de sair.'),
      pb(),

      // 2. DASHBOARD
      h1('2. Dashboard'),
      h2('2.1 Dashboard do Utilizador (USUARIO)'),
      body('O dashboard do formando apresenta um resumo imediato da sua actividade:'),
      spacer(),
      bullet('Matrículas activas — cursos em que está inscrito'),
      bullet('Planos de formação — planos atribuídos pelo formador com datas e progresso'),
      bullet('Lições concluídas — total de lições realizadas'),
      bullet('Certificados obtidos — certificados emitidos'),
      bullet('MPU pessoal — minutos por operação médio das suas lições'),
      bullet('Desafios e submissões — estado dos desafios realizados'),
      spacer(),
      callout('Indicador MPU', 'O MPU (Minutos por Operação / Minuto por Unidade) mede a eficiência operacional. Um valor mais baixo indica maior rapidez na execução. O target é definido por cada desafio ou lição.', 'F0F9FF'),
      spacer(),

      h2('2.2 Dashboard do Formador (FORMADOR)'),
      body('O dashboard do formador apresenta:'),
      bullet('Total de alunos sob tutoria'),
      bullet('Cursos criados e activos'),
      bullet('Submissões pendentes de revisão (badge vermelho quando existem)'),
      bullet('Taxa de conclusão dos planos dos seus formandos'),
      bullet('MPU médio dos formandos'),
      bullet('Horas totais de formação registadas'),
      pb(),

      // 3. CURSOS
      h1('3. Cursos e Lições'),
      h2('3.1 Consultar Cursos Disponíveis (USUARIO)'),
      step(1, 'No menu lateral, clique em "Os Meus Cursos".'),
      step(2, 'Verá a lista de cursos em que está matriculado.'),
      step(3, 'Clique num curso para ver as lições disponíveis.'),
      step(4, 'Uma lição só aparece disponível após o formador a libertar. Lições bloqueadas mostram um cadeado.'),
      spacer(),

      h2('3.2 Executar uma Lição (USUARIO)'),
      body('As lições práticas têm cronometragem de tempo. O processo é:'),
      spacer(),
      step(1, 'Clique em "Iniciar Lição" — o cronómetro arranca automaticamente.'),
      step(2, 'Execute a operação conforme descrito no conteúdo da lição.'),
      step(3, 'Se precisar de interromper, clique em "Pausar". O tempo pára e pode retomar mais tarde.'),
      step(4, 'Quando terminar, clique em "Terminar Lição". O sistema calcula o MPU automaticamente.'),
      step(5, 'Confirme que realizou a operação clicando em "Confirmar Execução".'),
      step(6, 'Aguarde que o formador finalize a lição. Receberá uma notificação.'),
      spacer(),
      tip('Pode pausar uma lição quantas vezes precisar. O tempo acumulado em pausa não conta para o MPU.'),
      spacer(),

      h2('3.3 Criar um Curso (FORMADOR)'),
      step(1, 'No menu, clique em "Cursos" → "Criar Novo Curso".'),
      step(2, 'Preencha o título, descrição, nível (Iniciante/Intermédio/Avançado) e tipo.'),
      step(3, 'Seleccione os bancos e produtos associados ao curso.'),
      step(4, 'Clique em "Guardar". O curso é criado com status "Activo".'),
      step(5, 'Adicione lições ao curso clicando em "Adicionar Lição".'),
      spacer(),

      h2('3.4 Gerir Lições (FORMADOR)'),
      body('Para cada lição pode definir:'),
      bullet('Título e descrição da tarefa a realizar'),
      bullet('Tipo: Teórica (sem cronometragem estrita) ou Prática (com MPU)'),
      bullet('Tempo estimado em minutos (define o target de MPU)'),
      bullet('Conteúdo HTML com as instruções detalhadas'),
      bullet('URL de vídeo de apoio e materiais de estudo'),
      bullet('Quem pode iniciar: Formador (mais controlo) ou Formando (auto-serviço)'),
      spacer(),
      warning('Após um formando iniciar uma lição, o tempo estimado não pode ser alterado nessa sessão.'),
      pb(),

      // 4. PLANOS DE FORMAÇÃO
      h1('4. Planos de Formação'),
      h2('4.1 Ver os Meus Planos (USUARIO)'),
      body('O menu "Os Meus Planos" mostra todos os planos de formação que lhe foram atribuídos:'),
      bullet('Título do plano e formador responsável'),
      bullet('Data de início e data limite'),
      bullet('Progresso — percentagem de conclusão'),
      bullet('Cursos incluídos no plano e respectivo estado (Pendente / Em Curso / Concluído)'),
      bullet('Certificado disponível quando o plano é finalizado'),
      spacer(),

      h2('4.2 Criar e Atribuir um Plano (FORMADOR)'),
      step(1, 'Clique em "Planos de Formação" → "Novo Plano".'),
      step(2, 'Defina título, descrição, data de início e data limite.'),
      step(3, 'Adicione os cursos que fazem parte do plano (por ordem).'),
      step(4, 'Atribua o plano a um formando clicando em "Adicionar Formando".'),
      step(5, 'O formando recebe acesso imediato ao plano.'),
      spacer(),

      h2('4.3 Finalizar um Plano e Emitir Certificado (FORMADOR)'),
      step(1, 'Abra o plano concluído pelo formando.'),
      step(2, 'Verifique que todos os cursos estão marcados como "Concluído".'),
      step(3, 'Clique em "Finalizar Plano".'),
      step(4, 'O sistema gera automaticamente o certificado PDF com número único.'),
      step(5, 'O formando pode descarregar o certificado em "Os Meus Certificados".'),
      spacer(),
      tip('Um plano "Permanente" renova automaticamente no início de cada ano, sem necessidade de recriar.'),
      pb(),

      // 5. DESAFIOS
      h1('5. Desafios Práticos'),
      h2('5.1 Executar um Desafio (USUARIO)'),
      body('Os desafios são avaliações práticas com critérios de aprovação configuráveis pelo formador. Existem dois tipos:'),
      spacer(),
      body('Tipo COMPLETO (linha a linha):', { bold: true }),
      bullet('Cada operação é registada individualmente com timestamp de início e fim.'),
      bullet('O sistema calcula o MPU de cada operação automaticamente.'),
      bullet('Pode indicar se uma operação teve erro e descrever o tipo de erro.'),
      spacer(),
      body('Tipo RESUMIDO (summary):', { bold: true }),
      bullet('Insere o total de operações e o tempo total no final.'),
      bullet('Indica o número e tipo de erros cometidos.'),
      spacer(),
      step(1, 'O desafio tem de estar libertado pelo formador para aparecer disponível.'),
      step(2, 'Clique em "Iniciar Desafio".'),
      step(3, 'Execute as operações conforme as instruções.'),
      step(4, 'Clique em "Submeter para Revisão" quando terminar.'),
      step(5, 'Aguarde a revisão do formador. Receberá notificação do resultado.'),
      spacer(),

      h2('5.2 Rever Submissões (FORMADOR)'),
      body('As submissões pendentes aparecem com badge no menu. Para rever:'),
      step(1, 'Clique em "Submissões Pendentes".'),
      step(2, 'Seleccione a submissão do formando.'),
      step(3, 'Analise os KPIs: volume de operações, MPU calculado, erros.'),
      step(4, 'No modo MANUAL, decida "Aprovado" ou "Reprovado" e adicione feedback.'),
      step(5, 'No modo AUTO, o sistema decide automaticamente com base nos critérios configurados.'),
      step(6, 'Se reprovado e allow_retry=Sim, pode activar nova tentativa clicando em "Permitir Re-tentativa".'),
      spacer(),
      callout('Critérios de Aprovação Automática', 'Volume de operações: >= operações_necessárias | MPU: <= target_mpu | Erros: <= max_errors. Todos os critérios activos têm de ser satisfeitos simultaneamente.', 'F0F9FF'),
      pb(),

      // 6. TUTORIA
      h1('6. Portal de Tutoria'),
      h2('6.1 O que é a Tutoria'),
      body('O portal de tutoria permite registar, acompanhar e resolver erros operacionais cometidos no processamento de operações de Trade Finance. É o equivalente digital do formulário Access utilizado anteriormente.'),
      spacer(),

      h2('6.2 Registar um Erro (LIBERADOR / ADMIN)'),
      step(1, 'No menu lateral, clique em "Tutoria" → "Registar Erro".'),
      step(2, 'Preencha a data de ocorrência, banco, referência e descrição do erro.'),
      step(3, 'Classifique o erro: impacto (ALTA/BAIXA), origem, categoria (Tipología), departamento, actividade.'),
      step(4, 'Indique o gravador (quem cometeu o erro) e o liberador responsável.'),
      step(5, 'Se houver múltiplas referências na operação, use o botão "+ Adicionar Referência".'),
      step(6, 'Clique em "Guardar". O erro fica com estado REGISTERED.'),
      spacer(),
      warning('Campos de classificação (impacto, origem, categoria) são obrigatórios para avançar no ciclo de resolução.'),
      spacer(),

      h2('6.3 Ciclo de Vida de um Erro'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [2200, 1800, 5026],
        rows: [
          new TableRow({ children: [hc('Estado', 2200), hc('Quem actua', 1800), hc('Acção', 5026)] }),
          new TableRow({ children: [cell('REGISTERED', { width: 2200 }), cell('Tutor', { width: 1800 }), cell('Verificar o registo e iniciar análise → clique em "Verificar"', { width: 5026 })] }),
          new TableRow({ children: [cell('IN_ANALYSIS', { width: 2200 }), cell('Tutor', { width: 1800 }), cell('Preencher análise 5 Porquês e criar Plano de Acção', { width: 5026 })] }),
          new TableRow({ children: [cell('PLAN_CREATED', { width: 2200 }), cell('Responsável', { width: 1800 }), cell('Plano de acção 5W2H criado e em preparação', { width: 5026 })] }),
          new TableRow({ children: [cell('IN_PROGRESS', { width: 2200 }), cell('Responsável', { width: 1800 }), cell('Executar as acções do plano; actualizar progresso dos itens', { width: 5026 })] }),
          new TableRow({ children: [cell('RESOLVED', { width: 2200 }), cell('Tutor', { width: 1800 }), cell('Confirmar solução implementada → clique em "Resolver"', { width: 5026 })] }),
          new TableRow({ children: [cell('CANCELLED', { width: 2200 }), cell('Admin', { width: 1800 }), cell('Cancelar registo inválido (requer motivo)', { width: 5026 })] }),
        ]
      }),
      spacer(),

      h2('6.4 Planos de Acção 5W2H (TUTOR)'),
      body('Um plano de acção estrutura a resposta ao erro segundo a metodologia 5W2H:'),
      bullet('O quê — acção correctiva a implementar'),
      bullet('Porquê — justificação da acção'),
      bullet('Onde — local / sistema afectado'),
      bullet('Quando — prazo (deadline)'),
      bullet('Quem — responsável pela execução'),
      bullet('Como — método de implementação'),
      bullet('Quanto custa — recursos necessários'),
      spacer(),
      body('Cada plano pode ter múltiplos itens de acção (IMEDIATA / CORRETIVA / PREVENTIVA). Cada item tem responsável, prazo e estado (PENDENTE → EM_ANDAMENTO → CONCLUIDO).'),
      spacer(),

      h2('6.5 Fichas de Aprendizagem'),
      body('Após a resolução de um erro, o tutor pode criar uma Ficha de Aprendizagem para o tutorado:'),
      bullet('Resumo do erro e causa raiz identificada'),
      bullet('Procedimento correcto a seguir no futuro'),
      bullet('Pontos-chave de aprendizagem'),
      bullet('Material de referência (links, documentos)'),
      spacer(),
      body('O tutorado recebe notificação e deve ler e reconhecer a ficha. O tutor pode definir se a ficha é obrigatória.'),
      spacer(),

      h2('6.6 Sessões Side-by-Side'),
      body('O tutor pode agendar sessões de acompanhamento presencial (side-by-side) onde observa o tutorado a executar operações. A sessão é registada com data, notas e resultado.'),
      pb(),

      // 7. RELATÓRIOS (Formando/Formador)
      h1('7. Os Meus Relatórios'),
      h2('7.1 Relatório do Formando'),
      body('Em "Os Meus Relatórios" (menu do formando), pode ver:'),
      bullet('Histórico de lições com MPU, data e resultado'),
      bullet('Histórico de desafios com score, MPU e resultado (Aprovado/Reprovado)'),
      bullet('Evolução do MPU ao longo do tempo'),
      bullet('Comparação com o target de cada desafio'),
      spacer(),

      h2('7.2 Avaliações (Ratings)'),
      body('Após concluir uma lição, desafio, ou plano, pode avaliar a experiência com 1 a 5 estrelas e um comentário opcional. As avaliações ajudam o formador a melhorar os conteúdos.'),
      spacer(),

      h2('7.3 Certificados'),
      body('Em "Os Meus Certificados" pode:'),
      bullet('Ver todos os certificados emitidos com data, plano e horas'),
      bullet('Descarregar o certificado em PDF para partilhar'),
      bullet('Verificar o número único do certificado para validação externa'),
      pb(),

      // 8. CHAT FAQ
      h1('8. Chatbot de Suporte'),
      body('O chatbot está disponível no canto inferior direito de todas as páginas. Responde a dúvidas frequentes sobre:'),
      bullet('Como iniciar/pausar uma lição'),
      bullet('Como submeter um desafio'),
      bullet('Como ver os meus certificados'),
      bullet('Problemas de acesso e login'),
      bullet('Questões sobre o portal de tutoria'),
      spacer(),
      body('Escreva a sua questão em linguagem natural. O chatbot detecta palavras-chave em PT, ES e EN.'),
      spacer(),
      tip('Se o chatbot não responder à sua questão, use o Portal de Chamados para reportar o problema.'),
      pb(),

      // 9. CHAMADOS
      h1('9. Portal de Chamados (Suporte Técnico)'),
      body('O portal de chamados permite reportar bugs ou pedir melhorias à equipa técnica:'),
      step(1, 'Clique em "Chamados" no menu lateral.'),
      step(2, 'Clique em "Novo Chamado".'),
      step(3, 'Indique o tipo (Bug / Melhoria), prioridade, portal afectado e descrição detalhada.'),
      step(4, 'Opcionalmente, adicione capturas de ecrã (screenshots).'),
      step(5, 'Clique em "Submeter". O chamado aparece no Kanban e será atribuído a um responsável.'),
      spacer(),
      body('Pode acompanhar o estado do seu chamado (Aberto → Em Andamento → Em Revisão → Concluído) e adicionar comentários.'),
    ]
  }]
});

// ═══════════════════════════════════════════════════════════════════════
// MANUAL TDH — PORTAL DE RELATÓRIOS + DADOS MESTRES (Gestor/Admin)
// ═══════════════════════════════════════════════════════════════════════
const tdhDoc = new Document({
  numbering, styles,
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: { default: makeHeader('Manual de Gestão e Relatórios') },
    footers: { default: makeFooter() },
    children: [

      // CAPA
      new Paragraph({ spacing: { before: 1800, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'SANTANDER', bold: true, font: 'Arial', size: 72, color: RED })] }),
      new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Trade Finance', font: 'Arial', size: 36, color: MID })] }),
      rule(),
      new Paragraph({ spacing: { before: 400, after: 160 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Manual de Gestão', bold: true, font: 'Arial', size: 52, color: DARK })] }),
      new Paragraph({ spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Trade Data Hub', font: 'Arial', size: 38, color: RED, bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Relatórios, Dados Mestres e Administração', font: 'Arial', size: 30, color: MID })] }),
      new Table({
        width: { size: 7200, type: WidthType.DXA }, alignment: AlignmentType.CENTER,
        columnWidths: [2400, 4800],
        rows: [
          new TableRow({ children: [hc('Versão', 2400), cell('1.0', { width: 4800 })] }),
          new TableRow({ children: [hc('Data', 2400), cell('Março 2026', { width: 4800 })] }),
          new TableRow({ children: [hc('Destinatários', 2400), cell('Administradores, Gestores / Chefes de Equipa', { width: 4800 })] }),
          new TableRow({ children: [hc('Pré-requisito', 2400), cell('Manual do Utilizador PTH (Manual_PTH.docx)', { width: 4800 })] }),
        ]
      }),
      pb(),

      // ÍNDICE
      new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-3' }),
      pb(),

      // 1. PORTAL DE RELATÓRIOS
      h1('1. Portal de Relatórios (/relatorios)'),
      body('O portal de relatórios apresenta dashboards analíticos em tempo real. Os dados são filtrados automaticamente por flags de permissão: ADMIN/DIRETOR vêem tudo, GERENTE/CHEFE_EQUIPE vêem a sua equipa, FORMADOR vê os seus formandos.'),
      spacer(),

      h2('1.1 Overview — Visão Global'),
      body('O overview é a página inicial do portal de relatórios. Apresenta 6 KPIs principais:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [hc('KPI', 3000), hc('O que mede', 6026)] }),
          new TableRow({ children: [cell('Total de Utilizadores', { width: 3000 }), cell('Utilizadores activos no scope (equipa/global)', { width: 6026 })] }),
          new TableRow({ children: [cell('Cursos', { width: 3000 }), cell('Cursos activos na plataforma', { width: 6026 })] }),
          new TableRow({ children: [cell('Planos Activos', { width: 3000 }), cell('Planos de formação em curso', { width: 6026 })] }),
          new TableRow({ children: [cell('Certificados', { width: 3000 }), cell('Certificados emitidos no período', { width: 6026 })] }),
          new TableRow({ children: [cell('Erros de Tutoria', { width: 3000 }), cell('Erros registados no portal de tutoria', { width: 6026 })] }),
          new TableRow({ children: [cell('Taxa de Resolução', { width: 3000 }), cell('% de erros resolvidos vs total', { width: 6026 })] }),
        ]
      }),
      spacer(),

      h2('1.2 Dashboard de Formações'),
      body('Análise detalhada do módulo de formações:'),
      bullet('Matrículas totais e concluídas com taxa de conclusão (%)'),
      bullet('Taxa de aprovação em desafios — submissões aprovadas / total'),
      bullet('Horas totais de estudo registadas'),
      bullet('MPU médio da plataforma'),
      bullet('Certificados emitidos no período'),
      bullet('Gráfico de área — evolução mensal de matrículas e conclusões'),
      bullet('Planos por estado — gráfico de barras (Pendente/Em Curso/Concluído/Atrasado)'),
      bullet('Erros por tipologia — donut chart (Metodologia/Conhecimento/Detalhe/Procedimento)'),
      bullet('Top 8 cursos por número de matrículas'),
      spacer(),

      h2('1.3 Dashboard de Tutoria'),
      body('Análise do módulo de tutoria e erros operacionais:'),
      bullet('Total de erros registados'),
      bullet('Taxa de resolução — erros resolvidos / total (%)'),
      bullet('Taxa de recorrência — erros recorrentes / total (%)'),
      bullet('Erros críticos (severity=CRITICA)'),
      bullet('Erros em aberto (status=OPEN)'),
      bullet('Planos de acção concluídos'),
      bullet('Gráfico de área — evolução mensal de erros registados vs resolvidos'),
      bullet('Donut chart — distribuição por gravidade (BAIXA/MÉDIA/ALTA/CRÍTICA)'),
      bullet('Gráfico de barras — erros por estado'),
      bullet('BarList — top 10 categorias de erros'),
      bullet('Gráfico de barras — planos de acção por estado'),
      bullet('Tabela de tutores — erros, resolvidos, taxa e dias médios de resolução'),
      spacer(),

      h2('1.4 Dashboard de Equipas'),
      body('Análise por equipa (ADMIN / DIRETOR / GERENTE):'),
      bullet('Total de equipas activas e membros'),
      bullet('Taxa de conclusão média das equipas'),
      bullet('BarList — taxa de conclusão por equipa (ordenado)'),
      bullet('BarList — erros por equipa'),
      bullet('Tabela com: equipa, produto, gestor, membros, erros, taxa de conclusão, MPU médio'),
      bullet('Pesquisa de equipas por nome ou produto'),
      spacer(),

      h2('1.5 Dashboard de Membros'),
      body('Análise individual por utilizador (ADMIN / DIRETOR / GERENTE):'),
      bullet('Totais: membros, taxa média de conclusão, erros totais, certificados'),
      bullet('Tabela completa com todos os membros, ordenável por qualquer coluna'),
      bullet('Para cada membro: erros, planos (concluídos/total), taxa de conclusão, MPU médio, certificados'),
      bullet('Pesquisa por nome ou email'),
      spacer(),

      h2('1.6 Relatório de Incidentes (Exportação)'),
      body('Tabela completa de todas as incidências com filtros avançados:'),
      bullet('Filtro por intervalo de datas (data de ocorrência)'),
      bullet('Filtro por estado: REGISTERED, IN_ANALYSIS, PLAN_CREATED, IN_PROGRESS, RESOLVED, CANCELLED'),
      bullet('Filtro por gravidade: BAIXA, MÉDIA, ALTA, CRÍTICA'),
      bullet('Filtro por banco'),
      bullet('Exportação para Excel (botão "Exportar Excel")'),
      spacer(),
      callout('Exportação para Excel', 'O botão "Exportar Excel" gera um ficheiro .xlsx com todas as incidências filtradas. Inclui todas as colunas do registo original (banco, referência, impacto, origem, categoria, datas, solução).', 'F0F9FF'),
      pb(),

      // 2. DADOS MESTRES
      h1('2. Portal de Dados Mestres (/master-data)'),
      body('O portal de dados mestres é a fonte de verdade para todos os dados de referência do sistema. Acesso permitido a ADMIN, DIRETOR e GERENTE.'),
      spacer(),

      h2('2.1 Bancos'),
      body('Gestão das instituições financeiras usadas nos cursos e erros de tutoria:'),
      step(1, 'Clique em "Bancos" no menu de Dados Mestres.'),
      step(2, 'Para criar: clique em "Novo Banco", introduza código, nome e país, e clique em "Guardar".'),
      step(3, 'Para editar: clique no ícone de lápis na linha do banco.'),
      step(4, 'Para desactivar: use o toggle na coluna "Activo". Bancos inactivos não aparecem em novos registos.'),
      spacer(),
      warning('Não é possível eliminar um banco que já esteja associado a cursos ou erros. Use a desactivação.'),
      spacer(),

      h2('2.2 Produtos / Serviços'),
      body('Produtos de Trade Finance (ex: Garantias, Créditos Documentários, Remessas). Mesmo fluxo que os Bancos.'),
      spacer(),

      h2('2.3 Equipas'),
      body('Gestão das equipas de trabalho:'),
      step(1, 'Clique em "Equipas" → "Nova Equipa".'),
      step(2, 'Defina nome, descrição, departamento, gestor e nó hierárquico.'),
      step(3, 'Após criar, adicione membros: clique em "Gerir Membros" → pesquise utilizador → clique em "Adicionar".'),
      step(4, 'Associe serviços à equipa: separador "Serviços" → seleccione produtos associados.'),
      spacer(),

      h2('2.4 Utilizadores'),
      body('Gestão completa de utilizadores (ADMIN):'),
      step(1, 'Clique em "Utilizadores" → "Novo Utilizador".'),
      step(2, 'Preencha nome, email, role e password temporária.'),
      step(3, 'Active as flags necessárias: is_formador (pode criar cursos), is_tutor (pode fazer tutoria), is_liberador (pode registar erros), is_chefe_equipe (chefe de equipa), is_referente (representante de análise).'),
      step(4, 'Atribua à equipa correspondente.'),
      step(5, 'O utilizador recebe email com as credenciais (se SMTP configurado).'),
      spacer(),
      tip('Para validar uma conta pendente (is_pending=True), abra o utilizador em "Utilizadores" e clique em "Validar". Contas com is_formador, is_tutor, is_liberador, is_gerente ou is_chefe_equipe ficam pendentes até validação.'),
      spacer(),

      h2('2.5 Hierarquia Organizacional'),
      body('A hierarquia organizacional estrutura a empresa em nós (divisões → departamentos → equipas):'),
      step(1, 'Clique em "Hierarquia Org." → "Novo Nó".'),
      step(2, 'Defina nome, tipo (Divisão/Departamento/Equipa) e nó pai (se aplicável).'),
      step(3, 'Adicione membros ao nó com o seu role dentro da estrutura.'),
      step(4, 'A árvore hierárquica é visível no separador "Árvore Org."'),
      spacer(),

      h2('2.6 Dados Mestres de Erros'),
      body('Configure os dados de referência usados no registo de erros de tutoria:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [hc('Secção', 3000), hc('O que configura', 6026)] }),
          new TableRow({ children: [cell('Impactos', { width: 3000 }), cell('Tipos de impacto (ALTA/BAIXA) com imagem ilustrativa', { width: 6026 })] }),
          new TableRow({ children: [cell('Origens', { width: 3000 }), cell('Origens dos erros (Trade_Personas, Trade_Procesos, Terceiros)', { width: 6026 })] }),
          new TableRow({ children: [cell('Categorias (Tipología)', { width: 3000 }), cell('Hierarquia de categorias de erros (pai → filho)', { width: 6026 })] }),
          new TableRow({ children: [cell('Detectado Por', { width: 3000 }), cell('Quem identificou o erro (Liberador, Chefe, Auditoria)', { width: 6026 })] }),
          new TableRow({ children: [cell('Departamentos', { width: 3000 }), cell('Departamentos da organização', { width: 6026 })] }),
          new TableRow({ children: [cell('Actividades', { width: 3000 }), cell('Actividades operacionais (depende de Banco + Depto)', { width: 6026 })] }),
          new TableRow({ children: [cell('Tipos de Erro', { width: 3000 }), cell('Tipos de campo/código SWIFT em erro (depende de Actividade)', { width: 6026 })] }),
        ]
      }),
      pb(),

      // 3. ADMINISTRAÇÃO
      h1('3. Administração do Sistema'),
      h2('3.1 Gestão de Formadores Pendentes'),
      body('Quando um utilizador se regista com uma flag de permissão elevada (is_formador, is_tutor, is_liberador, is_gerente, is_chefe_equipe), fica pendente de validação (is_pending=True). O ADMIN recebe notificação e deve:'),
      step(1, 'Ir a "Utilizadores" → filtrar por "Pendentes".'),
      step(2, 'Rever o perfil do formador.'),
      step(3, 'Clicar em "Validar" para activar, ou "Rejeitar" para recusar o acesso.'),
      spacer(),

      h2('3.2 Gestão de FAQs do Chatbot'),
      body('Configure as respostas automáticas do chatbot de suporte:'),
      step(1, 'Clique em "FAQ Admin" no menu de tutoria.'),
      step(2, 'Crie uma nova entrada com palavras-chave (PT/ES/EN) e resposta (PT/ES/EN).'),
      step(3, 'Opcionalmente, adicione URL de material de apoio e filtro por role.'),
      step(4, 'Defina a prioridade (menor número = maior prioridade em caso de conflito).'),
      spacer(),

      h2('3.3 Configuração de Inquéritos de Feedback'),
      body('Os inquéritos de feedback são enviados semanalmente aos Liberadores para avaliar a qualidade das operações:'),
      step(1, 'Clique em "Feedback" → "Novo Inquérito".'),
      step(2, 'Defina o período de recolha.'),
      step(3, 'Os Liberadores recebem notificação e preenchem o inquérito.'),
      step(4, 'Quando o período terminar, clique em "Fechar Inquérito".'),
      step(5, 'O dashboard de feedback apresenta os resultados agregados (scores, NPS, tendências).'),
      spacer(),

      h2('3.4 Gestão de Sensos (Erros Internos)'),
      body('Os Sensos são períodos de censagem de erros internos (identificados pelo liberador após gravação):'),
      step(1, 'Crie um Senso com data de início e fim.'),
      step(2, 'Os Liberadores registam erros internos durante o período activo.'),
      step(3, 'Os Gravadores recebem notificação e devem preencher os 5 Porquês.'),
      step(4, 'O tutor avalia e cria Fichas de Aprendizagem ou Planos de Acção.'),
      step(5, 'Feche o Senso quando o período terminar.'),
      spacer(),

      h2('3.5 Monitorização de Prazo de Erros'),
      body('O sistema verifica diariamente os erros com prazo vencido. Quando um erro ultrapassa o prazo mensal sem resolução, o sistema envia automaticamente uma notificação ao responsável pelo erro. O ADMIN pode ver o histórico de alertas enviados.'),
      spacer(),

      h2('3.6 Backup e Deploy'),
      body('O sistema é actualizado pelo pipeline de CI/CD. Para verificar o estado:'),
      bullet('Aceda ao GitHub do projecto → separador "Actions" para ver o último deploy.'),
      bullet('O servidor serve o frontend em /usr/share/nginx/html/ — ficheiros actualizados automaticamente após build.'),
      bullet('A base de dados é persistida num Docker volume (tradehub_mysql_data). Não perde dados em reinícios.'),
      bullet('Migrações SQL são aplicadas automaticamente no arranque do backend.'),
      spacer(),
      callout('Atenção: Migração Automática', 'A cada reinício do backend, as migrações SQL pendentes são aplicadas automaticamente. Não é necessária intervenção manual. Em caso de erro de migração, o sistema regista o erro mas continua a funcionar (non-fatal).', 'FFF8E1'),
    ]
  }]
});

// ─── Escrever ficheiros ────────────────────────────────────────────────────────
Promise.all([
  Packer.toBuffer(pthDoc).then(buf => { fs.writeFileSync('Manual_PTH.docx', buf); return 'Manual_PTH.docx'; }),
  Packer.toBuffer(tdhDoc).then(buf => { fs.writeFileSync('Manual_TDH.docx', buf); return 'Manual_TDH.docx'; }),
]).then(files => {
  files.forEach(f => console.log(`OK: ${f} created`));
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
