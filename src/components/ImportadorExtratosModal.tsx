import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { Category, PaymentMethod } from '../types';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  Info
} from 'lucide-react';

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
}

interface ImportadorExtratosModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImportSuccess: () => void;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
};

export const ImportadorExtratosModal: React.FC<ImportadorExtratosModalProps> = ({
  isOpen,
  onClose,
  categories,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parsed items list
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paste text state
  const [pastedText, setPastedText] = useState<string>('');

  // File upload state
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear confirmation state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await api.parsePdfStatement(base64, selectedYear);
          if (res.transactions && res.transactions.length > 0) {
            setItems(res.transactions);
            setSuccessMessage(`${res.transactions.length} lançamentos encontrados no arquivo PDF.`);
          } else {
            setError('Nenhum lançamento identificado no arquivo PDF. Tente colar o texto na aba "Colar Texto".');
          }
        } catch (err: any) {
          setError(err.message || 'Erro ao processar o arquivo PDF.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Erro ao ler arquivo.');
      setIsProcessing(false);
    }
  };

  const handleParseText = async () => {
    if (!pastedText.trim()) {
      setError('Por favor, cole o texto do extrato ou fatura antes de processar.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const res = await api.parseTextStatement(pastedText, selectedYear);
      if (res.transactions && res.transactions.length > 0) {
        setItems(res.transactions);
        setSuccessMessage(`${res.transactions.length} lançamentos identificados e categorizados com sucesso!`);
      } else {
        setError('Não foi possível identificar lançamentos no texto fornecido. Verifique o formato.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o texto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectAll = (select: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected: select })));
  };

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItem = (id: string, field: keyof ParsedItem, value: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'date') {
          updated.monthYear = (value as string).substring(0, 7);
        }
        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAllHistory = async () => {
    setIsClearing(true);
    setError(null);
    try {
      await api.clearAllTransactions();
      setSuccessMessage('Todo o histórico de lançamentos fictícios foi zerado com sucesso!');
      setShowClearConfirm(false);
      onImportSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao zerar histórico.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleConfirmImport = async () => {
    const selectedItems = items.filter(it => it.selected);
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos um lançamento para importar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = selectedItems.map(item => ({
        title: item.title,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        paymentMethod: item.paymentMethod,
        date: item.date,
        status: 'pago' as const,
        notes: item.notes || 'Importado via Fatura/Extrato',
      }));

      await api.createTransactionsBatch(payload);
      setSuccessMessage(`${selectedItems.length} transações salvas com sucesso no seu planejamento financeiro!`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transações no sistema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items
  const availableMonths: string[] = Array.from<string>(new Set(items.map(it => it.monthYear))).sort();

  const filteredItems = items.filter(item => {
    const matchesMonth = filterMonth === 'todos' || item.monthYear === filterMonth;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.amount.toString().includes(searchTerm);
    return matchesMonth && matchesSearch;
  });

  const selectedCount = items.filter(it => it.selected).length;
  const totalDespesas = items
    .filter(it => it.selected && it.type === 'despesa')
    .reduce((acc, it) => acc + it.amount, 0);
  const totalReceitas = items
    .filter(it => it.selected && it.type === 'receita')
    .reduce((acc, it) => acc + it.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Importar Extratos & Faturas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nubank, Itaú, Bradesco, Inter e bancos brasileiros (PDF ou Texto)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/50 flex items-center gap-1.5"
              title="Zera todo o histórico de lançamentos fictícios"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Zerar Histórico
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear confirmation banner */}
        {showClearConfirm && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>
                <strong>Atenção:</strong> Isso removerá todos os lançamentos de receitas e despesas cadastrados no sistema para deixá-lo limpo para seus dados reais.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAllHistory}
                disabled={isClearing}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isClearing ? 'Zerando...' : 'Confirmar e Zerar'}
              </button>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Input source */}
          {items.length === 0 ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${
                      activeTab === 'upload'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Enviar Arquivo PDF
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${
                      activeTab === 'paste'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Colar Texto do Extrato
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Ano base:</span>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              </div>

              {activeTab === 'upload' ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-violet-50/20 dark:hover:bg-violet-950/10 flex flex-col items-center justify-center gap-3 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isProcessing ? (
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                        {isProcessing
                          ? 'Processando e categorizando documento...'
                          : fileName
                          ? fileName
                          : 'Clique para selecionar seu arquivo PDF'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Selecione <strong>faturas combinadas.pdf</strong> ou <strong>extratos combinados.pdf</strong>.
                        O leitor inteligente extrairá automaticamente datas, valores e categorias para você conferir.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-start gap-3">
                    <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Como funciona o reconhecimento automático:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Identifica faturas completas com compras no crédito e extratos de conta com Pix/débito.</li>
                        <li>Classifica compras em Alimentação, Transporte, Moradia, Saúde, Lazer, etc.</li>
                        <li>Você visualiza a tabela completa antes de salvar e pode trocar qualquer categoria.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cole as linhas do seu extrato ou fatura:
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setPastedText(
                            `FATURA NUBANK\n05 JAN Padaria Real R$ 28,50\n10 JAN Uber *Trip R$ 22,90\n12 JAN Droga Raia R$ 64,20\n15 JAN Supermercado Pão de Açúcar R$ 340,00\n18 JAN Netflix.com R$ 55,90\n20 JAN Posto Shell Combustivel R$ 190,00\n25 JAN Salário Empresa Alpha R$ 6.500,00`
                          )
                        }
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        Carregar exemplo Nubank
                      </button>
                    </div>
                    <textarea
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder="Exemplo:&#10;05 JAN Uber *Trip 24,90&#10;12/01 Supermercado R$ 150,00&#10;15/01/2026 Salário R$ 5.000,00"
                      rows={9}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleParseText}
                    disabled={isProcessing || !pastedText.trim()}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analisando lançamentos...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analisar e Categorizar Lançamentos
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Interactive Review & Editing Table */
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Encontrado</span>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {items.length} itens
                  </div>
                </div>

                <div className="p-3.5 bg-violet-50/70 dark:bg-violet-950/30 rounded-xl border border-violet-200 dark:border-violet-900/50">
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                    Selecionados p/ Salvar
                  </span>
                  <div className="text-lg font-bold text-violet-700 dark:text-violet-300 mt-0.5">
                    {selectedCount} de {items.length}
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Total Despesas
                  </span>
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                    R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Total Receitas
                  </span>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Action and Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-violet-600" />
                    Marcar Todos
                  </button>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Desmarcar Todos
                  </button>
                  <button
                    onClick={() => setItems([])}
                    className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Novo Envio
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Month filter */}
                  {availableMonths.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Filter className="w-3.5 h-3.5" />
                      <select
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 text-xs font-medium"
                      >
                        <option value="todos">Todos os Meses ({items.length})</option>
                        {availableMonths.map(my => {
                          const m = my.split('-')[1];
                          const name = MONTH_NAMES[m] || my;
                          const count = items.filter(it => it.monthYear === my).length;
                          return (
                            <option key={my} value={my}>
                              {name} ({count})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Buscar lançamento..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500 w-44"
                  />
                </div>
              </div>

              {/* Editable Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[48vh]">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                        <th className="py-2.5 px-3 w-28">Data</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Descrição</th>
                        <th className="py-2.5 px-3 w-48">Categoria</th>
                        <th className="py-2.5 px-3 w-28">Tipo</th>
                        <th className="py-2.5 px-3 w-28">Método</th>
                        <th className="py-2.5 px-3 w-28 text-right">Valor</th>
                        <th className="py-2.5 px-3 w-10 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredItems.map(item => {
                        const cat = categories.find(c => c.id === item.categoryId);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                              !item.selected ? 'opacity-50 bg-slate-50/30 dark:bg-slate-900/30' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleItem(item.id)}
                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                              />
                            </td>

                            {/* Date */}
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={item.date}
                                onChange={e => updateItem(item.id, 'date', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-xs text-slate-800 dark:text-slate-200 font-mono outline-none focus:ring-1 focus:ring-violet-500 rounded"
                              />
                            </td>

                            {/* Title */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.title}
                                onChange={e => updateItem(item.id, 'title', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-xs text-slate-800 dark:text-slate-200 font-medium outline-none focus:ring-1 focus:ring-violet-500 rounded"
                              />
                              {item.isInvoicePayment && (
                                <span className="inline-block mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded font-normal">
                                  Pagamento de fatura (desmarcado p/ não duplicar)
                                </span>
                              )}
                            </td>

                            {/* Category Selector */}
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: cat?.color || '#CBD5E1' }}
                                />
                                <select
                                  value={item.categoryId}
                                  onChange={e => updateItem(item.id, 'categoryId', e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-1 px-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({c.type})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>

                            {/* Type Toggle */}
                            <td className="py-2 px-3">
                              <select
                                value={item.type}
                                onChange={e =>
                                  updateItem(item.id, 'type', e.target.value as 'receita' | 'despesa')
                                }
                                className={`text-xs font-semibold rounded-md py-1 px-1.5 border outline-none ${
                                  item.type === 'receita'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                }`}
                              >
                                <option value="despesa">Despesa</option>
                                <option value="receita">Receita</option>
                              </select>
                            </td>

                            {/* Payment Method */}
                            <td className="py-2 px-3">
                              <select
                                value={item.paymentMethod}
                                onChange={e =>
                                  updateItem(item.id, 'paymentMethod', e.target.value as PaymentMethod)
                                }
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-1 px-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none capitalize"
                              >
                                <option value="crédito">Crédito</option>
                                <option value="débito">Débito</option>
                                <option value="pix">Pix</option>
                                <option value="ticket">Ticket</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="transferência">Transferência</option>
                              </select>
                            </td>

                            {/* Amount */}
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[11px] text-slate-400">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.amount}
                                  onChange={e =>
                                    updateItem(item.id, 'amount', Math.abs(parseFloat(e.target.value) || 0))
                                  }
                                  className="w-20 text-right bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500 rounded"
                                />
                              </div>
                            </td>

                            {/* Remove action */}
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                title="Remover item da importação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {items.length > 0 ? (
              <span>
                <strong>{selectedCount}</strong> lançamentos prontos para salvar no banco de dados.
              </span>
            ) : (
              <span>Você poderá conferir e ajustar todas as categorias antes de confirmar.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            {items.length > 0 && (
              <button
                onClick={handleConfirmImport}
                disabled={isSubmitting || selectedCount === 0}
                className="px-5 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Lançando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar e Lançar ({selectedCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
