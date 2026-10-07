import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, UserRole } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Trash2,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  X
} from 'lucide-react';

export const AbaUsuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Password visibility states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('preenchedor');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTogglePassword = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyPassword = (userId: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedUserId(userId);
    setTimeout(() => {
      setCopiedUserId(null);
    }, 2000);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setShowModalPassword(false);
    setRole('preenchedor');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password || '');
    setShowModalPassword(false);
    setRole(u.role);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setFormError('Informe nome e usuário.');
      return;
    }

    if (!editingUser && (!password || password.trim().length < 4)) {
      setFormError('Informe uma senha com no mínimo 4 caracteres para o novo usuário.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: name.trim(),
          username: username.trim(),
          role,
          ...(password ? { password } : {}),
        });
      } else {
        await api.createUser({
          name: name.trim(),
          username: username.trim(),
          role,
          password,
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.username === 'fernanda.botelho') {
      alert('O usuário Master principal não pode ser removido.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover o usuário "${u.name}" (${u.username})?`)) {
      try {
        await api.deleteUser(u.id);
        fetchUsers();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              Gestão de Usuários & Senhas
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">
                Exclusivo Master
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Visualize as senhas criadas, edite acessos e cadastre novos usuários para o sistema.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Criar Novo Usuário</span>
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mb-2" />
            <p className="text-xs font-medium text-slate-600">Carregando usuários do sistema...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-rose-600 text-xs font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-6 py-3.5">Nome</th>
                  <th className="px-6 py-3.5">Usuário (Login)</th>
                  <th className="px-6 py-3.5">Senha de Acesso</th>
                  <th className="px-6 py-3.5">Perfil de Acesso</th>
                  <th className="px-6 py-3.5">Data de Criação</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {users.map((u) => {
                  const isMasterRole = u.role === 'master';
                  const isMainMaster = u.username === 'fernanda.botelho';
                  const isPwdVisible = visiblePasswords[u.id];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isMasterRole ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {isMainMaster && (
                            <div className="text-[10px] text-amber-600 font-semibold">
                              ★ Administrador Master Principal
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                        {u.username}
                      </td>

                      {/* Password (Visible with Eye toggle & Copy button) */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-xs font-bold text-slate-800 min-w-[55px]">
                            {isPwdVisible ? (u.password || '123456') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition cursor-pointer"
                            title={isPwdVisible ? 'Ocultar senha' : 'Ver senha'}
                          >
                            {isPwdVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(u.id, u.password || '123456')}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="Copiar senha"
                          >
                            {copiedUserId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {isMasterRole ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Usuário Master
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            Preenchedor
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Editar Usuário / Senha"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isMainMaster && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>{editingUser ? 'Editar Usuário & Senha' : 'Criar Novo Usuário'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Fernanda Botelho"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome de Usuário (Login)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: fernanda.botelho"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Senha de Acesso
                  </label>
                  {editingUser && editingUser.password && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Atual: {editingUser.password}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Digite uma nova senha ou mantenha a atual' : 'Ex: 1705'}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                    title={showModalPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showModalPassword ? (
                      <EyeOff className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perfil de Acesso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('master')}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                      role === 'master'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Master (Admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('preenchedor')}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                      role === 'preenchedor'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Preenchedor</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                  Usuários preenchedores podem criar lançamentos e categorias, mas NÃO enxergam a aba de Usuários.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-white text-xs rounded-xl transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
