import * as SQLite from 'expo-sqlite';

export type Transaction = {
  id: number;
  amount: number;
  category: string;
  note: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
};

export type TransactionInput = {
  amount: number;
  category: string;
  note: string;
  latitude?: number | null;
  longitude?: number | null;
  placeName?: string | null;
  createdAt?: Date;
};

export type Category = {
  key: string;
  label: string;
  emoji: string;
};

export type Budget = {
  category: string;
  monthlyLimit: number;
};

export const OVERALL_BUDGET_KEY = '__overall__';

const DEFAULT_CATEGORIES: [key: string, label: string, emoji: string][] = [
  ['food', 'Food', '🍔'],
  ['transport', 'Transport', '🚗'],
  ['shopping', 'Shopping', '🛍️'],
  ['bills', 'Bills', '🧾'],
  ['fun', 'Fun', '🎮'],
  ['other', 'Other', '💸'],
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
  const columnNames = new Set(columns.map((c) => c.name));

  if (!columnNames.has('latitude')) {
    await db.execAsync('ALTER TABLE transactions ADD COLUMN latitude REAL');
  }
  if (!columnNames.has('longitude')) {
    await db.execAsync('ALTER TABLE transactions ADD COLUMN longitude REAL');
  }
  if (!columnNames.has('place_name')) {
    await db.execAsync('ALTER TABLE transactions ADD COLUMN place_name TEXT');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      key TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      emoji TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!existing || existing.count === 0) {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const [key, label, emoji] = DEFAULT_CATEGORIES[i];
      await db.runAsync(
        'INSERT INTO categories (key, label, emoji, sort_order) VALUES (?, ?, ?, ?)',
        key,
        label,
        emoji,
        i
      );
    }
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      category TEXT PRIMARY KEY NOT NULL,
      monthly_limit REAL NOT NULL
    );
  `);
}

function slugify(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || `category-${Date.now()}`;
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('pouchly.db').then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO transactions (amount, category, note, created_at, latitude, longitude, place_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.amount,
    input.category,
    input.note,
    (input.createdAt ?? new Date()).toISOString(),
    input.latitude ?? null,
    input.longitude ?? null,
    input.placeName ?? null
  );
}

export async function updateTransaction(id: number, input: TransactionInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE transactions
     SET amount = ?, category = ?, note = ?, latitude = ?, longitude = ?, place_name = ?
     WHERE id = ?`,
    input.amount,
    input.category,
    input.note,
    input.latitude ?? null,
    input.longitude ?? null,
    input.placeName ?? null,
    id
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', id);
  return row ?? null;
}

export async function getRecentTransactions(limit = 50): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?',
    limit
  );
}

export async function getTransactionsWithLocation(): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY created_at DESC'
  );
}

export async function getTransactionsBetween(
  startISO: string,
  endISO: string,
  category?: string
): Promise<Transaction[]> {
  const db = await getDb();
  if (category && category !== 'all') {
    return db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE created_at >= ? AND created_at <= ? AND category = ? ORDER BY created_at ASC',
      startISO,
      endISO,
      category
    );
  }
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC',
    startISO,
    endISO
  );
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT key, label, emoji FROM categories ORDER BY sort_order ASC, label ASC');
}

export async function addCategory(label: string, emoji: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ maxOrder: number | null }>(
    'SELECT MAX(sort_order) as maxOrder FROM categories'
  );
  const nextOrder = (row?.maxOrder ?? -1) + 1;

  let key = slugify(label);
  const existing = await db.getFirstAsync('SELECT key FROM categories WHERE key = ?', key);
  if (existing) key = `${key}-${Date.now()}`;

  await db.runAsync(
    'INSERT INTO categories (key, label, emoji, sort_order) VALUES (?, ?, ?, ?)',
    key,
    label.trim(),
    emoji.trim() || '💸',
    nextOrder
  );
}

export async function updateCategory(key: string, label: string, emoji: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE categories SET label = ?, emoji = ? WHERE key = ?',
    label.trim(),
    emoji.trim() || '💸',
    key
  );
}

export async function deleteCategory(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE key = ?', key);
}

export async function getBudgets(): Promise<Budget[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; monthly_limit: number }>(
    'SELECT category, monthly_limit FROM budgets'
  );
  return rows.map((r) => ({ category: r.category, monthlyLimit: r.monthly_limit }));
}

export async function setBudget(category: string, monthlyLimit: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)
     ON CONFLICT(category) DO UPDATE SET monthly_limit = excluded.monthly_limit`,
    category,
    monthlyLimit
  );
}

export async function deleteBudget(category: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM budgets WHERE category = ?', category);
}

export async function getCategoryMonthTotals(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions
     WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
     GROUP BY category`
  );
  const map: Record<string, number> = {};
  for (const r of rows) map[r.category] = r.total;
  return map;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY created_at ASC');
}

export async function getTodayTotal(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM transactions WHERE date(created_at) = date('now', 'localtime')"
  );
  return row?.total ?? 0;
}

export async function getMonthTotal(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')"
  );
  return row?.total ?? 0;
}
