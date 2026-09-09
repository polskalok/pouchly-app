import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Budget, Category } from '../lib/db';
import { OVERALL_BUDGET_KEY } from '../lib/db';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

type Row = {
  key: string;
  label: string;
  emoji?: string;
};

type Props = {
  visible: boolean;
  categories: Category[];
  budgets: Budget[];
  onClose: () => void;
  onSave: (category: string, monthlyLimit: number | null) => void;
};

export default function BudgetEditorModal({ visible, categories, budgets, onClose, onSave }: Props) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    const initial: Record<string, string> = {};
    for (const b of budgets) initial[b.category] = String(b.monthlyLimit);
    setValues(initial);
  }, [visible, budgets]);

  const rows: Row[] = [
    { key: OVERALL_BUDGET_KEY, label: t('overall') },
    ...categories.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji })),
  ];

  function commit(key: string) {
    const raw = values[key] ?? '';
    const parsed = Number(raw.replace(',', '.'));
    if (raw.trim() === '' || Number.isNaN(parsed) || parsed <= 0) {
      onSave(key, null);
    } else {
      onSave(key, parsed);
    }
  }

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '75%',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 12,
    },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLabel: {
      fontSize: 15,
      color: colors.ink,
      flex: 1,
    },
    input: {
      width: 100,
      textAlign: 'right',
      fontSize: 15,
      backgroundColor: colors.cream,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: colors.ink,
    },
    doneButton: {
      marginTop: 16,
      backgroundColor: colors.walnut,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneButtonText: {
      color: colors.cream,
      fontSize: 15,
      fontWeight: '700',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('monthlyBudgets')}</Text>
          <FlatList
            data={rows}
            keyExtractor={(r) => r.key}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {item.emoji ? `${item.emoji} ` : ''}
                  {item.label}
                </Text>
                <TextInput
                  style={styles.input}
                  value={values[item.key] ?? ''}
                  onChangeText={(text) => setValues((v) => ({ ...v, [item.key]: text }))}
                  onEndEditing={() => commit(item.key)}
                  placeholder={t('noLimit')}
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          />
          <Pressable style={styles.doneButton} onPress={onClose} android_ripple={{ color: colors.rippleTint }}>
            <Text style={styles.doneButtonText}>{t('done')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
