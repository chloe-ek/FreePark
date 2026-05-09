import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { DisabilityParkingResult } from '../types/database';

interface Props {
  spot: DisabilityParkingResult;
  onDismiss: () => void;
}

export function DisabilitySheet({ spot, onDismiss }: Props) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;

  const rows: [string, string][] = [
    ['Type',      spot.description ?? 'Accessible Parking'],
    ['Spaces',    String(spot.spaces)],
    ['Area',      spot.geo_local_area ?? '—'],
    ['Distance',  `${Math.round(spot.distance_meters)} m`],
    ...(spot.notes ? [['Notes', spot.notes] as [string, string]] : []),
  ];

  return (
    <View style={[styles.sheet, { backgroundColor: surface, borderTopColor: border }]}>
      <View style={[styles.handle, { backgroundColor: border }]} />

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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  badgeIcon: { fontSize: 20 },
  headerText: { flex: 1 },
  title:    { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 12,
  },
  cell:     { minWidth: '40%' },
  cellKey: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cellVal:  { fontSize: 13, fontWeight: '500' },
  dismiss:  { marginTop: 14, alignItems: 'center' },
  dismissText: { fontSize: 12 },
});
