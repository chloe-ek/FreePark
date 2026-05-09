import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Badge } from './Badge';
import { GREEN } from '../theme';
import { NearbyMeterResult } from '../types/database';
import {
  isMeterFreeNow,
  isMeterProhibited,
  getCurrentRateLabel,
  getCurrentTimeLimit,
  minutesUntilFree,
  formatMinutes,
  getRushHours,
} from '../utils/parkingUtils';

interface Props {
  meter: NearbyMeterResult;
  onDismiss: () => void;
}

export function MeterSheet({ meter, onDismiss }: Props) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;
  const prohibited = isMeterProhibited(meter);
  const free = !prohibited && isMeterFreeNow(meter);
  const rateLabel = prohibited ? 'No parking' : getCurrentRateLabel(meter);
  const minsUntilFree = minutesUntilFree(meter);
  const timeLimit = getCurrentTimeLimit(meter);
  const timeLimitLabel = timeLimit == null ? 'No limit'
    : timeLimit >= 60 ? `${timeLimit / 60} hr` : `${timeLimit} min`;
  const rushHours = getRushHours(meter);

  const dotColor = prohibited ? '#ef4444' : free ? GREEN : '#666';

  const rows: [string, string][] = [
    ['Status',        prohibited ? 'No parking now' : free ? 'Free now' : rateLabel],
    ...(!free && !prohibited && minsUntilFree != null
      ? [['Free in', formatMinutes(minsUntilFree)] as [string, string]]
      : []),
    ['Time limit',    timeLimitLabel],
    ['Card accepted', meter.credit_card ? 'Yes' : 'No'],
    ['Distance',      `${Math.round(meter.distance_meters)} m`],
  ];

  return (
    <View style={[styles.sheet, { backgroundColor: surface, borderTopColor: border }]}>
      <View style={[styles.handle, { backgroundColor: border }]} />

      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.street, { color: text }]} numberOfLines={1}>
          Meter {meter.meter_id}
        </Text>
        <Badge variant={prohibited ? 'grey' : free ? 'green' : 'grey'}>
          {prohibited ? 'No parking' : free ? 'Free now' : rateLabel}
        </Badge>
      </View>

      {prohibited && rushHours.length > 0 && (
        <View style={styles.rushBanner}>
          <Text style={styles.rushTitle}>No parking — Rush hour (Mon–Fri)</Text>
          {rushHours.map((w) => (
            <Text key={w.label} style={styles.rushTime}>{w.label}</Text>
          ))}
        </View>
      )}

      {!prohibited && rushHours.length > 0 && (
        <View style={styles.rushWarning}>
          <Text style={styles.rushWarningTitle}>Rush hour restriction (Mon–Fri)</Text>
          {rushHours.map((w) => (
            <Text key={w.label} style={styles.rushWarningTime}>{w.label} — No parking</Text>
          ))}
        </View>
      )}

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
    gap: 10,
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  street: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  rushBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 10,
    marginBottom: 12,
  },
  rushTitle: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  rushTime: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  rushWarning: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    padding: 10,
    marginBottom: 12,
  },
  rushWarningTitle: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  rushWarningTime: {
    color: '#f97316',
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 12,
  },
  cell: { minWidth: '40%' },
  cellKey: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cellVal: {
    fontSize: 13,
    fontWeight: '500',
  },
  dismiss: {
    marginTop: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 12,
  },
});
