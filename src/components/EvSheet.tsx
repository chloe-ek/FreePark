import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { EvChargingResult } from '../types/database';

interface Props {
  station: EvChargingResult;
  onDismiss: () => void;
}

export function EvSheet({ station, onDismiss }: Props) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;

  const rows: [string, string][] = [
    ['Operator',  station.lot_operator ?? '—'],
    ['Area',      station.geo_local_area ?? '—'],
    ['Distance',  `${Math.round(station.distance_meters)} m`],
  ];

  return (
    <View style={[styles.sheet, { backgroundColor: surface, borderTopColor: border }]}>
      <View style={[styles.handle, { backgroundColor: border }]} />

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

      <View style={styles.grid}>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.cell}>
            <Text style={[styles.cellKey, { color: text3 }]}>{k}</Text>
            <Text style={[styles.cellVal, { color: text2 }]}>{v}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Text style={[styles.dismissText, { color: text3 }]}>tap to close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderTopWidth: 1, paddingHorizontal: 16, paddingBottom: 32,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16,
    elevation: 20, zIndex: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  badge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  badgeIcon: { fontSize: 20 },
  headerText: { flex: 1 },
  title:    { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 12 },
  cell:     { minWidth: '40%' },
  cellKey: {
    fontSize: 10, fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2,
  },
  cellVal:  { fontSize: 13, fontWeight: '500' },
  dismiss:  { marginTop: 14, alignItems: 'center' },
  dismissText: { fontSize: 12 },
});
