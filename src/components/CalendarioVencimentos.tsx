import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { ThemeSettings, THEME_CONFIGS } from '../lib/theme';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Receipt,
  Filter,
  DollarSign
} from 'lucide-react';

interface CalendarioVencimentosProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonthYear: string; // "YYYY-MM"
  onToggleStatus: (transactionId: string) => Promise<void>;
  onOpenNewTransaction?: (defaultDate?: string) => void;
  theme?: ThemeSettings;
}

export const CalendarioVencimentos: React.FC<CalendarioVencimentosProps> = ({
  transactions,
  categories,
  currentMonthYear,
  onToggleStatus,
  onOpenNewTransaction,
  theme,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'pago'>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const isDark = theme?.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme?.colorTheme || 'pastelRose'];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const [yearStr, monthStr] = currentMonthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Month navigation calculations
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

  // Month names
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Filter expenses for this month
  const monthExpenses = transactions.filter(t => t.monthYear === currentMonthYear && t.type === 'despesa');

  // Stats
  const totalBills = monthExpenses.length;
  const totalAmount = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = monthExpenses.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.amount, 0);
  const totalPending = monthExpenses.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = monthExpenses.filter(t => t.status === 'pendente').length;

  // Next upcoming bill (status pendente with date >= today, or earliest pending date)
  const todayStr = new Date().toISOString().substring(0, 10);
  const pendingBillsSorted = monthExpenses
    .filter(t => t.status === 'pendente')
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextUpcoming = pendingBillsSorted.find(t => t.date >= todayStr) || pendingBillsSorted[0] || null;

  // Map expenses by day
  const expensesByDay: Record<number, Transaction[]> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    expensesByDay[d] = [];
  }

  monthExpenses.forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10);
    if (day >= 1 && day <= daysInMonth) {
      if (filterStatus === 'all' || t.status === filterStatus) {
        expensesByDay[day].push(t);
      }
    }
  });

  const cardBg = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/80 text-slate-800 shadow-xs';
  const innerCardBg = isDark
    ? 'bg-slate-950/80 border-slate-800/80'
    : 'bg-slate-50/80 border-slate-200/60';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const todayDay = new Date().getFullYear() === year && new Date().getMonth() + 1 === month
    ? new Date().getDate()
    : null;

  return (
    <div id="calendario-vencimentos" className={`p-6 rounded-3xl border space-y-6 ${cardBg}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-950/60 text-blue-400 border border-blue-800/50' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              <CalendarIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className={`text-base font-black ${textTitle} flex items-center gap-2`}>
                <span>Calendário de Vencimentos</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  {monthNames[month - 1]} de {year}
                </span>
              </h3>
              <p className={`text-xs ${textMuted} font-medium mt-0.5`}>
                Visualize quando vencem suas contas, boletos e despesas para controlar o fluxo de caixa diário
              </p>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({totalBills})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pendente')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
              filterStatus === 'pendente'
                ? 'bg-white text-amber-700 shadow-2xs border border-amber-200/60'
                : 'text-amber-700 hover:text-amber-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>A Vencer ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pago')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
              filterStatus === 'pago'
                ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200/60'
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pagas ({totalBills - pendingCount})</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total de Contas
            </span>
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-lg font-black mt-1 ${textTitle}`}>
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {totalBills} lançamentos no mês
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Total Já Pago
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black mt-1 text-emerald-600">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {totalAmount > 0 ? `${((totalPaid / totalAmount) * 100).toFixed(0)}% liquidado` : '0%'}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Pendente / A Vencer
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black mt-1 text-amber-600">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {pendingCount} contas pendentes
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Próximo Vencimento
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-sm font-black mt-1 text-slate-900 truncate">
            {nextUpcoming ? nextUpcoming.title : 'Nenhum pendente'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>{nextUpcoming ? `Dia ${parseInt(nextUpcoming.date.split('-')[2], 10)}` : 'Tudo em dia!'}</span>
            {nextUpcoming && <strong className="text-rose-600 font-bold">{formatCurrency(nextUpcoming.amount)}</strong>}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-100/70 text-center">
          {weekDays.map((wd, idx) => (
            <div
              key={wd}
              className={`py-2 text-[11px] font-bold ${
                idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-600'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar days matrix */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-200/40 gap-px">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/40 min-h-[95px] p-2 opacity-50" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayItems = expensesByDay[dayNum] || [];
            const isToday = dayNum === todayDay;
            const dayTotal = dayItems.reduce((sum, item) => sum + item.amount, 0);
            const hasPending = dayItems.some(item => item.status === 'pendente');
            const dayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
                className={`bg-white min-h-[105px] p-2 flex flex-col justify-between transition cursor-pointer hover:bg-rose-50/20 ${
                  isToday ? 'ring-2 ring-inset ring-rose-400 bg-rose-50/30' : ''
                } ${selectedDay === dayNum ? 'bg-amber-50/40' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-rose-500 text-white font-black shadow-2xs'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayItems.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-500">
                      {formatCurrency(dayTotal)}
                    </span>
                  )}
                </div>

                {/* Day items list */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {dayItems.slice(0, 3).map(item => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    const isPaid = item.status === 'pago';

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(item.id);
                        }}
                        title={`${item.title} - ${formatCurrency(item.amount)} (${isPaid ? 'Pago' : 'Pendente'}). Clique para alternar.`}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center justify-between gap-1 transition ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
                        }`}
                      >
                        <span className="flex items-center gap-1 truncate">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#CBD5E1' }}
                          />
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="font-bold shrink-0 text-[9px]">
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600 inline" />
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {dayItems.length > 3 && (
                    <div className="text-[9px] font-bold text-slate-400 text-center">
                      +{dayItems.length - 3} mais
                    </div>
                  )}
                </div>

                {/* Quick Add Button on Hover or click */}
                {onOpenNewTransaction && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewTransaction(dayDateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-[10px] text-slate-400 hover:text-rose-600 transition flex items-center justify-center gap-0.5 pt-0.5"
                    title="Adicionar conta neste dia"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Lançar</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Drawer/Box */}
      {selectedDay !== null && (
        <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-3 animate-in fade-in duration-200`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-rose-500" />
              <span>
                Vencimentos do Dia {selectedDay} de {monthNames[month - 1]} ({expensesByDay[selectedDay]?.length || 0} contas)
              </span>
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-0.5 rounded-lg hover:bg-slate-200/50"
            >
              Fechar Detalhes ✕
            </button>
          </div>

          {expensesByDay[selectedDay]?.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Nenhuma conta vence neste dia.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {expensesByDay[selectedDay]?.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                const isPaid = item.status === 'pago';

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200/70 bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat?.color }} />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{cat?.name} • {item.paymentMethod}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900">{formatCurrency(item.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Clique para alternar status"
                      >
                        {isPaid ? 'Pago ✓' : 'Pendente ⏳'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
