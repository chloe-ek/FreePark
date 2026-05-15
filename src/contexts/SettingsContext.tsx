import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

export interface Settings {
  radiusMeters: number;
}

interface SettingsContextValue {
  settings: Settings;
  setRadiusMeters: (v: number) => void;
}

const DEFAULT: Settings = {
  radiusMeters: 400,
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT,
  setRadiusMeters: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.SETTINGS)
      .then((raw) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Partial<Settings>;
            setSettings((s) => ({ ...s, ...saved }));
          } catch {
            if (__DEV__) console.warn('[SettingsContext] Stored settings corrupted, using defaults');
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings, loaded]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setRadiusMeters: (v) => setSettings((prev) => ({ ...prev, radiusMeters: v })),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
