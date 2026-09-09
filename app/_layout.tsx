import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useAppTheme } from '../lib/theme';
import { LanguageProvider, useLanguage } from '../lib/i18n';
import { GlassSettingsProvider } from '../lib/glassSettings';

function RootStack() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink },
          headerBackTitle: t('back'),
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ title: t('newExpense') }} />
        <Stack.Screen name="transaction-detail" options={{ title: t('expenseTitle') }} />
        <Stack.Screen name="place-detail" options={{ title: t('placeTitle') }} />
        <Stack.Screen name="location-picker" options={{ title: t('pickLocationTitle') }} />
        <Stack.Screen name="settings" options={{ title: t('settings') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <GlassSettingsProvider>
            <RootStack />
          </GlassSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
