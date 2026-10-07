export type UserRole = 'master' | 'preenchedor';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export type TransactionType = 'receita' | 'despesa';

export type PaymentMethod = 'crédito' | 'débito' | 'pix' | 'ticket' | 'dinheiro' | 'transferência';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
  isDefault?: boolean;
  monthlyBudget?: number;
  subcategories?: string[];
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  color: string;
  icon?: string;
  category?: string;
  createdAt: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // For single transaction or current installment amount
  type: TransactionType;
  categoryId: string;
  subcategory?: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  status: 'pago' | 'pendente';
  notes?: string;
  
  // Installment fields
  isInstallment?: boolean;
  installmentSeriesId?: string; // Group ID for all installments in a purchase
  installmentCurrent?: number; // e.g., 1 of 10
  installmentTotal?: number; // e.g., 10
  totalPurchaseAmount?: number; // e.g., R$ 1200.00

  // Recurring / Fixed Expense fields
  isRecurring?: boolean;
  recurringGroupId?: string;

  createdById?: string;
}

export interface MonthlySummary {
  monthYear: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  salaryIncome: number;
  extraIncome: number;
  expenseByPaymentMethod: Record<PaymentMethod, number>;
  expenseByCategory: Record<string, number>;
}

export interface CategoryAverage {
  categoryId: string;
  categoryName: string;
  color: string;
  monthlyAverage: number;
  monthsAnalyzed: number;
  totalSpent: number;
  currentMonthActual: number; // Actual spent so far in target month
  projectedRemaining: number; // Max(0, monthlyAverage - currentMonthActual)
}

export interface ProjectedSalaryAnalysis {
  baseSalary: number;
  actualIncome: number;
  actualExpensesLogged: number;
  activeInstallmentsAmount: number;
  projectedUnfulfilledExpenses: number;
  estimatedNetSalary: number; // baseSalary - (actualExpensesLogged + projectedUnfulfilledExpenses)
  updatedBalanceText: string;
}

export interface AnnualDashboardData {
  year: number;
  totalAnnualIncome: number;
  totalAnnualExpense: number;
  totalAnnualSavings: number;
  averageMonthlyExpense: number;
  monthlyBreakdown: {
    monthYear: string;
    monthName: string;
    income: number;
    expense: number;
    net: number;
  }[];
  paymentMethodTotals: Record<PaymentMethod, number>;
  paymentMethodMonthly: Record<PaymentMethod, Record<string, number>>;
  categoryTotals: {
    categoryId: string;
    categoryName: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  last6Months?: {
    monthYear: string;
    monthName: string;
    shortName: string;
    expense: number;
    income: number;
    net: number;
  }[];
  previousYearComparison?: {
    year: number;
    totalAnnualIncome: number;
    totalAnnualExpense: number;
    totalAnnualSavings: number;
    monthlyExpensesByMonthIndex: number[]; // 0 to 11
  };
}

export type InvestmentCategory =
  | 'reserva'
  | 'renda_fixa'
  | 'fundos_imobiliarios'
  | 'acoes_etfs'
  | 'outros';

export interface InvestmentAsset {
  id: string;
  name: string;
  institution: string;
  category: InvestmentCategory;
  investedAmount: number;
  currentValue: number;
  targetAllocationPercent?: number;
  color: string;
  notes?: string;
  createdAt: string;
}

export interface InvestmentMovement {
  id: string;
  assetId: string;
  assetName: string;
  date: string;
  monthYear: string;
  type: 'aporte' | 'rendimento' | 'resgate';
  amount: number;
  notes?: string;
}

export interface InvestmentDataResponse {
  assets: InvestmentAsset[];
  movements: InvestmentMovement[];
}

export interface AccumulatedBalanceResponse {
  targetMonthYear: string;
  previousMonthYear: string;
  previousBalance: number; // Saldo do mês anterior / que sobrou do mês passado
  currentIncome: number; // Entradas deste mês
  currentExpense: number; // Saídas deste mês
  currentNet: number; // Resultado deste mês
  accumulatedBalance: number; // Saldo final disponível (previousBalance + currentNet)
}
