import type { Transaction } from './db';

export type TransactionSection = {
  key: string;
  title: string;
  total: number;
  data: Transaction[];
};

function formatSectionTitle(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
}

export function groupTransactionsByDate(transactions: Transaction[]): TransactionSection[] {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = t.created_at.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }

  return Array.from(map.keys())
    .sort()
    .reverse()
    .map((key) => {
      const data = map.get(key)!.slice().reverse();
      return {
        key,
        title: formatSectionTitle(key),
        total: data.reduce((sum, t) => sum + t.amount, 0),
        data,
      };
    });
}
