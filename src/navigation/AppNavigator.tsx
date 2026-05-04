import React, { useState } from 'react';
import { EntryScreen } from '../screens/EntryScreen';
import { MapScreen } from '../screens/MapScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabName } from '../components/TabBar';

type Phase = 'entry' | 'main';

export function AppNavigator() {
  const [phase, setPhase] = useState<Phase>('entry');
  const [activeTab, setActiveTab] = useState<TabName>('map');

  if (phase === 'entry') {
    return <EntryScreen onReady={() => setPhase('main')} />;
  }

  if (activeTab === 'schedule') {
    return <ScheduleScreen onNavigate={setActiveTab} />;
  }
  if (activeTab === 'settings') {
    return <SettingsScreen onNavigate={setActiveTab} />;
  }
  return <MapScreen onNavigate={setActiveTab} />;
}
