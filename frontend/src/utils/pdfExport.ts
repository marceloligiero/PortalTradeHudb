import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Logo base64 (Santander vermelho)
const SANTANDER_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHJ4PSI4IiBmaWxsPSIjRUMwMDAwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5TPC90ZXh0Pgo8L3N2Zz4=';

interface PDFOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Exporta dados tabulares para PDF
 */
export const exportTableToPDF = (
  data: TableData,
  options: PDFOptions = {}
) => {
  const {
    filename = 'relatorio.pdf',
    title = 'Relatório TradeHub',
    subtitle = '',
    orientation = 'portrait'
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  // Adicionar cabeçalho
  addHeader(doc, title, subtitle);

  // Adicionar tabela
  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: 50,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 38, 38], // Vermelho Santander
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Adicionar rodapé
  addFooter(doc);

  // Salvar PDF
  doc.save(filename);
};

/**
 * Exporta um elemento HTML para PDF
 */
export const exportHTMLToPDF = async (
  elementId: string,
  options: PDFOptions = {}
) => {
  const {
    filename = 'documento.pdf',
    title = 'TradeHub Formações',
    orientation = 'portrait'
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento ${elementId} não encontrado`);
  }

  // Converter HTML para canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = orientation === 'portrait' ? 297 : 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // Adicionar cabeçalho
  addHeader(pdf, title);
  position = 50;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Adicionar páginas adicionais se necessário
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Adicionar rodapé
  addFooter(pdf);

  pdf.save(filename);
};

/**
 * Exporta certificado para PDF
 */
export const exportCertificateToPDF = (data: {
  studentName: string;
  courseName: string;
  completionDate: string;
  trainerName: string;
  hours: number;
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Borda decorativa
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Título
  doc.setFontSize(40);
  doc.setTextColor(220, 38, 38);
  doc.text('CERTIFICADO', pageWidth / 2, 40, { align: 'center' });

  // Subtítulo
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text('de Conclusão de Curso', pageWidth / 2, 55, { align: 'center' });

  // Nome do estudante
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Certificamos que', pageWidth / 2, 80, { align: 'center' });

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(data.studentName, pageWidth / 2, 95, { align: 'center' });

  // Curso
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('concluiu com sucesso o curso', pageWidth / 2, 110, { align: 'center' });

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.courseName, pageWidth / 2, 125, { align: 'center' });

  // Detalhes
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Com carga horária de ${data.hours} horas`, pageWidth / 2, 140, { align: 'center' });
  doc.text(`Concluído em ${data.completionDate}`, pageWidth / 2, 150, { align: 'center' });

  // Assinatura
  doc.setFontSize(10);
  doc.text('_______________________________', pageWidth / 2, 175, { align: 'center' });
  doc.setFontSize(12);
  doc.text(data.trainerName, pageWidth / 2, 182, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Formador Responsável', pageWidth / 2, 188, { align: 'center' });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('TradeHub Formações - Santander Digital Services', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-PT')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

/**
 * Adiciona cabeçalho padrão ao PDF
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Logo
  try {
    doc.addImage(SANTANDER_LOGO, 'PNG', 10, 10, 15, 15);
  } catch (error) {
    console.error('Erro ao adicionar logo:', error);
  }

  // Título
  doc.setFontSize(18);
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 30, 18);

  // Subtítulo
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 30, 24);
  }

  // Linha separadora
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(10, 30, doc.internal.pageSize.getWidth() - 10, 30);

  // Data de geração
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const today = new Date().toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Gerado em ${today}`, doc.internal.pageSize.getWidth() - 10, 18, { align: 'right' });
}

/**
 * Adiciona rodapé padrão ao PDF
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Número da página
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    
    // Texto do rodapé
    doc.text(
      'TradeHub Formações - Santander Digital Services',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }
}

/**
 * Exporta relatório de progresso do estudante
 */
export const exportStudentProgressToPDF = (data: {
  studentName: string;
  courses: Array<{
    name: string;
    progress: number;
    grade: number;
    status: string;
  }>;
}) => {
  const tableData: TableData = {
    headers: ['Curso', 'Progresso', 'Nota', 'Status'],
    rows: data.courses.map(course => [
      course.name,
      `${course.progress}%`,
      course.grade.toFixed(1),
      course.status
    ])
  };

  exportTableToPDF(tableData, {
    filename: `progresso-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    title: 'Relatório de Progresso',
    subtitle: `Formando: ${data.studentName}`
  });
};
