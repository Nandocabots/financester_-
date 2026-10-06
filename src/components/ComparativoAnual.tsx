import React, { useState } from 'react';
import { AnnualDashboardData } from '../types';
import { ThemeSettings, THEME_CONFIGS } from '../lib/theme';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface ComparativoAnualProps {
  data: AnnualDashboardData;
  theme?: ThemeSettings;
}

export const ComparativoAnual: React.FC<ComparativoAnualProps> = ({ data, theme }) => {
  const [chartType, setChartType] = useState<'bars' | 'lines'>('bars');

  const isDark = theme?.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme?.colorTheme || 'pastelRose'];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatCurrencyShort = (val: number) => {
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(1)}k`;
    }
    return `R$ ${val}`;
  };

  const currentYear = data.year;
  const prevData = data.previousYearComparison;
  const prevYear = prevData?.year || currentYear - 1;

  // Comparison metrics
  const curExpense = data.totalAnnualExpense;
  const prevExpense = prevData?.totalAnnualExpense || 0;
  const expenseDiff = curExpense - prevExpense;
  const expensePctDiff = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;

  const curIncome = data.totalAnnualIncome;
  const prevIncome = prevData?.totalAnnualIncome || 0;
  const incomeDiff = curIncome - prevIncome;
  const incomePctDiff = prevIncome > 0 ? ((curIncome - prevIncome) / prevIncome) * 100 : 0;

  const curSavings = data.totalAnnualSavings;
  const prevSavings = prevData?.totalAnnualSavings || 0;
  const savingsDiff = curSavings - prevSavings;

  // Month-by-month comparative data array
  const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthData = (data.monthlyBreakdown || []).map((m, idx) => {
    const curMonthExp = m.expense || 0;
    const prevMonthExp = prevData?.monthlyExpensesByMonthIndex?.[idx] || 0;
    const diff = curMonthExp - prevMonthExp;
    const pct = prevMonthExp > 0 ? ((curMonthExp - prevMonthExp) / prevMonthExp) * 100 : 0;

    return {
      month: monthNamesShort[idx],
      fullName: m.monthName,
      [`gasto_${currentYear}`]: curMonthExp,
      [`gasto_${prevYear}`]: prevMonthExp,
      diff,
      pct,
    };
  });

  const cardBg = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/80 text-slate-800 shadow-xs';
  const innerCardBg = isDark
    ? 'bg-slate-950/80 border-slate-800/80'
    : 'bg-slate-50/80 border-slate-200/60';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const curColor = activeColorConfig?.previewHex || '#F472B6';
  const prevColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <div id="comparativo-anual-lado-a-lado" className={`p-6 rounded-3xl border space-y-6 ${cardBg}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
              <GitCompare className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
                <span>Comparativo Anual: {currentYear} vs {prevYear}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Ano Contra Ano (YoY)
                </span>
              </h3>
              <p className={`text-xs ${textMuted} font-medium mt-0.5`}>
                Contraste histórico mês a mês para avaliar se os gastos estão subindo, descendo ou estáveis
              </p>
            </div>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('bars')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              chartType === 'bars'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barras Duplas
          </button>
          <button
            type="button"
            onClick={() => setChartType('lines')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              chartType === 'lines'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Linhas Sobrepostas
          </button>
        </div>
      </div>

      {/* KPI Comparison Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Despesas */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Gastos Totais ({currentYear} vs {prevYear})
            </span>
            <TrendingDown className={`w-3.5 h-3.5 ${expenseDiff <= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className={`text-lg font-black ${textTitle}`}>
              {formatCurrency(curExpense)}
            </div>
            <div className="text-xs font-bold text-slate-400">
              {formatCurrency(prevExpense)}
            </div>
          </div>
          <div className="text-[11px] font-semibold mt-1 flex items-center gap-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                expenseDiff <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {expenseDiff <= 0 ? 'Economizou ' : 'Gastou a mais '}
              {formatCurrency(Math.abs(expenseDiff))} ({expensePctDiff > 0 ? '+' : ''}{expensePctDiff.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Receitas */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Receitas ({currentYear} vs {prevYear})
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className={`text-lg font-black ${textTitle}`}>
              {formatCurrency(curIncome)}
            </div>
            <div className="text-xs font-bold text-slate-400">
              {formatCurrency(prevIncome)}
            </div>
          </div>
          <div className="text-[11px] font-semibold mt-1 flex items-center gap-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                incomeDiff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {incomeDiff >= 0 ? '+' : ''}{formatCurrency(incomeDiff)} ({incomePctDiff > 0 ? '+' : ''}{incomePctDiff.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Saldo / Economia */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Saldo Economizado
            </span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className={`text-lg font-black ${curSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(curSavings)}
            </div>
            <div className="text-xs font-bold text-slate-400">
              {formatCurrency(prevSavings)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Variação de poupança: <strong className={savingsDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {savingsDiff >= 0 ? '+' : ''}{formatCurrency(savingsDiff)}
            </strong>
          </div>
        </div>
      </div>

      {/* Comparative Chart */}
      <div className="space-y-2">
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bars' ? (
              <BarChart data={monthData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#F1F5F9'} vertical={false} />
                <XAxis dataKey="month" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={12} tickLine={false} />
                <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={68} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const cVal = item[`gasto_${currentYear}`] || 0;
                      const pVal = item[`gasto_${prevYear}`] || 0;
                      const diff = cVal - pVal;
                      const pct = pVal > 0 ? (diff / pVal) * 100 : 0;

                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-200/90 rounded-2xl shadow-xl text-xs space-y-1.5 text-slate-800 min-w-[210px]">
                          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                            {item.fullName}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: curColor }} />
                              <span>{currentYear}:</span>
                            </span>
                            <span className="font-black">{formatCurrency(cVal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: prevColor }} />
                              <span>{prevYear}:</span>
                            </span>
                            <span className="font-bold">{formatCurrency(pVal)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span>Diferença:</span>
                            <span className={`font-bold ${diff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {diff <= 0 ? '-' : '+'}{formatCurrency(Math.abs(diff))} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(val) => (
                    <span className="text-xs font-bold text-slate-700">
                      {val === `gasto_${currentYear}` ? `Gastos ${currentYear}` : `Gastos ${prevYear}`}
                    </span>
                  )}
                />
                <Bar dataKey={`gasto_${currentYear}`} fill={curColor} radius={[6, 6, 0, 0]} />
                <Bar dataKey={`gasto_${prevYear}`} fill={prevColor} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <ComposedChart data={monthData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#F1F5F9'} vertical={false} />
                <XAxis dataKey="month" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={12} tickLine={false} />
                <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={68} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const cVal = item[`gasto_${currentYear}`] || 0;
                      const pVal = item[`gasto_${prevYear}`] || 0;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-200/90 rounded-2xl shadow-xl text-xs space-y-1.5 text-slate-800 min-w-[190px]">
                          <div className="font-bold text-slate-900 border-b pb-1">{item.fullName}</div>
                          <div className="flex justify-between font-bold">
                            <span>{currentYear}:</span>
                            <span>{formatCurrency(cVal)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>{prevYear}:</span>
                            <span>{formatCurrency(pVal)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(val) => (
                    <span className="text-xs font-bold text-slate-700">
                      {val === `gasto_${currentYear}` ? `Gastos ${currentYear}` : `Gastos ${prevYear}`}
                    </span>
                  )}
                />
                <Line type="monotone" dataKey={`gasto_${currentYear}`} stroke={curColor} strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey={`gasto_${prevYear}`} stroke={prevColor} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
