import type { Category } from './db';

export function categoryEmoji(categories: Category[], key: string): string {
  return categories.find((c) => c.key === key)?.emoji ?? '💸';
}

export function categoryLabel(categories: Category[], key: string): string {
  return categories.find((c) => c.key === key)?.label ?? 'Other';
}
