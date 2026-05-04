import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function Root() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <Root />
      </SettingsProvider>
    </ThemeProvider>
  );
}
