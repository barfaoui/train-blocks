import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';

import './base.scss';
import './tokens.scss';
import './typography.scss';
import {
  type ResolvedTheme,
  type ThemePreference,
  applyTheme,
  getSystemTheme,
  persistPreference,
  readStoredPreference,
  resolveTheme,
} from './theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const resolved = resolveTheme(preference, systemTheme);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    persistPreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
