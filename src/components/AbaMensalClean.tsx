import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Category, PaymentMethod, Transaction, ProjectedSalaryAnalysis, CategoryAverage, AccumulatedBalanceResponse } from '../types';
import { TransactionModal } from './TransactionModal';
import { GastosFixosModal } from './GastosFixosModal';
import { ThemeSettings, THEME_CONFIGS } from '../lib/theme';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  Layers,
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  CircleDot,
  ArrowDownCircle,
  ArrowUpCircle,
  Palette,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Percent,
  Download,
  Printer,
  Calendar as CalendarIcon,
  Target
} from 'lucide-react';
import { CalendarioVencimentos } from './CalendarioVencimentos';
import { PainelOrcamentoCategorias } from './PainelOrcamentoCategorias';
import { exportMonthlyTransactionsToCSV } from '../lib/exportUtils';
import { ImportadorExtratosModal } from './ImportadorExtratosModal';

interface AbaMensalCleanProps {
  categories: Category[];
  onRefreshCategories?: () => void;
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}

export const AbaMensalClean: React.FC<AbaMensalCleanProps> = ({
  categories,
  onRefreshCategories,
  theme,
  setTheme,
}) => {
  const [currentMonthYear, setCurrentMonthYear] = useState<string>(
    new Date().toISOString().substring(0, 7) // E.g. "2026-08"
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevMonthTransactions, setPrevMonthTransactions] = useState<Transaction[]>([]);
  const [projection, setProjection] = useState<ProjectedSalaryAnalysis | null>(null);
  const [averages, setAverages] = useState<CategoryAverage[]>([]);
  const [accumulatedData, setAccumulatedData] = useState<AccumulatedBalanceResponse | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Importador de Extratos e Faturas Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Gastos Fixos Modal state
  const [isGastosFixosModalOpen, setIsGastosFixosModalOpen] = useState(false);

  // Projection Modal state
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState<boolean>(false);

  // Multi-select Chart Categories state
  const [selectedChartCategories, setSelectedChartCategories] = useState<string[]>(['top4']);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'pizza' | 'rosca' | 'barras'>('pizza');
  const [chartDataMode, setChartDataMode] = useState<'real' | 'previsao'>('real');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<'receita' | 'despesa'>('despesa');

  // Insert dropdown state for + Inserir (Pagamento vs Recebimento)
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  // Quick salary edit modal
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [isSavingSalary, setIsSavingSalary] = useState<boolean>(false);

  // Delete confirmation
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Theme Drawer
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Sub-view mode (Lançamentos / Calendário de Vencimentos / Metas de Orçamento)
  const [subView, setSubView] = useState<'lancamentos' | 'calendario' | 'orcamento'>('lancamentos');

  const handleExportCSV = () => {
    exportMonthlyTransactionsToCSV(transactions, categories, currentMonthYear);
  };

  const handleUpdateCategoryBudget = async (catId: string, budget: number) => {
    await api.updateCategory(catId, { monthlyBudget: budget });
    if (onRefreshCategories) {
      onRefreshCategories();
    }
  };

  const handleToggleStatusById = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (tx) {
      await handleToggleStatus(tx);
    }
  };

  const fetchMonthData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate previous month string (e.g. "2026-07" for "2026-08")
      const [cy, cm] = currentMonthYear.split('-').map(Number);
      const prevDateObj = new Date(cy, cm - 2, 1);
      const prevMY = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}`;

      const [txData, prevTxData, projData, avgData, accData] = await Promise.all([
        api.getTransactions({ monthYear: currentMonthYear }),
        api.getTransactions({ monthYear: prevMY }),
        api.getProjectedSalary(currentMonthYear),
        api.getCategoryAverages(currentMonthYear),
        api.getAccumulatedBalance(currentMonthYear),
      ]);

      setTransactions(txData);
      setPrevMonthTransactions(prevTxData);
      setProjection(projData);
      setAverages(avgData);
      setAccumulatedData(accData);

      const salaryTx = txData.find(t => t.type === 'receita' && t.categoryId === 'cat-salario');
      if (salaryTx) {
        setSalaryInput(salaryTx.amount.toString());
      } else {
        setSalaryInput(projData.baseSalary.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do mês.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [currentMonthYear]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = currentMonthYear.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    setCurrentMonthYear(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonthYear.split('-').map(Number);
    const date = new Date(y, m, 1);
    setCurrentMonthYear(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleSaveSalary = async () => {
    const numSalary = parseFloat(salaryInput.replace(',', '.'));
    if (isNaN(numSalary) || numSalary <= 0) {
      alert('Informe um valor de salário válido.');
      return;
    }

    setIsSavingSalary(true);
    try {
      const salaryTx = transactions.find(t => t.type === 'receita' && t.categoryId === 'cat-salario');
      if (salaryTx) {
        await api.updateTransaction(salaryTx.id, { amount: numSalary });
      } else {
        await api.createTransaction({
          title: 'Meu Salário Mensal',
          amount: numSalary,
          type: 'receita',
          categoryId: 'cat-salario',
          paymentMethod: 'pix',
          date: `${currentMonthYear}-05`,
          status: 'pago',
        });
      }
      setIsEditingSalary(false);
      await fetchMonthData();
    } catch (err: any) {
      alert('Erro ao salvar salário: ' + err.message);
    } finally {
      setIsSavingSalary(false);
    }
  };

  const handleToggleStatus = async (tx: Transaction) => {
    const newStatus = tx.status === 'pago' ? 'pendente' : 'pago';
    try {
      await api.updateTransaction(tx.id, { status: newStatus });
      setTransactions(prev =>
        prev.map(item => (item.id === tx.id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleSaveTransaction = async (data: {
    title: string;
    amount: number;
    type: 'receita' | 'despesa';
    categoryId: string;
    subcategory?: string;
    paymentMethod: PaymentMethod;
    date: string;
    status: 'pago' | 'pendente';
    notes?: string;
    isInstallment?: boolean;
    installmentCurrent?: number;
    installmentTotal?: number;
    isRecurring?: boolean;
    updateFutureMonths?: boolean;
  }) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction.id, data);
    } else {
      await api.createTransaction(data);
    }
    fetchMonthData();
  };

  const confirmDelete = async (deleteSeries: boolean) => {
    if (!deletingTx) return;
    try {
      await api.deleteTransaction(deletingTx.id, deleteSeries);
      setDeletingTx(null);
      fetchMonthData();
    } catch (err: any) {
      alert('Erro ao excluir lançamento: ' + err.message);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (searchTerm && !tx.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory && tx.categoryId !== filterCategory) return false;
    if (filterPaymentMethod && tx.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const [y, m] = currentMonthYear.split('-').map(Number);
  const dateObj = new Date(y, m - 1, 1);
  const monthNameFormatted = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Totals calculated for the 3 Cards
  const totalIncome = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const actualExpenseLogged = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const totalProjectedExpense = projection?.projectedUnfulfilledExpenses
    ? actualExpenseLogged + projection.projectedUnfulfilledExpenses
    : actualExpenseLogged;

  // Month net result (Receitas do mês - Despesas do mês)
  const monthNetDelta = totalIncome - actualExpenseLogged;
  const projectedMonthNetDelta = totalIncome - totalProjectedExpense;

  // Rollover from previous months (Saldo do mês anterior / que sobrou do mês passado)
  const previousMonthBalance = accumulatedData?.previousBalance ?? 0;

  // Final Accumulated Balance (Saldo do mês anterior + movimentação deste mês)
  const finalAccumulatedBalance = previousMonthBalance + monthNetDelta;
  const projectedAccumulatedBalance = previousMonthBalance + projectedMonthNetDelta;

  // Chart Data for "Gráfico dos Gastos"
  let chartData = averages
    .filter(a => a.currentMonthActual > 0 || a.monthlyAverage > 0)
    .map(a => ({
      categoryId: a.categoryId,
      name: a.categoryName,
      GastoReal: a.currentMonthActual,
      Previsão: a.monthlyAverage,
      color: a.color,
    }));

  if (selectedChartCategories.includes('top4')) {
    chartData = [...chartData]
      .sort((a, b) => (b.GastoReal || b.Previsão) - (a.GastoReal || a.Previsão))
      .slice(0, 4);
  } else if (!selectedChartCategories.includes('all') && selectedChartCategories.length > 0) {
    chartData = chartData.filter(c => selectedChartCategories.includes(c.categoryId));
  }

  // Calculate Pie & Donut Chart items
  const rawPieItems = chartData
    .map(c => {
      const val = chartDataMode === 'real' ? (c.GastoReal || 0) : (c.Previsão || 0);
      return {
        name: c.name,
        value: val,
        color: c.color || '#64748B',
        categoryId: c.categoryId,
      };
    })
    .filter(item => item.value > 0);

  const totalPieValue = rawPieItems.reduce((acc, curr) => acc + curr.value, 0);

  const pieData = rawPieItems.map(item => ({
    ...item,
    percent: totalPieValue > 0 ? ((item.value / totalPieValue) * 100).toFixed(1) : '0',
  }));

  // Previsão & Comparativo por Categoria para o Pop-up
  const projectionBreakdown = averages.map(avg => {
    const prevMonthExpense = prevMonthTransactions
      .filter(t => t.type === 'despesa' && t.categoryId === avg.categoryId)
      .reduce((s, t) => s + t.amount, 0);

    const currentExpense = avg.currentMonthActual;

    let pctChange = 0;
    let isNew = false;
    if (prevMonthExpense > 0) {
      pctChange = Number((((currentExpense - prevMonthExpense) / prevMonthExpense) * 100).toFixed(1));
    } else if (currentExpense > 0) {
      isNew = true;
      pctChange = 100;
    }

    return {
      ...avg,
      prevMonthExpense,
      pctChange,
      isNew,
    };
  });

  const activeColorTheme = THEME_CONFIGS[theme.colorTheme];
  const isDark = theme.darkMode;
  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/70 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR: Month Selector + Theme Button + Inserir Button */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        
        {/* Left Side: Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className={`p-2 rounded-xl transition border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100'
              }`}
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center px-3 py-1 min-w-[160px]">
              <span className={`text-sm font-semibold capitalize tracking-tight block ${textTitle}`}>
                {monthNameFormatted}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Visão do Mês
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className={`p-2 rounded-xl transition border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100'
              }`}
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Importar Extrato + Gastos Fixos + Export + Inserir Button & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Importar Extratos / Faturas (PDF/Texto) */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/50 border border-violet-200/80 dark:border-violet-800 transition flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-2xs cursor-pointer"
            title="Importar extratos ou faturas do Nubank e outros bancos (PDF ou Texto)"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Importar Fatura / Extrato</span>
          </button>

          {/* Export to Excel (CSV) */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/70 transition flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-2xs"
            title="Exportar Lançamentos do Mês para Excel (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={() => window.print()}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-2xs ${
              isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100'
            }`}
            title="Imprimir Relatório Mensal"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* Gastos Fixos Management Button */}
          <button
            onClick={() => setIsGastosFixosModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 border border-purple-200/70 transition flex items-center gap-1.5 text-xs font-medium shrink-0"
            title="Ver e Gerenciar Gastos Fixos"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Gastos Fixos</span>
          </button>

          {/* Theme / Customize Color Button */}
          <button
            onClick={() => setIsThemeOpen(true)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100'
            }`}
            title="Personalizar Aparência"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tema</span>
          </button>

          {/* + Inserir Dropdown (Pagamento vs Recebimento) */}
          <div className="relative">
            <button
              onClick={() => setShowInsertMenu(!showInsertMenu)}
              className={`px-4 py-2 rounded-xl font-medium text-xs transition flex items-center gap-1.5 shadow-xs ${activeColorTheme.primary}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inserir</span>
            </button>

            {showInsertMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border border-slate-200/80 bg-white p-1.5 z-40 space-y-1 text-slate-800">
                <button
                  onClick={() => {
                    setShowInsertMenu(false);
                    setIsImportModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-50 text-violet-700 font-semibold text-xs flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Importar Fatura / Extrato</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => {
                    setShowInsertMenu(false);
                    setEditingTransaction(null);
                    setModalDefaultType('despesa');
                    setIsModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-medium text-xs flex items-center gap-2 transition"
                >
                  <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                  <span>Pagamento (Gasto)</span>
                </button>

                <button
                  onClick={() => {
                    setShowInsertMenu(false);
                    setEditingTransaction(null);
                    setModalDefaultType('receita');
                    setIsModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium text-xs flex items-center gap-2 transition"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                  <span>Recebimento (Salário)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-view Segmented Switcher (Lançamentos / Calendário / Metas de Orçamento) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 p-2.5 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setSubView('lancamentos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              subView === 'lancamentos'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Lançamentos & Balanço</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('calendario')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              subView === 'calendario'
                ? 'bg-white text-blue-700 shadow-2xs border border-blue-200/60'
                : 'text-blue-700 hover:text-blue-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>Calendário de Vencimentos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('orcamento')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              subView === 'orcamento'
                ? 'bg-white text-amber-700 shadow-2xs border border-amber-200/60'
                : 'text-amber-700 hover:text-amber-800'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Metas & Teto por Categoria</span>
          </button>
        </div>

        {/* Quick summary pill */}
        <div className="text-[11px] text-slate-500 font-medium px-2 hidden md:flex items-center gap-2">
          <span>Mês de <strong className="text-slate-800 font-bold">{monthNameFormatted}</strong> • {transactions.length} lançamentos</span>
          {previousMonthBalance !== 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold">
              Sobrou do mês anterior: {formatCurrency(previousMonthBalance)}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-rose-400 border-t-transparent rounded-full mb-3" />
          <p className="text-xs font-medium text-slate-500">Carregando painel de {monthNameFormatted}...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium">
          {error}
        </div>
      ) : subView === 'calendario' ? (
        <CalendarioVencimentos
          transactions={transactions}
          categories={categories}
          currentMonthYear={currentMonthYear}
          onToggleStatus={handleToggleStatusById}
          onOpenNewTransaction={() => {
            setEditingTransaction(null);
            setModalDefaultType('despesa');
            setIsModalOpen(true);
          }}
          theme={theme}
        />
      ) : subView === 'orcamento' ? (
        <PainelOrcamentoCategorias
          categories={categories}
          transactions={transactions}
          monthYear={currentMonthYear}
          onUpdateCategoryBudget={handleUpdateCategoryBudget}
          theme={theme}
        />
      ) : (
        <>
          {/* TOP ROW: 3 CARDS FOLLOWING THE DUAL PATTERN (ATUAL E DO LADO A PREVISÃO) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* CARD 1: Saldo (Receitas / Entrada de Salário) */}
            <div className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  Entradas / Receitas
                </span>
                <button
                  onClick={() => setIsEditingSalary(true)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60 hover:bg-emerald-100 transition"
                  title="Alterar Salário do Mês"
                >
                  Editar Salário
                </button>
              </div>

              <div className="my-2 flex items-baseline justify-between gap-2 border-y border-slate-100 py-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Lançado:</div>
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Previsão Total:</div>
                  <div className="text-xs font-semibold text-slate-600">{formatCurrency(totalIncome)}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-normal">
                Sua receita e salário confirmados para este mês.
              </div>
            </div>

            {/* CARD 2: Previsão Gasto & Gasto Real (Clickable for Detail Pop-up) */}
            <div
              onClick={() => setIsProjectionModalOpen(true)}
              className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-rose-300 transition ${cardBg}`}
              title="Clique para abrir detalhamento e variação por categoria"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  Gasto Real / Previsão
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-medium border border-rose-200/60 group-hover:bg-rose-600 group-hover:text-white transition">
                  Ver Variação
                </span>
              </div>

              <div className="my-2 flex items-baseline justify-between gap-2 border-y border-slate-100 py-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Gasto Real:</div>
                  <div className="text-lg font-bold text-rose-600">{formatCurrency(actualExpenseLogged)}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Média Prevista:</div>
                  <div className="text-xs font-semibold text-slate-600">{formatCurrency(totalProjectedExpense)}</div>
                </div>
              </div>

              <div className="text-[11px] text-rose-600 font-normal flex items-center gap-1">
                <span>Clique para ver especificação por categoria</span>
              </div>
            </div>

            {/* CARD 3: Saldo Disponível (Acumulado com o que sobrou do mês passado) */}
            <div className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Saldo Total Disponível
                </span>
                <div className="flex items-center gap-1.5">
                  {previousMonthBalance !== 0 && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-lg font-medium bg-amber-50 text-amber-800 border border-amber-200/60"
                      title="Saldo herdado do mês anterior"
                    >
                      {previousMonthBalance >= 0 ? '+' : ''}{formatCurrency(previousMonthBalance)} ant.
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium border ${
                    finalAccumulatedBalance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'
                  }`}>
                    {finalAccumulatedBalance >= 0 ? 'Positivo' : 'Alerta'}
                  </span>
                </div>
              </div>

              <div className="my-2 flex items-baseline justify-between gap-2 border-y border-slate-100 py-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Saldo Hoje (Acumulado):</div>
                  <div className={`text-lg font-bold ${finalAccumulatedBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(finalAccumulatedBalance)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Estimativa Fim:</div>
                  <div className={`text-xs font-semibold ${projectedAccumulatedBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(projectedAccumulatedBalance)}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-normal space-y-0.5">
                <div className="flex items-center justify-between">
                  <span>Sobrou do mês anterior:</span>
                  <span className={`font-semibold ${previousMonthBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(previousMonthBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Resultado deste mês:</span>
                  <span className={`font-semibold ${monthNetDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {monthNetDelta >= 0 ? '+' : ''}{formatCurrency(monthNetDelta)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT: 2 COLUMNS LAYOUT [ HISTÓRICO ] on Left, [ GRÁFICO ] + [ GASTO POR CATEGORIA ] on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: HISTÓRICO (Span 7 on desktop) */}
            <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className={`text-sm font-semibold ${textTitle} flex items-center gap-2`}>
                    <Receipt className="w-4 h-4 text-rose-500" />
                    <span>Histórico de Lançamentos</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-normal">
                    Lista detalhada de entradas e saídas do mês
                  </p>
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {filteredTransactions.length} item(ns)
                </span>
              </div>

              {/* Search & Filter bar inside Histórico */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar lançamento..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-normal text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-rose-400"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden"
                >
                  <option value="">Todas Categorias</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Transactions List */}
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Nenhum lançamento neste mês
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      O histórico fictício foi zerado. Você pode importar seus extratos ou faturas do Nubank (PDF ou texto) ou cadastrar lançamentos manuais.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Importar Extrato / Fatura PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingTransaction(null);
                        setModalDefaultType('despesa');
                        setIsModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      + Lançar Manual
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
                  {filteredTransactions.map(tx => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const isReceita = tx.type === 'receita';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 hover:bg-white transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || (isReceita ? '#10b981' : '#f43f5e') }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-900 truncate">{tx.title}</span>
                              {tx.isInstallment && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTransaction(tx);
                                    setIsModalOpen(true);
                                  }}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200/60 transition cursor-pointer"
                                  title={`Parcela ${tx.installmentCurrent || 1} de ${tx.installmentTotal || 1} no Cartão - Clique para editar`}
                                >
                                  {tx.installmentCurrent || 1}/{tx.installmentTotal || 1}x
                                </button>
                              )}
                              {tx.isRecurring && (
                                <button
                                  type="button"
                                  onClick={() => setIsGastosFixosModalOpen(true)}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium border border-purple-200/60 transition cursor-pointer flex items-center gap-1"
                                  title="Clique para gerenciar este Gasto Fixo"
                                >
                                  📌 Fixo
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                              <span>{cat?.name || 'Geral'}</span>
                              {tx.subcategory && (
                                <>
                                  <span className="text-slate-300">›</span>
                                  <span className="text-purple-600 font-medium">{tx.subcategory}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{tx.date.split('-').reverse().join('/')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            onClick={() => handleToggleStatus(tx)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition ${
                              tx.status === 'pago'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100'
                            }`}
                            title="Clique para alternar Pago / Pendente"
                          >
                            {tx.status === 'pago' ? 'Pago' : 'Pendente'}
                          </button>

                          <span className={`text-xs font-semibold ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isReceita ? '+' : '-'} {formatCurrency(tx.amount)}
                          </span>

                          <div className="flex items-center space-x-0.5">
                            <button
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingTx(tx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: GRÁFICO DOS GASTOS & GASTO POR CATEGORIA (Span 5 on desktop) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* BOX 1: GRÁFICO DOS GASTOS (Com Seleção de Tipo: Pizza / Rosca / Barras) */}
              <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${textTitle} flex items-center gap-2`}>
                      {chartType === 'barras' ? (
                        <BarChart3 className="w-4 h-4 text-rose-500" />
                      ) : chartType === 'rosca' ? (
                        <CircleDot className="w-4 h-4 text-rose-500" />
                      ) : (
                        <PieChartIcon className="w-4 h-4 text-rose-500" />
                      )}
                      <span>Gráfico dos Gastos</span>
                    </h3>

                    {/* Chart Type Selector */}
                    <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setChartType('pizza')}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                          chartType === 'pizza'
                            ? 'bg-white text-rose-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Gráfico de Pizza"
                      >
                        <PieChartIcon className="w-3 h-3" />
                        <span>Pizza</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartType('rosca')}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                          chartType === 'rosca'
                            ? 'bg-white text-rose-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Gráfico de Rosca (Donut)"
                      >
                        <CircleDot className="w-3 h-3" />
                        <span>Rosca</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartType('barras')}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                          chartType === 'barras'
                            ? 'bg-white text-rose-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Gráfico de Barras"
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span>Barras</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Mode Toggle for Pie/Donut (Real vs Previsão) */}
                    {(chartType === 'pizza' || chartType === 'rosca') && (
                      <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setChartDataMode('real')}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            chartDataMode === 'real'
                              ? 'bg-white text-slate-800 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Real
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartDataMode('previsao')}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            chartDataMode === 'previsao'
                              ? 'bg-white text-slate-800 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Previsão
                        </button>
                      </div>
                    )}

                    {/* Multi-Select Category Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 flex items-center gap-1.5 transition"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-rose-500" />
                        <span>
                          {selectedChartCategories.includes('top4')
                            ? 'Top 4'
                            : selectedChartCategories.includes('all')
                            ? 'Todas'
                            : `${selectedChartCategories.length} Selec.`}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {isChartDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/80 rounded-xl shadow-lg p-2.5 z-40 text-slate-800 space-y-1.5">
                          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-1">
                            Filtrar no Gráfico
                          </div>

                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedChartCategories(['top4']);
                                setIsChartDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                                selectedChartCategories.includes('top4') ? 'bg-rose-50 text-rose-700' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>Top 4 Maiores Gastos</span>
                              {selectedChartCategories.includes('top4') && <Check className="w-3.5 h-3.5 text-rose-500" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedChartCategories(['all']);
                                setIsChartDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                                selectedChartCategories.includes('all') ? 'bg-rose-50 text-rose-700' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>Todas as Categorias</span>
                              {selectedChartCategories.includes('all') && <Check className="w-3.5 h-3.5 text-rose-500" />}
                            </button>
                          </div>

                          <div className="border-t border-slate-100 pt-1.5 space-y-0.5 max-h-48 overflow-y-auto">
                            <div className="text-[10px] text-slate-400 font-medium px-1 mb-1">
                              Categorias Individuais:
                            </div>
                            {categories.filter(c => c.type === 'despesa').map(cat => {
                              const isChecked = selectedChartCategories.includes(cat.id);
                              return (
                                <label
                                  key={cat.id}
                                  className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer transition ${
                                    isChecked ? 'bg-rose-50 text-rose-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      let next: string[];
                                      if (selectedChartCategories.includes('top4') || selectedChartCategories.includes('all')) {
                                        next = [cat.id];
                                      } else if (isChecked) {
                                        next = selectedChartCategories.filter(id => id !== cat.id);
                                        if (next.length === 0) next = ['top4'];
                                      } else {
                                        next = [...selectedChartCategories, cat.id];
                                      }
                                      setSelectedChartCategories(next);
                                    }}
                                    className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300 focus:ring-rose-400"
                                  />
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className="truncate">{cat.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart Rendering */}
                {chartType === 'barras' ? (
                  chartData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-normal">
                      Nenhum gasto registrado para gerar gráfico este mês.
                    </div>
                  ) : (
                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                          <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                          <Bar dataKey="GastoReal" fill="#f43f5e" name="Gasto Lançado" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Previsão" fill="#e2e8f0" name="Média Prevista" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                ) : (
                  /* PIE / ROSCA CHART */
                  pieData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-normal space-y-2">
                      <p>Nenhum gasto {chartDataMode === 'real' ? 'lançado' : 'previsto'} para exibir no gráfico de pizza.</p>
                      {chartDataMode === 'real' && (
                        <button
                          type="button"
                          onClick={() => setChartDataMode('previsao')}
                          className="text-xs text-rose-600 hover:text-rose-700 underline font-medium"
                        >
                          Ver distribuição pela Previsão Mensal
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const item = payload[0].payload;
                                  return (
                                    <div className="bg-white/95 backdrop-blur-xs p-2.5 border border-slate-200/90 rounded-xl shadow-lg text-xs space-y-1 z-50 text-slate-800">
                                      <div className="flex items-center gap-1.5 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name}</span>
                                      </div>
                                      <div className="font-semibold text-slate-900 flex items-center justify-between gap-3">
                                        <span>{formatCurrency(item.value)}</span>
                                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                          {item.percent}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={chartType === 'rosca' ? 46 : 0}
                              outerRadius={76}
                              paddingAngle={chartType === 'rosca' ? 3 : 1}
                              dataKey="value"
                              stroke={isDark ? '#0f172a' : '#ffffff'}
                              strokeWidth={2}
                            >
                              {pieData.map((entry) => (
                                <Cell key={`cell-${entry.categoryId}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </RechartsPieChart>
                        </ResponsiveContainer>

                        {/* Center text for Rosca (Donut) */}
                        {chartType === 'rosca' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                              {chartDataMode === 'real' ? 'Total Gasto' : 'Previsão'}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {formatCurrency(totalPieValue)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Category Breakdown list with percentages */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {pieData.map((item) => (
                          <div key={item.categoryId} className="flex items-center justify-between text-xs py-0.5">
                            <div className="flex items-center gap-2 font-normal text-slate-700 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-medium text-slate-800">{formatCurrency(item.value)}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {item.percent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* BOX 2: GASTO POR CATEGORIA */}
              <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className={`text-sm font-semibold ${textTitle} flex items-center gap-2`}>
                    <Layers className="w-4 h-4 text-rose-500" />
                    <span>Gasto por Categoria vs Previsão</span>
                  </h3>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {averages.map(avg => {
                    return (
                      <div key={avg.categoryId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: avg.color }} />
                            <span>{avg.categoryName}</span>
                          </div>
                          <span className="font-medium text-slate-800">
                            {formatCurrency(avg.currentMonthActual)}{' '}
                            <span className="text-slate-400 font-normal">/ {formatCurrency(avg.monthlyAverage)}</span>
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (avg.currentMonthActual / (avg.monthlyAverage || 1)) * 100)}%`,
                              backgroundColor: avg.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        categories={categories}
        onRefreshCategories={onRefreshCategories}
        initialData={editingTransaction}
        defaultType={modalDefaultType}
        defaultMonthYear={currentMonthYear}
      />

      {/* Edit Salary Modal */}
      {isEditingSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200/80 bg-white text-slate-900 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Salário / Receita do Mês</span>
            </h3>

            <p className="text-xs text-slate-500 font-normal">
              Informe o salário base ou valor recebido em {monthNameFormatted}:
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor do Salário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingSalary(false)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-600 font-medium text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSalary}
                disabled={isSavingSalary}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition"
              >
                {isSavingSalary ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTION & COMPARISON DETAIL MODAL */}
      {isProjectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200/80 bg-white text-slate-900 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>Previsão e Detalhamento de Gastos por Categoria</span>
                </h3>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Comparação com média prevista e variação % em relação ao mês anterior
                </p>
              </div>
              <button
                onClick={() => setIsProjectionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-medium"
              >
                ✕
              </button>
            </div>

            {/* Category Breakdown Table */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {projectionBreakdown.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-normal">
                  Nenhuma categoria cadastrada.
                </div>
              ) : (
                projectionBreakdown.map(item => {
                  const isIncrease = item.pctChange > 0;
                  const isDecrease = item.pctChange < 0;

                  return (
                    <div
                      key={item.categoryId}
                      className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Category Info */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                            <span>{item.categoryName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 font-normal">
                            <span>Gasto Real: <strong className="font-semibold text-slate-700">{formatCurrency(item.currentMonthActual)}</strong></span>
                            <span>•</span>
                            <span>Mês Anterior: <strong className="font-semibold text-slate-700">{formatCurrency(item.prevMonthExpense)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Forecast & % Variance Badge */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-medium">Previsão:</div>
                          <div className="text-xs font-semibold text-slate-700">{formatCurrency(item.monthlyAverage)}</div>
                        </div>

                        {/* % Change Badge */}
                        <div className="min-w-[100px] text-right">
                          {item.isNew ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                              +100% (Novo)
                            </span>
                          ) : isIncrease ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                              <TrendingUp className="w-3 h-3 text-rose-500" />
                              +{item.pctChange}%
                            </span>
                          ) : isDecrease ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <TrendingDown className="w-3 h-3 text-emerald-500" />
                              {item.pctChange}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                              0% estável
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-normal">
                Total Previsão: <strong className="text-slate-800 font-semibold">{formatCurrency(totalProjectedExpense)}</strong>
              </div>
              <button
                onClick={() => setIsProjectionModalOpen(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200/80 bg-white text-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Confirmar Exclusão</h3>
            </div>

            <p className="text-xs text-slate-600 font-normal">
              Deseja realmente excluir <strong>"{deletingTx.title}"</strong> ({formatCurrency(deletingTx.amount)})?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingTx(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium shadow-xs transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THEME & COLOR CUSTOMIZATION DRAWER */}
      {isThemeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200/80 bg-white text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-500" />
                <span>Personalizar Aparência</span>
              </h3>
              <button
                onClick={() => setIsThemeOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div>
                <div className="text-xs font-medium text-slate-900">Modo Escuro</div>
                <div className="text-[11px] text-slate-500 font-normal">Tema noturno suave.</div>
              </div>
              <input
                type="checkbox"
                checked={theme.darkMode}
                onChange={(e) => {
                  const newTheme = { ...theme, darkMode: e.target.checked };
                  setTheme(newTheme);
                  localStorage.setItem('user_theme_pref', JSON.stringify(newTheme));
                }}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-400"
              />
            </div>

            {/* Pastel Accent Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Paletas de Cores Pastéis</span>
                <span className="text-[11px] text-rose-500 font-medium">Toques suaves & legíveis</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                {([
                  'pastelRose',
                  'pastelLavender',
                  'pastelMint',
                  'pastelPeach',
                  'pastelSky',
                  'pastelButter',
                  'pastelMatcha',
                ] as const).map(key => {
                  const cfg = THEME_CONFIGS[key];
                  const isSelected = theme.colorTheme === key && !theme.customBgColor;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const newTheme = { ...theme, colorTheme: key, customBgColor: undefined };
                        setTheme(newTheme);
                        localStorage.setItem('user_theme_pref', JSON.stringify(newTheme));
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-rose-300 bg-rose-50/50 font-semibold text-slate-900 shadow-2xs'
                          : 'border-slate-200/70 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: cfg.previewHex }}
                        />
                        <span className="text-xs">{cfg.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsThemeOpen(false)}
                className="px-4 py-2 bg-[#F472B6] hover:bg-[#EC4899] text-white font-medium text-xs rounded-xl shadow-xs transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gastos Fixos Management Modal */}
      <GastosFixosModal
        isOpen={isGastosFixosModalOpen}
        onClose={() => setIsGastosFixosModalOpen(false)}
        categories={categories}
        currentMonthYear={currentMonthYear}
        onRefreshData={fetchMonthData}
        onOpenNewRecurring={() => {
          setEditingTransaction(null);
          setModalDefaultType('despesa');
          setIsModalOpen(true);
        }}
      />

      {/* Importador de Extratos e Faturas Modal */}
      <ImportadorExtratosModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={categories}
        onImportSuccess={fetchMonthData}
      />
    </div>
  );
};
