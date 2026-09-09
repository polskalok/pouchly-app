import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

export type PieSlice = {
  key: string;
  label: string;
  emoji: string;
  total: number;
  count: number;
  percent: number;
  color: string;
};

const SIZE = 180;
const RADIUS = 80;
const CENTER = SIZE / 2;

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

type Props = {
  data: PieSlice[];
  selectedKey: string | null;
  onSelectKey: (key: string | null) => void;
};

export default function PieChart({ data, selectedKey, onSelectKey }: Props) {
  const { colors } = useAppTheme();
  const { t, plural } = useLanguage();

  function toggle(key: string) {
    onSelectKey(selectedKey === key ? null : key);
  }

  const styles = StyleSheet.create({
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
    chartWrap: {
      alignItems: 'center',
    },
    legend: {
      marginTop: 12,
      gap: 8,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    legendRowActive: {
      backgroundColor: colors.paper,
    },
    swatch: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendLabel: {
      fontSize: 14,
      color: colors.ink,
      flex: 1,
    },
    legendValue: {
      fontSize: 12,
      color: colors.inkMuted,
    },
  });

  if (data.length === 0) return null;

  const selected = data.find((d) => d.key === selectedKey) ?? null;

  let cumulative = 0;

  return (
    <View>
      <Text style={selected ? styles.detail : styles.placeholder}>
        {selected
          ? `${selected.emoji} ${selected.label}: ${formatAmount(selected.total)} (${selected.percent.toFixed(0)}%, ${plural('transactionCount', selected.count)})${t('tapAgainToClear')}`
          : t('tapSliceToFilter')}
      </Text>

      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          {data.length === 1 ? (
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill={data[0].color}
              onPress={() => toggle(data[0].key)}
            />
          ) : (
            data.map((slice) => {
              const startAngle = cumulative * 360;
              cumulative += slice.percent / 100;
              const endAngle = cumulative * 360;
              return (
                <Path
                  key={slice.key}
                  d={describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle)}
                  fill={slice.color}
                  opacity={selectedKey && selectedKey !== slice.key ? 0.35 : 1}
                  onPress={() => toggle(slice.key)}
                />
              );
            })
          )}
        </Svg>
      </View>

      <View style={styles.legend}>
        {data.map((slice) => (
          <Pressable
            key={slice.key}
            style={[styles.legendRow, selectedKey === slice.key && styles.legendRowActive]}
            onPress={() => toggle(slice.key)}
            android_ripple={{ color: colors.rippleTint }}
          >
            <View style={[styles.swatch, { backgroundColor: slice.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {slice.emoji} {slice.label}
            </Text>
            <Text style={styles.legendValue}>
              {formatAmount(slice.total)} · {slice.percent.toFixed(0)}% · {slice.count}x
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
