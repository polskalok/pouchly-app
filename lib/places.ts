import type { Transaction } from './db';

export type Place = {
  key: string;
  latitude: number;
  longitude: number;
  name: string;
  total: number;
  count: number;
  average: number;
};

export function roundCoord(n: number): number {
  return Math.round(n * 2000) / 2000; // ~50m grid, groups nearby visits together
}

export function placeKey(latitude: number, longitude: number): string {
  return `${roundCoord(latitude)},${roundCoord(longitude)}`;
}

export function groupByPlace(transactions: Transaction[]): Place[] {
  const groups = new Map<
    string,
    { latSum: number; lngSum: number; total: number; count: number; name: string | null }
  >();

  for (const t of transactions) {
    if (t.latitude == null || t.longitude == null) continue;
    const key = placeKey(t.latitude, t.longitude);
    const existing = groups.get(key);
    if (existing) {
      existing.latSum += t.latitude;
      existing.lngSum += t.longitude;
      existing.total += t.amount;
      existing.count += 1;
      if (!existing.name && t.place_name) existing.name = t.place_name;
    } else {
      groups.set(key, {
        latSum: t.latitude,
        lngSum: t.longitude,
        total: t.amount,
        count: 1,
        name: t.place_name,
      });
    }
  }

  return Array.from(groups.entries()).map(([key, v]) => ({
    key,
    latitude: v.latSum / v.count,
    longitude: v.lngSum / v.count,
    name: v.name ?? 'Unknown place',
    total: v.total,
    count: v.count,
    average: v.total / v.count,
  }));
}
