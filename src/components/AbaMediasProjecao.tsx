import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CategoryAverage, ProjectedSalaryAnalysis } from '../types';
import {
  TrendingUp,
  Calculator,
  Wallet,
  Sparkles,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const AbaMediasProjecao: React.FC = () => {
  const [targetMonthYear, setTargetMonthYear] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const [averages, setAverages] = useState<CategoryAverage[]>([]);
  const [projection, setProjection] = useState<ProjectedSalaryAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [avgData, projData] = await Promise.all([
        api.getCategoryAverages(targetMonthYear),
        api.getProjectedSalary(targetMonthYear),
      ]);
      setAverages(avgData);
      setProjection(projData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar médias e projeções.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetMonthYear]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = targetMonthYear.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    setTargetMonthYear(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = targetMonthYear.split('-').map(Number);
    const date = new Date(y, m, 1);
    setTargetMonthYear(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const [y, m] = targetMonthYear.split('-').map(Number);
  const dateObj = new Date(y, m - 1, 1);
  const monthNameFormatted = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Top Header & Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <span>Médias de Gastos & Salário Líquido Previsto</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Cálculo inteligente do saldo líquido futuro com base no seu histórico e lançamentos reais
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-emerald-800 capitalize px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            {monthNameFormatted}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-semibold text-slate-600">Calculando médias do histórico...</p>
        </div>
      ) : error || !projection ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold">
          {error || 'Não foi possível carregar as informações.'}
        </div>
      ) : (
        <>
          {/* FEATURE HERO CARD: Live Dynamic Salary Projection */}
          <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span className="uppercase tracking-wider">Projeção do Salário Líquido para {monthNameFormatted}</span>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                Atualização em Tempo Real
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Salário / Receita Base */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Salário / Receita
                </div>
                <div className="text-lg font-black text-emerald-600">
                  {formatCurrency(projection.actualIncome)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                  Entrada prev. / lançada
                </div>
              </div>

              {/* Gastos Lançados até Agora */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                  (-) Gastos Já Lançados
                </div>
                <div className="text-lg font-black text-rose-600">
                  {formatCurrency(projection.actualExpensesLogged)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                  Inclui {formatCurrency(projection.activeInstallmentsAmount)} em parcelas
                </div>
              </div>

              {/* Média das Demais Categorias */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                  (-) Média de Categorias Pendentes
                </div>
                <div className="text-lg font-black text-amber-600">
                  {formatCurrency(projection.projectedUnfulfilledExpenses)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                  Estimativa de gastos restantes
                </div>
              </div>

              {/* Salário Líquido Estimado */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl relative overflow-hidden">
                <div className="text-[11px] font-bold text-emerald-800 uppercase mb-1 flex items-center justify-between">
                  <span>Salário Líquido Livre</span>
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-900">
                  {formatCurrency(projection.estimatedNetSalary)}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1 font-bold">
                  Sobra prevista após contas
                </div>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Como funciona o cálculo: </span>
                {projection.updatedBalanceText}. À medida que você cadastra seus gastos reais na aba <strong>Lançamentos Mensais</strong>, o valor estimado da média é substituído automaticamente pelo seu gasto real!
              </div>
            </div>
          </div>

          {/* SECTION: Category Historical Averages Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Média Histórica por Categoria de Despesa</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Análise com base no seu histórico cadastrado
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Categoria</th>
                    <th className="px-6 py-3.5 text-right">Média Histórica Mensal</th>
                    <th className="px-6 py-3.5 text-right">Lançado em {monthNameFormatted}</th>
                    <th className="px-6 py-3.5 text-center">Status no Mês</th>
                    <th className="px-6 py-3.5 text-right">Impacto na Projeção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {averages.map((avg) => {
                    const hasLogged = avg.currentMonthActual > 0;
                    return (
                      <tr key={avg.categoryId} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: avg.color }} />
                          {avg.categoryName}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-700">
                          {formatCurrency(avg.monthlyAverage)}
                        </td>
                        <td className={`px-6 py-3.5 text-right font-bold ${hasLogged ? 'text-rose-600' : 'text-slate-400'}`}>
                          {hasLogged ? formatCurrency(avg.currentMonthActual) : 'R$ 0,00'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {hasLogged ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Real Lançado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Usando Média
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-700">
                          {hasLogged ? (
                            <span className="text-slate-400 font-sans text-[11px]">R$ 0,00 (substituído)</span>
                          ) : (
                            <span className="text-amber-700">- {formatCurrency(avg.monthlyAverage)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
