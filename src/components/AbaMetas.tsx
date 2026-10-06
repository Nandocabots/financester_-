import React, { useState, useEffect } from 'react';
import { FinancialGoal } from '../types';
import { api } from '../lib/api';
import { ThemeSettings, THEME_CONFIGS, PASTEL_PRESETS } from '../lib/theme';
import {
  Target,
  Plus,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  PiggyBank,
  Check,
  X,
  Compass
} from 'lucide-react';

interface AbaMetasProps {
  theme?: ThemeSettings;
}

export const AbaMetas: React.FC<AbaMetasProps> = ({ theme }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const [isTransactModalOpen, setIsTransactModalOpen] = useState(false);
  const [transactGoal, setTransactGoal] = useState<FinancialGoal | null>(null);
  const [transactType, setTransactType] = useState<'deposit' | 'withdraw'>('deposit');
  const [transactAmount, setTransactAmount] = useState<string>('');

  // Form State for Goal
  const [formTitle, setFormTitle] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formCurrentAmount, setFormCurrentAmount] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formCategory, setFormCategory] = useState('Sonhos');
  const [formColor, setFormColor] = useState(PASTEL_PRESETS[0].color);
  const [formNotes, setFormNotes] = useState('');

  const isDark = theme?.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme?.colorTheme || 'pastelRose'];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormTargetAmount('');
    setFormCurrentAmount('0');
    setFormDeadline('');
    setFormCategory('Sonhos');
    setFormColor(PASTEL_PRESETS[0].color);
    setFormNotes('');
    setIsGoalModalOpen(true);
  };

  const handleOpenEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormTargetAmount(goal.targetAmount.toString());
    setFormCurrentAmount(goal.currentAmount.toString());
    setFormDeadline(goal.deadline || '');
    setFormCategory(goal.category || 'Sonhos');
    setFormColor(goal.color || PASTEL_PRESETS[0].color);
    setFormNotes(goal.notes || '');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formTargetAmount) {
      alert('Informe o título e o valor alvo da meta.');
      return;
    }

    const targetVal = parseFloat(formTargetAmount.replace(',', '.'));
    const currentVal = parseFloat(formCurrentAmount.replace(',', '.')) || 0;

    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          title: formTitle,
          targetAmount: targetVal,
          currentAmount: currentVal,
          deadline: formDeadline || undefined,
          category: formCategory,
          color: formColor,
          notes: formNotes || undefined,
        });
      } else {
        await api.createGoal({
          title: formTitle,
          targetAmount: targetVal,
          currentAmount: currentVal,
          deadline: formDeadline || undefined,
          category: formCategory,
          color: formColor,
          notes: formNotes || undefined,
        });
      }
      setIsGoalModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      alert('Erro ao salvar meta: ' + err.message);
    }
  };

  const handleDeleteGoal = async (id: string, title: string) => {
    if (confirm(`Deseja realmente excluir a caixinha "${title}"?`)) {
      try {
        await api.deleteGoal(id);
        fetchGoals();
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  const handleOpenTransact = (goal: FinancialGoal, type: 'deposit' | 'withdraw') => {
    setTransactGoal(goal);
    setTransactType(type);
    setTransactAmount('');
    setIsTransactModalOpen(true);
  };

  const handleExecuteTransact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactGoal || !transactAmount) return;

    const val = parseFloat(transactAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    try {
      await api.transactGoal(transactGoal.id, val, transactType);
      setIsTransactModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      alert('Erro na operação: ' + err.message);
    }
  };

  // Metrics
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const cardBg = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/80 text-slate-800 shadow-xs';
  const innerCardBg = isDark
    ? 'bg-slate-950/80 border-slate-800/80'
    : 'bg-slate-50/80 border-slate-200/60';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Carregando caixinhas e metas financeiras...
      </div>
    );
  }

  return (
    <div id="aba-metas-caixinhas" className="space-y-6">
      {/* Top Banner & Action */}
      <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
            <PiggyBank className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className={`text-lg font-black ${textTitle} flex items-center gap-2`}>
              <span>Caixinhas de Metas & Reserva de Emergência</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {goals.length} Objetivos
              </span>
            </h2>
            <p className={`text-xs ${textMuted} font-medium mt-0.5`}>
              Guarde dinheiro para objetivos específicos, acompanhe seu progresso e mantenha sua reserva protegida
            </p>
          </div>
        </div>

        <button
          id="btn-nova-caixinha"
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Caixinha</span>
        </button>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Acumulado
            </span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black mt-1 text-emerald-600">
            {formatCurrency(totalSaved)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Saldo guardado nas caixinhas
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Meta Global Alvo
            </span>
            <Target className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className={`text-xl font-black mt-1 ${textTitle}`}>
            {formatCurrency(totalTarget)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Objetivo total estipulado
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Progresso Geral
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black mt-1 text-purple-600">
            {overallProgress.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Média de realização
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Objetivos Atingidos
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className={`text-xl font-black mt-1 ${textTitle}`}>
            {completedCount} de {goals.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Caixinhas 100% concluídas
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const pctClamped = Math.min(100, Math.max(0, pct));
          const isComplete = goal.currentAmount >= goal.targetAmount;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition hover:shadow-md ${cardBg}`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: goal.color }}
                    />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {goal.category || 'Geral'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {goal.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(goal)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                      title="Editar caixinha"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Excluir caixinha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-[11px] text-slate-400 font-normal mt-1.5 line-clamp-2">
                    {goal.notes}
                  </p>
                )}
              </div>

              {/* Progress and values */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Saldo Atual:</span>
                    <div className="text-xl font-black text-slate-900">
                      {formatCurrency(goal.currentAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Meta:</span>
                    <div className="text-xs font-bold text-slate-600">
                      {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span style={{ color: goal.color }}>
                      {pct.toFixed(1)}% concluído
                    </span>
                    <span className="text-slate-400 font-medium text-[10px]">
                      {isComplete ? 'Meta atingida! 🎉' : `Faltam ${formatCurrency(remaining)}`}
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-2xs"
                      style={{
                        width: `${pctClamped}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Prazo desejado: {goal.deadline.split('-').reverse().join('/')}</span>
                  </div>
                )}
              </div>

              {/* Deposit / Withdraw Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTransact(goal, 'deposit')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200/60 transition shadow-2xs"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Aportar</span>
                </button>

                <button
                  type="button"
                  disabled={goal.currentAmount <= 0}
                  onClick={() => handleOpenTransact(goal, 'withdraw')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold border border-slate-200/70 transition disabled:opacity-40"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>- Resgatar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Create/Edit Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-500" />
                <span>{editingGoal ? 'Editar Caixinha' : 'Nova Caixinha de Metas'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome da Caixinha / Objetivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência, Viagem Disney..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Valor Alvo (Meta) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="Ex: 10000"
                    value={formTargetAmount}
                    onChange={e => setFormTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Saldo Inicial Já Guardado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 2500"
                    value={formCurrentAmount}
                    onChange={e => setFormCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Prazo / Data Limite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Categoria do Objetivo
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none bg-white"
                  >
                    <option value="Segurança">Segurança & Reserva</option>
                    <option value="Sonhos">Sonhos & Viagens</option>
                    <option value="Bens">Bens (Carro / Casa)</option>
                    <option value="Educação">Educação / Cursos</option>
                    <option value="Patrimônio">Investimentos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              {/* Pastel Color Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cor da Caixinha (Tons Pastéis)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PASTEL_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormColor(preset.color)}
                      style={{ backgroundColor: preset.color }}
                      className={`w-6 h-6 rounded-full border transition flex items-center justify-center ${
                        formColor === preset.color ? 'ring-2 ring-slate-800 scale-110' : 'opacity-80'
                      }`}
                    >
                      {formColor === preset.color && <Check className="w-3 h-3 text-slate-900" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observações ou Onde o Dinheiro Está Guardado
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: CDB Liquidez Diária Banco Inter..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  {editingGoal ? 'Salvar Alterações' : 'Criar Caixinha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {isTransactModalOpen && transactGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {transactType === 'deposit' ? (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                )}
                <span>
                  {transactType === 'deposit' ? 'Aportar na Caixinha' : 'Resgatar da Caixinha'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTransactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Caixinha:</div>
              <div className="text-xs font-black text-slate-800">{transactGoal.title}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Saldo Atual: <strong>{formatCurrency(transactGoal.currentAmount)}</strong>
              </div>
            </div>

            <form onSubmit={handleExecuteTransact} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Valor do {transactType === 'deposit' ? 'Aporte' : 'Resgate'} (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    placeholder="0,00"
                    value={transactAmount}
                    onChange={e => setTransactAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-base font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                {[50, 100, 200, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTransactAmount(val.toString())}
                    className="flex-1 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransactModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-xs transition ${
                    transactType === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirmar {transactType === 'deposit' ? 'Aporte' : 'Resgate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
