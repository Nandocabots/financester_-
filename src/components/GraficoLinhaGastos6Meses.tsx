import React, { useState } from 'react';
import { AnnualDashboardData } from '../types';
import { ThemeSettings, THEME_CONFIGS } from '../lib/theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface GraficoLinhaGastos6MesesProps {
  data: AnnualDashboardData;
  theme?: ThemeSettings;
}

export const GraficoLinhaGastos6Meses: React.FC<GraficoLinhaGastos6MesesProps> = ({
  data,
  theme,
}) => {
  const [viewMode, setViewMode] = useState<'6m' | '12m'>('6m');

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

  // Determine dataset based on viewMode
  // Default is '6m' (últimos 6 meses)
  const chartData = React.useMemo(() => {
    if (viewMode === '6m') {
      if (data.last6Months && data.last6Months.length > 0) {
        return data.last6Months.map(item => ({
          monthYear: item.monthYear,
          label: item.shortName || item.monthName.split(' ')[0],
          fullName: item.monthName,
          expense: item.expense,
          income: item.income,
          net: item.net,
        }));
      }

      // Fallback: take last 6 months from monthlyBreakdown
      const mb = data.monthlyBreakdown || [];
      const slice6 = mb.slice(-6);
      return slice6.map(item => ({
        monthYear: item.monthYear,
        label: item.monthName.substring(0, 3),
        fullName: `${item.monthName} de ${data.year}`,
        expense: item.expense,
        income: item.income,
        net: item.net,
      }));
    }

    // 12m view: all months of the selected year
    return (data.monthlyBreakdown || []).map(item => ({
      monthYear: item.monthYear,
      label: item.monthName.substring(0, 3),
      fullName: `${item.monthName} de ${data.year}`,
      expense: item.expense,
      income: item.income,
      net: item.net,
    }));
  }, [viewMode, data]);

  // Calculations for stats
  const totalExpenseInPeriod = chartData.reduce((sum, item) => sum + item.expense, 0);
  const averageExpenseInPeriod = chartData.length > 0 ? totalExpenseInPeriod / chartData.length : 0;

  // Max and Min expense month in period
  const maxMonth = React.useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((prev, current) => (current.expense > prev.expense ? current : prev), chartData[0]);
  }, [chartData]);

  const minMonth = React.useMemo(() => {
    if (chartData.length === 0) return null;
    // Filter months with > 0 expense if any, otherwise return min
    const positiveExpenses = chartData.filter(d => d.expense > 0);
    const searchPool = positiveExpenses.length > 0 ? positiveExpenses : chartData;
    return searchPool.reduce((prev, current) => (current.expense < prev.expense ? current : prev), searchPool[0]);
  }, [chartData]);

  // Recent month vs average variation
  const lastMonthItem = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const recentDiffFromAvg = lastMonthItem && averageExpenseInPeriod > 0
    ? ((lastMonthItem.expense - averageExpenseInPeriod) / averageExpenseInPeriod) * 100
    : 0;

  // Dynamic styling variables
  const cardBg = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/80 text-slate-800 shadow-xs';
  const innerCardBg = isDark
    ? 'bg-slate-950/80 border-slate-800/80'
    : 'bg-slate-50/90 border-slate-200/70';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const gridColor = isDark ? '#334155' : '#F1F5F9';
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const lineColor = activeColorConfig?.previewHex || '#F472B6';
  const gradientFillId = `expense-line-gradient-${data.year}`;

  return (
    <div id="grafico-evolucao-gastos-6m" className={`p-6 rounded-3xl border space-y-6 ${cardBg}`}>
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              <Activity className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
                <span>Evolução dos Gastos Totais</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                  {viewMode === '6m' ? 'Últimos 6 Meses' : `Ano Todo (${data.year})`}
                </span>
              </h3>
              <p className={`text-xs ${textMuted} font-medium mt-0.5`}>
                Curva de despesas mensais para identificar tendências, variações e controle orçamentário
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 self-start sm:self-auto">
          <button
            id="btn-filtro-6m"
            type="button"
            onClick={() => setViewMode('6m')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              viewMode === '6m'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 6 Meses
          </button>
          <button
            id="btn-filtro-12m"
            type="button"
            onClick={() => setViewMode('12m')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              viewMode === '12m'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ano Completo ({data.year})
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total do Período */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total ({viewMode === '6m' ? '6 Meses' : 'Ano'})
            </span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lineColor }} />
          </div>
          <div className={`text-lg font-black mt-1 ${textTitle}`}>
            {formatCurrency(totalExpenseInPeriod)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Soma de todas as saídas
          </div>
        </div>

        {/* Média Mensal */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Média Mensal
            </span>
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-lg font-black mt-1 ${textTitle}`}>
            {formatCurrency(averageExpenseInPeriod)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Por mês no período
          </div>
        </div>

        {/* Pico de Gastos */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Mês de Maior Gasto
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black mt-1 text-rose-600">
            {maxMonth ? formatCurrency(maxMonth.expense) : 'R$ 0,00'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            {maxMonth ? maxMonth.fullName : '-'}
          </div>
        </div>

        {/* Mês Mais Econômico */}
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Mais Econômico
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black mt-1 text-emerald-600">
            {minMonth ? formatCurrency(minMonth.expense) : 'R$ 0,00'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            {minMonth ? minMonth.fullName : '-'}
          </div>
        </div>
      </div>

      {/* Main Line Chart Canvas */}
      {totalExpenseInPeriod === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs font-normal border border-dashed border-slate-200 rounded-2xl">
          Nenhuma despesa registrada para o período selecionado ({viewMode === '6m' ? 'últimos 6 meses' : data.year}).
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 18, right: 20, left: 0, bottom: 6 }}
              >
                <defs>
                  <linearGradient id={gradientFillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

                <XAxis
                  dataKey="label"
                  stroke={axisColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                  dy={6}
                />

                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrencyShort}
                  width={68}
                  dx={-4}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const expenseVal = item.expense || 0;
                      const diffAvg = averageExpenseInPeriod > 0
                        ? ((expenseVal - averageExpenseInPeriod) / averageExpenseInPeriod) * 100
                        : 0;
                      const isAboveAvg = diffAvg > 0;

                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-200/90 rounded-2xl shadow-xl text-xs space-y-2 z-50 text-slate-800 min-w-[200px]">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-900">{item.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.monthYear}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lineColor }} />
                                Total de Gastos:
                              </span>
                              <span className="font-black text-slate-900 text-sm">
                                {formatCurrency(expenseVal)}
                              </span>
                            </div>

                            {item.income > 0 && (
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>Receitas do Mês:</span>
                                <span className="font-semibold text-emerald-600">
                                  {formatCurrency(item.income)}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                              <span className="text-slate-500">vs Média do Período:</span>
                              <span
                                className={`font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                                  Math.abs(diffAvg) < 1
                                    ? 'bg-slate-100 text-slate-700'
                                    : isAboveAvg
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isAboveAvg ? '+' : ''}{diffAvg.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Reference line for 6-month average */}
                {averageExpenseInPeriod > 0 && (
                  <ReferenceLine
                    y={averageExpenseInPeriod}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Média: ${formatCurrencyShort(averageExpenseInPeriod)}`,
                      position: 'insideTopRight',
                      fill: isDark ? '#94a3b8' : '#64748b',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Gastos Totais"
                  stroke={lineColor}
                  strokeWidth={3}
                  dot={{
                    r: 4.5,
                    stroke: lineColor,
                    strokeWidth: 2,
                    fill: isDark ? '#0f172a' : '#ffffff',
                  }}
                  activeDot={{
                    r: 7,
                    stroke: lineColor,
                    strokeWidth: 3,
                    fill: lineColor,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom legend & context note */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full" style={{ backgroundColor: lineColor }} />
                <span>Gastos Lançados no Mês</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                <span>Linha de Média ({formatCurrency(averageExpenseInPeriod)})</span>
              </span>
            </div>

            {lastMonthItem && (
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span>Último mês ({lastMonthItem.label}):</span>
                <strong className="text-slate-800 font-bold">{formatCurrency(lastMonthItem.expense)}</strong>
                {recentDiffFromAvg !== 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    recentDiffFromAvg > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {recentDiffFromAvg > 0 ? `+${recentDiffFromAvg.toFixed(1)}%` : `${recentDiffFromAvg.toFixed(1)}%`} vs média
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
