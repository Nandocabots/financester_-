import { Transaction, Category, AnnualDashboardData } from '../types';

/**
 * Downloads a file to the client browser with given filename and content
 */
function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats currency number to brazilian format without R$ symbol for clean spreadsheet formulas
 */
function formatNumberBR(num: number): string {
  return num.toFixed(2).replace('.', ',');
}

/**
 * Exports monthly transactions to an Excel-compatible CSV file (separator ';', UTF-8 BOM)
 */
export function exportMonthlyTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  monthYear: string
) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const headers = [
    'Data',
    'Descrição',
    'Tipo',
    'Categoria',
    'Forma de Pagamento',
    'Valor (R$)',
    'Status',
    'Parcelamento',
    'Observações'
  ];

  const rows = transactions.map(t => {
    const categoryName = categoryMap.get(t.categoryId) || 'Geral';
    const typeLabel = t.type === 'receita' ? 'Receita' : 'Despesa';
    const statusLabel = t.status === 'pago' ? 'Pago' : 'Pendente';
    const installmentLabel = t.isInstallment && t.installmentCurrent && t.installmentTotal
      ? `${t.installmentCurrent}/${t.installmentTotal}`
      : '-';
    const cleanNotes = (t.notes || '').replace(/;/g, ',').replace(/\n/g, ' ');

    return [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      typeLabel,
      `"${categoryName}"`,
      t.paymentMethod.toUpperCase(),
      formatNumberBR(t.amount),
      statusLabel,
      installmentLabel,
      `"${cleanNotes}"`
    ].join(';');
  });

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpense;

  const summaryRows = [
    '',
    `Total Entradas;;;;;${formatNumberBR(totalIncome)};;;`,
    `Total Saídas;;;;;${formatNumberBR(totalExpense)};;;`,
    `Saldo Líquido;;;;;${formatNumberBR(net)};;;`
  ];

  const csvContent = [headers.join(';'), ...rows, ...summaryRows].join('\r\n');
  const filename = `extrato_financeiro_${monthYear}.csv`;
  downloadFile(csvContent, filename);
}

/**
 * Exports annual summary to an Excel-compatible CSV file
 */
export function exportAnnualSummaryToCSV(data: AnnualDashboardData) {
  const lines: string[] = [];

  // Title
  lines.push(`RELATÓRIO ANUAL DE FINANÇAS - ANO ${data.year}`);
  lines.push('');

  // 1. Resumo Geral
  lines.push('RESUMO ANUAL CONSOLIDADO');
  lines.push(`Total de Entradas no Ano;R$ ${formatNumberBR(data.totalAnnualIncome)}`);
  lines.push(`Total de Saídas no Ano;R$ ${formatNumberBR(data.totalAnnualExpense)}`);
  lines.push(`Saldo Total Economizado;R$ ${formatNumberBR(data.totalAnnualSavings)}`);
  lines.push(`Média Mensal de Gastos;R$ ${formatNumberBR(data.averageMonthlyExpense)}`);
  lines.push('');

  // 2. Mes a Mes
  lines.push('EVOLUÇÃO MÊS A MÊS');
  lines.push('Mês;Ano/Mês;Entradas (R$);Saídas (R$);Saldo (R$)');
  (data.monthlyBreakdown || []).forEach(m => {
    lines.push([
      m.monthName,
      m.monthYear,
      formatNumberBR(m.income),
      formatNumberBR(m.expense),
      formatNumberBR(m.net)
    ].join(';'));
  });
  lines.push('');

  // 3. Categorias
  lines.push('DISTRIBUIÇÃO DE GASTOS POR CATEGORIA');
  lines.push('Categoria;Total Gasto (R$);Participação (%)');
  (data.categoryTotals || []).forEach(c => {
    lines.push([
      `"${c.categoryName}"`,
      formatNumberBR(c.amount),
      `${c.percentage.toFixed(1)}%`
    ].join(';'));
  });
  lines.push('');

  // 4. Formas de Pagamento
  lines.push('GASTOS POR FORMA DE PAGAMENTO');
  lines.push('Forma de Pagamento;Total Gasto (R$)');
  Object.entries(data.paymentMethodTotals || {}).forEach(([method, amount]) => {
    lines.push([method.toUpperCase(), formatNumberBR(amount)].join(';'));
  });

  const csvContent = lines.join('\r\n');
  const filename = `relatorio_anual_${data.year}.csv`;
  downloadFile(csvContent, filename);
}
