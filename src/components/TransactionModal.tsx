import React, { useState, useEffect } from 'react';
import { Category, PaymentMethod, Transaction } from '../types';
import { api } from '../lib/api';
import { X, CreditCard, DollarSign, Calendar, Layers, CheckCircle2, Clock, Plus, Tag, FolderTree, Sparkles } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
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
  }) => Promise<void>;
  categories: Category[];
  onRefreshCategories?: () => void;
  initialData?: Transaction | null;
  defaultType?: 'receita' | 'despesa';
  defaultMonthYear?: string;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'crédito', label: 'Cartão de Crédito' },
  { value: 'débito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'ticket', label: 'Ticket / Vale' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferência', label: 'Transferência Bancária' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  onRefreshCategories,
  initialData,
  defaultType = 'despesa',
  defaultMonthYear = new Date().toISOString().substring(0, 7),
}) => {
  const [type, setType] = useState<'receita' | 'despesa'>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [date, setDate] = useState(`${defaultMonthYear}-05`);
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [notes, setNotes] = useState('');

  // Inline Category Creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#EC4899');
  const [creatingCat, setCreatingCat] = useState(false);

  // Inline Subcategory Creation state
  const [isAddingSubcat, setIsAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [creatingSubcat, setCreatingSubcat] = useState(false);

  // Installment (Parcela de Cartão) state
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCurrent, setInstallmentCurrent] = useState<number>(1);
  const [installmentTotal, setInstallmentTotal] = useState<number>(10);

  // Detected installment info from title (if imported with "Parcela X/Y")
  const [detectedInstallment, setDetectedInstallment] = useState<{ cleanTitle: string; cur: number; tot: number } | null>(null);

  // Recurring (Gasto Fixo) state
  const [isRecurring, setIsRecurring] = useState(false);
  const [updateFutureMonths, setUpdateFutureMonths] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setSubcategory(initialData.subcategory || '');
      setPaymentMethod(initialData.paymentMethod);
      setDate(initialData.date);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setIsRecurring(!!initialData.isRecurring);
      setUpdateFutureMonths(true);

      // Check if title has " - Parcela X/Y" or "(X/Y)"
      const match = initialData.title.match(/^(.*?)\s*-\s*Parcela\s*(\d+)\/(\d+)/i) ||
                    initialData.title.match(/^(.*?)\s*\((\d+)\/(\d+)\)/i);
      
      if (initialData.isInstallment) {
        setIsInstallment(true);
        setInstallmentCurrent(initialData.installmentCurrent || 1);
        setInstallmentTotal(initialData.installmentTotal || 10);
        setDetectedInstallment(null);
      } else if (match) {
        const cur = parseInt(match[2], 10);
        const tot = parseInt(match[3], 10);
        setIsInstallment(true);
        setInstallmentCurrent(cur);
        setInstallmentTotal(tot);
        setDetectedInstallment({
          cleanTitle: match[1].trim(),
          cur,
          tot
        });
      } else {
        setIsInstallment(false);
        setInstallmentCurrent(1);
        setInstallmentTotal(10);
        setDetectedInstallment(null);
      }
    } else {
      setType(defaultType);
      setTitle('');
      setAmount('');
      setPaymentMethod('pix');
      setDate(`${defaultMonthYear}-05`);
      setStatus('pago');
      setNotes('');
      setSubcategory('');
      setIsInstallment(false);
      setInstallmentCurrent(1);
      setInstallmentTotal(10);
      setDetectedInstallment(null);
      setIsRecurring(false);
      setUpdateFutureMonths(true);

      const filteredCats = categories.filter(c => c.type === defaultType);
      if (filteredCats.length > 0) {
        setCategoryId(filteredCats[0].id);
      }
    }
    setIsAddingCategory(false);
    setIsAddingSubcat(false);
  }, [initialData, isOpen, defaultType, defaultMonthYear, categories]);

  // Update default category when type changes
  useEffect(() => {
    if (!initialData) {
      const filteredCats = categories.filter(c => c.type === type);
      if (filteredCats.length > 0 && !filteredCats.some(c => c.id === categoryId)) {
        setCategoryId(filteredCats[0].id);
        setSubcategory('');
      }
    }
  }, [type, categories]);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const currentSubcategories = selectedCategory?.subcategories || [];

  if (!isOpen) return null;

  const handleCleanTitleFromInstallment = () => {
    if (detectedInstallment) {
      setTitle(detectedInstallment.cleanTitle);
      setIsInstallment(true);
      setInstallmentCurrent(detectedInstallment.cur);
      setInstallmentTotal(detectedInstallment.tot);
      setPaymentMethod('crédito');
      setDetectedInstallment(null);
    }
  };

  const handleCreateCategoryInline = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const newCat = await api.createCategory({
        name: newCatName.trim(),
        type,
        color: newCatColor,
        subcategories: [],
      });
      if (onRefreshCategories) {
        onRefreshCategories();
      }
      setCategoryId(newCat.id);
      setSubcategory('');
      setNewCatName('');
      setIsAddingCategory(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar categoria.');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleCreateSubcategoryInline = async () => {
    if (!newSubcatName.trim() || !categoryId) return;
    setCreatingSubcat(true);
    try {
      const updatedCat = await api.addSubcategory(categoryId, newSubcatName.trim());
      if (onRefreshCategories) {
        onRefreshCategories();
      }
      setSubcategory(newSubcatName.trim());
      setNewSubcatName('');
      setIsAddingSubcat(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar subcategoria.');
    } finally {
      setCreatingSubcat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !categoryId || !date) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const numVal = parseFloat(amount.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        amount: numVal,
        type,
        categoryId,
        subcategory: subcategory.trim() || undefined,
        paymentMethod: isInstallment ? 'crédito' : paymentMethod,
        date,
        status,
        notes: notes.trim(),
        isInstallment: type === 'despesa' ? isInstallment : false,
        installmentCurrent: isInstallment ? Number(installmentCurrent) : 1,
        installmentTotal: isInstallment ? Number(installmentTotal) : 1,
        isRecurring: isInstallment ? false : isRecurring,
        updateFutureMonths,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const numAmount = parseFloat(amount.replace(',', '.'));
  const calcInstallmentValue = !isNaN(numAmount) && installmentTotal > 1
    ? (numAmount / installmentTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${type === 'receita' ? 'text-emerald-500' : 'text-rose-500'}`} />
            <span>{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Notice if imported title has Parcela X/Y */}
          {detectedInstallment && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="text-purple-900">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Parcela Detectada no Título:
                </span>
                <span className="text-[11px] text-purple-700 block mt-0.5">
                  Identificado <strong>Parcela {detectedInstallment.cur} de {detectedInstallment.tot}</strong> ({detectedInstallment.cur}/{detectedInstallment.tot}x).
                </span>
              </div>
              <button
                type="button"
                onClick={handleCleanTitleFromInstallment}
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition"
              >
                Ativar Parcela & Limpar Título
              </button>
            </div>
          )}

          {/* Type Selector (Receita / Despesa) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setType('receita')}
              className={`py-1.5 rounded-lg text-xs font-medium transition ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Receita (Entrada)
            </button>
            <button
              type="button"
              onClick={() => setType('despesa')}
              className={`py-1.5 rounded-lg text-xs font-medium transition ${
                type === 'despesa'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              - Despesa (Saída)
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição / Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'receita' ? 'Ex: Salário Mensal, Freela' : 'Ex: Supermercado, Aluguel'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-rose-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-normal text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isInstallment ? 'Valor Desta Parcela (R$)' : 'Valor (R$)'}
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 150,00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-rose-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-rose-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-normal text-slate-900"
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova</span>
                </button>
              </div>

              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategory('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-rose-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-medium text-slate-900"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Subcategoria
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingSubcat(!isAddingSubcat)}
                  className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova</span>
                </button>
              </div>

              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-purple-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-medium text-slate-900"
              >
                <option value="">(Sem subcategoria)</option>
                {currentSubcategories.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inline Add Category Drawer */}
          {isAddingCategory && (
            <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-800 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-rose-500" />
                  <span>Cadastrar Nova Categoria</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nome da categoria"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={creatingCat || !newCatName.trim()}
                  onClick={handleCreateCategoryInline}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg disabled:opacity-50 transition"
                >
                  {creatingCat ? 'Criando...' : 'Salvar Categoria'}
                </button>
              </div>
            </div>
          )}

          {/* Inline Add Subcategory Drawer */}
          {isAddingSubcat && (
            <div className="p-3 bg-purple-50/60 border border-purple-200/70 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-800 flex items-center gap-1.5">
                  <FolderTree className="w-3 h-3 text-purple-500" />
                  <span>Nova Subcategoria para "{selectedCategory?.name}"</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingSubcat(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ex: Delivery, Padaria, Streaming"
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={creatingSubcat || !newSubcatName.trim()}
                  onClick={handleCreateSubcategoryInline}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg disabled:opacity-50 transition"
                >
                  {creatingSubcat ? 'Criando...' : 'Salvar Subcategoria'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={isInstallment ? 'crédito' : paymentMethod}
                disabled={isInstallment}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-rose-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-medium text-slate-900 disabled:opacity-75"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`py-1 rounded-lg text-xs font-medium transition ${
                    status === 'pago'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pago / Recebido
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  className={`py-1 rounded-lg text-xs font-medium transition ${
                    status === 'pendente'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>

          {/* PARCELA DE CARTÃO DE CRÉDITO (Available for ANY Despesa, including IMPORTED ones!) */}
          {type === 'despesa' && (
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">
                      É Parcela de Cartão de Crédito?
                    </span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Defina a parcela atual e o total (ex: 2 de 4x)
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="chk-installment"
                  checked={isInstallment}
                  onChange={(e) => {
                    setIsInstallment(e.target.checked);
                    if (e.target.checked) {
                      setIsRecurring(false);
                      setPaymentMethod('crédito');
                    }
                  }}
                  className="w-3.5 h-3.5 text-rose-600 rounded bg-white border-slate-300 focus:ring-rose-500"
                />
              </div>

              {isInstallment && (
                <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-normal text-slate-700 block mb-1">
                        Parcela Atual:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={installmentTotal}
                        value={installmentCurrent}
                        onChange={(e) => setInstallmentCurrent(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-normal text-slate-700 block mb-1">
                        Total de Parcelas:
                      </label>
                      <select
                        value={installmentTotal}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setInstallmentTotal(val);
                          if (installmentCurrent > val) setInstallmentCurrent(val);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map(n => (
                          <option key={n} value={n}>{n}x parcelas</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-2 bg-rose-50 border border-rose-200/60 rounded-lg text-[11px] text-rose-700 flex items-center justify-between">
                    <span>
                      Etiqueta no sistema: <strong className="font-bold">{installmentCurrent}/{installmentTotal}x</strong>
                    </span>
                    <span className="text-[10px] text-rose-600">
                      Cartão de Crédito
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recurring / Gasto Fixo Toggle */}
          {!isInstallment && (
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">
                      Gasto / Receita Fixa (Repetir todo mês)?
                    </span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Ex: Aluguel, Internet, Salário. Será lançado automaticamente todo mês.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="chk-recurring"
                  checked={isRecurring}
                  onChange={(e) => {
                    setIsRecurring(e.target.checked);
                    if (e.target.checked) setIsInstallment(false);
                  }}
                  className="w-3.5 h-3.5 text-purple-600 rounded bg-white border-slate-300 focus:ring-purple-500"
                />
              </div>

              {initialData && isRecurring && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-normal">
                    Atualizar este valor nos meses seguintes?
                  </span>
                  <input
                    type="checkbox"
                    checked={updateFutureMonths}
                    onChange={(e) => setUpdateFutureMonths(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Compra no débito, parcelado em 3x..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 focus:border-rose-400 focus:bg-white focus:outline-hidden rounded-xl text-xs font-normal text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 font-medium text-white text-xs rounded-xl transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
