import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'day' | 'night' | 'wood';

export type Palette = {
  bark: string;
  walnut: string;
  saddle: string;
  tan: string;
  sand: string;
  cream: string;
  paper: string;
  ink: string;
  inkMuted: string;
  border: string;
  gold: string;
  good: string;
  warn: string;
  bad: string;
  showWoodBanner: boolean;
  statusBarStyle: 'dark' | 'light';
  rippleTint: string;
};

const woodPalette: Palette = {
  bark: '#3B2A1E',
  walnut: '#6B3F22',
  saddle: '#8F5A34',
  tan: '#B9814F',
  sand: '#E8CFA9',
  cream: '#E4CBA0',
  paper: '#F8ECD8',
  ink: '#3B2A1E',
  inkMuted: '#8A6F58',
  border: '#E7D8C2',
  gold: '#C08A3E',
  good: '#3F7D4A',
  warn: '#B7791F',
  bad: '#B4462F',
  showWoodBanner: true,
  statusBarStyle: 'dark',
  rippleTint: 'rgba(59,42,30,0.08)',
};

const dayPalette: Palette = {
  bark: '#18181B',
  walnut: '#18181B',
  saddle: '#3F3F46',
  tan: '#A1A1AA',
  sand: '#E7E9EC',
  cream: '#E3E5E9',
  paper: '#F7F8FA',
  ink: '#18181B',
  inkMuted: '#71717A',
  border: '#E4E4E7',
  gold: '#3B82F6',
  good: '#16A34A',
  warn: '#D97706',
  bad: '#DC2626',
  showWoodBanner: false,
  statusBarStyle: 'dark',
  rippleTint: 'rgba(0,0,0,0.06)',
};

const nightPalette: Palette = {
  bark: '#F4F4F5',
  walnut: '#F4F4F5',
  saddle: '#D4D4D8',
  tan: '#71717A',
  sand: '#1C1C1E',
  cream: '#000000',
  paper: '#1C1C1E',
  ink: '#F4F4F5',
  inkMuted: '#A1A1AA',
  border: '#2C2C2E',
  gold: '#E0A94D',
  good: '#4ADE80',
  warn: '#FBBF24',
  bad: '#F87171',
  showWoodBanner: false,
  statusBarStyle: 'light',
  rippleTint: 'rgba(255,255,255,0.1)',
};

export const palettes: Record<ThemeName, Palette> = {
  day: dayPalette,
  night: nightPalette,
  wood: woodPalette,
};

export const THEME_OPTIONS: { key: ThemeName; label: string }[] = [
  { key: 'wood', label: 'Wood' },
  { key: 'day', label: 'Day' },
  { key: 'night', label: 'Night' },
];

const STORAGE_KEY = 'pouchly:theme';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  colors: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('wood');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'day' || value === 'night' || value === 'wood') {
        setThemeState(value);
      }
      setLoaded(true);
    });
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: palettes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}
