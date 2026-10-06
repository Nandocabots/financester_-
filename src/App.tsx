import React, { useState, useEffect } from 'react';
import { User, Category } from './types';
import { api, getStoredUser, clearStoredAuth, getStoredToken } from './lib/api';
import { ThemeSettings, DEFAULT_THEME, THEME_CONFIGS } from './lib/theme';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardAnual } from './components/DashboardAnual';
import { AbaMensalClean } from './components/AbaMensalClean';
import { AbaCategorias } from './components/AbaCategorias';
import { AbaUsuarios } from './components/AbaUsuarios';
import { AbaMetas } from './components/AbaMetas';
import { ImportadorExtratosModal } from './components/ImportadorExtratosModal';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mensal' | 'metas' | 'categorias' | 'usuarios'>('mensal');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGlobalImportOpen, setIsGlobalImportOpen] = useState(false);
  const [isFirebaseSyncOpen, setIsFirebaseSyncOpen] = useState(false);

  // Persistent Theme State (Modo Noturno / Custom Colors)
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('user_theme_pref');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, darkMode: false }; // Enforce light theme as requested
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_THEME;
  });

  // Validate session token on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe();
        setCurrentUser(user);
      } catch (e) {
        console.warn('Sessão expirada:', e);
        clearStoredAuth();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch Categories whenever logged in
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCategories();
    }
  }, [currentUser]);

  // Guard against non-master accessing "usuarios" tab
  useEffect(() => {
    if (activeTab === 'usuarios' && currentUser?.role !== 'master') {
      setActiveTab('mensal');
    }
  }, [activeTab, currentUser]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planilha_financeira_backup_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Erro ao exportar backup: ' + e.message);
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          await api.importBackup(parsed);
          alert('Backup importado com sucesso!');
          window.location.reload();
        } catch (err: any) {
          alert('Erro ao importar backup: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const isDark = theme.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme.colorTheme];
  const bgClass = isDark ? 'bg-slate-950 text-slate-100' : `${activeColorConfig.bgLight} text-slate-800`;
  const customBgStyle = theme.customBgColor ? { backgroundColor: theme.customBgColor } : undefined;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`} style={customBgStyle}>
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin w-10 h-10 border-4 border-rose-400 border-t-transparent rounded-full" />
          <p className="text-sm font-bold text-slate-700">Carregando Suas Finanças...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bgClass}`} style={customBgStyle}>
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        onOpenStatementImport={() => setIsGlobalImportOpen(true)}
        onOpenFirebaseSync={() => setIsFirebaseSyncOpen(true)}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'mensal' && (
          <AbaMensalClean
            categories={categories}
            onRefreshCategories={fetchCategories}
            theme={theme}
            setTheme={setTheme}
          />
        )}
        {activeTab === 'dashboard' && <DashboardAnual theme={theme} />}
        {activeTab === 'metas' && <AbaMetas theme={theme} />}
        {activeTab === 'categorias' && (
          <AbaCategorias categories={categories} onRefresh={fetchCategories} />
        )}
        {activeTab === 'usuarios' && currentUser.role === 'master' && <AbaUsuarios />}
      </main>

      {/* Global Statement & Invoice Import Modal */}
      <ImportadorExtratosModal
        isOpen={isGlobalImportOpen}
        onClose={() => setIsGlobalImportOpen(false)}
        categories={categories}
        onImportSuccess={() => {
          fetchCategories();
          // Reload page to guarantee full UI sync across tabs
          window.location.reload();
        }}
      />

      {/* Firebase Cloud Sync Modal */}
      <FirebaseSyncModal
        isOpen={isFirebaseSyncOpen}
        onClose={() => setIsFirebaseSyncOpen(false)}
        onSyncComplete={() => {
          fetchCategories();
        }}
      />

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs font-medium ${
        isDark ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-rose-100 bg-white text-slate-400'
      }`}>
        Minhas Finanças • Padrão Google & Personalizável
      </footer>
    </div>
  );
}
