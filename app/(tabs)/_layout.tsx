import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppTheme } from '../../lib/theme';
import { useLanguage } from '../../lib/i18n';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  return (
    <NativeTabs tintColor={colors.walnut} blurEffect="systemChromeMaterial">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>{t('history')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="places">
        <NativeTabs.Trigger.Icon sf="map.fill" md="place" />
        <NativeTabs.Trigger.Label>{t('places')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="new">
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
        <NativeTabs.Trigger.Label>{t('add')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
