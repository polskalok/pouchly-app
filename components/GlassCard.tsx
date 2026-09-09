import { StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

import { useGlassSettings } from '../lib/glassSettings';
import { useAppTheme } from '../lib/theme';

export default function GlassCard({ style, children, ...rest }: ViewProps) {
  const { colors } = useAppTheme();
  const { intensity } = useGlassSettings();

  return (
    <View style={[style, styles.clip]} {...rest}>
      <BlurView
        intensity={Math.max(1, intensity)}
        tint={colors.statusBarStyle === 'light' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.sand, opacity: 0.3 }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
