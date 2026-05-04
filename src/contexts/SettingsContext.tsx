import React, { createContext, useContext, useState } from 'react';

export interface Settings {
  showFreeOnly: boolean;
  weekendMode: boolean;
  notifyWhenFree: boolean;
  radiusMeters: number;
}

interface SettingsContextValue {
  settings: Settings;
  setShowFreeOnly: (v: boolean) => void;
  setWeekendMode: (v: boolean) => void;
  setNotifyWhenFree: (v: boolean) => void;
  setRadiusMeters: (v: number) => void;
}

const DEFAULT: Settings = {
  showFreeOnly: false,
  weekendMode: false,
  notifyWhenFree: true,
  radiusMeters: 400,
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT,
  setShowFreeOnly: () => {},
  setWeekendMode: () => {},
  setNotifyWhenFree: () => {},
  setRadiusMeters: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setShowFreeOnly: (v) => setSettings((s) => ({ ...s, showFreeOnly: v })),
        setWeekendMode: (v) => setSettings((s) => ({ ...s, weekendMode: v })),
        setNotifyWhenFree: (v) => setSettings((s) => ({ ...s, notifyWhenFree: v })),
        setRadiusMeters: (v) => setSettings((s) => ({ ...s, radiusMeters: v })),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
