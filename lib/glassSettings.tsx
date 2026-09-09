import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pouchly:glassIntensity';
const DEFAULT_INTENSITY = 55;

type GlassSettingsContextValue = {
  intensity: number;
  setIntensity: (value: number) => void;
};

const GlassSettingsContext = createContext<GlassSettingsContextValue | null>(null);

export function GlassSettingsProvider({ children }: { children: ReactNode }) {
  const [intensity, setIntensityState] = useState(DEFAULT_INTENSITY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      const parsed = value ? Number(value) : NaN;
      if (!Number.isNaN(parsed)) setIntensityState(parsed);
      setLoaded(true);
    });
  }, []);

  const setIntensity = useCallback((value: number) => {
    setIntensityState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  if (!loaded) return null;

  return (
    <GlassSettingsContext.Provider value={{ intensity, setIntensity }}>
      {children}
    </GlassSettingsContext.Provider>
  );
}

export function useGlassSettings(): GlassSettingsContextValue {
  const ctx = useContext(GlassSettingsContext);
  if (!ctx) throw new Error('useGlassSettings must be used within a GlassSettingsProvider');
  return ctx;
}
