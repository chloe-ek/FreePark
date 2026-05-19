import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ParkingDataProvider } from './src/contexts/ParkingDataContext';
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
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ParkingDataProvider>
            <Root />
          </ParkingDataProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
