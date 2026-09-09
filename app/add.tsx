import { router, useLocalSearchParams } from 'expo-router';

import ExpenseForm from '../components/ExpenseForm';

export default function AddScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;

  return <ExpenseForm transactionId={editingId} onSaved={() => router.back()} onDeleted={() => router.back()} />;
}
