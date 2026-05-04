import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, LIGHT_THEME, DARK_THEME } from '../theme';

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

  const scheme = override ?? systemScheme ?? 'light';
  const theme = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;

  function toggleTheme() {
    setOverride((prev) => {
      if (prev === null) return scheme === 'dark' ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
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
