import { PaymentMethod } from '../src/types';

export interface ParsedItem {
  id: string;
  date: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  title: string;
  amount: number;
  type: 'receita' | 'despesa';
  categoryId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isInvoicePayment?: boolean;
  selected: boolean;
  isInstallment?: boolean;
  installmentCurrent?: number;
  installmentTotal?: number;
}

function extractInstallmentInfo(rawTitle: string): { title: string; isInstallment: boolean; current?: number; total?: number } {
  const m = rawTitle.match(/^(.*?)\s*-\s*Parcela\s*(\d+)\/(\d+)/i) || rawTitle.match(/^(.*?)\s*\((\d+)\/(\d+)\)/i);
  if (m) {
    return {
      title: m[1].trim(),
      isInstallment: true,
      current: parseInt(m[2], 10),
      total: parseInt(m[3], 10),
    };
  }
  return { title: rawTitle, isInstallment: false };
}

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  janeiro: '01',
  fev: '02',
  fevereiro: '02',
  mar: '03',
  marco: '03',
  março: '03',
  abr: '04',
  abril: '04',
  mai: '05',
  maio: '05',
  jun: '06',
  junho: '06',
  jul: '07',
  julho: '07',
  ago: '08',
  agosto: '08',
  set: '09',
  setembro: '09',
  out: '10',
  outubro: '10',
  nov: '11',
  novembro: '11',
  dez: '12',
  dezembro: '12',
};

// Categorization Keyword Rules
export function autoCategorize(title: string, type: 'receita' | 'despesa'): string {
  const t = title.toLowerCase();

  if (type === 'receita') {
    if (
      t.includes('salario') ||
      t.includes('salário') ||
      t.includes('remunera') ||
      t.includes('provento') ||
      t.includes('folha') ||
      t.includes('pagamento receb') ||
      t.includes('pro-labore') ||
      t.includes('pró-labore')
    ) {
      return 'cat-salario';
    }
    if (
      t.includes('rendimento') ||
      t.includes('dividendo') ||
      t.includes('jcp') ||
      t.includes('juros') ||
      t.includes('cdi') ||
      t.includes('selic')
    ) {
      return 'cat-rendimentos';
    }
    return 'cat-extra';
  }

  // Despesas
  if (
    t.includes('ifood') ||
    t.includes('rappi') ||
    t.includes('delivery') ||
    t.includes('ze delivery') ||
    t.includes('padaria') ||
    t.includes('pao de acucar') ||
    t.includes('pão de açúcar') ||
    t.includes('supermercado') ||
    t.includes('mercado') ||
    t.includes('carrefour') ||
    t.includes('assai') ||
    t.includes('assaí') ||
    t.includes('atacadao') ||
    t.includes('atacadão') ||
    t.includes('bistek') ||
    t.includes('angeloni') ||
    t.includes('muffato') ||
    t.includes('restaurante') ||
    t.includes('lanchonete') ||
    t.includes('mcdonald') ||
    t.includes('burger') ||
    t.includes('subway') ||
    t.includes('pizza') ||
    t.includes('churrasco') ||
    t.includes('sushi') ||
    t.includes('hortifruti') ||
    t.includes('acougue') ||
    t.includes('açougue') ||
    t.includes('cafe') ||
    t.includes('café') ||
    t.includes('cafeteria') ||
    t.includes('bar ') ||
    t.includes('cervejaria') ||
    t.includes('confeitaria') ||
    t.includes('doceria') ||
    t.includes('bebidas')
  ) {
    return 'cat-alimentacao';
  }

  if (
    t.includes('uber') ||
    t.includes('99app') ||
    t.includes('99*') ||
    t.includes('99 *') ||
    t.includes('99 tecnologia') ||
    t.includes('99 corrida') ||
    t.includes('taxi') ||
    t.includes('posto') ||
    t.includes('ipiranga') ||
    t.includes('shell') ||
    t.includes('petrobras') ||
    t.includes('combustivel') ||
    t.includes('combustível') ||
    t.includes('gasolina') ||
    t.includes('etanol') ||
    t.includes('estacionamento') ||
    t.includes('sem parar') ||
    t.includes('veloe') ||
    t.includes('pedagio') ||
    t.includes('pedágio') ||
    t.includes('taggy') ||
    t.includes('buser') ||
    t.includes('latam') ||
    t.includes('gol lin') ||
    t.includes('azul lin') ||
    t.includes('passagem') ||
    t.includes('bilhete') ||
    t.includes('metro') ||
    t.includes('metrô') ||
    t.includes('recarga sp') ||
    t.includes('auto posto')
  ) {
    return 'cat-transporte';
  }

  if (
    t.includes('aluguel') ||
    t.includes('condominio') ||
    t.includes('condomínio') ||
    t.includes('enel') ||
    t.includes('cpfl') ||
    t.includes('cemig') ||
    t.includes('celesc') ||
    t.includes('copel') ||
    t.includes('luz ') ||
    t.includes('energia') ||
    t.includes('sabesp') ||
    t.includes('sanepar') ||
    t.includes('agua ') ||
    t.includes('água ') ||
    t.includes('gas ') ||
    t.includes('gás ') ||
    t.includes('comgas') ||
    t.includes('comgás') ||
    t.includes('ultragaz') ||
    t.includes('claro') ||
    t.includes('vivo') ||
    t.includes('tim ') ||
    t.includes('oi fibra') ||
    t.includes('iptu') ||
    t.includes('leroy') ||
    t.includes('telhanorte') ||
    t.includes('marcenaria') ||
    t.includes('reforma') ||
    t.includes('eletrica') ||
    t.includes('encanador')
  ) {
    return 'cat-moradia';
  }

  if (
    t.includes('farmacia') ||
    t.includes('farmácia') ||
    t.includes('drogaria') ||
    t.includes('raia') ||
    t.includes('drogasil') ||
    t.includes('panvel') ||
    t.includes('pague menos') ||
    t.includes('nissei') ||
    t.includes('sao joao') ||
    t.includes('consulta') ||
    t.includes('medico') ||
    t.includes('médico') ||
    t.includes('dentista') ||
    t.includes('odonto') ||
    t.includes('clinica') ||
    t.includes('clínica') ||
    t.includes('hospital') ||
    t.includes('laboratorio') ||
    t.includes('laboratório') ||
    t.includes('fleury') ||
    t.includes('exame') ||
    t.includes('psicolog') ||
    t.includes('terapia') ||
    t.includes('fisioterap') ||
    t.includes('unimed') ||
    t.includes('bradesco saude') ||
    t.includes('otica') ||
    t.includes('ótica')
  ) {
    return 'cat-saude';
  }

  if (
    t.includes('netflix') ||
    t.includes('spotify') ||
    t.includes('amazon prime') ||
    t.includes('apple') ||
    t.includes('icloud') ||
    t.includes('google') ||
    t.includes('youtube') ||
    t.includes('globoplay') ||
    t.includes('disney') ||
    t.includes('hbo') ||
    t.includes('max.com') ||
    t.includes('deezer') ||
    t.includes('chatgpt') ||
    t.includes('openai') ||
    t.includes('canva') ||
    t.includes('adobe') ||
    t.includes('assinatura')
  ) {
    return 'cat-assinaturas';
  }

  if (
    t.includes('cinema') ||
    t.includes('cinemark') ||
    t.includes('cinepolis') ||
    t.includes('ingresso') ||
    t.includes('sympla') ||
    t.includes('eventim') ||
    t.includes('show') ||
    t.includes('teatro') ||
    t.includes('hotel') ||
    t.includes('pousada') ||
    t.includes('airbnb') ||
    t.includes('booking') ||
    t.includes('viagem') ||
    t.includes('parque') ||
    t.includes('steam') ||
    t.includes('playstation') ||
    t.includes('xbox') ||
    t.includes('games') ||
    t.includes('entretenimento')
  ) {
    return 'cat-lazer';
  }

  if (
    t.includes('curso') ||
    t.includes('faculdade') ||
    t.includes('escola') ||
    t.includes('universidade') ||
    t.includes('udemy') ||
    t.includes('alura') ||
    t.includes('livro') ||
    t.includes('livraria') ||
    t.includes('saraiva') ||
    t.includes('kindle') ||
    t.includes('educacao') ||
    t.includes('educação') ||
    t.includes('idiomas') ||
    t.includes('ingles') ||
    t.includes('inglês')
  ) {
    return 'cat-educacao';
  }

  if (
    t.includes('renner') ||
    t.includes('c&a') ||
    t.includes('riachuelo') ||
    t.includes('zara') ||
    t.includes('shein') ||
    t.includes('centauro') ||
    t.includes('decathlon') ||
    t.includes('roupa') ||
    t.includes('calcado') ||
    t.includes('calçado') ||
    t.includes('sapato') ||
    t.includes('tenis') ||
    t.includes('tênis') ||
    t.includes('arezzo') ||
    t.includes('havaianas') ||
    t.includes('hering') ||
    t.includes('osklen') ||
    t.includes('dafiti')
  ) {
    return 'cat-vestuario';
  }

  if (
    t.includes('nuinvest') ||
    t.includes('xp invest') ||
    t.includes('btg') ||
    t.includes('rico') ||
    t.includes('clear cor') ||
    t.includes('tesouro direto') ||
    t.includes('cdb') ||
    t.includes('aporte') ||
    t.includes('investimento') ||
    t.includes('corretora')
  ) {
    return 'cat-investimentos';
  }

  return 'cat-outros';
}

function parseBrazilianAmount(str: string): number | null {
  if (!str) return null;
  // Clean string
  let cleaned = str.replace(/[R$\s+]/g, '').trim();
  const isNegative = cleaned.startsWith('-') || str.includes('-');
  cleaned = cleaned.replace('-', '').trim();

  // If format is 1.250,50
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isNegative ? -Math.abs(num) : Math.abs(num);
}

export function parseStatementText(rawText: string, defaultYear: number = 2026): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Attempt to detect statement year from header if present
  let detectedYear = defaultYear;
  const yearMatch = rawText.match(/\b(202[4-9])\b/);
  if (yearMatch) {
    detectedYear = parseInt(yearMatch[1], 10);
  }

  let currentYear = detectedYear;
  let currentMonth = '01';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line indicates a new month section (e.g., "FATURA DE OUTUBRO 2026" or "Janeiro 2026")
    const monthHeaderMatch = line.match(
      /\b(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i
    );
    if (monthHeaderMatch) {
      const monthWord = monthHeaderMatch[1].toLowerCase();
      if (MONTH_MAP[monthWord]) {
        currentMonth = MONTH_MAP[monthWord];
      }
      const yMatch = line.match(/\b(202[4-9])\b/);
      if (yMatch) {
        currentYear = parseInt(yMatch[1], 10);
      }
    }

    // Pattern A: Standard Nubank Fatura format
    // e.g. "05 JAN Uber *Trip 24,90" or "05/01 Uber *Trip 24,90" or "12 FEV Drogasil R$ 45,00"
    const patternA = /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+([R$]*\s*[-+]?\d{1,3}(?:\.\d{3})*,\d{2})$/i;
    const matchA = line.match(patternA);
    if (matchA) {
      const day = matchA[1].padStart(2, '0');
      const monthAbbr = matchA[2].toLowerCase();
      const title = matchA[3].trim();
      const amountStr = matchA[4];

      const month = MONTH_MAP[monthAbbr] || currentMonth;
      const amount = parseBrazilianAmount(amountStr);

      if (amount !== null && amount !== 0) {
        const isPayment = title.toLowerCase().includes('pagamento') || title.toLowerCase().includes('fatura');
        const isIncome = title.toLowerCase().includes('estorno') || title.toLowerCase().includes('reembolso');
        const type: 'receita' | 'despesa' = isIncome ? 'receita' : 'despesa';

        const instInfo = extractInstallmentInfo(title);

        items.push({
          id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 6)}`,
          date: `${currentYear}-${month}-${day}`,
          monthYear: `${currentYear}-${month}`,
          title: instInfo.title,
          amount: Math.abs(amount),
          type,
          categoryId: autoCategorize(instInfo.title, type),
          paymentMethod: 'crédito',
          isInvoicePayment: isPayment,
          selected: !isPayment, // Uncheck invoice payments by default to prevent double counting
          isInstallment: instInfo.isInstallment,
          installmentCurrent: instInfo.current,
          installmentTotal: instInfo.total,
          notes: instInfo.isInstallment ? `Parcela ${instInfo.current} de ${instInfo.total}` : undefined,
        });
        continue;
      }
    }

    // Pattern B: Date with slash (DD/MM/YYYY or DD/MM) followed by title and amount
    // e.g. "15/03/2026 Compra Padaria Real R$ 25,50" or "15/03 Compra Padaria Real 25,50"
    const patternB = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?\s+(?:-\s+)?(.+?)\s+([R$]*\s*[-+]?\d{1,3}(?:\.\d{3})*,\d{2})$/i;
    const matchB = line.match(patternB);
    if (matchB) {
      const day = matchB[1];
      const month = matchB[2];
      const year = matchB[3] ? parseInt(matchB[3], 10) : currentYear;
      const title = matchB[4].trim();
      const amountStr = matchB[5];

      const amount = parseBrazilianAmount(amountStr);
      if (amount !== null && amount !== 0) {
        const isTransferReceived =
          title.toLowerCase().includes('transferência recebida') ||
          title.toLowerCase().includes('pix recebido') ||
          title.toLowerCase().includes('salário') ||
          title.toLowerCase().includes('salario') ||
          title.toLowerCase().includes('estorno') ||
          title.toLowerCase().includes('rendimento');

        const isPayment =
          title.toLowerCase().includes('pagamento de fatura') ||
          title.toLowerCase().includes('pagamento recebido');

        const type: 'receita' | 'despesa' = isTransferReceived ? 'receita' : 'despesa';
        let paymentMethod: PaymentMethod = 'crédito';
        if (title.toLowerCase().includes('pix')) paymentMethod = 'pix';
        else if (title.toLowerCase().includes('débito') || title.toLowerCase().includes('debito')) paymentMethod = 'débito';
        else if (title.toLowerCase().includes('boleto')) paymentMethod = 'débito';
        else if (title.toLowerCase().includes('transferência') || title.toLowerCase().includes('ted') || title.toLowerCase().includes('doc')) paymentMethod = 'transferência';

        const instInfo = extractInstallmentInfo(title);
        if (instInfo.isInstallment) paymentMethod = 'crédito';

        items.push({
          id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 6)}`,
          date: `${year}-${month}-${day}`,
          monthYear: `${year}-${month}`,
          title: instInfo.title,
          amount: Math.abs(amount),
          type,
          categoryId: autoCategorize(instInfo.title, type),
          paymentMethod,
          isInvoicePayment: isPayment,
          selected: !isPayment,
          isInstallment: instInfo.isInstallment,
          installmentCurrent: instInfo.current,
          installmentTotal: instInfo.total,
          notes: instInfo.isInstallment ? `Parcela ${instInfo.current} de ${instInfo.total}` : undefined,
        });
        continue;
      }
    }

    // Pattern C: Multi-line detection
    // e.g.
    // Line i: "08 JAN"
    // Line i+1: "Supermercado Pão de Açúcar"
    // Line i+2: "R$ 145,20"
    const dateLineMatch = line.match(/^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i);
    if (dateLineMatch && i + 1 < lines.length) {
      const day = dateLineMatch[1].padStart(2, '0');
      const monthAbbr = dateLineMatch[2].toLowerCase();
      const month = MONTH_MAP[monthAbbr] || currentMonth;

      let nextTitle = lines[i + 1];
      let amountLine = '';
      let advance = 1;

      if (i + 2 < lines.length && /^[R$]*\s*[-+]?\d{1,3}(?:\.\d{3})*,\d{2}$/i.test(lines[i + 2])) {
        amountLine = lines[i + 2];
        advance = 2;
      } else if (/^[R$]*\s*[-+]?\d{1,3}(?:\.\d{3})*,\d{2}$/i.test(nextTitle)) {
        // nextTitle was actually the amount, maybe title was skipped
        amountLine = nextTitle;
        nextTitle = 'Despesa Cartão';
        advance = 1;
      }

      if (amountLine) {
        const amount = parseBrazilianAmount(amountLine);
        if (amount !== null && amount !== 0) {
          const isPayment = nextTitle.toLowerCase().includes('pagamento') || nextTitle.toLowerCase().includes('fatura');
          const isIncome = nextTitle.toLowerCase().includes('estorno') || nextTitle.toLowerCase().includes('reembolso');
          const type: 'receita' | 'despesa' = isIncome ? 'receita' : 'despesa';

          const instInfo = extractInstallmentInfo(nextTitle);

          items.push({
            id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 6)}`,
            date: `${currentYear}-${month}-${day}`,
            monthYear: `${currentYear}-${month}`,
            title: instInfo.title,
            amount: Math.abs(amount),
            type,
            categoryId: autoCategorize(instInfo.title, type),
            paymentMethod: 'crédito',
            isInvoicePayment: isPayment,
            selected: !isPayment,
            isInstallment: instInfo.isInstallment,
            installmentCurrent: instInfo.current,
            installmentTotal: instInfo.total,
            notes: instInfo.isInstallment ? `Parcela ${instInfo.current} de ${instInfo.total}` : undefined,
          });
          i += advance;
          continue;
        }
      }
    }

    // Pattern D: Generic line containing amount at end
    // e.g. "Padaria Central R$ 15,00"
    const amountMatchAtEnd = line.match(/^(.+?)\s+([R$]*\s*[-+]?\d{1,3}(?:\.\d{3})*,\d{2})$/);
    if (amountMatchAtEnd) {
      const possibleTitle = amountMatchAtEnd[1].trim();
      const possibleAmount = parseBrazilianAmount(amountMatchAtEnd[2]);

      // Filter out table headers or totals like "Total da fatura" or "Limite disponível"
      if (
        possibleAmount !== null &&
        possibleAmount > 0 &&
        !possibleTitle.toLowerCase().includes('total') &&
        !possibleTitle.toLowerCase().includes('fatura anterior') &&
        !possibleTitle.toLowerCase().includes('saldo') &&
        !possibleTitle.toLowerCase().includes('limite')
      ) {
        const type: 'receita' | 'despesa' = 'despesa';
        const instInfo = extractInstallmentInfo(possibleTitle);

        items.push({
          id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 6)}`,
          date: `${currentYear}-${currentMonth}-01`,
          monthYear: `${currentYear}-${currentMonth}`,
          title: instInfo.title,
          amount: Math.abs(possibleAmount),
          type,
          categoryId: autoCategorize(instInfo.title, type),
          paymentMethod: 'crédito',
          isInvoicePayment: possibleTitle.toLowerCase().includes('pagamento'),
          selected: !possibleTitle.toLowerCase().includes('pagamento'),
          isInstallment: instInfo.isInstallment,
          installmentCurrent: instInfo.current,
          installmentTotal: instInfo.total,
          notes: instInfo.isInstallment ? `Parcela ${instInfo.current} de ${instInfo.total}` : undefined,
        });
      }
    }
  }

  return items;
}
