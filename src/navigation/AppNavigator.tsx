import React, { useState } from 'react';
import { EntryScreen } from '../screens/EntryScreen';
import { MapScreen } from '../screens/MapScreen';
import { NearbyListScreen } from '../screens/NearbyListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabName } from '../components/TabBar';
import { NearbyMeterResult } from '../types/database';

type Phase = 'entry' | 'main';

export function AppNavigator() {
  const [phase, setPhase] = useState<Phase>('entry');
  const [activeTab, setActiveTab] = useState<TabName>('map');
  const [pendingFocusMeter, setPendingFocusMeter] = useState<NearbyMeterResult | null>(null);

  if (phase === 'entry') {
    return <EntryScreen onReady={() => setPhase('main')} />;
  }

  if (activeTab === 'nearby') {
    return (
      <NearbyListScreen
        onNavigate={setActiveTab}
        onSelectMeter={(meter) => {
          setPendingFocusMeter(meter);
          setActiveTab('map');
        }}
      />
    );
  }
  if (activeTab === 'settings') {
    return <SettingsScreen onNavigate={setActiveTab} />;
  }
  return (
    <MapScreen
      onNavigate={setActiveTab}
      pendingFocusMeter={pendingFocusMeter}
      onClearFocus={() => setPendingFocusMeter(null)}
    />
  );
}
