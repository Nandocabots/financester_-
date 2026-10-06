import React, { useState } from 'react';
import { api } from '../lib/api';
import { Category } from '../types';
import { Tags, Plus, Trash2, Edit2, Check, Palette, X, FolderTree, Tag } from 'lucide-react';

interface AbaCategoriasProps {
  categories: Category[];
  onRefresh: () => void;
}

const PASTEL_COLORS = [
  '#FDA4AF', // Rosa Pastel
  '#FED7AA', // Pêssego Pastel
  '#FEF08A', // Baunilha Pastel
  '#A7F3D0', // Menta / Sálvia Pastel
  '#99F6E4', // Turquesa Pastel
  '#BAE6FD', // Azul Céu Pastel
  '#D8B4FE', // Lavanda Pastel
  '#FBCFE8', // Lilás Pastel
  '#D9F99D', // Matcha Pastel
  '#FDBA74', // Damasco Pastel
  '#FCA5A5', // Coral Pastel
  '#CBD5E1', // Areia / Cinza Soft
];

export const AbaCategorias: React.FC<AbaCategoriasProps> = ({ categories, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [color, setColor] = useState('#FDA4AF');
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [modalSubcategories, setModalSubcategories] = useState<string[]>([]);
  const [newSubcatInput, setNewSubcatInput] = useState('');

  // Quick inline add subcategory on cards
  const [inlineSubcatInputs, setInlineSubcatInputs] = useState<Record<string, string>>({});
  const [addingSubcatForId, setAddingSubcatForId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setType('despesa');
    setColor('#FDA4AF');
    setMonthlyBudget('');
    setModalSubcategories([]);
    setNewSubcatInput('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setMonthlyBudget(cat.monthlyBudget ? cat.monthlyBudget.toString() : '');
    setModalSubcategories(cat.subcategories ? [...cat.subcategories] : []);
    setNewSubcatInput('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddModalSubcategory = () => {
    const trimmed = newSubcatInput.trim();
    if (!trimmed) return;
    if (modalSubcategories.includes(trimmed)) {
      alert('Esta subcategoria já foi adicionada.');
      return;
    }
    setModalSubcategories(prev => [...prev, trimmed]);
    setNewSubcatInput('');
  };

  const handleRemoveModalSubcategory = (subToRemove: string) => {
    setModalSubcategories(prev => prev.filter(s => s !== subToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome da categoria.');
      return;
    }

    setLoading(true);
    setError(null);
    const parsedBudget = monthlyBudget ? parseFloat(monthlyBudget.replace(',', '.')) : 0;
    const finalBudget = isNaN(parsedBudget) ? 0 : parsedBudget;

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          color,
          monthlyBudget: type === 'despesa' ? finalBudget : 0,
          subcategories: modalSubcategories,
        });
      } else {
        await api.createCategory({
          name: name.trim(),
          type,
          color,
          monthlyBudget: type === 'despesa' ? finalBudget : 0,
          subcategories: modalSubcategories,
        });
      }
      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.isDefault) {
      alert('Categorias padrão do sistema não podem ser removidas.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat.name}"?`)) {
      try {
        await api.deleteCategory(cat.id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir categoria.');
      }
    }
  };

  // Inline quick add subcategory to card
  const handleAddInlineSubcat = async (categoryId: string) => {
    const value = (inlineSubcatInputs[categoryId] || '').trim();
    if (!value) return;

    setAddingSubcatForId(categoryId);
    try {
      await api.addSubcategory(categoryId, value);
      setInlineSubcatInputs(prev => ({ ...prev, [categoryId]: '' }));
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar subcategoria.');
    } finally {
      setAddingSubcatForId(null);
    }
  };

  const handleRemoveInlineSubcat = async (categoryId: string, subName: string) => {
    try {
      await api.removeSubcategory(categoryId, subName);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover subcategoria.');
    }
  };

  const renderCategoryCard = (cat: Category) => {
    const subcats = cat.subcategories || [];
    const inlineVal = inlineSubcatInputs[cat.id] || '';

    return (
      <div
        key={cat.id}
        className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-3 hover:border-slate-300 transition"
      >
        {/* Header: Color + Name + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-xs font-bold text-slate-800">{cat.name}</span>
            {cat.isDefault && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-bold">
                Padrão
              </span>
            )}
            {cat.monthlyBudget && cat.monthlyBudget > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200/60">
                Teto: R$ {cat.monthlyBudget.toLocaleString('pt-BR')}
              </span>
            ) : null}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleOpenEdit(cat)}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
              title="Editar Categoria e Subcategorias"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {!cat.isDefault && (
              <button
                onClick={() => handleDelete(cat)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subcategories Section */}
        <div className="pt-2 border-t border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <FolderTree className="w-3 h-3 text-slate-400" />
              <span>Subcategorias ({subcats.length})</span>
            </span>
          </div>

          {/* Subcategories Pills */}
          <div className="flex flex-wrap gap-1.5">
            {subcats.map(sub => (
              <span
                key={sub}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs group"
              >
                <span>{sub}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInlineSubcat(cat.id, sub)}
                  className="text-slate-400 hover:text-rose-600 rounded-full transition ml-0.5"
                  title={`Remover subcategoria "${sub}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {subcats.length === 0 && (
              <span className="text-[11px] text-slate-400 italic">
                Nenhuma subcategoria cadastrada ainda.
              </span>
            )}
          </div>

          {/* Inline Add Subcategory Input */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              placeholder="+ Adicionar subcategoria..."
              value={inlineVal}
              onChange={(e) => setInlineSubcatInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInlineSubcat(cat.id);
                }
              }}
              className="flex-1 px-2.5 py-1 bg-white border border-slate-200 focus:border-rose-400 focus:outline-hidden rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400"
            />
            <button
              type="button"
              disabled={!inlineVal.trim() || addingSubcatForId === cat.id}
              onClick={() => handleAddInlineSubcat(cat.id)}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"
              title="Adicionar Subcategoria"
            >
              <Plus className="w-3 h-3" />
              <span>Inserir</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Tags className="w-5 h-5 text-rose-500" />
            <span>Cadastro de Categorias & Subcategorias</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Organize suas finanças adicionando subcategorias para cada categoria (ex: Alimentação &gt; Supermercado, Delivery)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#F472B6] hover:bg-[#EC4899] text-white font-bold text-xs rounded-2xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receitas */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center justify-between pb-3 border-b border-slate-100">
            <span>Categorias de Receitas (Entradas)</span>
            <span className="text-slate-400 font-bold">
              {categories.filter(c => c.type === 'receita').length} item(ns)
            </span>
          </div>

          <div className="space-y-3">
            {categories.filter(c => c.type === 'receita').map(renderCategoryCard)}
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center justify-between pb-3 border-b border-slate-100">
            <span>Categorias de Despesas (Saídas)</span>
            <span className="text-slate-400 font-bold">
              {categories.filter(c => c.type === 'despesa').length} item(ns)
            </span>
          </div>

          <div className="space-y-3">
            {categories.filter(c => c.type === 'despesa').map(renderCategoryCard)}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-500" />
                <span>{editingCategory ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pets, Farmácia, Lazer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Lançamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('receita')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      type === 'receita'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('despesa')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      type === 'despesa'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              {/* Subcategories Editor inside Modal */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-purple-600" />
                    <span>Subcategorias desta Categoria</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {modalSubcategories.length} subcategoria(s)
                  </span>
                </label>

                {/* Subcategories list */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white border border-slate-200 rounded-xl">
                  {modalSubcategories.map(sub => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModalSubcategory(sub)}
                        className="text-slate-400 hover:text-rose-600 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {modalSubcategories.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      Nenhuma subcategoria adicionada. Digite abaixo para inserir.
                    </span>
                  )}
                </div>

                {/* Add Subcategory input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Digite o nome da subcategoria..."
                    value={newSubcatInput}
                    onChange={(e) => setNewSubcatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModalSubcategory();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddModalSubcategory}
                    disabled={!newSubcatInput.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {type === 'despesa' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Teto Orçamentário Mensal (R$)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="Ex: 1200,00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Cor da Categoria</span>
                  <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Paleta Pastel
                  </span>
                </label>
                <div className="grid grid-cols-6 gap-2 mb-2.5">
                  {PASTEL_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className="h-8 rounded-xl flex items-center justify-center transition border border-black/10 hover:scale-105 shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {color.toLowerCase() === c.toLowerCase() && (
                        <Check className="w-4 h-4 text-slate-800 drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Personalizar:</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#FDA4AF"
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 font-bold text-white text-xs rounded-xl transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Salvar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
