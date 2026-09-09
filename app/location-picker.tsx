import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';

import { emitLocationPick } from '../lib/locationPickerBus';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

const FALLBACK = { latitude: 37.78825, longitude: -122.4324 };

export default function LocationPickerScreen() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const hasParamCoords = Boolean(lat && lng);

  const [coord, setCoord] = useState(
    hasParamCoords ? { latitude: Number(lat), longitude: Number(lng) } : null
  );

  useEffect(() => {
    if (coord) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled) {
            setCoord({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          }
          return;
        }
      } catch {
        // fall through to fallback
      }
      if (!cancelled) setCoord(FALLBACK);
    })();
    return () => {
      cancelled = true;
    };
  }, [coord]);

  function handleConfirm() {
    if (coord) emitLocationPick(coord);
    router.back();
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cream,
    },
    map: {
      flex: 1,
    },
    hint: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      backgroundColor: colors.paper,
      borderRadius: 12,
      padding: 12,
    },
    hintText: {
      color: colors.ink,
      fontSize: 13,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
    },
    button: {
      backgroundColor: colors.walnut,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.cream,
      fontSize: 16,
      fontWeight: '700',
    },
  });

  if (!coord) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.walnut} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onPress={(e) => setCoord(e.nativeEvent.coordinate)}
      >
        <Marker coordinate={coord} draggable onDragEnd={(e) => setCoord(e.nativeEvent.coordinate)} />
      </MapView>

      <View style={styles.hint}>
        <Text style={styles.hintText}>{t('pointOnMapHint')}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleConfirm} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
          <Text style={styles.buttonText}>{t('confirmLocation')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
