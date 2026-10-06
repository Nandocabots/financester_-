import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Category, Transaction, PaymentMethod, FinancialGoal, InvestmentAsset, InvestmentMovement } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DBData {
  users: (User & { passwordHash: string })[];
  categories: Category[];
  transactions: Transaction[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
  goals?: FinancialGoal[];
  investmentAssets?: InvestmentAsset[];
  investmentMovements?: InvestmentMovement[];
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-salario',
    name: 'Salário',
    type: 'receita',
    color: '#86EFAC',
    icon: 'DollarSign',
    isDefault: true,
    subcategories: ['Salário Principal', 'Adiantamento', '13º Salário', 'Férias', 'Bônus']
  },
  {
    id: 'cat-extra',
    name: 'Renda Extra',
    type: 'receita',
    color: '#99F6E4',
    icon: 'TrendingUp',
    isDefault: true,
    subcategories: ['Consultoria & Freela', 'Vendas & Desapegos', 'Reembolsos', 'Outros']
  },
  {
    id: 'cat-rendimentos',
    name: 'Rendimentos & Dividendos',
    type: 'receita',
    color: '#93C5FD',
    icon: 'Coins',
    isDefault: true,
    subcategories: ['Dividendos', 'JCP', 'Rendimento CDI/Selic']
  },
  {
    id: 'cat-alimentacao',
    name: 'Alimentação',
    type: 'despesa',
    color: '#FCA5A5',
    icon: 'ShoppingCart',
    isDefault: true,
    monthlyBudget: 1500,
    subcategories: ['Supermercado', 'Restaurantes & Bares', 'Delivery (iFood)', 'Padaria & Café', 'Lanches & Confeitaria']
  },
  {
    id: 'cat-moradia',
    name: 'Moradia (Aluguel/Contas)',
    type: 'despesa',
    color: '#FED7AA',
    icon: 'Home',
    isDefault: true,
    monthlyBudget: 2200,
    subcategories: ['Aluguel / Financiamento', 'Condomínio', 'Energia Elétrica', 'Água & Gás', 'Internet & TV', 'Manutenção & Móveis']
  },
  {
    id: 'cat-transporte',
    name: 'Transporte & Combustível',
    type: 'despesa',
    color: '#BAE6FD',
    icon: 'Car',
    isDefault: true,
    monthlyBudget: 600,
    subcategories: ['Combustível', 'Aplicativo (Uber/99)', 'Estacionamento & Pedágio', 'Manutenção & Seguro', 'Passagens Aéreas']
  },
  {
    id: 'cat-saude',
    name: 'Saúde & Farmácia',
    type: 'despesa',
    color: '#FBCFE8',
    icon: 'Activity',
    isDefault: true,
    monthlyBudget: 400,
    subcategories: ['Farmácia & Medicamentos', 'Consultas & Terapia', 'Exames', 'Plano de Saúde', 'Academia & Esportes']
  },
  {
    id: 'cat-lazer',
    name: 'Lazer & Viagens',
    type: 'despesa',
    color: '#D8B4FE',
    icon: 'Smile',
    isDefault: true,
    monthlyBudget: 600,
    subcategories: ['Cinema & Eventos', 'Bares & Choperias', 'Viagens & Hospedagem', 'Festas & Passeios']
  },
  {
    id: 'cat-educacao',
    name: 'Educação',
    type: 'despesa',
    color: '#C7D2FE',
    icon: 'BookOpen',
    isDefault: true,
    monthlyBudget: 500,
    subcategories: ['Cursos & Treinamentos', 'Livros', 'Mensalidades Escola/Faculdade']
  },
  {
    id: 'cat-assinaturas',
    name: 'Assinaturas & Serviços',
    type: 'despesa',
    color: '#A7F3D0',
    icon: 'Tv',
    isDefault: true,
    monthlyBudget: 250,
    subcategories: ['Streaming (Netflix/Spotify)', 'Pets (Planopet/Ração)', 'Software & Nuvem', 'Telefonia Móvel']
  },
  {
    id: 'cat-vestuario',
    name: 'Vestuário',
    type: 'despesa',
    color: '#FDA4AF',
    icon: 'ShoppingBag',
    isDefault: true,
    monthlyBudget: 350,
    subcategories: ['Roupas & Moda', 'Calçados', 'Acessórios & Cosméticos', 'Salão & Beleza']
  },
  {
    id: 'cat-outros',
    name: 'Outros Gastos',
    type: 'despesa',
    color: '#CBD5E1',
    icon: 'MoreHorizontal',
    isDefault: true,
    monthlyBudget: 400,
    subcategories: ['Presentes', 'Taxas Bancárias & Impostos', 'Diversos']
  },
];

function ensureDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateInitialSeed(): DBData {
  const masterPasswordHash = bcrypt.hashSync('1705', 10);
  
  const masterUser = {
    id: 'usr-fernanda',
    name: 'Fernanda Botelho',
    username: 'fernanda.botelho',
    role: 'master' as const,
    passwordHash: masterPasswordHash,
    createdAt: new Date().toISOString(),
  };

  const sampleUser = {
    id: 'usr-preenchedor',
    name: 'Assistente Financeiro',
    username: 'assistente',
    role: 'preenchedor' as const,
    passwordHash: bcrypt.hashSync('123456', 10),
    createdAt: new Date().toISOString(),
  };

  const initialTransactions: Transaction[] = [];

  const initialGoals: FinancialGoal[] = [
    {
      id: 'goal-reserva',
      title: 'Reserva de Emergência (6 Meses)',
      targetAmount: 25000,
      currentAmount: 0,
      deadline: '2026-12-31',
      color: '#10B981',
      icon: 'ShieldCheck',
      category: 'Segurança',
      createdAt: new Date().toISOString(),
      notes: 'Manter aplicado em CDB com liquidez diária 100% CDI'
    },
    {
      id: 'goal-viagem',
      title: 'Viagem de Férias & Lazer',
      targetAmount: 8000,
      currentAmount: 0,
      deadline: '2026-11-20',
      color: '#EC4899',
      icon: 'Plane',
      category: 'Sonhos',
      createdAt: new Date().toISOString(),
      notes: 'Passagens e hospedagem de fim de ano'
    },
    {
      id: 'goal-investimentos',
      title: 'Aporte de Longo Prazo',
      targetAmount: 15000,
      currentAmount: 0,
      deadline: '2027-06-30',
      color: '#8B5CF6',
      icon: 'TrendingUp',
      category: 'Patrimônio',
      createdAt: new Date().toISOString(),
      notes: 'Fundos imobiliários e renda fixa'
    }
  ];

  return {
    users: [masterUser, sampleUser],
    categories: DEFAULT_CATEGORIES,
    transactions: initialTransactions,
    sessions: {},
    goals: initialGoals,
    investmentAssets: STARTER_INVESTMENT_ASSETS,
    investmentMovements: STARTER_INVESTMENT_MOVEMENTS,
  };
}

const STARTER_INVESTMENT_ASSETS: InvestmentAsset[] = [
  {
    id: 'asset-cdb-inter',
    name: 'Reserva de Emergência - CDB 100% CDI',
    institution: 'Banco Inter / Nubank',
    category: 'reserva',
    investedAmount: 0,
    currentValue: 0,
    targetAllocationPercent: 50,
    color: '#34D399',
    notes: 'Liquidez diária (D+0). Reserva para imprevistos e emergências.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asset-tesouro-selic',
    name: 'Tesouro Selic 2029',
    institution: 'Tesouro Direto',
    category: 'renda_fixa',
    investedAmount: 0,
    currentValue: 0,
    targetAllocationPercent: 30,
    color: '#60A5FA',
    notes: 'Investimento mais seguro do país. 100% garantido pelo Tesouro.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asset-fii-mxrf11',
    name: 'Fundo Imobiliário MXRF11',
    institution: 'NuInvest / XP',
    category: 'fundos_imobiliarios',
    investedAmount: 0,
    currentValue: 0,
    targetAllocationPercent: 20,
    color: '#C084FC',
    notes: 'Paga rendimentos todo mês isentos de Imposto de Renda.',
    createdAt: new Date().toISOString(),
  },
];

const STARTER_INVESTMENT_MOVEMENTS: InvestmentMovement[] = [];

export class DB {
  private static readData(): DBData {
    ensureDirExists();
    if (!fs.existsSync(DB_FILE)) {
      const initial = generateInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: DBData = JSON.parse(raw);
      if (!parsed.goals || parsed.goals.length === 0) {
        parsed.goals = [
          {
            id: 'goal-reserva',
            title: 'Reserva de Emergência (6 Meses)',
            targetAmount: 25000,
            currentAmount: 14500,
            deadline: '2026-12-31',
            color: '#10B981',
            icon: 'ShieldCheck',
            category: 'Segurança',
            createdAt: new Date().toISOString(),
            notes: 'Manter aplicado em CDB com liquidez diária 100% CDI'
          },
          {
            id: 'goal-viagem',
            title: 'Viagem de Férias & Lazer',
            targetAmount: 8000,
            currentAmount: 3200,
            deadline: '2026-11-20',
            color: '#EC4899',
            icon: 'Plane',
            category: 'Sonhos',
            createdAt: new Date().toISOString(),
            notes: 'Passagens e hospedagem de fim de ano'
          },
          {
            id: 'goal-investimentos',
            title: 'Aporte de Longo Prazo',
            targetAmount: 15000,
            currentAmount: 7000,
            deadline: '2027-06-30',
            color: '#8B5CF6',
            icon: 'TrendingUp',
            category: 'Patrimônio',
            createdAt: new Date().toISOString(),
            notes: 'Fundos imobiliários e renda fixa'
          }
        ];
      }
      if (!parsed.investmentAssets || parsed.investmentAssets.length === 0) {
        parsed.investmentAssets = STARTER_INVESTMENT_ASSETS;
      }
      if (!parsed.investmentMovements || parsed.investmentMovements.length === 0) {
        parsed.investmentMovements = STARTER_INVESTMENT_MOVEMENTS;
      }
      // Ensure investment categories exist
      if (!parsed.categories.some(c => c.id === 'cat-investimentos')) {
        parsed.categories.push({ id: 'cat-investimentos', name: 'Aportes & Investimentos', type: 'despesa', color: '#6EE7B7', icon: 'TrendingUp', isDefault: true, monthlyBudget: 800 });
      }
      if (!parsed.categories.some(c => c.id === 'cat-rendimentos')) {
        parsed.categories.push({ id: 'cat-rendimentos', name: 'Rendimentos & Dividendos', type: 'receita', color: '#93C5FD', icon: 'Coins', isDefault: true });
      }
      parsed.categories.forEach(cat => {
        if (cat.type === 'despesa' && (cat.monthlyBudget === undefined || cat.monthlyBudget === 0)) {
          const matchDefault = DEFAULT_CATEGORIES.find(d => d.id === cat.id);
          cat.monthlyBudget = matchDefault?.monthlyBudget || 500;
        }
        if (!cat.subcategories || cat.subcategories.length === 0) {
          const matchDefault = DEFAULT_CATEGORIES.find(d => d.id === cat.id);
          cat.subcategories = matchDefault?.subcategories ? [...matchDefault.subcategories] : [];
        }
      });

      // Migrate existing transactions that have "Parcela X/Y" in the title to real card installments
      let hasMigrated = false;
      parsed.transactions.forEach(t => {
        if (!t.isInstallment && t.title) {
          const m = t.title.match(/^(.*?)\s*-\s*Parcela\s*(\d+)\/(\d+)/i) || t.title.match(/^(.*?)\s*\((\d+)\/(\d+)\)/i);
          if (m) {
            t.isInstallment = true;
            t.installmentCurrent = parseInt(m[2], 10);
            t.installmentTotal = parseInt(m[3], 10);
            t.installmentSeriesId = t.installmentSeriesId || `series-auto-${m[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '')}-${m[3]}`;
            t.title = m[1].trim();
            t.paymentMethod = 'crédito';
            hasMigrated = true;
          }
        }
      });

      if (hasMigrated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }

      return parsed;
    } catch (e) {
      console.error('Error reading DB, re-seeding:', e);
      const initial = generateInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }

  private static writeData(data: DBData): void {
    ensureDirExists();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // --- Users ---
  static getUsers(): User[] {
    const data = this.readData();
    return data.users.map(({ passwordHash, ...user }) => user);
  }

  static getUserByUsername(username: string) {
    const data = this.readData();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  static getUserById(id: string) {
    const data = this.readData();
    const user = data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static createUser(user: Omit<User, 'id' | 'createdAt'> & { password?: string }) {
    const data = this.readData();
    const existing = data.users.find(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (existing) {
      throw new Error('Nome de usuário já está em uso.');
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: user.name,
      username: user.username,
      role: user.role,
      passwordHash: bcrypt.hashSync(user.password || '123456', 10),
      createdAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    this.writeData(data);
    const { passwordHash, ...safe } = newUser;
    return safe;
  }

  static updateUser(id: string, updates: Partial<User> & { password?: string }) {
    const data = this.readData();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado.');

    if (updates.username) {
      const duplicate = data.users.find(u => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase());
      if (duplicate) throw new Error('Outro usuário já utiliza este nome de usuário.');
      data.users[idx].username = updates.username;
    }

    if (updates.name) data.users[idx].name = updates.name;
    if (updates.role) data.users[idx].role = updates.role;
    if (updates.password && updates.password.trim().length > 0) {
      data.users[idx].passwordHash = bcrypt.hashSync(updates.password, 10);
    }

    this.writeData(data);
    const { passwordHash, ...safe } = data.users[idx];
    return safe;
  }

  static deleteUser(id: string) {
    const data = this.readData();
    const userToDelete = data.users.find(u => u.id === id);
    if (!userToDelete) throw new Error('Usuário não encontrado.');
    if (userToDelete.username === 'fernanda.botelho') {
      throw new Error('Não é possível excluir o usuário master principal.');
    }
    data.users = data.users.filter(u => u.id !== id);
    this.writeData(data);
    return true;
  }

  // --- Auth & Sessions ---
  static createSession(userId: string): string {
    const data = this.readData();
    const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    data.sessions[token] = { userId, expiresAt };
    this.writeData(data);
    return token;
  }

  static getUserByToken(token: string) {
    const data = this.readData();
    const session = data.sessions[token];
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    return this.getUserById(session.userId);
  }

  // --- Categories ---
  static getCategories(): Category[] {
    const data = this.readData();
    return data.categories;
  }

  static createCategory(cat: Omit<Category, 'id'>): Category {
    const data = this.readData();
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    data.categories.push(newCat);
    this.writeData(data);
    return newCat;
  }

  static updateCategory(id: string, updates: Partial<Category>): Category {
    const data = this.readData();
    const idx = data.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada.');
    data.categories[idx] = { ...data.categories[idx], ...updates };
    this.writeData(data);
    return data.categories[idx];
  }

  static deleteCategory(id: string) {
    const data = this.readData();
    const cat = data.categories.find(c => c.id === id);
    if (cat?.isDefault) {
      throw new Error('Categorias padrão do sistema não podem ser removidas.');
    }
    data.categories = data.categories.filter(c => c.id !== id);
    this.writeData(data);
    return true;
  }

  static addSubcategory(categoryId: string, subcategoryName: string): Category {
    const data = this.readData();
    const idx = data.categories.findIndex(c => c.id === categoryId);
    if (idx === -1) throw new Error('Categoria não encontrada.');
    const cat = data.categories[idx];
    cat.subcategories = cat.subcategories || [];
    const trimmed = subcategoryName.trim();
    if (!trimmed) throw new Error('Nome da subcategoria não pode ser vazio.');
    if (!cat.subcategories.includes(trimmed)) {
      cat.subcategories.push(trimmed);
      this.writeData(data);
    }
    return cat;
  }

  static removeSubcategory(categoryId: string, subcategoryName: string): Category {
    const data = this.readData();
    const idx = data.categories.findIndex(c => c.id === categoryId);
    if (idx === -1) throw new Error('Categoria não encontrada.');
    const cat = data.categories[idx];
    cat.subcategories = (cat.subcategories || []).filter(s => s !== subcategoryName);
    this.writeData(data);
    return cat;
  }

  // --- Transactions & Installments ---
  static getTransactions(filter?: {
    monthYear?: string;
    year?: number;
    type?: string;
    paymentMethod?: string;
    categoryId?: string;
  }): Transaction[] {
    const data = this.readData();

    // Auto-generate recurring (Gasto Fixo) entries for requested monthYear if not already present
    if (filter && filter.monthYear) {
      const targetMY = filter.monthYear;
      let hasChanges = false;

      // Find all recurring groups created prior to or equal to targetMY
      const recurringMap = new Map<string, Transaction[]>();
      data.transactions.forEach(t => {
        if (t.isRecurring && t.recurringGroupId && t.monthYear <= targetMY) {
          if (!recurringMap.has(t.recurringGroupId)) {
            recurringMap.set(t.recurringGroupId, []);
          }
          recurringMap.get(t.recurringGroupId)!.push(t);
        }
      });

      recurringMap.forEach((groupTxs, groupId) => {
        const alreadyInTarget = groupTxs.some(t => t.monthYear === targetMY);
        if (!alreadyInTarget) {
          // Sort by monthYear descending to get the latest settings
          groupTxs.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
          const latest = groupTxs[0];

          const day = latest.date.split('-')[2] || '05';
          const newDate = `${targetMY}-${day}`;

          const autoRecurringTx: Transaction = {
            id: `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: latest.title,
            amount: latest.amount,
            type: latest.type,
            categoryId: latest.categoryId,
            paymentMethod: latest.paymentMethod,
            date: newDate,
            monthYear: targetMY,
            status: 'pendente', // Default to pending for future months
            notes: latest.notes ? `${latest.notes} (Gasto Fixo)` : 'Gasto Fixo Automático',
            isRecurring: true,
            recurringGroupId: groupId,
            createdById: latest.createdById,
          };

          data.transactions.push(autoRecurringTx);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.writeData(data);
      }
    }

    let result = data.transactions;

    if (filter) {
      if (filter.monthYear) {
        result = result.filter(t => t.monthYear === filter.monthYear);
      } else if (filter.year) {
        result = result.filter(t => t.monthYear.startsWith(`${filter.year}-`));
      }

      if (filter.type) {
        result = result.filter(t => t.type === filter.type);
      }

      if (filter.paymentMethod) {
        result = result.filter(t => t.paymentMethod === filter.paymentMethod);
      }

      if (filter.categoryId) {
        result = result.filter(t => t.categoryId === filter.categoryId);
      }
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static createTransaction(payload: {
    title: string;
    amount: number;
    type: 'receita' | 'despesa';
    categoryId: string;
    paymentMethod: PaymentMethod;
    date: string; // YYYY-MM-DD
    status?: 'pago' | 'pendente';
    notes?: string;
    isInstallment?: boolean;
    installmentTotal?: number; // Number of installments (e.g., 10)
    isRecurring?: boolean;
    createdById?: string;
  }): Transaction[] {
    const data = this.readData();
    const created: Transaction[] = [];

    const baseDate = new Date(payload.date + 'T12:00:00Z');
    const isInstallment = !!(payload.isInstallment && payload.installmentTotal && payload.installmentTotal > 1);
    const isRecurring = !!payload.isRecurring;

    if (!isInstallment) {
      const monthYear = payload.date.substring(0, 7);
      const recurringGroupId = isRecurring ? `recgroup-${Date.now()}` : undefined;

      const single: Transaction = {
        id: `tx-${Date.now()}`,
        title: payload.title,
        amount: payload.amount,
        type: payload.type,
        categoryId: payload.categoryId,
        paymentMethod: payload.paymentMethod,
        date: payload.date,
        monthYear,
        status: payload.status || 'pago',
        notes: payload.notes,
        isRecurring,
        recurringGroupId,
        createdById: payload.createdById,
      };
      data.transactions.push(single);
      created.push(single);
    } else {
      const totalCount = payload.installmentTotal!;
      const totalAmount = payload.amount;
      const installmentAmount = Math.round((totalAmount / totalCount) * 100) / 100;
      const seriesId = `series-${Date.now()}`;

      for (let i = 1; i <= totalCount; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setMonth(baseDate.getMonth() + (i - 1));

        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const monthYear = `${yyyy}-${mm}`;

        const installmentTx: Transaction = {
          id: `tx-${Date.now()}-${i}`,
          title: `${payload.title} (${i}/${totalCount})`,
          amount: installmentAmount,
          type: payload.type,
          categoryId: payload.categoryId,
          paymentMethod: payload.paymentMethod,
          date: dateStr,
          monthYear,
          status: i === 1 ? (payload.status || 'pago') : 'pendente',
          notes: payload.notes ? `${payload.notes} - Parcela ${i} de ${totalCount}` : `Compra parcelada: ${i}/${totalCount}`,
          isInstallment: true,
          installmentSeriesId: seriesId,
          installmentCurrent: i,
          installmentTotal: totalCount,
          totalPurchaseAmount: totalAmount,
          createdById: payload.createdById,
        };

        data.transactions.push(installmentTx);
        created.push(installmentTx);
      }
    }

    this.writeData(data);
    return created;
  }

  static updateTransaction(id: string, updates: Partial<Transaction> & { updateFutureMonths?: boolean }) {
    const data = this.readData();
    const idx = data.transactions.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Lançamento não encontrado.');

    const targetTx = data.transactions[idx];

    if (updates.date) {
      updates.monthYear = updates.date.substring(0, 7);
    }

    // Apply updates to current transaction
    const { updateFutureMonths, ...fieldsToUpdate } = updates;

    // If user marks isRecurring on an existing transaction that didn't have recurringGroupId:
    if (fieldsToUpdate.isRecurring && !targetTx.recurringGroupId) {
      const newGroupId = `recgroup-${Date.now()}`;
      fieldsToUpdate.recurringGroupId = newGroupId;
      targetTx.recurringGroupId = newGroupId;
    }

    data.transactions[idx] = { ...data.transactions[idx], ...fieldsToUpdate };

    // If it's a recurring expense and updateFutureMonths is requested (or default for recurring amount changes)
    if (targetTx.isRecurring && targetTx.recurringGroupId && (updateFutureMonths !== false)) {
      const recGroupId = targetTx.recurringGroupId;
      const currentMY = targetTx.monthYear;

      data.transactions.forEach((t, i) => {
        if (t.recurringGroupId === recGroupId && t.monthYear > currentMY) {
          if (fieldsToUpdate.amount !== undefined) data.transactions[i].amount = fieldsToUpdate.amount;
          if (fieldsToUpdate.title !== undefined) data.transactions[i].title = fieldsToUpdate.title;
          if (fieldsToUpdate.categoryId !== undefined) data.transactions[i].categoryId = fieldsToUpdate.categoryId;
          if (fieldsToUpdate.paymentMethod !== undefined) data.transactions[i].paymentMethod = fieldsToUpdate.paymentMethod;
        }
      });
    }

    this.writeData(data);
    return data.transactions[idx];
  }

  static deleteTransaction(id: string, deleteSeries = false) {
    const data = this.readData();
    const tx = data.transactions.find(t => t.id === id);
    if (!tx) throw new Error('Lançamento não encontrado.');

    if (deleteSeries && tx.installmentSeriesId) {
      data.transactions = data.transactions.filter(t => t.installmentSeriesId !== tx.installmentSeriesId);
    } else if (deleteSeries && tx.recurringGroupId) {
      // Delete all future recurring instances
      data.transactions = data.transactions.filter(t => !(t.recurringGroupId === tx.recurringGroupId && t.monthYear >= tx.monthYear));
    } else {
      data.transactions = data.transactions.filter(t => t.id !== id);
    }

    this.writeData(data);
    return true;
  }

  static createTransactionsBatch(
    items: Array<{
      title: string;
      amount: number;
      type: 'receita' | 'despesa';
      categoryId: string;
      subcategory?: string;
      paymentMethod: PaymentMethod;
      date: string;
      status?: 'pago' | 'pendente';
      notes?: string;
      createdById?: string;
      isInstallment?: boolean;
      installmentCurrent?: number;
      installmentTotal?: number;
    }>,
    userId?: string
  ): Transaction[] {
    const data = this.readData();
    const createdList: Transaction[] = [];

    items.forEach((item, index) => {
      const monthYear = item.date ? item.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      
      let title = item.title;
      let isInstallment = !!item.isInstallment;
      let installmentCurrent = item.installmentCurrent;
      let installmentTotal = item.installmentTotal;

      const m = title.match(/^(.*?)\s*-\s*Parcela\s*(\d+)\/(\d+)/i) || title.match(/^(.*?)\s*\((\d+)\/(\d+)\)/i);
      if (m) {
        title = m[1].trim();
        isInstallment = true;
        installmentCurrent = parseInt(m[2], 10);
        installmentTotal = parseInt(m[3], 10);
      }

      const tx: Transaction = {
        id: `tx-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        amount: Math.abs(Number(item.amount)),
        type: item.type,
        categoryId: item.categoryId || 'cat-outros',
        subcategory: item.subcategory,
        paymentMethod: isInstallment ? 'crédito' : (item.paymentMethod || 'crédito'),
        date: item.date,
        monthYear,
        status: item.status || 'pago',
        notes: item.notes || (isInstallment ? `Parcela ${installmentCurrent} de ${installmentTotal}` : 'Importado via Extrato/Fatura'),
        isInstallment,
        installmentCurrent,
        installmentTotal,
        installmentSeriesId: isInstallment ? `series-auto-${title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${installmentTotal}` : undefined,
        createdById: userId || item.createdById || 'usr-fernanda',
      };
      data.transactions.push(tx);
      createdList.push(tx);
    });

    this.writeData(data);
    return createdList;
  }

  static clearAllTransactions(): boolean {
    const data = this.readData();
    data.transactions = [];
    this.writeData(data);
    return true;
  }

  // --- Monthly Balance Rollover / Carryover ---
  static getAccumulatedBalance(targetMonthYear: string): {
    targetMonthYear: string;
    previousMonthYear: string;
    previousBalance: number;
    currentIncome: number;
    currentExpense: number;
    currentNet: number;
    accumulatedBalance: number;
  } {
    const data = this.readData();

    // Past transactions prior to targetMonthYear
    const pastTx = data.transactions.filter(t => t.monthYear < targetMonthYear);
    const pastIncome = pastTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
    const pastExpense = pastTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
    const previousBalance = Math.round((pastIncome - pastExpense) * 100) / 100;

    // Current month transactions
    const currentTx = data.transactions.filter(t => t.monthYear === targetMonthYear);
    const currentIncome = Math.round(currentTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const currentExpense = Math.round(currentTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const currentNet = Math.round((currentIncome - currentExpense) * 100) / 100;
    const accumulatedBalance = Math.round((previousBalance + currentNet) * 100) / 100;

    const [y, m] = targetMonthYear.split('-').map(Number);
    const pDate = new Date(y, m - 2, 1);
    const previousMonthYear = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;

    return {
      targetMonthYear,
      previousMonthYear,
      previousBalance,
      currentIncome,
      currentExpense,
      currentNet,
      accumulatedBalance,
    };
  }

  // --- Recurring / Gastos Fixos Management ---
  static getRecurringGroups() {
    const data = this.readData();
    const map = new Map<string, Transaction[]>();

    data.transactions.forEach(t => {
      if (t.recurringGroupId) {
        if (!map.has(t.recurringGroupId)) {
          map.set(t.recurringGroupId, []);
        }
        map.get(t.recurringGroupId)!.push(t);
      }
    });

    const groups: {
      recurringGroupId: string;
      latestTx: Transaction;
      categoryName?: string;
      categoryColor?: string;
      monthsCount: number;
      isCurrentlyActive: boolean;
      allMonthYears: string[];
    }[] = [];

    map.forEach((txs, groupId) => {
      txs.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
      const latestTx = txs[0];
      const category = data.categories.find(c => c.id === latestTx.categoryId);

      groups.push({
        recurringGroupId: groupId,
        latestTx,
        categoryName: category?.name,
        categoryColor: category?.color,
        monthsCount: txs.length,
        isCurrentlyActive: !!latestTx.isRecurring,
        allMonthYears: txs.map(t => t.monthYear),
      });
    });

    return groups.sort((a, b) => b.latestTx.monthYear.localeCompare(a.latestTx.monthYear));
  }

  static stopRecurringGroup(recurringGroupId: string, fromMonthYear: string) {
    const data = this.readData();
    
    // Find all transactions in this group
    data.transactions.forEach((t, i) => {
      if (t.recurringGroupId === recurringGroupId) {
        if (t.monthYear >= fromMonthYear) {
          data.transactions[i].isRecurring = false;
        }
      }
    });

    // Also delete any future pending auto-generated instances strictly after fromMonthYear
    data.transactions = data.transactions.filter(t => {
      if (t.recurringGroupId === recurringGroupId && t.monthYear > fromMonthYear && t.status === 'pendente') {
        return false;
      }
      return true;
    });

    this.writeData(data);
    return true;
  }

  static updateRecurringAmountGroup(recurringGroupId: string, newAmount: number, fromMonthYear: string) {
    const data = this.readData();

    data.transactions.forEach((t, i) => {
      if (t.recurringGroupId === recurringGroupId && t.monthYear >= fromMonthYear) {
        data.transactions[i].amount = newAmount;
      }
    });

    this.writeData(data);
    return true;
  }

  // --- Category Averages & Net Income Projections ---
  static getCategoryAverages(targetMonthYear: string) {
    const data = this.readData();
    
    // Find all distinct months in history prior to targetMonthYear
    const pastTransactions = data.transactions.filter(t => t.type === 'despesa' && t.monthYear < targetMonthYear);
    const monthsSet = new Set(pastTransactions.map(t => t.monthYear));
    const totalMonths = Math.max(1, monthsSet.size);

    // Current month logged despesas
    const currentMonthExpenses = data.transactions.filter(t => t.type === 'despesa' && t.monthYear === targetMonthYear);

    const expenseCategories = data.categories.filter(c => c.type === 'despesa');

    const result = expenseCategories.map(cat => {
      const totalSpentHistorical = pastTransactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyAverage = Math.round((totalSpentHistorical / totalMonths) * 100) / 100;

      const currentMonthActual = currentMonthExpenses
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      // If user has NOT logged anything in this category yet for the current month, we project the average.
      // If user HAS logged expenses in this category, we use actual spend or remaining delta.
      const projectedRemaining = currentMonthActual > 0 ? 0 : monthlyAverage;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        color: cat.color,
        monthlyAverage,
        monthsAnalyzed: totalMonths,
        totalSpent: totalSpentHistorical,
        currentMonthActual,
        projectedRemaining,
      };
    });

    return result;
  }

  static getProjectedSalaryAnalysis(monthYear: string) {
    const data = this.readData();

    // Incomes for target month
    const incomes = data.transactions.filter(t => t.type === 'receita' && t.monthYear === monthYear);
    const salaryIncomeTx = incomes.find(t => t.categoryId === 'cat-salario');
    const baseSalary = salaryIncomeTx ? salaryIncomeTx.amount : 6500; // Default baseline if not yet logged
    const actualIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

    // Expenses logged so far in target month
    const loggedExpenses = data.transactions.filter(t => t.type === 'despesa' && t.monthYear === monthYear);
    const actualExpensesLogged = loggedExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Categories that have NO logged expenses yet this month get average expense applied
    const catAverages = this.getCategoryAverages(monthYear);
    const loggedCatIds = new Set(loggedExpenses.map(t => t.categoryId));

    let projectedUnfulfilledExpenses = 0;
    catAverages.forEach(ca => {
      if (!loggedCatIds.has(ca.categoryId)) {
        projectedUnfulfilledExpenses += ca.monthlyAverage;
      }
    });

    // Active installments for this month
    const activeInstallments = loggedExpenses.filter(t => t.isInstallment);
    const activeInstallmentsAmount = activeInstallments.reduce((sum, t) => sum + t.amount, 0);

    // Estimated Net Income = Total Income (logged or baseline salary) - (Actual Logged Expenses + Projected Unfulfilled Averages)
    const effectiveIncome = actualIncome > 0 ? actualIncome : baseSalary;
    const estimatedNetSalary = Math.round((effectiveIncome - (actualExpensesLogged + projectedUnfulfilledExpenses)) * 100) / 100;

    return {
      baseSalary,
      actualIncome: effectiveIncome,
      actualExpensesLogged,
      activeInstallmentsAmount,
      projectedUnfulfilledExpenses: Math.round(projectedUnfulfilledExpenses * 100) / 100,
      estimatedNetSalary,
      updatedBalanceText: loggedExpenses.length > 0
        ? `Atualizado com base em ${loggedExpenses.length} lançamentos deste mês + média das demais categorias`
        : `Projeção inicial baseada na média histórica das suas categorias`,
    };
  }

  // --- Annual Dashboard ---
  static getAnnualDashboard(year: number) {
    const data = this.readData();
    const yearPrefix = `${year}-`;

    const yearTransactions = data.transactions.filter(t => t.monthYear.startsWith(yearPrefix));

    let totalAnnualIncome = 0;
    let totalAnnualExpense = 0;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthlyBreakdown = monthNames.map((mName, idx) => {
      const mStr = `${year}-${String(idx + 1).padStart(2, '0')}`;
      const mTx = yearTransactions.filter(t => t.monthYear === mStr);

      const income = mTx.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
      const expense = mTx.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;

      totalAnnualIncome += income;
      totalAnnualExpense += expense;

      return {
        monthYear: mStr,
        monthName: mName,
        income,
        expense,
        net,
      };
    });

    const totalAnnualSavings = totalAnnualIncome - totalAnnualExpense;
    const averageMonthlyExpense = Math.round((totalAnnualExpense / 12) * 100) / 100;

    // Payment methods total & monthly breakdown for Expenses
    const paymentMethods: PaymentMethod[] = ['crédito', 'débito', 'pix', 'ticket', 'dinheiro', 'transferência'];
    const paymentMethodTotals: Record<PaymentMethod, number> = {
      'crédito': 0, 'débito': 0, 'pix': 0, 'ticket': 0, 'dinheiro': 0, 'transferência': 0
    };
    const paymentMethodMonthly: Record<PaymentMethod, Record<string, number>> = {
      'crédito': {}, 'débito': {}, 'pix': {}, 'ticket': {}, 'dinheiro': {}, 'transferência': {}
    };

    paymentMethods.forEach(pm => {
      monthlyBreakdown.forEach(m => {
        paymentMethodMonthly[pm][m.monthYear] = 0;
      });
    });

    yearTransactions.filter(t => t.type === 'despesa').forEach(t => {
      if (paymentMethodTotals[t.paymentMethod] !== undefined) {
        paymentMethodTotals[t.paymentMethod] += t.amount;
        paymentMethodMonthly[t.paymentMethod][t.monthYear] = (paymentMethodMonthly[t.paymentMethod][t.monthYear] || 0) + t.amount;
      }
    });

    // Category distribution for expenses
    const categoryTotalsMap: Record<string, number> = {};
    yearTransactions.filter(t => t.type === 'despesa').forEach(t => {
      categoryTotalsMap[t.categoryId] = (categoryTotalsMap[t.categoryId] || 0) + t.amount;
    });

    const categoryTotals = data.categories
      .filter(c => c.type === 'despesa')
      .map(c => {
        const amount = categoryTotalsMap[c.id] || 0;
        const percentage = totalAnnualExpense > 0 ? Math.round((amount / totalAnnualExpense) * 1000) / 10 : 0;
        return {
          categoryId: c.id,
          categoryName: c.name,
          color: c.color,
          amount,
          percentage,
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Calculate 6 consecutive months ending at selected year/current month
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;

    let endYear = year;
    let endMonth = 12;

    if (year === currentYear) {
      endYear = year;
      endMonth = currentMonthNum;
    } else if (year > currentYear) {
      endYear = year;
      endMonth = 6;
    } else {
      endYear = year;
      endMonth = 12;
    }

    const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      let m = endMonth - i;
      let y = endYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const mStr = `${y}-${String(m).padStart(2, '0')}`;
      const mTx = data.transactions.filter(t => t.monthYear === mStr);

      const expense = mTx.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
      const income = mTx.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;

      last6Months.push({
        monthYear: mStr,
        monthName: `${monthNames[m - 1]} de ${y}`,
        shortName: `${shortNames[m - 1]}/${String(y).slice(2)}`,
        expense,
        income,
        net,
      });
    }

    // Previous Year Comparison (Year vs Year - 1)
    const prevYear = year - 1;
    const prevYearPrefix = `${prevYear}-`;
    const prevYearTransactions = data.transactions.filter(t => t.monthYear.startsWith(prevYearPrefix));
    const prevTotalIncome = prevYearTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const prevTotalExpense = prevYearTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const prevTotalSavings = prevTotalIncome - prevTotalExpense;

    const monthlyExpensesByMonthIndex = monthNames.map((_, idx) => {
      const mStr = `${prevYear}-${String(idx + 1).padStart(2, '0')}`;
      return prevYearTransactions
        .filter(t => t.monthYear === mStr && t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const previousYearComparison = {
      year: prevYear,
      totalAnnualIncome: prevTotalIncome,
      totalAnnualExpense: prevTotalExpense,
      totalAnnualSavings: prevTotalSavings,
      monthlyExpensesByMonthIndex,
    };

    return {
      year,
      totalAnnualIncome,
      totalAnnualExpense,
      totalAnnualSavings,
      averageMonthlyExpense,
      monthlyBreakdown,
      paymentMethodTotals,
      paymentMethodMonthly,
      categoryTotals,
      last6Months,
      previousYearComparison,
    };
  }

  // --- Financial Goals (Caixinhas de Metas) ---
  static getGoals(): FinancialGoal[] {
    const data = this.readData();
    return data.goals || [];
  }

  static createGoal(goal: Omit<FinancialGoal, 'id' | 'createdAt'>): FinancialGoal {
    const data = this.readData();
    data.goals = data.goals || [];
    const newGoal: FinancialGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.goals.push(newGoal);
    this.writeData(data);
    return newGoal;
  }

  static updateGoal(id: string, updates: Partial<FinancialGoal>): FinancialGoal {
    const data = this.readData();
    data.goals = data.goals || [];
    const idx = data.goals.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Meta financeira não encontrada.');
    data.goals[idx] = { ...data.goals[idx], ...updates };
    this.writeData(data);
    return data.goals[idx];
  }

  static deleteGoal(id: string): boolean {
    const data = this.readData();
    data.goals = data.goals || [];
    data.goals = data.goals.filter(g => g.id !== id);
    this.writeData(data);
    return true;
  }

  static transactGoal(id: string, amount: number, type: 'deposit' | 'withdraw'): FinancialGoal {
    const data = this.readData();
    data.goals = data.goals || [];
    const idx = data.goals.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Meta financeira não encontrada.');
    
    const goal = data.goals[idx];
    if (type === 'deposit') {
      goal.currentAmount += Math.abs(amount);
    } else {
      goal.currentAmount = Math.max(0, goal.currentAmount - Math.abs(amount));
    }
    
    this.writeData(data);
    return goal;
  }

  // --- Investments (Ativos, Aportes & Rendimentos) ---
  static getInvestments(): { assets: InvestmentAsset[]; movements: InvestmentMovement[] } {
    const data = this.readData();
    return {
      assets: data.investmentAssets || [],
      movements: (data.investmentMovements || []).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }

  static createInvestmentAsset(asset: Omit<InvestmentAsset, 'id' | 'createdAt'>): InvestmentAsset {
    const data = this.readData();
    data.investmentAssets = data.investmentAssets || [];
    const newAsset: InvestmentAsset = {
      ...asset,
      id: `asset-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.investmentAssets.push(newAsset);
    this.writeData(data);
    return newAsset;
  }

  static updateInvestmentAsset(id: string, updates: Partial<InvestmentAsset>): InvestmentAsset {
    const data = this.readData();
    data.investmentAssets = data.investmentAssets || [];
    const idx = data.investmentAssets.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Ativo financeiro não encontrado.');
    data.investmentAssets[idx] = { ...data.investmentAssets[idx], ...updates };
    this.writeData(data);
    return data.investmentAssets[idx];
  }

  static deleteInvestmentAsset(id: string): boolean {
    const data = this.readData();
    data.investmentAssets = (data.investmentAssets || []).filter(a => a.id !== id);
    data.investmentMovements = (data.investmentMovements || []).filter(m => m.assetId !== id);
    this.writeData(data);
    return true;
  }

  static createInvestmentMovement(
    movement: Omit<InvestmentMovement, 'id'>,
    syncMonthly: boolean = false,
    userId: string = 'usr-fernanda'
  ): InvestmentMovement {
    const data = this.readData();
    data.investmentAssets = data.investmentAssets || [];
    data.investmentMovements = data.investmentMovements || [];

    const asset = data.investmentAssets.find(a => a.id === movement.assetId);
    if (!asset) throw new Error('Ativo financeiro vinculado não encontrado.');

    const newMovement: InvestmentMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
    };

    const amt = Math.abs(movement.amount);
    if (movement.type === 'aporte') {
      asset.investedAmount = (asset.investedAmount || 0) + amt;
      asset.currentValue = (asset.currentValue || 0) + amt;
    } else if (movement.type === 'rendimento') {
      asset.currentValue = (asset.currentValue || 0) + amt;
    } else if (movement.type === 'resgate') {
      asset.investedAmount = Math.max(0, (asset.investedAmount || 0) - amt);
      asset.currentValue = Math.max(0, (asset.currentValue || 0) - amt);
    }

    data.investmentMovements.push(newMovement);

    // Sync with monthly transactions if requested
    if (syncMonthly) {
      if (movement.type === 'aporte') {
        data.transactions.push({
          id: `tx-inv-${newMovement.id}`,
          title: `Aporte: ${asset.name}`,
          amount: amt,
          type: 'despesa',
          categoryId: 'cat-investimentos',
          paymentMethod: 'pix',
          date: movement.date,
          monthYear: movement.monthYear,
          status: 'pago',
          notes: `Aporte registrado em Investimentos (${asset.institution})`,
          createdById: userId,
        });
      } else if (movement.type === 'rendimento') {
        data.transactions.push({
          id: `tx-inv-${newMovement.id}`,
          title: `Rendimento: ${asset.name}`,
          amount: amt,
          type: 'receita',
          categoryId: 'cat-rendimentos',
          paymentMethod: 'transferência',
          date: movement.date,
          monthYear: movement.monthYear,
          status: 'pago',
          notes: `Proventos / Juros creditados (${asset.institution})`,
          createdById: userId,
        });
      }
    }

    this.writeData(data);
    return newMovement;
  }

  static deleteInvestmentMovement(id: string): boolean {
    const data = this.readData();
    data.investmentMovements = data.investmentMovements || [];
    const movIdx = data.investmentMovements.findIndex(m => m.id === id);
    if (movIdx === -1) throw new Error('Movimentação financeira não encontrada.');

    const mov = data.investmentMovements[movIdx];
    const asset = (data.investmentAssets || []).find(a => a.id === mov.assetId);
    if (asset) {
      const amt = Math.abs(mov.amount);
      if (mov.type === 'aporte') {
        asset.investedAmount = Math.max(0, (asset.investedAmount || 0) - amt);
        asset.currentValue = Math.max(0, (asset.currentValue || 0) - amt);
      } else if (mov.type === 'rendimento') {
        asset.currentValue = Math.max(0, (asset.currentValue || 0) - amt);
      } else if (mov.type === 'resgate') {
        asset.investedAmount = (asset.investedAmount || 0) + amt;
        asset.currentValue = (asset.currentValue || 0) + amt;
      }
    }

    // Delete synced monthly transaction if any
    data.transactions = data.transactions.filter(t => t.id !== `tx-inv-${id}`);

    data.investmentMovements.splice(movIdx, 1);
    this.writeData(data);
    return true;
  }

  // --- Export / Import Backup ---
  static exportData() {
    return this.readData();
  }

  static importData(data: DBData) {
    if (!data.users || !data.categories || !data.transactions) {
      throw new Error('Arquivo de backup inválido.');
    }
    this.writeData(data);
    return true;
  }
}
