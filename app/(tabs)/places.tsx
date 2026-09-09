import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { router, useFocusEffect } from 'expo-router';

import { getTransactionsWithLocation, type Transaction } from '../../lib/db';
import { groupByPlace } from '../../lib/places';
import { useLanguage } from '../../lib/i18n';
import { useAppTheme } from '../../lib/theme';

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const FALLBACK_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function PlacesScreen() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTransactionsWithLocation().then(setTransactions);
    }, [])
  );

  const places = useMemo(() => groupByPlace(transactions), [transactions]);

  const initialRegion =
    places.length > 0
      ? { latitude: places[0].latitude, longitude: places[0].longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : FALLBACK_REGION;

  const styles = StyleSheet.create({
    map: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.cream,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 15,
      color: colors.inkMuted,
      textAlign: 'center',
    },
    callout: {
      minWidth: 160,
      padding: 4,
    },
    calloutTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 4,
    },
    calloutLine: {
      fontSize: 13,
      color: colors.ink,
    },
    calloutLink: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.gold,
      marginTop: 6,
    },
  });

  if (places.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('noLocatedExpenses')}</Text>
      </View>
    );
  }

  return (
    <MapView style={styles.map} initialRegion={initialRegion}>
      {places.map((place) => (
        <Marker key={place.key} coordinate={{ latitude: place.latitude, longitude: place.longitude }}>
          <Callout
            onPress={() =>
              router.push(
                `/place-detail?lat=${place.latitude}&lng=${place.longitude}&name=${encodeURIComponent(place.name)}`
              )
            }
          >
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{place.name}</Text>
              <Text style={styles.calloutLine}>
                {t('calloutTotal')} {formatAmount(place.total)}
              </Text>
              <Text style={styles.calloutLine}>
                {t('calloutVisits')} {place.count}
              </Text>
              <Text style={styles.calloutLine}>
                {t('calloutAvg')} {formatAmount(place.average)}
              </Text>
              <Text style={styles.calloutLink}>{t('tapForDetails')}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
