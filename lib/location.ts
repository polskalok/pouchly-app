import * as Location from 'expo-location';

export type CapturedLocation = {
  latitude: number;
  longitude: number;
  placeName: string | null;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const geocoded = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), 3000);
    if (geocoded && geocoded.length > 0) {
      const place = geocoded[0];
      return [place.name, place.city].filter(Boolean).join(', ') || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function captureCurrentLocation(): Promise<CapturedLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      4000
    );
    if (!position) return null;

    const { latitude, longitude } = position.coords;
    const placeName = await reverseGeocode(latitude, longitude);

    return { latitude, longitude, placeName };
  } catch {
    return null;
  }
}
