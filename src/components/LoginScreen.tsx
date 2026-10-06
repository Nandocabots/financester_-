import React, { useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { Wallet, KeyRound, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('fernanda.botelho');
  const [password, setPassword] = useState('1705');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.login(username.trim(), password);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao efetuar login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (usr: string, pass: string) => {
    setUsername(usr);
    setPassword(pass);
    setError(null);
    setLoading(true);

    try {
      const result = await api.login(usr, pass);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao efetuar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-3 shadow-inner">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Planilha Financeira</h1>
          <p className="text-xs text-slate-400 mt-1">
            Acesse seu painel financeiro pessoal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu usuário"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-semibold text-slate-950 text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
          >
            {loading ? (
              <span>Entrando...</span>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Card */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Acesso Recomendado (Usuário Solicitado)</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('fernanda.botelho', '1705')}
              className="w-full p-2.5 bg-slate-950/60 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  fernanda.botelho
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Master
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Senha: <code className="text-slate-300 font-mono">1705</code>
                </div>
              </div>
              <span className="text-xs text-amber-400 group-hover:translate-x-1 transition-transform">
                Entrar →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('assistente', '123456')}
              className="w-full p-2 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition flex items-center justify-between text-slate-400 text-xs"
            >
              <span>Entrar como Preenchedor (assistente / 123456)</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
