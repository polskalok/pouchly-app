import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import BudgetEditorModal from '../../components/BudgetEditorModal';
import BudgetSection from '../../components/BudgetSection';
import GlassCard from '../../components/GlassCard';
import {
  deleteBudget,
  deleteTransaction,
  getBudgets,
  getCategories,
  getCategoryMonthTotals,
  getMonthTotal,
  getRecentTransactions,
  getTodayTotal,
  setBudget,
  type Budget,
  type Category,
  type Transaction,
} from '../../lib/db';
import { categoryEmoji, categoryLabel } from '../../lib/categories';
import { useLanguage } from '../../lib/i18n';
import { useAppTheme, type ThemeName } from '../../lib/theme';

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const LOGO_SOURCES: Record<ThemeName, number> = {
  day: require('../../assets/logo-day.png'),
  night: require('../../assets/logo-night.png'),
  wood: require('../../assets/logo-wood.png'),
};

export default function HomeScreen() {
  const { colors, theme } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryMonthTotals, setCategoryMonthTotals] = useState<Record<string, number>>({});
  const [budgetEditorVisible, setBudgetEditorVisible] = useState(false);

  const reload = useCallback(() => {
    getTodayTotal().then(setTodayTotal);
    getMonthTotal().then(setMonthTotal);
    getRecentTransactions().then(setTransactions);
    getCategories().then(setCategories);
    getBudgets().then(setBudgets);
    getCategoryMonthTotals().then(setCategoryMonthTotals);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleSaveBudget(category: string, monthlyLimit: number | null) {
    if (monthlyLimit === null) {
      await deleteBudget(category);
    } else {
      await setBudget(category, monthlyLimit);
    }
    getBudgets().then(setBudgets);
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
    header: {
      height: 200,
    },
    headerImage: {
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    headerPlain: {
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: 'hidden',
    },
    settingsButton: {
      position: 'absolute',
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 14,
    },
    wordmark: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.cream,
      letterSpacing: 0.3,
      textShadowColor: 'rgba(0,0,0,0.25)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    stickyGroup: {
      backgroundColor: colors.cream,
      paddingBottom: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    summaryPress: {
      flex: 1,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.inkMuted,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.ink,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 100,
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

  const bannerInner = (
    <View style={[styles.headerContent, { paddingTop: insets.top + 18 }]}>
      <Image source={LOGO_SOURCES[theme]} style={styles.logo} />
      <Text style={styles.wordmark}>Pouchly</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {colors.showWoodBanner ? (
          <ImageBackground
            source={require('../../assets/wood-banner.png')}
            style={styles.header}
            imageStyle={styles.headerImage}
          >
            {bannerInner}
            <Pressable
              style={[styles.settingsButton, { top: insets.top + 12 }]}
              onPress={() => router.push('/settings')}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={20} color={colors.cream} />
            </Pressable>
          </ImageBackground>
        ) : (
          <View style={[styles.header, styles.headerPlain, { backgroundColor: colors.walnut }]}>
            {bannerInner}
            <Pressable
              style={[styles.settingsButton, { top: insets.top + 12 }]}
              onPress={() => router.push('/settings')}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={20} color={colors.cream} />
            </Pressable>
          </View>
        )}

        <View style={styles.stickyGroup}>
          <View style={styles.summaryRow}>
            <Pressable style={styles.summaryPress} onPress={() => router.push('/history?range=today&category=all')}>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('today')}</Text>
                <Text style={styles.summaryValue}>{formatAmount(todayTotal)}</Text>
              </GlassCard>
            </Pressable>
            <Pressable style={styles.summaryPress} onPress={() => router.push('/history?range=month&category=all')}>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('thisMonth')}</Text>
                <Text style={styles.summaryValue}>{formatAmount(monthTotal)}</Text>
              </GlassCard>
            </Pressable>
          </View>

          <BudgetSection
            budgets={budgets}
            categories={categories}
            monthTotal={monthTotal}
            categoryMonthTotals={categoryMonthTotals}
            onManage={() => setBudgetEditorVisible(true)}
          />
        </View>

        <View style={styles.listContent}>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>{t('noExpensesYet')}</Text>
          ) : (
            transactions.map((item) => (
              <Pressable
                key={item.id}
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
            ))
          )}
        </View>
      </ScrollView>

      <BudgetEditorModal
        visible={budgetEditorVisible}
        categories={categories}
        budgets={budgets}
        onClose={() => setBudgetEditorVisible(false)}
        onSave={handleSaveBudget}
      />
    </View>
  );
}
