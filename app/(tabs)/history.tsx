import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import Dropdown, { type DropdownOption } from '../../components/Dropdown';
import GlassCard from '../../components/GlassCard';
import LineChart from '../../components/LineChart';
import PieChart, { type PieSlice } from '../../components/PieChart';
import {
  addTransaction,
  deleteTransaction,
  getCategories,
  getTransactionsBetween,
  type Category,
  type Transaction,
} from '../../lib/db';
import {
  RANGE_OPTIONS,
  bucketTransactions,
  getRangeDates,
  type RangeKey,
} from '../../lib/dateRanges';
import { groupTransactionsByDate } from '../../lib/sections';
import { categoryEmoji, categoryLabel } from '../../lib/categories';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useAppTheme } from '../../lib/theme';

const CHART_HEIGHT = 140;

const CHART_PALETTE = [
  '#E07A5F',
  '#3D5A80',
  '#81B29A',
  '#F2CC8F',
  '#9B5DE5',
  '#00BBF9',
  '#F15BB5',
  '#118AB2',
  '#EF476F',
  '#06A77D',
];

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type ChartType = 'column' | 'points' | 'pie';

const CHART_TYPE_LABEL_KEY: Record<ChartType, TranslationKey> = {
  column: 'chartColumn',
  points: 'chartPoints',
  pie: 'chartPie',
};

const RANGE_LABEL_KEY: Record<RangeKey, TranslationKey> = {
  today: 'rangeToday',
  yesterday: 'rangeYesterday',
  week: 'rangeWeek',
  '2weeks': 'range2Weeks',
  month: 'rangeMonth',
  '3months': 'range3Months',
  '6months': 'range6Months',
  year: 'rangeYear',
  allTime: 'rangeAllTime',
  custom: 'rangeCustom',
};

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ range?: string; category?: string }>();
  const [range, setRange] = useState<RangeKey>('month');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    if (params.range) setRange(params.range as RangeKey);
    if (params.category) setCategory(params.category);
  }, [params.range, params.category]);
  const [customStart, setCustomStart] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [customEnd, setCustomEnd] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [chartType, setChartType] = useState<ChartType>('column');
  const [pieSelectedCategory, setPieSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setPieSelectedCategory(null);
  }, [range, category, customStart, customEnd, minAmount, maxAmount]);

  const categoryOptions: DropdownOption<string>[] = useMemo(
    () => [{ key: 'all', label: t('all') }, ...categories.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji }))],
    [categories, t]
  );

  const localizedRangeOptions: DropdownOption<RangeKey>[] = useMemo(
    () => RANGE_OPTIONS.map((o) => ({ key: o.key, label: t(RANGE_LABEL_KEY[o.key]) })),
    [t]
  );

  const chartTypeOptions: DropdownOption<ChartType>[] = useMemo(
    () =>
      (['column', 'points', 'pie'] as ChartType[]).map((key) => ({
        key,
        label: t(CHART_TYPE_LABEL_KEY[key]),
      })),
    [t]
  );

  const { start, end } = useMemo(
    () => getRangeDates(range, customStart, customEnd),
    [range, customStart, customEnd]
  );

  const reload = useCallback(() => {
    getTransactionsBetween(start.toISOString(), end.toISOString(), category).then(setTransactions);
    getCategories().then(setCategories);
  }, [start, end, category]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filteredTransactions = useMemo(() => {
    const min = minAmount ? Number(minAmount.replace(',', '.')) : null;
    const max = maxAmount ? Number(maxAmount.replace(',', '.')) : null;
    return transactions.filter((t) => {
      if (min !== null && !Number.isNaN(min) && t.amount < min) return false;
      if (max !== null && !Number.isNaN(max) && t.amount > max) return false;
      return true;
    });
  }, [transactions, minAmount, maxAmount]);

  const buckets = useMemo(
    () => bucketTransactions(filteredTransactions, start, end),
    [filteredTransactions, start, end]
  );
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));

  const visibleTransactions = useMemo(
    () =>
      pieSelectedCategory
        ? filteredTransactions.filter((t) => t.category === pieSelectedCategory)
        : filteredTransactions,
    [filteredTransactions, pieSelectedCategory]
  );
  const sections = useMemo(() => groupTransactionsByDate(visibleTransactions), [visibleTransactions]);
  const total = useMemo(
    () => visibleTransactions.reduce((sum, t) => sum + t.amount, 0),
    [visibleTransactions]
  );
  const average = visibleTransactions.length > 0 ? total / visibleTransactions.length : 0;

  const categoryBreakdown: PieSlice[] = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();
    for (const t of filteredTransactions) {
      const cur = totals.get(t.category) ?? { total: 0, count: 0 };
      cur.total += t.amount;
      cur.count += 1;
      totals.set(t.category, cur);
    }
    const grandTotal = Array.from(totals.values()).reduce((sum, v) => sum + v.total, 0);
    const keys = Array.from(totals.keys()).sort((a, b) => totals.get(b)!.total - totals.get(a)!.total);
    return keys.map((key, i) => {
      const v = totals.get(key)!;
      return {
        key,
        label: categoryLabel(categories, key),
        emoji: categoryEmoji(categories, key),
        total: v.total,
        count: v.count,
        percent: grandTotal > 0 ? (v.total / grandTotal) * 100 : 0,
        color: CHART_PALETTE[i % CHART_PALETTE.length],
      };
    });
  }, [filteredTransactions, categories]);

  const selectedSlice = categoryBreakdown.find((s) => s.key === pieSelectedCategory) ?? null;

  async function handleSeedSampleData() {
    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
    await addTransaction({
      amount: 12.5,
      category: 'food',
      note: 'Lunch',
      createdAt: daysAgo(1),
    });
    await addTransaction({
      amount: 45,
      category: 'shopping',
      note: 'New shoes',
      createdAt: daysAgo(30),
    });
    await addTransaction({
      amount: 89.99,
      category: 'bills',
      note: 'Electric bill',
      createdAt: daysAgo(90),
    });
    reload();
  }

  function handleLongPress(item: Transaction) {
    Alert.alert(t('deleteExpense'), t('cannotBeUndone'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(item.id);
          reload();
        },
      },
    ]);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.inkMuted,
      marginTop: 16,
      marginBottom: 8,
    },
    devButton: {
      backgroundColor: '#FEF3C7',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 4,
    },
    devButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#92400E',
      textAlign: 'center',
    },
    transactionsHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 4,
    },
    transactionsLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.inkMuted,
    },
    clearFilterText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.gold,
    },
    chartHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
    },
    segmentBar: {
      flexDirection: 'row',
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 2,
    },
    segment: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
    },
    segmentActive: {
      backgroundColor: colors.walnut,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.inkMuted,
    },
    segmentTextActive: {
      color: colors.cream,
    },
    dropdownRow: {
      flexDirection: 'row',
      gap: 12,
    },
    amountRow: {
      flexDirection: 'row',
      gap: 12,
    },
    amountInput: {
      flex: 1,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.ink,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
    },
    dateField: {
      flex: 1,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    dateFieldLabel: {
      fontSize: 12,
      color: colors.inkMuted,
    },
    dateFieldValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
      marginTop: 2,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.inkMuted,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.inkMuted,
      marginTop: 40,
    },
    chartScroll: {
      marginTop: 24,
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingBottom: 4,
    },
    barColumn: {
      alignItems: 'center',
      width: 40,
    },
    barTrack: {
      height: CHART_HEIGHT,
      justifyContent: 'flex-end',
    },
    bar: {
      width: 16,
      backgroundColor: colors.walnut,
      borderRadius: 6,
    },
    barLabel: {
      fontSize: 10,
      color: colors.inkMuted,
      marginTop: 6,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 16,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    sectionTotal: {
      fontSize: 13,
      color: colors.inkMuted,
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
    rowNote: {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('noExpensesInRange')}</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatAmount(section.total)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/transaction-detail?id=${item.id}`)}
            onLongPress={() => handleLongPress(item)}
            android_ripple={{ color: colors.rippleTint }}
          >
            <Text style={styles.rowEmoji}>{categoryEmoji(categories, item.category)}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.rowCategory}>{categoryLabel(categories, item.category)}</Text>
              {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
            </View>
            <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
          </Pressable>
        )}
        ListHeaderComponent={
          <View>
            {__DEV__ ? (
              <Pressable style={styles.devButton} onPress={handleSeedSampleData}>
                <Text style={styles.devButtonText}>{t('addSampleData')}</Text>
              </Pressable>
            ) : null}

            <View style={styles.dropdownRow}>
              <Dropdown label={t('timeField')} value={range} options={localizedRangeOptions} onChange={setRange} />
              <Dropdown label={t('categoryField')} value={category} options={categoryOptions} onChange={setCategory} />
            </View>

            {range === 'custom' ? (
              <View style={styles.dateRow}>
                <Pressable style={styles.dateField} onPress={() => setPickerTarget('start')}>
                  <Text style={styles.dateFieldLabel}>{t('from')}</Text>
                  <Text style={styles.dateFieldValue}>{formatDate(customStart)}</Text>
                </Pressable>
                <Pressable style={styles.dateField} onPress={() => setPickerTarget('end')}>
                  <Text style={styles.dateFieldLabel}>{t('to')}</Text>
                  <Text style={styles.dateFieldValue}>{formatDate(customEnd)}</Text>
                </Pressable>
              </View>
            ) : null}

            {pickerTarget ? (
              <DateTimePicker
                value={pickerTarget === 'start' ? customStart : customEnd}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS !== 'ios') setPickerTarget(null);
                  if (!selectedDate) return;
                  if (pickerTarget === 'start') setCustomStart(selectedDate);
                  else setCustomEnd(selectedDate);
                }}
              />
            ) : null}

            <Text style={styles.sectionLabel}>{t('amountRange')}</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                value={minAmount}
                onChangeText={setMinAmount}
                placeholder={t('minAmount')}
                placeholderTextColor={colors.inkMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.amountInput}
                value={maxAmount}
                onChangeText={setMaxAmount}
                placeholder={t('maxAmount')}
                placeholderTextColor={colors.inkMuted}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.summaryRow}>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>
                  {selectedSlice ? `${t('total')} · ${selectedSlice.emoji} ${selectedSlice.label}` : t('total')}
                </Text>
                <Text style={styles.summaryValue}>{formatAmount(total)}</Text>
              </GlassCard>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('avgPerTransaction')}</Text>
                <Text style={styles.summaryValue}>{formatAmount(average)}</Text>
              </GlassCard>
            </View>

            <View style={styles.chartHeaderRow}>
              <Text style={styles.sectionLabel}>{t('chart')}</Text>
              <View style={styles.segmentBar}>
                {chartTypeOptions.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setChartType(opt.key)}
                    style={[styles.segment, chartType === opt.key && styles.segmentActive]}
                    android_ripple={{ color: colors.rippleTint }}
                  >
                    <Text style={[styles.segmentText, chartType === opt.key && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {chartType === 'column' ? (
              buckets.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                  <View style={styles.chart}>
                    {buckets.map((b) => (
                      <View key={b.key} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              { height: Math.max(2, (b.total / maxBucket) * CHART_HEIGHT) },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{b.label}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : null
            ) : null}

            {chartType === 'points' ? <LineChart buckets={buckets} /> : null}

            {chartType === 'pie' ? (
              <PieChart
                data={categoryBreakdown}
                selectedKey={pieSelectedCategory}
                onSelectKey={(key) => setPieSelectedCategory((current) => (current === key ? null : key))}
              />
            ) : null}

            <View style={styles.transactionsHeaderRow}>
              <Text style={styles.transactionsLabel}>{t('transactions')}</Text>
              {selectedSlice ? (
                <Pressable onPress={() => setPieSelectedCategory(null)} android_ripple={{ color: colors.rippleTint }}>
                  <Text style={styles.clearFilterText}>
                    {selectedSlice.emoji} {selectedSlice.label} ✕
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
