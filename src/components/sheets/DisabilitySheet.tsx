import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { DisabilityParkingResult } from '../../types/database';
import { navigateTo } from '../../utils/navigation';
import { BottomSheet, InfoGrid } from './BottomSheet';

interface Props {
  spot: DisabilityParkingResult;
  onDismiss: () => void;
}

export function DisabilitySheet({ spot, onDismiss }: Props) {
  const { theme } = useTheme();
  const { text } = theme.colors;

  const rows: [string, string][] = [
    ['Type',     spot.description ?? 'Accessible Parking'],
    ['Spaces',   String(spot.spaces)],
    ['Area',     spot.geo_local_area ?? '—'],
    ['Distance', `${Math.round(spot.distance_meters)} m`],
    ...(spot.notes ? [['Notes', spot.notes] as [string, string]] : []),
  ];

  return (
    <BottomSheet
      onNavigate={() => navigateTo(spot.latitude, spot.longitude)}
      onDismiss={onDismiss}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>♿</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: text }]} numberOfLines={2}>
            {spot.location}
          </Text>
          <Text style={[styles.subtitle, { color: '#2563eb' }]}>Accessible Parking</Text>
        </View>
      </View>
      <InfoGrid rows={rows} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  badge:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  badgeIcon:  { fontSize: 20 },
  headerText: { flex: 1 },
  title:      { fontSize: 15, fontWeight: '600' },
  subtitle:   { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
