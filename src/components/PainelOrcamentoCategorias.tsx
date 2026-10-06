import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { ThemeSettings, THEME_CONFIGS } from '../lib/theme';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Edit2,
  Check,
  X,
  PieChart,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface PainelOrcamentoCategoriasProps {
  categories: Category[];
  transactions: Transaction[];
  monthYear: string;
  onUpdateCategoryBudget: (categoryId: string, newBudget: number) => Promise<void>;
  theme?: ThemeSettings;
}

export const PainelOrcamentoCategorias: React.FC<PainelOrcamentoCategoriasProps> = ({
  categories,
  transactions,
  monthYear,
  onUpdateCategoryBudget,
  theme,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempBudgetValue, setTempBudgetValue] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'alert' | 'budgeted'>('all');
  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme?.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme?.colorTheme || 'pastelRose'];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Only expense categories
  const expenseCategories = categories.filter(c => c.type === 'despesa');

  // Compute spendings per category in the current month
  const categoryBudgetData = expenseCategories.map(cat => {
    const spent = transactions
      .filter(t => t.categoryId === cat.id && t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);

    const budget = cat.monthlyBudget || 0;
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;
    const isExceeded = budget > 0 && spent > budget;
    const isWarning = budget > 0 && pct >= 80 && pct <= 100;
    const isSafe = budget > 0 && pct < 80;

    return {
      category: cat,
      spent,
      budget,
      pct,
      remaining,
      isExceeded,
      isWarning,
      isSafe,
    };
  });

  // Totals
  const totalBudgeted = categoryBudgetData.reduce((sum, item) => sum + item.budget, 0);
  const totalSpentInBudgeted = categoryBudgetData
    .filter(item => item.budget > 0)
    .reduce((sum, item) => sum + item.spent, 0);
  const overallPct = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;
  const totalRemaining = totalBudgeted - totalSpentInBudgeted;

  const totalExceededCount = categoryBudgetData.filter(item => item.isExceeded).length;
  const totalWarningCount = categoryBudgetData.filter(item => item.isWarning).length;

  // Filtered list
  const filteredData = categoryBudgetData.filter(item => {
    if (filterMode === 'alert') return item.isExceeded || item.isWarning;
    if (filterMode === 'budgeted') return item.budget > 0;
    return true;
  });

  const handleStartEdit = (catId: string, currentBudget: number) => {
    setEditingCategoryId(catId);
    setTempBudgetValue(currentBudget > 0 ? currentBudget.toString() : '');
  };

  const handleSaveBudget = async (catId: string) => {
    const num = parseFloat(tempBudgetValue.replace(',', '.'));
    const validVal = isNaN(num) || num < 0 ? 0 : num;
    setIsSaving(true);
    try {
      await onUpdateCategoryBudget(catId, validVal);
      setEditingCategoryId(null);
    } catch (e: any) {
      alert('Erro ao atualizar orçamento: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const cardBg = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/80 text-slate-800 shadow-xs';
  const innerCardBg = isDark
    ? 'bg-slate-950/80 border-slate-800/80'
    : 'bg-slate-50/80 border-slate-200/60';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div id="painel-orcamento-categorias" className={`p-6 rounded-3xl border space-y-6 ${cardBg}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
                <span>Metas & Teto de Gastos por Categoria</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  Orçamento Mensal
                </span>
              </h3>
              <p className={`text-xs ${textMuted} font-medium mt-0.5`}>
                Defina limites para cada categoria e acompanhe o consumo da sua verba em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({expenseCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('budgeted')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filterMode === 'budgeted'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Com Teto ({categoryBudgetData.filter(c => c.budget > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('alert')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              filterMode === 'alert'
                ? 'bg-white text-rose-700 shadow-2xs border border-rose-200/60'
                : 'text-rose-600 hover:text-rose-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Alertas ({totalExceededCount + totalWarningCount})</span>
          </button>
        </div>
      </div>

      {/* Global Budget KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Orçamento Total Previsto
            </span>
            <Target className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className={`text-lg font-black mt-1 ${textTitle}`}>
            {formatCurrency(totalBudgeted)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Soma dos tetos cadastrados
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Consumido
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className={`text-lg font-black mt-1 ${textTitle}`}>
            {formatCurrency(totalSpentInBudgeted)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {overallPct.toFixed(1)}% do orçamento total
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Saldo Orçamentário
            </span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${totalRemaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div className={`text-lg font-black mt-1 ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(totalRemaining)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {totalRemaining >= 0 ? 'Ainda disponível para gastar' : 'Orçamento geral estourado'}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Status das Categorias
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black mt-1 flex items-center gap-2">
            <span className="text-rose-600">{totalExceededCount} estouradas</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600">{totalWarningCount} em alerta</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {categoryBudgetData.filter(i => i.isSafe).length} dentro do teto seguro
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredData.map(item => {
          const isEditing = editingCategoryId === item.category.id;
          const pctClamped = Math.min(100, Math.max(0, item.pct));

          // Progress bar color based on status
          let progressColor = '#10B981'; // safe green
          let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
          let statusText = 'Dentro da Meta';

          if (item.budget === 0) {
            progressColor = '#CBD5E1';
            badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
            statusText = 'Sem Teto';
          } else if (item.isExceeded) {
            progressColor = '#F43F5E'; // rose/red
            badgeBg = 'bg-rose-50 text-rose-700 border-rose-200/60';
            statusText = `Estourado (+${formatCurrency(Math.abs(item.remaining))})`;
          } else if (item.isWarning) {
            progressColor = '#F59E0B'; // amber
            badgeBg = 'bg-amber-50 text-amber-700 border-amber-200/60';
            statusText = `Atenção (${item.pct.toFixed(0)}%)`;
          } else {
            statusText = `Resta ${formatCurrency(item.remaining)}`;
          }

          return (
            <div
              key={item.category.id}
              className={`p-4 rounded-2xl border transition hover:border-slate-300 ${innerCardBg} flex flex-col justify-between space-y-3`}
            >
              {/* Category Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.category.color }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {item.category.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Gasto real: <strong className="text-slate-700 font-bold">{formatCurrency(item.spent)}</strong>
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badgeBg}`}>
                  {statusText}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Progresso:</span>
                  <span className="font-bold text-slate-700">
                    {item.budget > 0 ? `${item.pct.toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/70 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pctClamped}%`,
                      backgroundColor: progressColor,
                    }}
                  />
                </div>
              </div>

              {/* Budget amount & quick edit */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                {isEditing ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-[11px] font-bold text-slate-500">R$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={tempBudgetValue}
                      onChange={e => setTempBudgetValue(e.target.value)}
                      placeholder="Ex: 1200"
                      className="w-24 px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveBudget(item.category.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                      title="Salvar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategoryId(null)}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] text-slate-600 font-medium">
                      Teto Mensal:{' '}
                      <strong className="text-slate-900 font-black">
                        {item.budget > 0 ? formatCurrency(item.budget) : 'Não definido'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(item.category.id, item.budget)}
                      className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                      title="Ajustar teto da categoria"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Ajustar Teto</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
