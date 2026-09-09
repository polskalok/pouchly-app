import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';

import Dropdown from '../components/Dropdown';
import GlassCard from '../components/GlassCard';
import { exportTransactionsCSV } from '../lib/export';
import { useGlassSettings } from '../lib/glassSettings';
import { useLanguage, LANGUAGE_OPTIONS } from '../lib/i18n';
import { useAppTheme, THEME_OPTIONS, type ThemeName } from '../lib/theme';

// Placeholder — replace with a real support inbox before shipping.
const SUPPORT_EMAIL = 'support@pouchly.app';

const LOGO_SOURCES: Record<ThemeName, number> = {
  day: require('../assets/logo-day.png'),
  night: require('../assets/logo-night.png'),
  wood: require('../assets/logo-wood.png'),
};

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { theme, setTheme } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const { intensity, setIntensity } = useGlassSettings();

  const localizedThemeOptions = THEME_OPTIONS.map((o) => ({
    key: o.key,
    label: t(o.key === 'wood' ? 'themeWood' : o.key === 'day' ? 'themeDay' : 'themeNight'),
  }));

  function handleSendBugReport() {
    Alert.alert(t('sendBugReport'), t('bugReportPrompt'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('openMail'),
        onPress: () => {
          Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pouchly bug report')}`);
        },
      },
      {
        text: t('copyEmail'),
        onPress: async () => {
          await Clipboard.setStringAsync(SUPPORT_EMAIL);
          Alert.alert(t('copied'), t('emailCopiedMessage', { email: SUPPORT_EMAIL }));
        },
      },
    ]);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.inkMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    aboutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 4,
    },
    aboutLogo: {
      width: 40,
      height: 40,
      borderRadius: 12,
    },
    aboutName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.ink,
    },
    aboutLine: {
      fontSize: 13,
      color: colors.inkMuted,
      marginTop: 4,
    },
    row: {
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowFirst: {
      borderTopWidth: 0,
    },
    rowText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.ink,
    },
    dropdownGroup: {
      gap: 10,
    },
    sliderLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    sliderCaption: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.ink,
    },
    sliderValue: {
      fontSize: 13,
      color: colors.inkMuted,
    },
    previewCard: {
      marginTop: 16,
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
    },
    previewLabel: {
      fontSize: 13,
      color: colors.inkMuted,
      marginBottom: 4,
    },
    previewValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.ink,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>{t('about')}</Text>
        <View style={styles.aboutHeader}>
          <Image source={LOGO_SOURCES[theme]} style={styles.aboutLogo} />
          <Text style={styles.aboutName}>Pouchly</Text>
        </View>
        <Text style={styles.aboutLine}>{t('version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
        <Text style={styles.aboutLine}>{t('aboutTagline')}</Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>{t('preferences')}</Text>
        <View style={styles.dropdownGroup}>
          <Dropdown label={t('language')} value={language} options={LANGUAGE_OPTIONS} onChange={setLanguage} />
          <Dropdown label={t('theme')} value={theme} options={localizedThemeOptions} onChange={setTheme} />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>{t('appearance')}</Text>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderCaption}>{t('glassClearance')}</Text>
          <Text style={styles.sliderValue}>{Math.round(intensity)}%</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={100}
          value={intensity}
          onValueChange={setIntensity}
          minimumTrackTintColor={colors.gold}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.walnut}
        />

        <Text style={styles.previewLabel}>{t('preview')}</Text>
        <GlassCard style={styles.previewCard}>
          <Text style={styles.previewLabel}>{t('today')}</Text>
          <Text style={styles.previewValue}>$42.10</Text>
        </GlassCard>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>{t('data')}</Text>
        <Pressable
          style={[styles.row, styles.rowFirst]}
          onPress={() => exportTransactionsCSV()}
          android_ripple={{ color: colors.rippleTint }}
        >
          <Text style={styles.rowText}>{t('exportCsv')}</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>{t('support')}</Text>
        <Pressable
          style={[styles.row, styles.rowFirst]}
          onPress={handleSendBugReport}
          android_ripple={{ color: colors.rippleTint }}
        >
          <Text style={styles.rowText}>{t('sendBugReport')}</Text>
        </Pressable>
      </GlassCard>
    </ScrollView>
  );
}
