import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EntryScreen } from '../screens/EntryScreen';
import { MapScreen } from '../screens/MapScreen';
import { NearbyListScreen } from '../screens/NearbyListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingModal } from '../components/OnboardingModal';
import { TabName } from '../components/ui/TabBar';
import { STORAGE_KEYS } from '../constants/storage';
import type { Selection } from '../types/map';

type Phase = 'entry' | 'main';

export function AppNavigator() {
  const [phase, setPhase] = useState<Phase>('entry');
  const [activeTab, setActiveTab] = useState<TabName>('map');
  const [pendingFocus, setPendingFocus] = useState<Selection>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN).then((val) => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  function handleOnboardingDismiss() {
    setShowOnboarding(false);
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, '1').catch(() => {});
  }

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
          pendingFocus={pendingFocus}
          onClearFocus={() => setPendingFocus(null)}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'nearby' ? 'flex' : 'none' }}>
        <NearbyListScreen
          onNavigate={setActiveTab}
          onSelectSpot={(selection) => {
            setPendingFocus(selection);
            setActiveTab('map');
          }}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'settings' ? 'flex' : 'none' }}>
        <SettingsScreen onNavigate={setActiveTab} />
      </View>

      <OnboardingModal
        visible={showOnboarding}
        variant="auto"
        onClose={() => setShowOnboarding(false)}
        onDismiss={handleOnboardingDismiss}
      />
    </View>
  );
}
