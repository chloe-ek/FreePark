import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { MotorcycleParkingResult } from '../../types/database';
import { GREEN } from '../../theme';
import { navigateTo } from '../../utils/navigation';
import { getMotoCurrentRate, getMotoCurrentTimeLimit, isMotoRushHour, getRushHours } from '../../utils/parkingUtils';
import { BottomSheet, InfoGrid, RushHourBanner } from './BottomSheet';

interface Props {
  spot: MotorcycleParkingResult;
  onDismiss: () => void;
}

export function MotorcycleSheet({ spot, onDismiss }: Props) {
  const { theme } = useTheme();
  const { text } = theme.colors;

  const rushHour = isMotoRushHour(spot);
  const rushHours = getRushHours(spot);

  const rate = rushHour ? null : getMotoCurrentRate(spot);
  const isFree = !rushHour && (rate == null || rate === 0);
  const rateLabel = rushHour ? 'No parking — Rush hour' : isFree ? 'Free now' : `$${rate!.toFixed(2)}/hr`;

  const timeLimit = rushHour ? null : getMotoCurrentTimeLimit(spot);
  const timeLimitLabel = rushHour ? '—'
    : timeLimit == null ? 'No limit'
    : timeLimit >= 60 ? `${timeLimit / 60} hr` : `${timeLimit} min`;

  const rows: [string, string][] = [
    ['Status',        rateLabel],
    ['Time limit',    timeLimitLabel],
    ['Card accepted', spot.credit_card ? 'Yes' : 'No'],
    ['Area',          spot.geo_local_area ?? '—'],
    ['Distance',      `${Math.round(spot.distance_meters)} m`],
  ];

  return (
    <BottomSheet
      onNavigate={() => navigateTo(spot.latitude, spot.longitude)}
      onDismiss={onDismiss}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🏍</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: text }]} numberOfLines={1}>
            {spot.location ?? spot.intersectn ?? 'Motorcycle Parking'}
          </Text>
          <Text style={[styles.subtitle, { color: isFree ? GREEN : '#7c3aed' }]}>
            {rateLabel}
          </Text>
        </View>
      </View>
      <RushHourBanner windows={rushHours} active={rushHour} />

      <InfoGrid rows={rows} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  badge:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  badgeIcon:  { fontSize: 20 },
  headerText: { flex: 1 },
  title:      { fontSize: 15, fontWeight: '600' },
  subtitle:   { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
