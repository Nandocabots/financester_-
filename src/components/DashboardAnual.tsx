import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AnnualDashboardData, PaymentMethod } from '../types';
import { ThemeSettings } from '../lib/theme';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CircleDot,
  BarChart2,
  Download,
  Printer
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { GraficoLinhaGastos6Meses } from './GraficoLinhaGastos6Meses';
import { ComparativoAnual } from './ComparativoAnual';
import { exportAnnualSummaryToCSV } from '../lib/exportUtils';

interface DashboardAnualProps {
  theme?: ThemeSettings;
}

export const DashboardAnual: React.FC<DashboardAnualProps> = ({ theme }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<AnnualDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Active selected payment method for breakdown
  const [activePaymentMethodFilter, setActivePaymentMethodFilter] = useState<PaymentMethod>('crédito');

  const isDark = theme?.darkMode;
  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800 shadow-xs';
  const innerCardBg = isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';

  const fetchDashboard = async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnnualDashboard(year);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dashboard anual.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold text-slate-600">Carregando dados anuais...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold">
        {error || 'Não foi possível carregar os dados.'}
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    'crédito': 'Cartão de Crédito',
    'débito': 'Cartão de Débito',
    'pix': 'PIX',
    'ticket': 'Ticket / Vale',
    'dinheiro': 'Dinheiro',
    'transferência': 'Transferência',
  };

  return (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
            <Calendar className="w-5 h-5 text-emerald-500" />
            <span>Visão Anual - {data.year}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Resumo consolidado das suas receitas, despesas e gastos por forma de pagamento no ano todo
          </p>
        </div>

        {/* Action Controls & Year Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Annual Summary CSV */}
          <button
            onClick={() => exportAnnualSummaryToCSV(data)}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/70 transition flex items-center gap-1.5 shadow-2xs"
            title="Exportar Relatório Anual para Planilha (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          {/* Print Report */}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs"
            title="Imprimir Relatório Anual"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Year Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Ano:</span>
            {[2025, 2026, 2027].map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition border ${
                  selectedYear === y
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Total Entradas (Ano)
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 my-1">
            {formatCurrency(data.totalAnnualIncome)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Média de {formatCurrency(data.totalAnnualIncome / 12)}/mês
          </div>
        </div>

        {/* Despesa Total */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Total Saídas (Ano)
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-2xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 my-1">
            {formatCurrency(data.totalAnnualExpense)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Média de {formatCurrency(data.averageMonthlyExpense)}/mês
          </div>
        </div>

        {/* Saldo Líquido do Ano */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Saldo Acumulado no Ano
            </span>
            <div className={`p-2 rounded-2xl ${data.totalAnnualSavings >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-black my-1 ${data.totalAnnualSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(data.totalAnnualSavings)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {data.totalAnnualSavings >= 0 ? 'Sobra de caixa acumulada' : 'Déficit acumulado no ano'}
          </div>
        </div>

        {/* Média de Crédito */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Gasto no Cartão de Crédito
            </span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-2xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-600 my-1">
            {formatCurrency(data.paymentMethodTotals['crédito'] || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Representa {data.totalAnnualExpense > 0 ? Math.round(((data.paymentMethodTotals['crédito'] || 0) / data.totalAnnualExpense) * 100) : 0}% dos gastos totais
          </div>
        </div>
      </div>

      {/* SECTION: 6-Month Line Chart Expense Evolution */}
      <GraficoLinhaGastos6Meses data={data} theme={theme} />

      {/* SECTION: Payment Method Breakdown */}
      <div className={`p-6 rounded-3xl border space-y-5 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span>Análise por Forma de Pagamento (Crédito, PIX, Débito, Ticket)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Selecione uma modalidade para visualizar quanto você gasta por mês e no ano
            </p>
          </div>

          {/* Payment Method Badges */}
          <div className="flex flex-wrap gap-1.5">
            {(['crédito', 'débito', 'pix', 'ticket', 'dinheiro', 'transferência'] as PaymentMethod[]).map(pm => (
              <button
                key={pm}
                onClick={() => setActivePaymentMethodFilter(pm)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                  activePaymentMethodFilter === pm
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {paymentMethodLabels[pm]}: {formatCurrency(data.paymentMethodTotals[pm] || 0)}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Payment Method Breakdown */}
        <div className={`p-4 rounded-2xl border space-y-4 ${innerCardBg}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              Evolução Mensal de Gastos com: {paymentMethodLabels[activePaymentMethodFilter]}
            </span>
            <span className="text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
              Total no Ano: {formatCurrency(data.paymentMethodTotals[activePaymentMethodFilter] || 0)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {data.monthlyBreakdown.map((m) => {
              const spent = data.paymentMethodMonthly[activePaymentMethodFilter]?.[m.monthYear] || 0;
              return (
                <div
                  key={m.monthYear}
                  className="p-3 bg-white border border-slate-200/80 rounded-2xl text-center shadow-2xs"
                >
                  <div className="text-[11px] font-bold text-slate-500 mb-1">
                    {m.monthName}
                  </div>
                  <div className={`text-sm font-black ${spent > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {formatCurrency(spent)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: 12-Month Table */}
      <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
            <Calendar className="w-5 h-5 text-emerald-500" />
            <span>Detalhamento dos 12 Meses de {data.year}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="px-6 py-3.5">Mês</th>
                <th className="px-6 py-3.5 text-right">Entradas (Receitas)</th>
                <th className="px-6 py-3.5 text-right">Saídas (Despesas)</th>
                <th className="px-6 py-3.5 text-right">Saldo do Mês</th>
                <th className="px-6 py-3.5 text-center">Status do Caixa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {data.monthlyBreakdown.map((m) => {
                const isPositive = m.net >= 0;
                return (
                  <tr key={m.monthYear} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {m.monthName}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                      {formatCurrency(m.income)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-rose-600">
                      {formatCurrency(m.expense)}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(m.net)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? 'Positivo' : 'Negativo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-black border-t border-slate-200 text-slate-900">
              <tr>
                <td className="px-6 py-4 uppercase">Total do Ano</td>
                <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(data.totalAnnualIncome)}</td>
                <td className="px-6 py-4 text-right text-rose-600">{formatCurrency(data.totalAnnualExpense)}</td>
                <td className={`px-6 py-4 text-right ${data.totalAnnualSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(data.totalAnnualSavings)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-slate-500 text-[11px] font-bold">Balanço Anual</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION: Comparativo Anual (YoY - Ano Atual vs Ano Anterior) */}
      <ComparativoAnual data={data} theme={theme} />

      {/* SECTION: Category Distribution with Pie Chart */}
      <div className={`p-6 rounded-3xl border ${cardBg}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
            <PieChart className="w-5 h-5 text-amber-500" />
            <span>Distribuição de Gastos por Categoria no Ano</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Total do Ano: {formatCurrency(data.totalAnnualExpense)}
          </span>
        </div>

        {data.categoryTotals.length === 0 || data.totalAnnualExpense === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-normal">
            Nenhuma despesa registrada para o ano selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Pie Chart */}
            <div className="lg:col-span-5 h-64 relative flex items-center justify-center">
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
                              <span>{item.categoryName}</span>
                            </div>
                            <div className="font-semibold text-slate-900 flex items-center justify-between gap-3">
                              <span>{formatCurrency(item.amount)}</span>
                              <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={data.categoryTotals.filter(c => c.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="categoryName"
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={2}
                  >
                    {data.categoryTotals.filter(c => c.amount > 0).map((entry) => (
                      <Cell key={`annual-cell-${entry.categoryId}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Despesas</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrency(data.totalAnnualExpense)}</span>
              </div>
            </div>

            {/* List with progress bars */}
            <div className="lg:col-span-7 space-y-3">
              {data.categoryTotals.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.categoryName}
                    </span>
                    <span className="text-slate-800 font-extrabold">
                      {formatCurrency(cat.amount)}{' '}
                      <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, cat.percentage)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
