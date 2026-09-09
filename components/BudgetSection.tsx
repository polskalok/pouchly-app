import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Budget, Category } from '../lib/db';
import { OVERALL_BUDGET_KEY } from '../lib/db';
import { categoryEmoji, categoryLabel } from '../lib/categories';
import { useLanguage } from '../lib/i18n';
import { useAppTheme, type Palette } from '../lib/theme';
import GlassCard from './GlassCard';

type Props = {
  budgets: Budget[];
  categories: Category[];
  monthTotal: number;
  categoryMonthTotals: Record<string, number>;
  onManage: () => void;
};

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function progressColor(ratio: number, colors: Palette): string {
  if (ratio > 1) return colors.bad;
  if (ratio > 0.8) return colors.warn;
  return colors.good;
}

function ProgressBar({ ratio, colors }: { ratio: number; colors: Palette }) {
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          width: `${Math.min(1, ratio) * 100}%`,
          backgroundColor: progressColor(ratio, colors),
        }}
      />
    </View>
  );
}

export default function BudgetSection({
  budgets,
  categories,
  monthTotal,
  categoryMonthTotals,
  onManage,
}: Props) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const overall = budgets.find((b) => b.category === OVERALL_BUDGET_KEY);
  const categoryBudgets = budgets.filter((b) => b.category !== OVERALL_BUDGET_KEY);

  const styles = StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.ink,
    },
    manageLink: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.gold,
    },
    row: {
      marginTop: 8,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    rowLabel: {
      fontSize: 13,
      color: colors.ink,
    },
    rowValue: {
      fontSize: 12,
      color: colors.inkMuted,
    },
    emptyText: {
      fontSize: 13,
      color: colors.inkMuted,
    },
  });

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('budgets')}</Text>
        <Pressable onPress={onManage} android_ripple={{ color: colors.rippleTint }}>
          <Text style={styles.manageLink}>{t('manage')}</Text>
        </Pressable>
      </View>

      {overall ? (
        <View style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowLabel}>{t('overall')}</Text>
            <Text style={styles.rowValue}>
              {formatAmount(monthTotal)} / {formatAmount(overall.monthlyLimit)}
            </Text>
          </View>
          <ProgressBar ratio={overall.monthlyLimit > 0 ? monthTotal / overall.monthlyLimit : 0} colors={colors} />
        </View>
      ) : null}

      {categoryBudgets.map((b) => {
        const spent = categoryMonthTotals[b.category] ?? 0;
        return (
          <View key={b.category} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowLabel}>
                {categoryEmoji(categories, b.category)} {categoryLabel(categories, b.category)}
              </Text>
              <Text style={styles.rowValue}>
                {formatAmount(spent)} / {formatAmount(b.monthlyLimit)}
              </Text>
            </View>
            <ProgressBar ratio={b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0} colors={colors} />
          </View>
        );
      })}

      {!overall && categoryBudgets.length === 0 ? (
        <Text style={styles.emptyText}>{t('noBudgetsSet')}</Text>
      ) : null}
    </GlassCard>
  );
}
