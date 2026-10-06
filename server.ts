import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { DB } from './server/db';
import { PDFParse } from 'pdf-parse';
import { parseStatementText } from './server/statementParser';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- Authentication Middleware ---
interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof DB.getUserById>;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Não autorizado. Token de sessão ausente.' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const user = DB.getUserByToken(token);

  if (!user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  req.user = user;
  next();
}

function masterOnlyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'master') {
    res.status(403).json({ error: 'Acesso negado. Recurso exclusivo para Usuários Master.' });
    return;
  }
  next();
}

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Por favor, informe usuário e senha.' });
      return;
    }

    const rawUser = DB.getUserByUsername(username);
    if (!rawUser) {
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, rawUser.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      return;
    }

    const token = DB.createSession(rawUser.id);
    const { passwordHash, ...safeUser } = rawUser;

    res.json({ token, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao realizar login.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// User Management (Master Only)
app.get('/api/users', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = DB.getUsers();
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !role) {
      res.status(400).json({ error: 'Preencha nome, usuário e perfil.' });
      return;
    }
    const newUser = DB.createUser({ name, username, role, password });
    res.status(201).json(newUser);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/users/:id', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = DB.updateUser(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/users/:id', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    DB.deleteUser(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Categories
app.get('/api/categories', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = DB.getCategories();
    res.json(categories);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const newCat = DB.createCategory(req.body);
    res.status(201).json(newCat);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/categories/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = DB.updateCategory(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    DB.deleteCategory(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Subcategories Management
app.post('/api/categories/:id/subcategories', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Nome da subcategoria obrigatório.' });
      return;
    }
    const updated = DB.addSubcategory(id, name);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/categories/:id/subcategories/:subName', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, subName } = req.params;
    const updated = DB.removeSubcategory(id, decodeURIComponent(subName));
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Transactions
app.get('/api/transactions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { monthYear, year, type, paymentMethod, categoryId } = req.query;
    const filter: any = {};
    if (monthYear) filter.monthYear = String(monthYear);
    if (year) filter.year = Number(year);
    if (type) filter.type = String(type);
    if (paymentMethod) filter.paymentMethod = String(paymentMethod);
    if (categoryId) filter.categoryId = String(categoryId);

    const transactions = DB.getTransactions(filter);
    res.json(transactions);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/transactions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = {
      ...req.body,
      createdById: req.user?.id,
    };
    const created = DB.createTransaction(payload);
    res.status(201).json(created);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/transactions/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = DB.updateTransaction(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/transactions/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleteSeries = req.query.deleteSeries === 'true';
    DB.deleteTransaction(id, deleteSeries);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Batch Transactions
app.post('/api/transactions/batch', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({ error: 'Nenhuma transação enviada para inserção.' });
      return;
    }
    const created = DB.createTransactionsBatch(transactions, req.user?.id);
    res.status(201).json({ success: true, count: created.length, transactions: created });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Accumulated Balance & Rollover from Previous Month
app.get('/api/balance/accumulated', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { monthYear } = req.query;
    const targetMY = String(monthYear || new Date().toISOString().substring(0, 7));
    const balanceData = DB.getAccumulatedBalance(targetMY);
    res.json(balanceData);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Clear All Transactions (Zero fake history)
app.post('/api/transactions/clear-all', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    DB.clearAllTransactions();
    res.json({ success: true, message: 'Histórico de transações zerado com sucesso.' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Import: Parse PDF statement/invoice
app.post('/api/import/parse-pdf', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileBase64, defaultYear } = req.body;
    if (!fileBase64) {
      res.status(400).json({ error: 'Arquivo PDF não fornecido.' });
      return;
    }

    // Strip data url prefix if present
    const base64Data = fileBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const parser = new (PDFParse as any)({ data: buffer });
    const pdfData = await parser.getText();
    const rawText = pdfData.text || '';
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }

    const year = defaultYear ? Number(defaultYear) : 2026;
    const parsedItems = parseStatementText(rawText, year);

    res.json({
      success: true,
      count: parsedItems.length,
      transactions: parsedItems,
      textPreview: rawText.substring(0, 500),
    });
  } catch (e: any) {
    res.status(500).json({ error: `Erro ao processar o PDF: ${e.message}` });
  }
});

// Import: Parse pasted raw text
app.post('/api/import/parse-text', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, defaultYear } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Texto do extrato não fornecido.' });
      return;
    }

    const year = defaultYear ? Number(defaultYear) : 2026;
    const parsedItems = parseStatementText(text, year);

    res.json({
      success: true,
      count: parsedItems.length,
      transactions: parsedItems,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Recurring / Gastos Fixos Routes
app.get('/api/recurring', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const recurringGroups = DB.getRecurringGroups();
    res.json(recurringGroups);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/recurring/stop', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recurringGroupId, fromMonthYear } = req.body;
    if (!recurringGroupId || !fromMonthYear) {
      res.status(400).json({ error: 'Informe recurringGroupId e fromMonthYear.' });
      return;
    }
    DB.stopRecurringGroup(recurringGroupId, fromMonthYear);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/recurring/update-amount', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recurringGroupId, newAmount, fromMonthYear } = req.body;
    if (!recurringGroupId || newAmount === undefined || !fromMonthYear) {
      res.status(400).json({ error: 'Informe recurringGroupId, newAmount e fromMonthYear.' });
      return;
    }
    DB.updateRecurringAmountGroup(recurringGroupId, Number(newAmount), fromMonthYear);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Historical Averages & Net Salary Projections
app.get('/api/averages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const monthYear = (req.query.monthYear as string) || new Date().toISOString().substring(0, 7);
    const averages = DB.getCategoryAverages(monthYear);
    res.json(averages);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projected-salary', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const monthYear = (req.query.monthYear as string) || new Date().toISOString().substring(0, 7);
    const analysis = DB.getProjectedSalaryAnalysis(monthYear);
    res.json(analysis);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Annual Dashboard
app.get('/api/dashboard/annual', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const data = DB.getAnnualDashboard(year);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Financial Goals (Caixinhas e Metas)
app.get('/api/goals', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const goals = DB.getGoals();
    res.json(goals);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/goals', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, targetAmount, currentAmount, deadline, color, icon, category, notes } = req.body;
    if (!title || targetAmount === undefined) {
      res.status(400).json({ error: 'Título e valor da meta são obrigatórios.' });
      return;
    }
    const newGoal = DB.createGoal({
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      deadline,
      color: color || '#10B981',
      icon: icon || 'Target',
      category: category || 'Geral',
      notes,
    });
    res.status(201).json(newGoal);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/goals/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = DB.updateGoal(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/goals/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    DB.deleteGoal(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/goals/:id/transact', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, type } = req.body;
    if (!amount || !type || (type !== 'deposit' && type !== 'withdraw')) {
      res.status(400).json({ error: 'Informe valor e tipo (deposit ou withdraw).' });
      return;
    }
    const updated = DB.transactGoal(id, Number(amount), type);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- Investments API ---
app.get('/api/investments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = DB.getInvestments();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/investments/assets', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, institution, category, investedAmount, currentValue, targetAllocationPercent, color, notes } = req.body;
    if (!name || !institution || !category) {
      res.status(400).json({ error: 'Nome, instituição e categoria são obrigatórios.' });
      return;
    }
    const created = DB.createInvestmentAsset({
      name,
      institution,
      category,
      investedAmount: Number(investedAmount) || 0,
      currentValue: Number(currentValue) || Number(investedAmount) || 0,
      targetAllocationPercent: targetAllocationPercent ? Number(targetAllocationPercent) : undefined,
      color: color || '#34D399',
      notes,
    });
    res.status(201).json(created);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/investments/assets/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = DB.updateInvestmentAsset(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/investments/assets/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    DB.deleteInvestmentAsset(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/investments/movements', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, assetName, date, monthYear, type, amount, notes, syncMonthly } = req.body;
    if (!assetId || !type || !amount || !date) {
      res.status(400).json({ error: 'Preencha todos os campos obrigatórios da movimentação.' });
      return;
    }
    const created = DB.createInvestmentMovement(
      {
        assetId,
        assetName: assetName || '',
        date,
        monthYear: monthYear || date.substring(0, 7),
        type,
        amount: Number(amount),
        notes,
      },
      Boolean(syncMonthly),
      req.user?.id
    );
    res.status(201).json(created);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/investments/movements/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    DB.deleteInvestmentMovement(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Backup
app.get('/api/backup/export', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = DB.exportData();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/backup/import', authMiddleware, masterOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    DB.importData(req.body);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- Server & Vite Startup ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planilha Financeira server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
