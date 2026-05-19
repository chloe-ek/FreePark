import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { EvChargingResult } from '../../types/database';
import { navigateTo } from '../../utils/navigation';
import { BottomSheet, InfoGrid } from './BottomSheet';

interface Props {
  station: EvChargingResult;
  onDismiss: () => void;
}

export function EvSheet({ station, onDismiss }: Props) {
  const { theme } = useTheme();
  const { text } = theme.colors;

  const rows: [string, string][] = [
    ['Operator', station.lot_operator ?? '—'],
    ['Area',     station.geo_local_area ?? '—'],
    ['Distance', `${Math.round(station.distance_meters)} m`],
  ];

  return (
    <BottomSheet
      onNavigate={() => navigateTo(station.latitude, station.longitude)}
      onDismiss={onDismiss}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>⚡</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: text }]} numberOfLines={2}>
            {station.address}
          </Text>
          <Text style={[styles.subtitle, { color: '#16a34a' }]}>EV Charging Station</Text>
        </View>
      </View>
      <InfoGrid rows={rows} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  badge:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  badgeIcon:  { fontSize: 20 },
  headerText: { flex: 1 },
  title:      { fontSize: 15, fontWeight: '600' },
  subtitle:   { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
