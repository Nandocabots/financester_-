import React, { useState } from 'react';
import { api } from '../lib/api';
import { firebaseSync } from '../lib/firebaseSync';
import { Cloud, Check, RefreshCw, X, ShieldCheck, Database, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const handlePushToFirebase = async () => {
    setLoading(true);
    setStatusMessage('Buscando dados locais para sincronização...');
    setStatusType(null);

    try {
      const fullData = await api.exportBackup();
      setStatusMessage(`Enviando ${fullData.transactions.length} lançamentos e ${fullData.categories.length} categorias para o Firestore...`);

      const res = await firebaseSync.syncAllToFirestore(fullData);

      setStatusType('success');
      setStatusMessage(`Sucesso! ${res.transactionsCount} lançamentos, ${res.categoriesCount} categorias e ${res.goalsCount} metas foram salvos na nuvem do Firebase.`);
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage('Erro na sincronização: ' + (err.message || 'Falha ao conectar com Firestore.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePullFromFirebase = async () => {
    if (!window.confirm('Deseja puxar os dados do Firebase e substituir os dados locais atuais?')) {
      return;
    }

    setLoading(true);
    setStatusMessage('Buscando coleções no Firebase Firestore...');
    setStatusType(null);

    try {
      const cloudData = await firebaseSync.pullAllFromFirestore();
      if (cloudData.transactions.length === 0 && cloudData.categories.length === 0) {
        setStatusType('error');
        setStatusMessage('Nenhum dado encontrado no Firebase Firestore. Faça o envio dos dados locais primeiro.');
        setLoading(false);
        return;
      }

      await api.importBackup({
        categories: cloudData.categories,
        transactions: cloudData.transactions,
        goals: cloudData.goals,
      });

      setStatusType('success');
      setStatusMessage(`Dados importados do Firebase com sucesso! (${cloudData.transactions.length} transações).`);
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage('Erro ao importar do Firebase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Banco de Dados em Nuvem (Firebase)</h3>
              <p className="text-[11px] text-slate-400">Google Cloud Firestore conectado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Info Badge */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              Projeto Firebase:
            </span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
              {firebaseConfig.projectId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Status do Firestore:
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3" /> Conectado & Ativo
            </span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium border ${
            statusType === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusType === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handlePushToFirebase}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sincronizando com Firestore...</span>
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-4 h-4" />
                <span>Salvar Tudo no Firebase Firestore (Nuvem)</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handlePullFromFirebase}
            className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4 text-slate-500" />
            <span>Puxar Dados da Nuvem para o Sistema Local</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
          Os dados ficam armazenados de forma persistente nas coleções de usuários, transações, categorias e metas no Google Firestore.
        </p>
      </div>
    </div>
  );
};
