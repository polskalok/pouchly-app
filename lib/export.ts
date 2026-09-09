import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getAllTransactions, getCategories } from './db';
import { categoryLabel } from './categories';

function csvEscape(value: string): string {
  // Neutralize CSV formula injection: a leading =, +, -, or @ is interpreted
  // as a formula by Excel/Sheets when the exported file is reopened.
  if (/^[=+\-@]/.test(value)) {
    value = `'${value}`;
  }
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export async function exportTransactionsCSV(): Promise<void> {
  const [transactions, categories] = await Promise.all([getAllTransactions(), getCategories()]);

  const header = ['Date', 'Amount', 'Category', 'Note', 'Location'];
  const rows = transactions.map((t) =>
    [
      formatDate(t.created_at),
      formatAmount(t.amount),
      categoryLabel(categories, t.category),
      csvEscape(t.note ?? ''),
      csvEscape(t.place_name ?? ''),
    ].join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  const file = new File(Paths.cache, `pouchly-export-${Date.now()}.csv`);
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Pouchly data' });
  }
}
