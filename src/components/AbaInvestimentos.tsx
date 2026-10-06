import React, { useState, useEffect, useMemo } from 'react';
import { InvestmentAsset, InvestmentMovement, InvestmentCategory } from '../types';
import { api } from '../lib/api';
import { ThemeSettings, THEME_CONFIGS, PASTEL_PRESETS } from '../lib/theme';
import {
  TrendingUp,
  Plus,
  DollarSign,
  PieChart as PieChartIcon,
  Calculator,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ShieldCheck,
  Building,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  HelpCircle,
  Percent,
  CheckCircle2,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Coffee,
  Pizza,
  Zap,
  Tv,
  ArrowRight,
  Sliders,
  Award,
  Smile,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface AbaInvestimentosProps {
  theme?: ThemeSettings;
}

const CATEGORY_CONFIG: Record<
  InvestmentCategory,
  { label: string; simpleLabel: string; description: string; color: string; bgLight: string; icon: any }
> = {
  reserva: {
    label: 'Reserva de Emergência',
    simpleLabel: 'Escudo Protetor',
    description: 'Dinheiro para imprevistos. Pode sacar a qualquer dia ou hora sem perder nada.',
    color: '#10B981',
    bgLight: '#ECFDF5',
    icon: ShieldCheck,
  },
  renda_fixa: {
    label: 'Renda Fixa Segura',
    simpleLabel: 'CDB & Tesouro',
    description: 'Mais seguro que poupança e rende todo dia útil, garantido pelo governo ou bancos.',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    icon: Layers,
  },
  fundos_imobiliarios: {
    label: 'Fundos Imobiliários',
    simpleLabel: 'Aluguéis Mensais',
    description: 'Pedacinhos de imóveis que pagam "aluguel" todo mês na sua conta, isento de imposto.',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    icon: Building,
  },
  acoes_etfs: {
    label: 'Ações & Empresas',
    simpleLabel: 'Sociedade em Empresas',
    description: 'Para quem quer multiplicar patrimônio pensando nos próximos 5 a 10 anos.',
    color: '#EC4899',
    bgLight: '#FDF2F8',
    icon: TrendingUp,
  },
  outros: {
    label: 'Previdência & Outros',
    simpleLabel: 'Aposentadoria / Outros',
    description: 'Planos de longo prazo ou investimentos alternativos.',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    icon: Coins,
  },
};

const STARTER_SUGGESTIONS = [
  {
    name: 'CDB 100% CDI (Caixinha / Reserva)',
    institution: 'Nubank / Inter / C6',
    category: 'reserva' as InvestmentCategory,
    color: '#10B981',
    notes: 'Ideal para guardar qualquer dinheiro. Rende todo dia útil e pode sacar quando quiser.',
    defaultAmount: 200,
  },
  {
    name: 'Tesouro Selic 2029',
    institution: 'Tesouro Direto',
    category: 'renda_fixa' as InvestmentCategory,
    color: '#3B82F6',
    notes: 'O investimento mais seguro do Brasil. 100% garantido pelo Governo Federal.',
    defaultAmount: 300,
  },
  {
    name: 'FII MXRF11 (Aluguel todo mês)',
    institution: 'XP / NuInvest / Inter',
    category: 'fundos_imobiliarios' as InvestmentCategory,
    color: '#8B5CF6',
    notes: 'Custa cerca de R$ 10 por cota e pinga rendimentos todo mês direto na sua conta.',
    defaultAmount: 100,
  },
  {
    name: 'Tesouro IPCA+ (Proteção Inflação)',
    institution: 'Tesouro Direto',
    category: 'renda_fixa' as InvestmentCategory,
    color: '#06B6D4',
    notes: 'Garante que seu poder de compra não seja corroído pelo aumento de preços.',
    defaultAmount: 250,
  },
];

export function AbaInvestimentos({ theme }: AbaInvestimentosProps) {
  const [subTab, setSubTab] = useState<'carteira' | 'assistente' | 'simulador' | 'extrato' | 'duvidas'>('carteira');
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [movements, setMovements] = useState<InvestmentMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedAssetForMovement, setSelectedAssetForMovement] = useState<InvestmentAsset | null>(null);

  // Asset Form State
  const [assetName, setAssetName] = useState('');
  const [assetInstitution, setAssetInstitution] = useState('');
  const [assetCategory, setAssetCategory] = useState<InvestmentCategory>('reserva');
  const [assetInvested, setAssetInvested] = useState('');
  const [assetCurrent, setAssetCurrent] = useState('');
  const [assetColor, setAssetColor] = useState(PASTEL_PRESETS[0].color);
  const [assetNotes, setAssetNotes] = useState('');

  // Movement Form State
  const [movType, setMovType] = useState<'aporte' | 'rendimento' | 'resgate'>('aporte');
  const [movAmount, setMovAmount] = useState('');
  const [movDate, setMovDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [movNotes, setMovNotes] = useState('');
  const [syncMonthly, setSyncMonthly] = useState(true);

  // Assistente Interativo "O que fazer com meu dinheiro?"
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardAmount, setWizardAmount] = useState<number>(100);
  const [wizardGoal, setWizardGoal] = useState<'seguranca' | 'mensal' | 'curto_prazo' | 'futuro'>('seguranca');

  // Termômetro da Reserva de Emergência
  const [monthlyExpenseEstimate, setMonthlyExpenseEstimate] = useState<number>(2500);

  // Comparador Poupança vs CDB Dinâmico
  const [compareAmount, setCompareAmount] = useState<number>(1000);

  // Simulador de Juros Compostos
  const [simInitial, setSimInitial] = useState(500);
  const [simMonthly, setSimMonthly] = useState(200);
  const [simYears, setSimYears] = useState(5);
  const [simAnnualRate, setSimAnnualRate] = useState(10.5);

  // Dúvidas frequentes abertas (FAQ Accordion)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const isDark = theme?.darkMode;
  const activeColorConfig = THEME_CONFIGS[theme?.colorTheme || 'pastelRose'];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const data = await api.getInvestments();
      setAssets(data.assets || []);
      setMovements(data.movements || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  // Summary Calculations
  const totalInvested = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.investedAmount || 0), 0);
  }, [assets]);

  const totalCurrentValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  }, [assets]);

  const totalProfit = totalCurrentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Monthly Yield (Rendimentos no mês atual)
  const currentMonthYear = new Date().toISOString().substring(0, 7);
  const monthlyYield = useMemo(() => {
    return movements
      .filter(m => m.type === 'rendimento' && m.monthYear === currentMonthYear)
      .reduce((sum, m) => sum + m.amount, 0);
  }, [movements, currentMonthYear]);

  // Reserva de Emergência Acumulada
  const emergencyFundAmount = useMemo(() => {
    return assets
      .filter(a => a.category === 'reserva')
      .reduce((sum, a) => sum + (a.currentValue || 0), 0);
  }, [assets]);

  const emergencyMonthsCovered = monthlyExpenseEstimate > 0 ? emergencyFundAmount / monthlyExpenseEstimate : 0;
  const target3Months = monthlyExpenseEstimate * 3;
  const target6Months = monthlyExpenseEstimate * 6;
  const emergencyFundProgressPercent = target3Months > 0 ? Math.min(100, (emergencyFundAmount / target3Months) * 100) : 0;

  // Allocation By Category
  const allocationData = useMemo(() => {
    const categoriesMap: Record<InvestmentCategory, number> = {
      reserva: 0,
      renda_fixa: 0,
      fundos_imobiliarios: 0,
      acoes_etfs: 0,
      outros: 0,
    };

    assets.forEach(a => {
      categoriesMap[a.category] = (categoriesMap[a.category] || 0) + (a.currentValue || 0);
    });

    return Object.entries(categoriesMap)
      .filter(([_, val]) => val > 0)
      .map(([cat, val]) => ({
        category: cat as InvestmentCategory,
        name: CATEGORY_CONFIG[cat as InvestmentCategory]?.simpleLabel || cat,
        value: val,
        color: CATEGORY_CONFIG[cat as InvestmentCategory]?.color || '#94A3B8',
        percentage: totalCurrentValue > 0 ? (val / totalCurrentValue) * 100 : 0,
      }));
  }, [assets, totalCurrentValue]);

  // Analogias Divertidas com o Rendimento
  const yieldAnalogies = useMemo(() => {
    const totalEarnings = Math.max(0, monthlyYield > 0 ? monthlyYield : totalProfit);
    return [
      {
        icon: Coffee,
        title: `${Math.max(1, Math.floor(totalEarnings / 6))} cafezinhos na padaria`,
        desc: 'pagos 100% pelo lucro do seu dinheiro, sem você gastar seu salário!',
      },
      {
        icon: Pizza,
        title: `${(totalEarnings / 45).toFixed(1)} pizzas com os amigos`,
        desc: 'patrocinadas pelo rendimento dos seus investimentos.',
      },
      {
        icon: Tv,
        title: `${(totalEarnings / 35).toFixed(1)} mensalidades de streaming`,
        desc: 'como Netflix ou Spotify cobertas por juros automáticos.',
      },
      {
        icon: Zap,
        title: `${(totalEarnings / 110 * 100).toFixed(0)}% da sua conta de luz`,
        desc: 'paga diretamente pela sua renda passiva.',
      },
    ];
  }, [monthlyYield, totalProfit]);

  // Compound Interest Calculation
  const simulationResults = useMemo(() => {
    const monthlyRate = Math.pow(1 + simAnnualRate / 100, 1 / 12) - 1;
    const totalMonths = simYears * 12;

    const dataPoints: {
      year: number;
      invested: number;
      totalWithInterest: number;
      interestProfit: number;
    }[] = [];

    let currentBalance = simInitial;
    let totalDeposited = simInitial;

    dataPoints.push({
      year: 0,
      invested: Math.round(totalDeposited),
      totalWithInterest: Math.round(currentBalance),
      interestProfit: 0,
    });

    for (let m = 1; m <= totalMonths; m++) {
      currentBalance = currentBalance * (1 + monthlyRate) + simMonthly;
      totalDeposited += simMonthly;

      if (m % 12 === 0 || m === totalMonths) {
        const yr = Math.floor(m / 12);
        dataPoints.push({
          year: yr,
          invested: Math.round(totalDeposited),
          totalWithInterest: Math.round(currentBalance),
          interestProfit: Math.round(currentBalance - totalDeposited),
        });
      }
    }

    const finalPoint = dataPoints[dataPoints.length - 1];

    return {
      dataPoints,
      finalTotal: finalPoint?.totalWithInterest || 0,
      finalInvested: finalPoint?.invested || 0,
      finalInterest: finalPoint?.interestProfit || 0,
    };
  }, [simInitial, simMonthly, simYears, simAnnualRate]);

  // Quick Deposit Handler (+R$ 20, +R$ 50, +R$ 100 com 1 clique)
  const handleQuickDeposit = async (asset: InvestmentAsset, amount: number) => {
    try {
      await api.createInvestmentMovement({
        assetId: asset.id,
        assetName: asset.name,
        date: new Date().toISOString().split('T')[0],
        monthYear: new Date().toISOString().substring(0, 7),
        type: 'aporte',
        amount: amount,
        notes: `Aporte rápido de ${formatCurrency(amount)}`,
        syncMonthly: true,
      });
      fetchInvestments();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar aporte.');
    }
  };

  // Asset Modal Handlers
  const handleOpenCreateAsset = (suggestion?: typeof STARTER_SUGGESTIONS[0]) => {
    setEditingAsset(null);
    if (suggestion) {
      setAssetName(suggestion.name);
      setAssetInstitution(suggestion.institution);
      setAssetCategory(suggestion.category);
      setAssetInvested(suggestion.defaultAmount.toString());
      setAssetCurrent(suggestion.defaultAmount.toString());
      setAssetColor(suggestion.color);
      setAssetNotes(suggestion.notes);
    } else {
      setAssetName('');
      setAssetInstitution('');
      setAssetCategory('reserva');
      setAssetInvested('100');
      setAssetCurrent('100');
      setAssetColor(PASTEL_PRESETS[0].color);
      setAssetNotes('');
    }
    setIsAssetModalOpen(true);
  };

  const handleOpenEditAsset = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    setAssetInstitution(asset.institution);
    setAssetCategory(asset.category);
    setAssetInvested(asset.investedAmount.toString());
    setAssetCurrent(asset.currentValue.toString());
    setAssetColor(asset.color || PASTEL_PRESETS[0].color);
    setAssetNotes(asset.notes || '');
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetInstitution.trim()) return;

    try {
      if (editingAsset) {
        await api.updateInvestmentAsset(editingAsset.id, {
          name: assetName,
          institution: assetInstitution,
          category: assetCategory,
          investedAmount: Number(assetInvested) || 0,
          currentValue: Number(assetCurrent) || Number(assetInvested) || 0,
          color: assetColor,
          notes: assetNotes,
        });
      } else {
        await api.createInvestmentAsset({
          name: assetName,
          institution: assetInstitution,
          category: assetCategory,
          investedAmount: Number(assetInvested) || 0,
          currentValue: Number(assetCurrent) || Number(assetInvested) || 0,
          color: assetColor,
          notes: assetNotes,
        });
      }
      setIsAssetModalOpen(false);
      fetchInvestments();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar investimento.');
    }
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o investimento "${name}"? Todas as movimentações deste ativo também serão excluídas.`)) {
      return;
    }
    try {
      await api.deleteInvestmentAsset(id);
      fetchInvestments();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover investimento.');
    }
  };

  // Movement Modal Handlers
  const handleOpenMovementModal = (asset?: InvestmentAsset, defaultType: 'aporte' | 'rendimento' | 'resgate' = 'aporte') => {
    setSelectedAssetForMovement(asset || (assets[0] || null));
    setMovType(defaultType);
    setMovAmount('');
    setMovDate(new Date().toISOString().split('T')[0]);
    setMovNotes(defaultType === 'rendimento' ? 'Rendimento mensal / Provento' : '');
    setSyncMonthly(true);
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForMovement || !movAmount || Number(movAmount) <= 0) {
      alert('Informe um investimento e um valor válido.');
      return;
    }

    try {
      await api.createInvestmentMovement({
        assetId: selectedAssetForMovement.id,
        assetName: selectedAssetForMovement.name,
        date: movDate,
        monthYear: movDate.substring(0, 7),
        type: movType,
        amount: Number(movAmount),
        notes: movNotes,
        syncMonthly,
      });

      setIsMovementModalOpen(false);
      fetchInvestments();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação.');
    }
  };

  const handleDeleteMovement = async (id: string) => {
    if (!window.confirm('Deseja excluir esta movimentação? O saldo do ativo será recalculado automaticamente.')) {
      return;
    }
    try {
      await api.deleteInvestmentMovement(id);
      fetchInvestments();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir movimentação.');
    }
  };

  // Sugestão Dinâmica do Assistente
  const assistantRecommendation = useMemo(() => {
    if (wizardGoal === 'seguranca') {
      return {
        title: 'CDB 100% CDI Liquidez Diária (ex: Caixinha Nubank, Inter)',
        category: 'reserva' as InvestmentCategory,
        reason: 'Você pode sacar a qualquer hora do dia ou da noite e não corre nenhum risco de perder 1 centavo sequer. É o melhor lugar para seu escudo de emergência.',
        gainComparison: `Em 1 ano, R$ ${wizardAmount} rende aprox. R$ ${(wizardAmount * 0.105).toFixed(0)} no CDB contra só R$ ${(wizardAmount * 0.06).toFixed(0)} na Poupança.`,
        actionLabel: 'Guardar na Reserva de Emergência',
      };
    }
    if (wizardGoal === 'mensal') {
      return {
        title: 'Fundos Imobiliários (FIIs como MXRF11 ou similares)',
        category: 'fundos_imobiliarios' as InvestmentCategory,
        reason: 'Você compra cotas a partir de R$ 10 e passa a receber "aluguéis" todo mês na sua conta, isento de Imposto de Renda!',
        gainComparison: `Com R$ ${wizardAmount}, você compra cotas que pingam cerca de R$ ${(wizardAmount * 0.01).toFixed(2)} a R$ ${(wizardAmount * 0.011).toFixed(2)} todo mês direto na sua conta.`,
        actionLabel: 'Começar a Receber Aluguéis Mensais',
      };
    }
    if (wizardGoal === 'curto_prazo') {
      return {
        title: 'Tesouro Selic ou CDB com Vencimento em 1 a 2 Anos',
        category: 'renda_fixa' as InvestmentCategory,
        reason: 'Seu dinheiro fica rendendo todo santo dia útil com segurança máxima garantida pelo governo, perfeito para viagens ou compras planejadas.',
        gainComparison: `Zero sustos com oscilações. No final do prazo, você resgata o valor total acrescido de juros.`,
        actionLabel: 'Guardar para Minha Meta de Curto Prazo',
      };
    }
    return {
      title: 'Tesouro IPCA+ ou ETFs de Longo Prazo',
      category: 'renda_fixa' as InvestmentCategory,
      reason: 'O melhor para sua aposentadoria ou liberdade financeira. Ele garante que seu dinheiro sempre ganhará da inflação.',
      gainComparison: `Com o efeito dos juros compostos em 10 anos, esse valor pode triplicar de poder de compra.`,
      actionLabel: 'Investir Pensando no Futuro',
    };
  }, [wizardGoal, wizardAmount]);

  const handleApplyRecommendation = () => {
    const existing = assets.find(a => a.category === assistantRecommendation.category);
    if (existing) {
      setSelectedAssetForMovement(existing);
      setMovType('aporte');
      setMovAmount(wizardAmount.toString());
      setMovDate(new Date().toISOString().split('T')[0]);
      setMovNotes(`Aporte via Assistente Inteligente (${assistantRecommendation.title})`);
      setIsMovementModalOpen(true);
    } else {
      setEditingAsset(null);
      setAssetName(assistantRecommendation.title);
      setAssetInstitution('Sua corretora / Banco');
      setAssetCategory(assistantRecommendation.category);
      setAssetInvested(wizardAmount.toString());
      setAssetCurrent(wizardAmount.toString());
      setAssetColor(CATEGORY_CONFIG[assistantRecommendation.category].color);
      setAssetNotes(assistantRecommendation.reason);
      setIsAssetModalOpen(true);
    }
  };

  const faqs = [
    {
      q: 'Investir é perigoso? Posso perder todo o meu dinheiro?',
      a: 'NÃO na Renda Fixa e Reserva de Emergência! Investimentos como CDBs, LCIs e Caixinhas são protegidos pelo FGC (Fundo Garantidor de Créditos) até R$ 250.000 por CPF. O Tesouro Direto é 100% garantido pelo próprio Governo Federal. O risco de perder dinheiro nesses lugares é praticamente zero.',
    },
    {
      q: 'Por que não devo deixar meu dinheiro na Poupança tradicional?',
      a: 'A poupança só rende 1 vez ao mês (no dia do aniversário) e rende cerca de 6% ao ano, o que frequentemente empata ou até perde para o aumento dos preços no supermercado. Um simples CDB 100% CDI rende cerca de 10% a 11% ao ano e o rendimento cai todo dia útil!',
    },
    {
      q: 'Quanto preciso para começar a investir?',
      a: 'Com apenas R$ 1 você já consegue guardar nas Caixinhas ou CDBs digitais! No Tesouro Direto, com cerca de R$ 30 já é possível comprar títulos públicos. E cotas de Fundos Imobiliários custam cerca de R$ 10 cada.',
    },
    {
      q: 'Se eu precisar do dinheiro em uma emergência de saúde, consigo sacar?',
      a: 'Sim! Os investimentos marcados como "Reserva de Emergência" e "Liquidez Diária" podem ser resgatados imediatamente, direto pelo app do seu banco, caindo na sua conta corrente na mesma hora.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Principal Amigável para Leigos */}
      <div className={`p-6 rounded-3xl border transition shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border-emerald-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Smile className="w-3.5 h-3.5 text-emerald-600" />
              <span>Investimentos Descomplicados (Zero Financês)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
              Seu Dinheiro Trabalhando Por Você 24h por Dia
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Investir não é gastar: é <strong>transferir dinheiro do seu bolso de hoje para o seu bolso de amanhã</strong>, ganhando juros e dividendos todo mês sem esforço.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSubTab('assistente');
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Onde Guardar Meu Dinheiro?</span>
            </button>

            <button
              onClick={() => handleOpenMovementModal(undefined, 'aporte')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Dinheiro (+ Aporte)</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Resumo em Linguagem 100% Leiga */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {/* Total Acumulado */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Patrimônio Guardado
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl md:text-2xl font-black text-slate-800">
              {formatCurrency(totalCurrentValue)}
            </div>
            <p className="text-[11px] text-slate-400">Total somando juros e aportes</p>
          </div>

          {/* Do Próprio Bolso */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Saiu do Seu Bolso
              </span>
              <ArrowDownLeft className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg md:text-xl font-bold text-slate-700">
              {formatCurrency(totalInvested)}
            </div>
            <p className="text-[11px] text-slate-400">O que você depositou</p>
          </div>

          {/* Dinheiro Gerado Sozinho */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Lucro Criado Sozinho
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-lg md:text-xl font-black ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalProfit >= 0 ? `+${formatCurrency(totalProfit)}` : formatCurrency(totalProfit)}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                +{totalReturnPercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Juros sem você trabalhar a mais</p>
          </div>

          {/* Renda Passiva do Mês */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pingou Este Mês
              </span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg md:text-xl font-black text-blue-600">
              {formatCurrency(monthlyYield)}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Dinheiro que caiu na conta
            </p>
          </div>
        </div>
      </div>

      {/* Navegação Rápida entre Sub-Abas */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSubTab('carteira')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl transition whitespace-nowrap ${
              subTab === 'carteira'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Onde Está Meu Dinheiro ({assets.length})</span>
          </button>

          <button
            onClick={() => setSubTab('assistente')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl transition whitespace-nowrap ${
              subTab === 'assistente'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assistente: O que fazer com meu dinheiro?</span>
          </button>

          <button
            onClick={() => setSubTab('simulador')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl transition whitespace-nowrap ${
              subTab === 'simulador'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulador Bola de Neve</span>
          </button>

          <button
            onClick={() => setSubTab('extrato')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl transition whitespace-nowrap ${
              subTab === 'extrato'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Histórico de Aportes</span>
          </button>

          <button
            onClick={() => setSubTab('duvidas')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl transition whitespace-nowrap ${
              subTab === 'duvidas'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Dúvidas do Iniciante (FAQ)</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-ABA 1: MINHA CARTEIRA & TERMÔMETRO DE SEGURANÇA
      ======================================================== */}
      {subTab === 'carteira' && (
        <div className="space-y-6">
          {/* TERMÔMETRO DO ESCUDO DE EMERGÊNCIA (Super Dinâmico & Visual) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm md:text-base font-extrabold text-slate-800">
                    Seu Escudo de Segurança (Reserva de Emergência)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Prioridade nº 1
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Antes de arriscar, tenha dinheiro para viver com tranquilidade se imprevistos de saúde ou trabalho acontecerem.
                </p>
              </div>

              {/* Ajuste simples do custo de vida mensal */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Seu gasto mensal:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    value={monthlyExpenseEstimate}
                    onChange={e => setMonthlyExpenseEstimate(Number(e.target.value) || 2000)}
                    className="w-28 pl-8 pr-2 py-1 text-xs font-extrabold border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Barra de Progresso do Escudo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">
                  Você tem guardado no escudo: <strong className="text-emerald-600">{formatCurrency(emergencyFundAmount)}</strong>
                </span>
                <span className="text-slate-500">
                  {emergencyMonthsCovered >= 3 ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Escudo Blindado ({emergencyMonthsCovered.toFixed(1)} meses de paz)
                    </span>
                  ) : (
                    <span>Meta: {formatCurrency(target3Months)} (3 meses de tranquilidade)</span>
                  )}
                </span>
              </div>

              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, emergencyFundProgressPercent)}%` }}
                />
              </div>

              {/* Níveis do Escudo */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className={`p-2.5 rounded-xl border text-center transition ${
                  emergencyFundAmount >= monthlyExpenseEstimate
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  🥉 Nível 1: 1 Mês ({formatCurrency(monthlyExpenseEstimate)})
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition ${
                  emergencyFundAmount >= target3Months
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  🥈 Nível 2: 3 Meses ({formatCurrency(target3Months)})
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition ${
                  emergencyFundAmount >= target6Months
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  🥇 Nível 3: 6 Meses ({formatCurrency(target6Months)})
                </div>
              </div>
            </div>
          </div>

          {/* O QUE O SEU RENDIMENTO JÁ PAGA NA VIDA REAL (Analogias) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border border-blue-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  O Que Seus Rendimentos Já Pagam na Vida Real
                </h3>
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-2xs">
                {formatCurrency(Math.max(0, monthlyYield > 0 ? monthlyYield : totalProfit))} gerados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {yieldAnalogies.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
                    <div className="flex items-center gap-2 text-blue-600">
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs font-black text-slate-800">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMPARADOR POUPANÇA VS CDB EM TEMPO REAL (Dinâmico!) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Comparador Dinâmico: Poupança Antiga vs CDB 100% CDI</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Arraste o valor e veja quanto você perde deixando dinheiro parado na poupança:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Valor guardado:</span>
                <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                  {formatCurrency(compareAmount)}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={compareAmount}
              onChange={e => setCompareAmount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Na Poupança (em 1 ano)</span>
                <div className="text-base font-extrabold text-slate-700">
                  {formatCurrency(compareAmount * 1.06)}
                </div>
                <p className="text-[10px] text-slate-400">Rendimento de apenas ~{formatCurrency(compareAmount * 0.06)}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800">No CDB 100% CDI / Selic</span>
                <div className="text-base font-extrabold text-emerald-700">
                  {formatCurrency(compareAmount * 1.105)}
                </div>
                <p className="text-[10px] text-emerald-600 font-bold">Rendimento de ~{formatCurrency(compareAmount * 0.105)}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800">Diferença de Graça no Seu Bolso</span>
                <div className="text-base font-extrabold text-amber-700">
                  +{formatCurrency(compareAmount * 0.045)}
                </div>
                <p className="text-[10px] text-amber-700 font-medium">Você ganha a mais só por escolher o lugar certo!</p>
              </div>
            </div>
          </div>

          {/* LISTA DE ATIVOS COM BOTÕES DE APORTE RÁPIDO (+R$ 20, +R$ 50, +R$ 100) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <span>Seus Investimentos Cadastrados</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {assets.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Clique nos botões de aporte rápido para guardar sem burocracia</p>
              </div>

              <button
                onClick={() => handleOpenCreateAsset()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Cadastrar Novo Ativo</span>
              </button>
            </div>

            {assets.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-2xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Você ainda não cadastrou seus investimentos</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Comece pelo mais importante: adicione seu CDB de liquidez diária ou Caixinha do Nubank com um toque!
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCreateAsset(STARTER_SUGGESTIONS[0])}
                  className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                >
                  Criar Meu Primeiro Investimento (CDB 100% CDI)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(asset => {
                  const profit = asset.currentValue - asset.investedAmount;
                  const returnRate = asset.investedAmount > 0 ? (profit / asset.investedAmount) * 100 : 0;
                  const catConfig = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.outros;
                  const CatIcon = catConfig.icon;

                  return (
                    <div
                      key={asset.id}
                      className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 shadow-2xs transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-800 shadow-2xs"
                              style={{ backgroundColor: asset.color ? `${asset.color}25` : '#ECFDF5' }}
                            >
                              <CatIcon className="w-5 h-5 text-slate-700" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 leading-tight">
                                {asset.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {asset.institution}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditAsset(asset)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                              title="Editar Ativo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id, asset.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                              title="Excluir Ativo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Categoria Badge */}
                        <div>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: catConfig.bgLight,
                              borderColor: `${catConfig.color}40`,
                              color: catConfig.color,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catConfig.color }} />
                            {catConfig.simpleLabel}
                          </span>
                        </div>

                        {/* Valores Principais */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Saldo Atual
                            </span>
                            <span className="text-base font-black text-slate-800">
                              {formatCurrency(asset.currentValue)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Do Seu Bolso
                            </span>
                            <span className="text-sm font-bold text-slate-600">
                              {formatCurrency(asset.investedAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Lucro / Rendimento Acumulado */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                          <span className="text-[11px] text-slate-500">Lucro gerado:</span>
                          <div className="flex items-center gap-1 font-bold">
                            <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
                            </span>
                            <span className="text-[10px] text-slate-400">({returnRate.toFixed(1)}%)</span>
                          </div>
                        </div>

                        {/* APORTE RÁPIDO EM 1 CLIQUE */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Guardar Rápido (+ 1 clique):
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[20, 50, 100, 200].map(val => (
                              <button
                                key={val}
                                onClick={() => handleQuickDeposit(asset, val)}
                                className="py-1 px-1.5 text-[11px] font-bold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 transition text-center shadow-2xs"
                              >
                                +R$ {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação Completa */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenMovementModal(asset, 'aporte')}
                          className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Outro Valor</span>
                        </button>
                        <button
                          onClick={() => handleOpenMovementModal(asset, 'rendimento')}
                          className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition flex items-center justify-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5 text-blue-600" />
                          <span>+ Lucro</span>
                        </button>
                        <button
                          onClick={() => handleOpenMovementModal(asset, 'resgate')}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                          title="Resgatar / Sacar"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-ABA 2: ASSISTENTE DINÂMICO "ONDE GUARDAR MEU DINHEIRO?"
      ======================================================== */}
      {subTab === 'assistente' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Assistente Inteligente: Onde Guardar Meu Dinheiro Hoje?
                </h3>
                <p className="text-xs text-slate-500">
                  Responda 2 perguntas simples e nós indicamos exatamente o melhor produto para o seu momento.
                </p>
              </div>
            </div>

            {/* Pergunta 1: Quanto você quer guardar? */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
                1. Quanto você tem disponível para guardar agora?
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {[50, 100, 250, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setWizardAmount(amount)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                      wizardAmount === amount
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    R$ {amount}
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs font-bold text-slate-400">Outro:</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={wizardAmount}
                    onChange={e => setWizardAmount(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Pergunta 2: Qual seu principal objetivo? */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
                2. Qual o seu principal objetivo com esse dinheiro?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardGoal('seguranca')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                    wizardGoal === 'seguranca'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">
                      Segurança & Poder Sacar a Qualquer Hora
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Para reserva de emergência e imprevistos. Zero risco de perder nada.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWizardGoal('mensal')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                    wizardGoal === 'mensal'
                      ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-200'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <Coins className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">
                      Pingar Dinheiro Todo Mês (Aluguéis)
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Fundos Imobiliários que depositam "aluguel" isento de imposto na conta.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWizardGoal('curto_prazo')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                    wizardGoal === 'curto_prazo'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">
                      Viagem ou Compra em 1 a 2 Anos
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Para quem tem data marcada e quer rentabilidade muito acima da poupança.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWizardGoal('futuro')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                    wizardGoal === 'futuro'
                      ? 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-200'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">
                      Construir Fortuna / Aposentadoria (5+ Anos)
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Multiplicar patrimônio aproveitando a força máxima dos juros compostos.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Card com a Recomendação Personalizada */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Nossa Recomendação Ideal Para Você
                </span>
              </div>

              <h4 className="text-base font-black text-slate-800">
                {assistantRecommendation.title}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed">
                {assistantRecommendation.reason}
              </p>

              <div className="p-3 rounded-2xl bg-white border border-emerald-100 text-xs text-emerald-900 font-medium">
                💡 {assistantRecommendation.gainComparison}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleApplyRecommendation}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <span>{assistantRecommendation.actionLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-ABA 3: SIMULADOR DE JUROS COMPOSTOS (BOLA DE NEVE)
      ======================================================== */}
      {subTab === 'simulador' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>Simulador Bola de Neve (A Força dos Juros Compostos)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Veja com seus próprios olhos quanto seu dinheiro renderá se você guardar um pouquinho todo mês:
                </p>
              </div>
            </div>

            {/* Presets Rápidos Divertidos */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Simulações rápidas:</span>
              <button
                onClick={() => {
                  setSimInitial(200);
                  setSimMonthly(150);
                  setSimYears(3);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                ☕ 1 Café por dia (R$ 150/mês)
              </button>
              <button
                onClick={() => {
                  setSimInitial(500);
                  setSimMonthly(300);
                  setSimYears(5);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                🍕 1 Delivery a menos (R$ 300/mês)
              </button>
              <button
                onClick={() => {
                  setSimInitial(2000);
                  setSimMonthly(800);
                  setSimYears(10);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                🚀 Foco em Aposentadoria (R$ 800/mês)
              </button>
            </div>

            {/* Controles da Simulação */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Aplicação Inicial (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={simInitial}
                  onChange={e => setSimInitial(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-extrabold border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Guardar Todo Mês (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={simMonthly}
                  onChange={e => setSimMonthly(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-extrabold border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Prazo: {simYears} anos</span>
                  <span className="text-slate-400">({simYears * 12} meses)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simYears}
                  onChange={e => setSimYears(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Taxa Anual: {simAnnualRate}% a.a.</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">(Ref. CDI)</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  step="0.5"
                  value={simAnnualRate}
                  onChange={e => setSimAnnualRate(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 3 Cartões de Resultado da Simulação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-950 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Acumulado Final
                </span>
                <div className="text-2xl font-black text-emerald-800">
                  {formatCurrency(simulationResults.finalTotal)}
                </div>
                <p className="text-[11px] text-emerald-700">Seu patrimônio daqui a {simYears} anos</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tirado do Seu Bolso
                </span>
                <div className="text-2xl font-extrabold text-slate-700">
                  {formatCurrency(simulationResults.finalInvested)}
                </div>
                <p className="text-[11px] text-slate-400">Soma de todos os seus depósitos</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-950 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Lucro Puro em Juros
                </span>
                <div className="text-2xl font-black text-blue-700">
                  +{formatCurrency(simulationResults.finalInterest)}
                </div>
                <p className="text-[11px] text-blue-600 font-medium">Dinheiro novo que os juros criaram</p>
              </div>
            </div>

            {/* Gráfico Visual */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationResults.dataPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="year" tickFormatter={v => `Ano ${v}`} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis
                    tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)),
                      name === 'totalWithInterest' ? 'Total com Juros' : 'Total Guardado',
                    ]}
                    labelFormatter={label => `Ano ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalWithInterest"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorInvested)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-ABA 4: EXTRATO DE MOVIMENTAÇÕES
      ======================================================== */}
      {subTab === 'extrato' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Extrato de Aportes & Rendimentos</h3>
              <p className="text-xs text-slate-400">Histórico de todas as aplicações e lucros creditados</p>
            </div>
            <button
              onClick={() => handleOpenMovementModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Movimentação</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma movimentação registrada até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Investimento</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Observações</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map(mov => {
                      const isAporte = mov.type === 'aporte';
                      const isRendimento = mov.type === 'rendimento';
                      const isResgate = mov.type === 'resgate';

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                            {mov.date.split('-').reverse().join('/')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isAporte && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowUpRight className="w-3 h-3" /> Aporte
                              </span>
                            )}
                            {isRendimento && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Coins className="w-3 h-3" /> Rendimento
                              </span>
                            )}
                            {isResgate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <ArrowDownLeft className="w-3 h-3" /> Resgate
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {mov.assetName}
                          </td>
                          <td className="py-3 px-4 font-black whitespace-nowrap">
                            <span
                              className={
                                isAporte
                                  ? 'text-emerald-600'
                                  : isRendimento
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }
                            >
                              {isResgate ? `- ${formatCurrency(mov.amount)}` : `+ ${formatCurrency(mov.amount)}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {mov.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteMovement(mov.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                              title="Excluir movimentação"
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
        </div>
      )}

      {/* ========================================================
          SUB-ABA 5: DÚVIDAS DO INICIANTE (FAQ DESCOMPLICADO)
      ======================================================== */}
      {subTab === 'duvidas' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1 mb-4">
            <h3 className="text-base font-extrabold text-slate-800">
              Perguntas Que Todo Mundo Tem Vergonha de Fazer
            </h3>
            <p className="text-xs text-slate-500">
              Respostas diretas e sem termos difíceis para você investir com 100% de segurança.
            </p>
          </div>

          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                >
                  <span className="text-xs md:text-sm font-bold text-slate-800">
                    {faq.q}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: CRIAR / EDITAR ATIVO
      ======================================================== */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingAsset ? 'Editar Investimento' : 'Adicionar Novo Investimento'}
              </h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome do Investimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caixinha Nubank, Tesouro Selic, FII MXRF11..."
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Instituição / Banco *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Inter, XP..."
                    value={assetInstitution}
                    onChange={e => setAssetInstitution(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Categoria Descomplicada *
                  </label>
                  <select
                    value={assetCategory}
                    onChange={e => setAssetCategory(e.target.value as InvestmentCategory)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    <option value="reserva">🛡️ Reserva de Emergência (Liquidez Imediata)</option>
                    <option value="renda_fixa">📈 Renda Fixa Segura (CDB / Tesouro)</option>
                    <option value="fundos_imobiliarios">🏢 Aluguéis Mensais (FIIs)</option>
                    <option value="acoes_etfs">🚀 Ações & Empresas (Longo Prazo)</option>
                    <option value="outros">🪙 Outros / Aposentadoria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Total Guardado do Bolso (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 500"
                    value={assetInvested}
                    onChange={e => setAssetInvested(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Saldo Atual com Rendimentos (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 520"
                    value={assetCurrent}
                    onChange={e => setAssetCurrent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cor de Identificação
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PASTEL_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setAssetColor(preset.color)}
                      style={{ backgroundColor: preset.color }}
                      className={`w-6 h-6 rounded-full border transition flex items-center justify-center ${
                        assetColor === preset.color ? 'ring-2 ring-slate-800 scale-110' : 'opacity-80'
                      }`}
                    >
                      {assetColor === preset.color && <Check className="w-3 h-3 text-slate-900" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Anotações ou Dica Pessoal (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pode resgatar a qualquer hora, foco em viagem, etc..."
                  value={assetNotes}
                  onChange={e => setAssetNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition"
                >
                  {editingAsset ? 'Atualizar' : 'Salvar Investimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REGISTRAR MOVIMENTAÇÃO
      ======================================================== */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {movType === 'aporte'
                  ? 'Guardar Dinheiro (+ Aporte)'
                  : movType === 'rendimento'
                  ? 'Registrar Lucro / Rendimento'
                  : 'Registrar Resgate'}
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMovType('aporte')}
                  className={`py-1.5 text-xs font-bold rounded-xl transition ${
                    movType === 'aporte' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  + Aporte
                </button>
                <button
                  type="button"
                  onClick={() => setMovType('rendimento')}
                  className={`py-1.5 text-xs font-bold rounded-xl transition ${
                    movType === 'rendimento' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  + Rendimento
                </button>
                <button
                  type="button"
                  onClick={() => setMovType('resgate')}
                  className={`py-1.5 text-xs font-bold rounded-xl transition ${
                    movType === 'resgate' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  - Resgate
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Qual investimento? *
                </label>
                <select
                  required
                  value={selectedAssetForMovement?.id || ''}
                  onChange={e => {
                    const found = assets.find(a => a.id === e.target.value);
                    setSelectedAssetForMovement(found || null);
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.institution})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex: 150.00"
                    value={movAmount}
                    onChange={e => setMovAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={movDate}
                    onChange={e => setMovDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rendimento referente a maio..."
                  value={movNotes}
                  onChange={e => setMovNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="syncMonthlyCheck"
                  checked={syncMonthly}
                  onChange={e => setSyncMonthly(e.target.checked)}
                  className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="syncMonthlyCheck" className="text-xs text-slate-700 cursor-pointer leading-snug">
                  <strong>Criar lançamento automático no mês</strong>
                  <span className="block text-[10px] text-slate-400">
                    {movType === 'aporte'
                      ? 'Lança como "Aporte & Investimento" na aba do mês para você controlar quanto guardou.'
                      : movType === 'rendimento'
                      ? 'Lança como receita de "Rendimento" na aba do mês.'
                      : 'Não cria lançamento de despesa, apenas ajusta o saldo.'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
