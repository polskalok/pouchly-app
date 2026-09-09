import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import type { Bucket } from '../lib/dateRanges';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

const POINT_SPACING = 40;
const CHART_HEIGHT = 140;

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function LineChart({ buckets }: { buckets: Bucket[] }) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<Bucket | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [buckets]);

  const styles = StyleSheet.create({
    container: {
      marginTop: 8,
    },
    detail: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: 8,
    },
    placeholder: {
      fontSize: 13,
      color: colors.inkMuted,
      marginBottom: 8,
    },
  });

  if (buckets.length === 0) return null;

  const max = Math.max(1, ...buckets.map((b) => b.total));
  const width = Math.max(POINT_SPACING * buckets.length, POINT_SPACING);

  const points = buckets.map((b, i) => ({
    x: POINT_SPACING * i + POINT_SPACING / 2,
    y: CHART_HEIGHT - 14 - (b.total / max) * (CHART_HEIGHT - 28),
    bucket: b,
  }));

  return (
    <View style={styles.container}>
      <Text style={selected ? styles.detail : styles.placeholder}>
        {selected ? `${selected.label}: ${formatAmount(selected.total)}` : t('tapPointForTotal')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={width} height={CHART_HEIGHT}>
          <Polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.walnut}
            strokeWidth={2}
          />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={selected === p.bucket ? 6 : 4}
              fill={selected === p.bucket ? colors.gold : colors.walnut}
              onPress={() => setSelected(p.bucket)}
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
}
