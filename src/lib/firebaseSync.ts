import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Category, Transaction, FinancialGoal } from '../types';

export const firebaseSync = {
  // Upload all local data to Firebase Firestore
  syncAllToFirestore: async (data: {
    categories: Category[];
    transactions: Transaction[];
    goals?: FinancialGoal[];
  }): Promise<{ success: boolean; categoriesCount: number; transactionsCount: number; goalsCount: number }> => {
    // 1. Sync Categories
    for (const cat of data.categories) {
      await setDoc(doc(db, 'categories', cat.id), {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon || '',
        isDefault: !!cat.isDefault,
        monthlyBudget: cat.monthlyBudget || 0,
        subcategories: cat.subcategories || [],
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Sync Goals
    if (data.goals) {
      for (const goal of data.goals) {
        await setDoc(doc(db, 'goals', goal.id), {
          ...goal,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Sync Transactions in batches of 400 (Firestore limit is 500 ops per batch)
    const BATCH_SIZE = 400;
    for (let i = 0; i < data.transactions.length; i += BATCH_SIZE) {
      const slice = data.transactions.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const tx of slice) {
        const ref = doc(db, 'transactions', tx.id);
        batch.set(ref, {
          id: tx.id,
          title: tx.title,
          amount: tx.amount,
          type: tx.type,
          categoryId: tx.categoryId,
          subcategory: tx.subcategory || null,
          paymentMethod: tx.paymentMethod,
          date: tx.date,
          monthYear: tx.monthYear,
          status: tx.status,
          notes: tx.notes || '',
          isInstallment: !!tx.isInstallment,
          installmentCurrent: tx.installmentCurrent || null,
          installmentTotal: tx.installmentTotal || null,
          installmentSeriesId: tx.installmentSeriesId || null,
          isRecurring: !!tx.isRecurring,
          recurringGroupId: tx.recurringGroupId || null,
          createdById: tx.createdById || 'usr-fernanda',
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    return {
      success: true,
      categoriesCount: data.categories.length,
      transactionsCount: data.transactions.length,
      goalsCount: data.goals?.length || 0,
    };
  },

  // Pull all data from Firebase Firestore
  pullAllFromFirestore: async (): Promise<{
    categories: Category[];
    transactions: Transaction[];
    goals: FinancialGoal[];
  }> => {
    const catsSnap = await getDocs(collection(db, 'categories'));
    const categories: Category[] = catsSnap.docs.map(d => d.data() as Category);

    const txSnap = await getDocs(collection(db, 'transactions'));
    const transactions: Transaction[] = txSnap.docs.map(d => d.data() as Transaction);

    const goalsSnap = await getDocs(collection(db, 'goals'));
    const goals: FinancialGoal[] = goalsSnap.docs.map(d => d.data() as FinancialGoal);

    return { categories, transactions, goals };
  },
};
