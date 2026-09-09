import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { getCategories, getTransactionsWithLocation, type Category, type Transaction } from '../lib/db';
import { placeKey } from '../lib/places';
import { categoryEmoji, categoryLabel } from '../lib/categories';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlaceDetailScreen() {
  const { colors } = useAppTheme();
  const { t, plural } = useLanguage();
  const { lat, lng, name } = useLocalSearchParams<{ lat: string; lng: string; name?: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTransactionsWithLocation().then(setTransactions);
      getCategories().then(setCategories);
    }, [])
  );

  const targetKey = placeKey(Number(lat), Number(lng));

  const placeTransactions = useMemo(
    () =>
      transactions.filter(
        (t) => t.latitude != null && t.longitude != null && placeKey(t.latitude, t.longitude) === targetKey
      ),
    [transactions, targetKey]
  );

  const total = placeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const average = placeTransactions.length > 0 ? total / placeTransactions.length : 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    header: {
      padding: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
    },
    subtitle: {
      fontSize: 13,
      color: colors.inkMuted,
      marginTop: 4,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.inkMuted,
      marginTop: 40,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowEmoji: {
      fontSize: 22,
      marginRight: 12,
    },
    rowMain: {
      flex: 1,
    },
    rowCategory: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.ink,
    },
    rowDate: {
      fontSize: 13,
      color: colors.inkMuted,
      marginTop: 2,
    },
    rowAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.ink,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name || 'Place'}</Text>
        <Text style={styles.subtitle}>
          {t('placeSummary', {
            total: formatAmount(total),
            visits: plural('visitCount', placeTransactions.length),
            avg: formatAmount(average),
          })}
        </Text>
      </View>

      <FlatList
        data={placeTransactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('noTransactionsHere')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/transaction-detail?id=${item.id}`)}
            android_ripple={{ color: colors.rippleTint }}
          >
            <Text style={styles.rowEmoji}>{categoryEmoji(categories, item.category)}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.rowCategory}>{categoryLabel(categories, item.category)}</Text>
              <Text style={styles.rowDate}>
                {formatDate(item.created_at)}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
            </View>
            <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
