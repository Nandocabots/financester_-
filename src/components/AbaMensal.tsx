import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Category, PaymentMethod, Transaction } from '../types';
import { TransactionModal } from './TransactionModal';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Wallet,
  AlertCircle
} from 'lucide-react';

interface AbaMensalProps {
  categories: Category[];
}

export const AbaMensal: React.FC<AbaMensalProps> = ({ categories }) => {
  const [currentMonthYear, setCurrentMonthYear] = useState<string>(
    new Date().toISOString().substring(0, 7) // E.g. "2026-08"
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<'receita' | 'despesa'>('despesa');

  // Delete installment confirmation modal
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTransactions({ monthYear: currentMonthYear });
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lançamentos mensais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentMonthYear]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = currentMonthYear.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonthYear(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonthYear.split('-').map(Number);
    const date = new Date(y, m, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonthYear(newMonth);
  };

  // Status toggle handler
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

  // Create or Update submission
  const handleSaveTransaction = async (data: {
    title: string;
    amount: number;
    type: 'receita' | 'despesa';
    categoryId: string;
    paymentMethod: PaymentMethod;
    date: string;
    status: 'pago' | 'pendente';
    notes?: string;
    isInstallment?: boolean;
    installmentTotal?: number;
  }) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction.id, data);
    } else {
      await api.createTransaction(data);
    }
    fetchTransactions();
  };

  // Delete handler
  const confirmDelete = async (deleteSeries: boolean) => {
    if (!deletingTx) return;
    try {
      await api.deleteTransaction(deletingTx.id, deleteSeries);
      setDeletingTx(null);
      fetchTransactions();
    } catch (err: any) {
      alert('Erro ao excluir lançamento: ' + err.message);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    if (searchTerm && !tx.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory && tx.categoryId !== filterCategory) return false;
    if (filterPaymentMethod && tx.paymentMethod !== filterPaymentMethod) return false;
    if (filterStatus && tx.status !== filterStatus) return false;
    return true;
  });

  // Calculate Monthly Totals
  const totalReceitas = transactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoMes = totalReceitas - totalDespesas;
  const percentComprometido = totalReceitas > 0 ? Math.min(100, Math.round((totalDespesas / totalReceitas) * 100)) : 0;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    'crédito': 'Crédito',
    'débito': 'Débito',
    'pix': 'PIX',
    'ticket': 'Ticket',
    'dinheiro': 'Dinheiro',
    'transferência': 'Transf.',
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Outros';
  };

  const getCategoryColor = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.color : '#64748B';
  };

  // Helper month label (e.g. "Agosto de 2026")
  const [y, m] = currentMonthYear.split('-').map(Number);
  const dateObj = new Date(y, m - 1, 1);
  const monthNameFormatted = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Month Selector & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        {/* Month Navigation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-white capitalize">
              {monthNameFormatted}
            </h2>
            <p className="text-xs text-slate-400">
              Lançamento de Salário e Despesas do Mês
            </p>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setModalDefaultType('receita');
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Salário / Entrada</span>
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setModalDefaultType('despesa');
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Gasto / Parcela</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receitas */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Meu Pagamento / Entradas</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {formatCurrency(totalReceitas)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {transactions.filter(t => t.type === 'receita').length} entrada(s) este mês
          </div>
        </div>

        {/* Despesas */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total de Pagamentos / Saídas</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400">
            {formatCurrency(totalDespesas)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Renda comprometida: <span className="font-bold text-rose-300">{percentComprometido}%</span>
          </div>
        </div>

        {/* Saldo Líquido do Mês */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Saldo Líquido do Mês</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-bold ${saldoMes >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {formatCurrency(saldoMes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {saldoMes >= 0 ? 'Sobra livre para economizar' : 'Gastos excederam as receitas!'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
          >
            <option value="">Todas as Categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
          >
            <option value="">Todas Formas de Pagamento</option>
            <option value="crédito">Cartão de Crédito</option>
            <option value="débito">Cartão de Débito</option>
            <option value="pix">PIX</option>
            <option value="ticket">Ticket / Vale</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferência">Transferência</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
          >
            <option value="">Todos os Status</option>
            <option value="pago">Somente Pagos / Concluídos</option>
            <option value="pendente">Somente Pendentes</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
            <p className="text-xs">Carregando lançamentos...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-1" />
            <p className="text-sm font-semibold text-slate-300">Nenhum lançamento encontrado para este mês</p>
            <p className="text-xs text-slate-500 mt-1">
              Clique em "+ Salário / Entrada" ou "+ Novo Gasto" para começar a preencher.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Descrição</th>
                  <th className="px-5 py-3 font-semibold">Categoria</th>
                  <th className="px-5 py-3 font-semibold">Forma Pagto</th>
                  <th className="px-5 py-3 font-semibold text-right">Valor (R$)</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTransactions.map((tx) => {
                  const isReceita = tx.type === 'receita';
                  const catColor = getCategoryColor(tx.categoryId);
                  const catName = getCategoryName(tx.categoryId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono">
                        {tx.date.split('-').reverse().join('/')}
                      </td>

                      {/* Title + Installment Badge */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{tx.title}</span>
                          {tx.isInstallment && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                              <Layers className="w-3 h-3" />
                              Parcelado {tx.installmentCurrent}/{tx.installmentTotal}
                            </span>
                          )}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-800 bg-slate-950">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                          {catName}
                        </span>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap text-sm ${
                        isReceita ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isReceita ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>

                      {/* Status Button */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(tx)}
                          title="Clique para alternar status"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                            tx.status === 'pago'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {tx.status === 'pago' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Pago</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingTx(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Excluir"
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
        )}
      </div>

      {/* Transaction Add/Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        categories={categories}
        initialData={editingTransaction}
        defaultType={modalDefaultType}
        defaultMonthYear={currentMonthYear}
      />

      {/* Delete Confirmation Dialog */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirmar Exclusão</h3>
            </div>

            <p className="text-xs text-slate-300">
              Você está prestes a excluir o lançamento <strong>"{deletingTx.title}"</strong> ({formatCurrency(deletingTx.amount)}).
            </p>

            {deletingTx.isInstallment && deletingTx.installmentSeriesId ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
                <p>Este lançamento faz parte de uma compra parcelada em <strong>{deletingTx.installmentTotal}x</strong>.</p>
                <div className="flex flex-col gap-2 pt-2 border-t border-amber-500/20">
                  <button
                    onClick={() => confirmDelete(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-xs transition"
                  >
                    Excluir APENAS esta parcela ({deletingTx.installmentCurrent}/{deletingTx.installmentTotal})
                  </button>
                  <button
                    onClick={() => confirmDelete(true)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs transition"
                  >
                    Excluir TODAS as {deletingTx.installmentTotal} parcelas desta compra
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setDeletingTx(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDelete(false)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                >
                  Confirmar Exclusão
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
