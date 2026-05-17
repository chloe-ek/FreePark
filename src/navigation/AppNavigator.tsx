import React, { useState } from 'react';
import { View } from 'react-native';
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

  // Keep all screens mounted so MapView and GPS don't reinitialize on tab switch.
  // display:'none' hides the inactive screen without unmounting it.
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, display: activeTab === 'map' ? 'flex' : 'none' }}>
        <MapScreen
          onNavigate={setActiveTab}
          pendingFocusMeter={pendingFocusMeter}
          onClearFocus={() => setPendingFocusMeter(null)}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'nearby' ? 'flex' : 'none' }}>
        <NearbyListScreen
          onNavigate={setActiveTab}
          onSelectMeter={(meter) => {
            setPendingFocusMeter(meter);
            setActiveTab('map');
          }}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'settings' ? 'flex' : 'none' }}>
        <SettingsScreen onNavigate={setActiveTab} />
      </View>
    </View>
  );
}
