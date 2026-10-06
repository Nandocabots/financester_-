import React, { useState } from 'react';
import { User } from '../types';
import { ThemeSettings, THEME_CONFIGS, ThemeColor } from '../lib/theme';
import {
  LayoutDashboard,
  CalendarDays,
  Tag,
  Users,
  LogOut,
  Download,
  Upload,
  ShieldCheck,
  UserCheck,
  Moon,
  Sun,
  Wallet,
  Palette,
  Check,
  Target,
  TrendingUp,
  Sparkles,
  Cloud
} from 'lucide-react';

interface NavbarProps {
  user: User;
  activeTab: 'dashboard' | 'mensal' | 'metas' | 'categorias' | 'usuarios';
  setActiveTab: (tab: 'dashboard' | 'mensal' | 'metas' | 'categorias' | 'usuarios') => void;
  onLogout: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenStatementImport?: () => void;
  onOpenFirebaseSync?: () => void;
  theme?: ThemeSettings;
  setTheme?: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onExport,
  onImport,
  onOpenStatementImport,
  onOpenFirebaseSync,
  theme,
  setTheme,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isMaster = user.role === 'master';
  const isDark = theme?.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme?.colorTheme || 'pastelRose'];

  const navBg = isDark
    ? 'bg-slate-900/95 border-slate-800/80 text-slate-100'
    : 'bg-white/95 border-slate-200/70 text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.03)]';

  const handleSelectThemeColor = (key: ThemeColor) => {
    if (!theme || !setTheme) return;
    const updated = { ...theme, colorTheme: key, customBgColor: undefined };
    setTheme(updated);
    localStorage.setItem('user_theme_pref', JSON.stringify(updated));
    setIsPaletteOpen(false);
  };

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition ${
                isDark ? 'bg-slate-800 border-slate-700 text-rose-400' : 'border-rose-100'
              }`}
              style={{
                backgroundColor: !isDark ? activeColorConfig.pastelPill : undefined,
                color: !isDark ? activeColorConfig.previewHex : undefined
              }}
            >
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 flex items-center gap-1.5">
                Minhas Finanças
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block font-normal">
                Painel Mensal & Controle
              </p>
            </div>
          </div>

          {/* User Profile & Backup & Pastel Theme Actions */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Pastel Palette Selector in Navbar */}
            {theme && setTheme && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition text-xs font-medium ${
                    isDark
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100'
                  }`}
                  title="Mudar Paleta de Cores Pastéis"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-black/10 shadow-2xs"
                    style={{ backgroundColor: activeColorConfig.previewHex }}
                  />
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{activeColorConfig.shortName}</span>
                </button>

                {isPaletteOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3 z-50 text-slate-800 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Cores Pastéis
                      </span>
                      <button
                        onClick={() => setIsPaletteOpen(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {([
                        'pastelRose',
                        'pastelLavender',
                        'pastelMint',
                        'pastelPeach',
                        'pastelSky',
                        'pastelButter',
                        'pastelMatcha',
                      ] as ThemeColor[]).map((key) => {
                        const cfg = THEME_CONFIGS[key];
                        const isSelected = theme.colorTheme === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectThemeColor(key)}
                            className={`w-full px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                              isSelected
                                ? 'border-rose-300 bg-rose-50/50 font-semibold text-slate-900'
                                : 'border-transparent hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: cfg.previewHex }}
                              />
                              <span>{cfg.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-rose-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Dark Mode Switcher in Header */}
            {theme && setTheme && (
              <button
                onClick={() => {
                  const updated = { ...theme, darkMode: !theme.darkMode };
                  setTheme(updated);
                  localStorage.setItem('user_theme_pref', JSON.stringify(updated));
                }}
                className={`p-2 rounded-xl border transition ${
                  isDark
                    ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Noturno'}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}

            {onOpenStatementImport && (
              <button
                onClick={onOpenStatementImport}
                title="Importar extratos ou faturas do Nubank (PDF ou texto)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200/80 dark:border-violet-850 bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/50 font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="hidden lg:inline">Importar Extrato/Fatura</span>
                <span className="lg:hidden">Extrato</span>
              </button>
            )}

            <div className="hidden md:flex items-center space-x-1 text-xs">
              <button
                onClick={onExport}
                title="Exportar backup dos dados (JSON)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition font-medium ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar</span>
              </button>
              <button
                onClick={onImport}
                title="Importar dados de um backup"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition font-medium ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Backup</span>
              </button>

              {onOpenFirebaseSync && (
                <button
                  type="button"
                  onClick={onOpenFirebaseSync}
                  title="Sincronizar com banco de dados em nuvem Firebase Firestore"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/70'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nuvem Firebase</span>
                </button>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200/70 hidden md:block" />

            {/* User Chip */}
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200/70'
            }`}>
              <div
                className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: activeColorConfig.previewHex }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-slate-900 leading-none">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  {isMaster ? (
                    <span className="text-amber-600 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Master
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium flex items-center gap-0.5">
                      <UserCheck className="w-3 h-3" /> Preenchedor
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Sair da conta"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Navigation Tabs */}
        <nav className={`flex space-x-1 sm:space-x-1.5 border-t overflow-x-auto py-2 no-scrollbar ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}>
          <button
            onClick={() => setActiveTab('mensal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition whitespace-nowrap ${
              activeTab === 'mensal'
                ? `${activeColorConfig.primary} shadow-xs font-semibold`
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Aba Mês</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? `${activeColorConfig.primary} shadow-xs font-semibold`
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Visão Anual</span>
          </button>

          <button
            onClick={() => setActiveTab('metas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition whitespace-nowrap ${
              activeTab === 'metas'
                ? `${activeColorConfig.primary} shadow-xs font-semibold`
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Caixinhas & Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition whitespace-nowrap ${
              activeTab === 'categorias'
                ? `${activeColorConfig.primary} shadow-xs font-semibold`
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categorias</span>
          </button>

          {/* USUÁRIOS TAB - STRICTLY FOR MASTER ROLE */}
          {isMaster && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition whitespace-nowrap ${
                activeTab === 'usuarios'
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuários</span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-100 text-amber-900 border border-amber-200">
                Master
              </span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
