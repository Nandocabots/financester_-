import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Transaction, Category } from '../types';
import {
  X,
  Clock,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Plus,
  RefreshCw,
  Slash,
  ArrowRight
} from 'lucide-react';

interface GastosFixosModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentMonthYear: string; // E.g. "2026-08"
  onRefreshData: () => void;
  onOpenNewRecurring: () => void;
}

interface RecurringGroupItem {
  recurringGroupId: string;
  latestTx: Transaction;
  categoryName?: string;
  categoryColor?: string;
  monthsCount: number;
  isCurrentlyActive: boolean;
  allMonthYears: string[];
}

export const GastosFixosModal: React.FC<GastosFixosModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentMonthYear,
  onRefreshData,
  onOpenNewRecurring,
}) => {
  const [groups, setGroups] = useState<RecurringGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stop recurring state
  const [stoppingGroup, setStoppingGroup] = useState<RecurringGroupItem | null>(null);
  const [stopFromMonth, setStopFromMonth] = useState<string>(currentMonthYear);
  const [isSubmittingStop, setIsSubmittingStop] = useState(false);

  // Edit amount state
  const [editingGroup, setEditingGroup] = useState<RecurringGroupItem | null>(null);
  const [newAmountInput, setNewAmountInput] = useState<string>('');
  const [amountFromMonth, setAmountFromMonth] = useState<string>(currentMonthYear);
  const [isSubmittingAmount, setIsSubmittingAmount] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecurringGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar gastos fixos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setStopFromMonth(currentMonthYear);
      setAmountFromMonth(currentMonthYear);
      setStoppingGroup(null);
      setEditingGroup(null);
    }
  }, [isOpen, currentMonthYear]);

  if (!isOpen) return null;

  const handleConfirmStop = async () => {
    if (!stoppingGroup) return;
    setIsSubmittingStop(true);
    try {
      await api.stopRecurringGroup(stoppingGroup.recurringGroupId, stopFromMonth);
      setStoppingGroup(null);
      await fetchGroups();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao desativar gasto fixo.');
    } finally {
      setIsSubmittingStop(false);
    }
  };

  const handleConfirmUpdateAmount = async () => {
    if (!editingGroup) return;
    const numVal = parseFloat(newAmountInput.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    setIsSubmittingAmount(true);
    try {
      await api.updateRecurringAmountGroup(
        editingGroup.recurringGroupId,
        numVal,
        amountFromMonth
      );
      setEditingGroup(null);
      await fetchGroups();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar valor futuro.');
    } finally {
      setIsSubmittingAmount(false);
    }
  };

  // Helper to format month name in PT-BR
  const formatMonthName = (my: string) => {
    const [y, m] = my.split('-').map(Number);
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${months[m - 1]}/${y}`;
  };

  // Month select options (Current month - 2 to +12 months)
  const getMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const [cy, cm] = currentMonthYear.split('-').map(Number);
    
    for (let i = 0; i <= 12; i++) {
      const dt = new Date(cy, cm - 1 + i, 1);
      const val = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      options.push({
        value: val,
        label: `${dt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} ${val === currentMonthYear ? '(Atual)' : ''}`,
      });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden my-6 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                Painel de Gastos & Receitas Fixas
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-200/60">
                  Recorrentes
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Altere valores a partir de qualquer mês ou cancele a recorrência de lançamentos fixos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-purple-50/40 border border-purple-100/70 rounded-xl">
            <div className="text-xs text-purple-900/80 font-normal">
              Os lançamentos fixos repetem automaticamente todo mês, mantendo seu histórico e projeção atualizados.
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenNewRecurring();
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Gasto Fixo</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
              <p className="text-xs font-normal">Carregando seus gastos e receitas fixas...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200/80 rounded-2xl space-y-3">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-medium text-slate-700">Nenhum gasto fixo cadastrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-normal">
                Você pode marcar a opção "Gasto / Receita Fixa" ao criar qualquer lançamento no aplicativo.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewRecurring();
                }}
                className="mt-2 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Primeiro Gasto Fixo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isExpense = group.latestTx.type === 'despesa';
                const isStopping = stoppingGroup?.recurringGroupId === group.recurringGroupId;
                const isEditing = editingGroup?.recurringGroupId === group.recurringGroupId;

                return (
                  <div
                    key={group.recurringGroupId}
                    className={`p-4 rounded-xl border transition ${
                      group.isCurrentlyActive
                        ? 'bg-white border-slate-200/80 shadow-xs hover:border-purple-200'
                        : 'bg-slate-50/70 border-slate-200/60 opacity-80'
                    }`}
                  >
                    {/* Top Row: Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isExpense ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-semibold text-slate-900">
                              {group.latestTx.title}
                            </h3>
                            {group.categoryName && (
                              <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: group.categoryColor || '#64748B' }}
                              >
                                {group.categoryName}
                              </span>
                            )}
                            {group.isCurrentlyActive ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Ativo Mensalmente
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70 flex items-center gap-1">
                                <Slash className="w-3 h-3" />
                                Interrompido
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-2.5 flex-wrap">
                            <span>Forma: <strong className="text-slate-600 font-medium capitalize">{group.latestTx.paymentMethod}</strong></span>
                            <span>•</span>
                            <span>Lançado em <strong>{group.monthsCount}</strong> {group.monthsCount === 1 ? 'mês' : 'meses'}</span>
                            {group.allMonthYears.length > 0 && (
                              <>
                                <span>•</span>
                                <span>Mês base: <strong>{formatMonthName(group.allMonthYears[group.allMonthYears.length - 1])}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount */}
                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-slate-400 font-normal">
                          Valor Recorrente
                        </div>
                        <div className={`text-sm font-semibold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {group.latestTx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Próximo lançamento no dia <strong>{group.latestTx.date.split('-')[2] || '05'}</strong> de cada mês.</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Button 1: Alterar valor a partir de X data */}
                        <button
                          onClick={() => {
                            setEditingGroup(isEditing ? null : group);
                            setNewAmountInput(group.latestTx.amount.toString());
                            setAmountFromMonth(currentMonthYear);
                            setStoppingGroup(null);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-lg transition flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3 text-purple-600" />
                          <span>Alterar valor a partir de X mês</span>
                        </button>

                        {/* Button 2: Deixar de ser Fixo */}
                        {group.isCurrentlyActive && (
                          <button
                            onClick={() => {
                              setStoppingGroup(isStopping ? null : group);
                              setStopFromMonth(currentMonthYear);
                              setEditingGroup(null);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-lg transition flex items-center gap-1.5 border border-rose-200/70"
                          >
                            <Slash className="w-3 h-3" />
                            <span>Deixar de ser Fixo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Drawer Action 1: Deixar de ser fixo form */}
                    {isStopping && (
                      <div className="mt-3 p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-rose-900 flex items-center gap-1.5">
                            <Slash className="w-3.5 h-3.5 text-rose-600" />
                            <span>Confirmar: Deixar de ser Fixo</span>
                          </h4>
                          <button
                            onClick={() => setStoppingGroup(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                          >
                            ✕
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 font-normal">
                          A partir de qual mês o lançamento <strong>"{group.latestTx.title}"</strong> deixará de ser repetido automaticamente?
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <select
                            value={stopFromMonth}
                            onChange={(e) => setStopFromMonth(e.target.value)}
                            className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-rose-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-rose-400"
                          >
                            {monthOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => setStoppingGroup(null)}
                              className="px-2.5 py-1.5 bg-white text-slate-600 font-medium text-xs rounded-lg border border-slate-200"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleConfirmStop}
                              disabled={isSubmittingStop}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 shadow-xs"
                            >
                              {isSubmittingStop ? 'Cancelando...' : 'Confirmar e Interromper'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Drawer Action 2: Alterar valor a partir de X data form */}
                    {isEditing && (
                      <div className="mt-3 p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-purple-900 flex items-center gap-1.5">
                            <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>Alterar Valor de Gasto Fixo a Partir de Mês Selecionado</span>
                          </h4>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Novo Valor Recorrente (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={newAmountInput}
                              onChange={(e) => setNewAmountInput(e.target.value)}
                              placeholder="0,00"
                              className="w-full px-2.5 py-1.5 bg-white border border-purple-200/80 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-purple-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              A Partir de Qual Mês?
                            </label>
                            <select
                              value={amountFromMonth}
                              onChange={(e) => setAmountFromMonth(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-purple-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-purple-400"
                            >
                              {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-purple-800 font-normal">
                            O valor anterior ({group.latestTx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) será mantido nos meses passados.
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingGroup(null)}
                              className="px-2.5 py-1.5 bg-white text-slate-600 font-medium text-xs rounded-lg border border-slate-200"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleConfirmUpdateAmount}
                              disabled={isSubmittingAmount}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 shadow-xs"
                            >
                              {isSubmittingAmount ? 'Salvando...' : 'Salvar Alteração'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
