import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, Category, Transaction, FinancialGoal } from '../src/types';
import type { DBData } from './db';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firestoreDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export class FirestoreService {
  // Push all local data to Firestore
  static async pushAll(data: DBData): Promise<void> {
    try {
      // 1. Users
      for (const u of data.users) {
        await setDoc(doc(firestoreDb, 'users', u.id), {
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          password: u.password || (u.username === 'fernanda.botelho' ? '1705' : u.username === 'ester.aiolfi' ? '1234' : '123456'),
          passwordHash: u.passwordHash,
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Categories
      for (const cat of data.categories) {
        await setDoc(doc(firestoreDb, 'categories', cat.id), {
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

      // 3. Goals
      if (data.goals) {
        for (const goal of data.goals) {
          await setDoc(doc(firestoreDb, 'goals', goal.id), {
            ...goal,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // 4. Transactions in batches of 400
      const BATCH_SIZE = 400;
      for (let i = 0; i < data.transactions.length; i += BATCH_SIZE) {
        const slice = data.transactions.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(firestoreDb);
        for (const tx of slice) {
          const ref = doc(firestoreDb, 'transactions', tx.id);
          batch.set(ref, {
            ...tx,
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();
      }

      console.log(`[FirestoreService] Pushed ${data.transactions.length} txs, ${data.categories.length} cats, ${data.users.length} users to Firestore.`);
    } catch (e) {
      console.error('[FirestoreService] Error pushing to Firestore:', e);
    }
  }

  // Pull all data from Firestore
  static async pullAll(): Promise<Partial<DBData> | null> {
    try {
      const usersSnap = await getDocs(collection(firestoreDb, 'users'));
      if (usersSnap.empty) {
        return null;
      }

      const users = usersSnap.docs.map(d => d.data() as (User & { passwordHash: string }));

      const catsSnap = await getDocs(collection(firestoreDb, 'categories'));
      const categories: Category[] = catsSnap.docs.map(d => d.data() as Category);

      const goalsSnap = await getDocs(collection(firestoreDb, 'goals'));
      const goals: FinancialGoal[] = goalsSnap.docs.map(d => d.data() as FinancialGoal);

      const txSnap = await getDocs(collection(firestoreDb, 'transactions'));
      const transactions: Transaction[] = txSnap.docs.map(d => d.data() as Transaction);

      return {
        users,
        categories: categories.length > 0 ? categories : undefined,
        transactions: transactions.length > 0 ? transactions : undefined,
        goals: goals.length > 0 ? goals : undefined,
      };
    } catch (e) {
      console.error('[FirestoreService] Error pulling from Firestore:', e);
      return null;
    }
  }

  static async getUserByUsername(username: string): Promise<any | null> {
    try {
      const cleanQ = username.trim().toLowerCase();
      const cleanWithDot = cleanQ.replace(/\s+/g, '.');
      const cleanNoSpace = cleanQ.replace(/[\s\.]+/g, '');

      const snap = await getDocs(collection(firestoreDb, 'users'));
      for (const d of snap.docs) {
        const u = d.data();
        const uName = (u.username || '').toLowerCase();
        const uFullName = (u.name || '').toLowerCase();
        const uNoSpace = uName.replace(/[\s\.]+/g, '');
        const uFullNoSpace = uFullName.replace(/[\s\.]+/g, '');

        if (
          uName === cleanQ ||
          uName === cleanWithDot ||
          uNoSpace === cleanNoSpace ||
          uFullName === cleanQ ||
          uFullNoSpace === cleanNoSpace ||
          (cleanQ.includes('ester') && (uName.includes('ester') || uFullName.includes('ester'))) ||
          (cleanQ.includes('fernanda') && (uName.includes('fernanda') || uFullName.includes('fernanda')))
        ) {
          return u;
        }
      }
      return null;
    } catch (e) {
      console.error('[FirestoreService] Error fetching user by username:', e);
      return null;
    }
  }

  // Real-time mutations
  static async saveUser(user: User): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'users', user.id), {
        ...user,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[FirestoreService] Error saving user to Firestore:', e);
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(firestoreDb, 'users', id));
    } catch (e) {
      console.error('[FirestoreService] Error deleting user in Firestore:', e);
    }
  }

  static async saveCategory(cat: Category): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'categories', cat.id), {
        ...cat,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[FirestoreService] Error saving category to Firestore:', e);
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(firestoreDb, 'categories', id));
    } catch (e) {
      console.error('[FirestoreService] Error deleting category in Firestore:', e);
    }
  }

  static async saveTransaction(tx: Transaction): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'transactions', tx.id), {
        ...tx,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[FirestoreService] Error saving transaction to Firestore:', e);
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(firestoreDb, 'transactions', id));
    } catch (e) {
      console.error('[FirestoreService] Error deleting transaction in Firestore:', e);
    }
  }

  static async saveGoal(goal: FinancialGoal): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'goals', goal.id), {
        ...goal,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[FirestoreService] Error saving goal to Firestore:', e);
    }
  }

  static async deleteGoal(id: string): Promise<void> {
    try {
      await deleteDoc(doc(firestoreDb, 'goals', id));
    } catch (e) {
      console.error('[FirestoreService] Error deleting goal in Firestore:', e);
    }
  }
}
