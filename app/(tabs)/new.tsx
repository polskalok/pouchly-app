import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpenseForm from '../../components/ExpenseForm';
import { useAppTheme } from '../../lib/theme';

export default function NewExpenseTab() {
  const { colors } = useAppTheme();
  const [resetKey, setResetKey] = useState(0);

  // Remount with a blank form every time this tab gains focus.
  useFocusEffect(
    useCallback(() => {
      setResetKey((k) => k + 1);
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ExpenseForm key={resetKey} onSaved={() => router.replace('/')} />
    </SafeAreaView>
  );
}
