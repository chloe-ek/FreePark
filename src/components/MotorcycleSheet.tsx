import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { MotorcycleParkingResult } from '../types/database';
import { GREEN } from '../theme';

interface Props {
  spot: MotorcycleParkingResult;
  onDismiss: () => void;
}

function getCurrentMotoRate(spot: MotorcycleParkingResult): number | null {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const mins = now.getHours() * 60 + now.getMinutes();
  const is9to6  = mins >= 9 * 60 && mins < 18 * 60;
  const is6to10 = mins >= 18 * 60 && mins < 22 * 60;

  if (day >= 1 && day <= 5) { // Weekday
    if (is9to6)  return spot.rate_9am_6pm;
    if (is6to10) return spot.rate_6pm_10pm;
  } else if (day === 6) { // Saturday
    if (is9to6)  return spot.rate_sa_9am_6pm;
    if (is6to10) return spot.rate_sa_6pm_10pm;
  } else { // Sunday
    if (is9to6)  return spot.rate_su_9am_6pm;
    if (is6to10) return spot.rate_su_6pm_10pm;
  }
  return null; // free outside metered hours
}

function getCurrentMotoTimeLimit(spot: MotorcycleParkingResult): number | null {
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const is9to6  = mins >= 9 * 60 && mins < 18 * 60;
  const is6to10 = mins >= 18 * 60 && mins < 22 * 60;

  if (day >= 1 && day <= 5) {
    if (is9to6)  return spot.time_limit_9am_6pm;
    if (is6to10) return spot.time_limit_6pm_10pm;
  } else if (day === 6) {
    if (is9to6)  return spot.time_limit_sa_9am_6pm;
    if (is6to10) return spot.time_limit_sa_6pm_10pm;
  } else {
    if (is9to6)  return spot.time_limit_su_9am_6pm;
    if (is6to10) return spot.time_limit_su_6pm_10pm;
  }
  return null;
}

export function MotorcycleSheet({ spot, onDismiss }: Props) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;

  const rate = getCurrentMotoRate(spot);
  const isFree = rate == null || rate === 0;
  const rateLabel = isFree ? 'Free now' : `$${rate!.toFixed(2)}/hr`;

  const timeLimit = getCurrentMotoTimeLimit(spot);
  const timeLimitLabel = timeLimit == null ? 'No limit'
    : timeLimit >= 60 ? `${timeLimit / 60} hr` : `${timeLimit} min`;

  const rows: [string, string][] = [
    ['Status',       rateLabel],
    ['Time limit',   timeLimitLabel],
    ['Card accepted', spot.credit_card ? 'Yes' : 'No'],
    ['Area',         spot.geo_local_area ?? '—'],
    ['Distance',     `${Math.round(spot.distance_meters)} m`],
    ...(spot.rush_hr ? [['Rush hour', spot.rush_hr] as [string, string]] : []),
  ];

  return (
    <View style={[styles.sheet, { backgroundColor: surface, borderTopColor: border }]}>
      <View style={[styles.handle, { backgroundColor: border }]} />

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
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
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
