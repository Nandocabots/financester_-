import {
  User,
  Category,
  Transaction,
  CategoryAverage,
  ProjectedSalaryAnalysis,
  AnnualDashboardData,
  PaymentMethod,
  FinancialGoal,
  InvestmentAsset,
  InvestmentMovement,
  InvestmentDataResponse
} from '../types';

const TOKEN_KEY = 'pf_auth_token';
const USER_KEY = 'pf_user_data';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    if (response.status === 401) {
      clearStoredAuth();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(`Resposta do servidor não é JSON (${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(data?.error || `Erro na requisição (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const data = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  getMe: async () => {
    return request<{ user: User }>('/api/auth/me');
  },

  logout: () => {
    clearStoredAuth();
  },

  // Users
  getUsers: async () => {
    return request<User[]>('/api/users');
  },

  createUser: async (userData: { name: string; username: string; role: 'master' | 'preenchedor'; password?: string }) => {
    return request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id: string, userData: Partial<User> & { password?: string }) => {
    return request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id: string) => {
    return request<{ success: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  getCategories: async () => {
    return request<Category[]>('/api/categories');
  },

  createCategory: async (category: Omit<Category, 'id'>) => {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    return request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteCategory: async (id: string) => {
    return request<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  addSubcategory: async (categoryId: string, name: string) => {
    return request<Category>(`/api/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  removeSubcategory: async (categoryId: string, subName: string) => {
    return request<Category>(`/api/categories/${categoryId}/subcategories/${encodeURIComponent(subName)}`, {
      method: 'DELETE',
    });
  },

  // Transactions
  getTransactions: async (params?: {
    monthYear?: string;
    year?: number;
    type?: string;
    paymentMethod?: string;
    categoryId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      if (params.monthYear) query.set('monthYear', params.monthYear);
      if (params.year) query.set('year', String(params.year));
      if (params.type) query.set('type', params.type);
      if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
      if (params.categoryId) query.set('categoryId', params.categoryId);
    }
    const qStr = query.toString();
    return request<Transaction[]>(`/api/transactions${qStr ? `?${qStr}` : ''}`);
  },

  createTransaction: async (tx: {
    title: string;
    amount: number;
    type: 'receita' | 'despesa';
    categoryId: string;
    paymentMethod: PaymentMethod;
    date: string;
    status?: 'pago' | 'pendente';
    notes?: string;
    isInstallment?: boolean;
    installmentTotal?: number;
  }) => {
    return request<Transaction[]>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    return request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteTransaction: async (id: string, deleteSeries = false) => {
    return request<{ success: boolean }>(`/api/transactions/${id}?deleteSeries=${deleteSeries}`, {
      method: 'DELETE',
    });
  },

  createTransactionsBatch: async (transactions: Array<any>) => {
    return request<{ success: boolean; count: number; transactions: Transaction[] }>('/api/transactions/batch', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  },

  clearAllTransactions: async () => {
    return request<{ success: boolean; message: string }>('/api/transactions/clear-all', {
      method: 'POST',
    });
  },

  getAccumulatedBalance: async (monthYear: string) => {
    return request<{
      targetMonthYear: string;
      previousMonthYear: string;
      previousBalance: number;
      currentIncome: number;
      currentExpense: number;
      currentNet: number;
      accumulatedBalance: number;
    }>(`/api/balance/accumulated?monthYear=${encodeURIComponent(monthYear)}`);
  },

  parsePdfStatement: async (fileBase64: string, defaultYear?: number) => {
    return request<{
      success: boolean;
      count: number;
      transactions: Array<{
        id: string;
        date: string;
        monthYear: string;
        title: string;
        amount: number;
        type: 'receita' | 'despesa';
        categoryId: string;
        paymentMethod: PaymentMethod;
        notes?: string;
        isInvoicePayment?: boolean;
        selected: boolean;
      }>;
      textPreview?: string;
    }>('/api/import/parse-pdf', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, defaultYear }),
    });
  },

  parseTextStatement: async (text: string, defaultYear?: number) => {
    return request<{
      success: boolean;
      count: number;
      transactions: Array<{
        id: string;
        date: string;
        monthYear: string;
        title: string;
        amount: number;
        type: 'receita' | 'despesa';
        categoryId: string;
        paymentMethod: PaymentMethod;
        notes?: string;
        isInvoicePayment?: boolean;
        selected: boolean;
      }>;
    }>('/api/import/parse-text', {
      method: 'POST',
      body: JSON.stringify({ text, defaultYear }),
    });
  },

  // Recurring / Gastos Fixos
  getRecurringGroups: async () => {
    return request<{
      recurringGroupId: string;
      latestTx: Transaction;
      categoryName?: string;
      categoryColor?: string;
      monthsCount: number;
      isCurrentlyActive: boolean;
      allMonthYears: string[];
    }[]>('/api/recurring');
  },

  stopRecurringGroup: async (recurringGroupId: string, fromMonthYear: string) => {
    return request<{ success: boolean }>('/api/recurring/stop', {
      method: 'POST',
      body: JSON.stringify({ recurringGroupId, fromMonthYear }),
    });
  },

  updateRecurringAmountGroup: async (recurringGroupId: string, newAmount: number, fromMonthYear: string) => {
    return request<{ success: boolean }>('/api/recurring/update-amount', {
      method: 'POST',
      body: JSON.stringify({ recurringGroupId, newAmount, fromMonthYear }),
    });
  },

  // Averages & Projections
  getCategoryAverages: async (monthYear: string) => {
    return request<CategoryAverage[]>(`/api/averages?monthYear=${monthYear}`);
  },

  getProjectedSalary: async (monthYear: string) => {
    return request<ProjectedSalaryAnalysis>(`/api/projected-salary?monthYear=${monthYear}`);
  },

  // Dashboard
  getAnnualDashboard: async (year: number) => {
    return request<AnnualDashboardData>(`/api/dashboard/annual?year=${year}`);
  },

  // Financial Goals (Caixinhas de Metas)
  getGoals: async () => {
    return request<FinancialGoal[]>('/api/goals');
  },

  createGoal: async (goalData: Partial<FinancialGoal>) => {
    return request<FinancialGoal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  },

  updateGoal: async (id: string, goalData: Partial<FinancialGoal>) => {
    return request<FinancialGoal>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  },

  deleteGoal: async (id: string) => {
    return request<{ success: boolean }>(`/api/goals/${id}`, {
      method: 'DELETE',
    });
  },

  transactGoal: async (id: string, amount: number, type: 'deposit' | 'withdraw') => {
    return request<FinancialGoal>(`/api/goals/${id}/transact`, {
      method: 'POST',
      body: JSON.stringify({ amount, type }),
    });
  },

  // Investments (Ativos, Aportes, Rendimentos & Simulador)
  getInvestments: async () => {
    return request<InvestmentDataResponse>('/api/investments');
  },

  createInvestmentAsset: async (assetData: Partial<InvestmentAsset>) => {
    return request<InvestmentAsset>('/api/investments/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  },

  updateInvestmentAsset: async (id: string, assetData: Partial<InvestmentAsset>) => {
    return request<InvestmentAsset>(`/api/investments/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
  },

  deleteInvestmentAsset: async (id: string) => {
    return request<{ success: boolean }>(`/api/investments/assets/${id}`, {
      method: 'DELETE',
    });
  },

  createInvestmentMovement: async (movementData: {
    assetId: string;
    assetName?: string;
    date: string;
    monthYear?: string;
    type: 'aporte' | 'rendimento' | 'resgate';
    amount: number;
    notes?: string;
    syncMonthly?: boolean;
  }) => {
    return request<InvestmentMovement>('/api/investments/movements', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  },

  deleteInvestmentMovement: async (id: string) => {
    return request<{ success: boolean }>(`/api/investments/movements/${id}`, {
      method: 'DELETE',
    });
  },

  // Backup
  exportBackup: async () => {
    return request<any>('/api/backup/export');
  },

  importBackup: async (backupData: any) => {
    return request<{ success: boolean }>('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  },
};
