import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@freepark_settings';

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
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Partial<Settings>;
            setSettings((s) => ({ ...s, ...saved }));
          } catch {
            console.warn('[SettingsContext] Stored settings corrupted, using defaults');
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Sync to storage only after initial load to avoid overwriting with defaults
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  function update(patch: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setRadiusMeters: (v) => update({ radiusMeters: v }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
