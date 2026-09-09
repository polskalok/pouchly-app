import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { deleteTransaction, getCategories, getTransactionById, type Category, type Transaction } from '../lib/db';
import { categoryEmoji, categoryLabel } from '../lib/categories';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function openInMaps(lat: number, lng: number, label: string | null) {
  const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
  const url = Platform.select({
    ios: `maps:0,0?q=${query}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${query})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  if (url) Linking.openURL(url);
}

export default function TransactionDetailScreen() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTransactionById(transactionId).then((fetched) => {
        if (fetched) {
          setTransaction(fetched);
        } else {
          // Deleted elsewhere (e.g. from the edit screen) while this was in the background.
          router.back();
        }
      });
      getCategories().then(setCategories);
    }, [transactionId])
  );

  function handleDelete() {
    Alert.alert(t('deleteExpense'), t('cannotBeUndone'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transactionId);
          router.back();
        },
      },
    ]);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 24,
    },
    emoji: {
      fontSize: 48,
      marginBottom: 8,
    },
    category: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.ink,
    },
    amount: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.ink,
      marginTop: 4,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.inkMuted,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
      flexShrink: 1,
      textAlign: 'right',
    },
    buttonRow: {
      marginTop: 32,
      gap: 12,
    },
    button: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    mapsButton: {
      backgroundColor: colors.walnut,
    },
    mapsButtonText: {
      color: colors.cream,
      fontSize: 16,
      fontWeight: '700',
    },
    editButton: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editButtonText: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: '700',
    },
    deleteButton: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: colors.bad,
      fontSize: 15,
      fontWeight: '600',
    },
  });

  if (!transaction) return null;

  const hasLocation = transaction.latitude != null && transaction.longitude != null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{categoryEmoji(categories, transaction.category)}</Text>
        <Text style={styles.category}>{categoryLabel(categories, transaction.category)}</Text>
        <Text style={styles.amount}>{formatAmount(transaction.amount)}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('date')}</Text>
        <Text style={styles.detailValue}>{formatDate(transaction.created_at)}</Text>
      </View>
      {transaction.note ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('note')}</Text>
          <Text style={styles.detailValue}>{transaction.note}</Text>
        </View>
      ) : null}
      {transaction.place_name ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('location')}</Text>
          <Text style={styles.detailValue}>{transaction.place_name}</Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        {hasLocation ? (
          <Pressable
            style={[styles.button, styles.mapsButton]}
            onPress={() => openInMaps(transaction.latitude!, transaction.longitude!, transaction.place_name)}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={styles.mapsButtonText}>{t('showOnMaps')}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.button, styles.editButton]}
          onPress={() => router.push(`/add?id=${transactionId}`)}
          android_ripple={{ color: colors.rippleTint }}
        >
          <Text style={styles.editButtonText}>{t('edit')}</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete} android_ripple={{ color: 'rgba(220,38,38,0.1)' }}>
          <Text style={styles.deleteButtonText}>{t('deleteExpense')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
