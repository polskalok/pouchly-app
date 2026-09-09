import type { Transaction } from './db';

export type RangeKey =
  | 'today'
  | 'yesterday'
  | 'week'
  | '2weeks'
  | 'month'
  | '3months'
  | '6months'
  | 'year'
  | 'allTime'
  | 'custom';

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'Week' },
  { key: '2weeks', label: '2 Weeks' },
  { key: 'month', label: 'Month' },
  { key: '3months', label: '3 Months' },
  { key: '6months', label: '6 Months' },
  { key: 'year', label: 'Year' },
  { key: 'allTime', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getRangeDates(key: RangeKey, customStart: Date, customEnd: Date): { start: Date; end: Date } {
  if (key === 'custom') {
    return { start: customStart, end: customEnd };
  }

  const now = new Date();

  if (key === 'today') {
    return { start: startOfDay(now), end: now };
  }

  if (key === 'yesterday') {
    const end = startOfDay(now);
    const start = new Date(end);
    start.setDate(start.getDate() - 1);
    return { start, end };
  }

  if (key === 'allTime') {
    return { start: new Date(2000, 0, 1), end: now };
  }

  const end = now;
  const start = new Date(end);
  const daysBack: Record<Exclude<RangeKey, 'custom' | 'today' | 'yesterday' | 'allTime'>, number> = {
    week: 7,
    '2weeks': 14,
    month: 30,
    '3months': 90,
    '6months': 182,
    year: 365,
  };
  start.setDate(start.getDate() - daysBack[key]);
  return { start, end };
}

export type Bucket = {
  key: string;
  label: string;
  total: number;
};

type Granularity = 'day' | 'week' | 'month';

function granularityFor(start: Date, end: Date): Granularity {
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  if (days <= 14) return 'day';
  if (days <= 92) return 'week';
  return 'month';
}

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (granularity === 'week') {
    const dayOfWeek = (date.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek);
    return monday.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === 'month') {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' });
  }
  const date = new Date(`${key}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function bucketTransactions(transactions: Transaction[], start: Date, end: Date): Bucket[] {
  const granularity = granularityFor(start, end);
  const totals = new Map<string, number>();

  for (const t of transactions) {
    const key = bucketKey(new Date(t.created_at), granularity);
    totals.set(key, (totals.get(key) ?? 0) + t.amount);
  }

  return Array.from(totals.keys())
    .sort()
    .map((key) => ({ key, total: totals.get(key)!, label: bucketLabel(key, granularity) }));
}
