import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, LIGHT_THEME, DARK_THEME } from '../theme';

const STORAGE_KEY = '@freepark_theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: LIGHT_THEME,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') setOverride(saved);
      })
      .catch(() => {}); // storage unavailable — use system theme
  }, []);

  const scheme = override ?? systemScheme ?? 'light';
  const theme = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;

  function toggleTheme() {
    setOverride((prev) => {
      const next = prev === null
        ? (scheme === 'dark' ? 'light' : 'dark')
        : (prev === 'dark' ? 'light' : 'dark');
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
