import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Badge } from './Badge';
import { GREEN } from '../theme';
import { NearbyMeterResult } from '../types/database';
import { isMeterFreeNow, getCurrentRateLabel } from '../utils/parkingUtils';

interface Props {
  meter: NearbyMeterResult;
  onDismiss: () => void;
}

export function MeterSheet({ meter, onDismiss }: Props) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;
  const free = isMeterFreeNow(meter);
  const rateLabel = getCurrentRateLabel(meter);

  const rows: [string, string][] = [
    ['Status',       free ? 'Free now' : rateLabel],
    ['Time limit',   formatLimit(meter)],
    ['Card accepted',meter.credit_card ? 'Yes' : 'No'],
    ['Distance',     `${Math.round(meter.distance_meters)} m`],
  ];

  return (
    <View style={[styles.sheet, { backgroundColor: surface, borderTopColor: border }]}>
      <View style={[styles.handle, { backgroundColor: border }]} />

      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: free ? GREEN : '#666' }]} />
        <Text style={[styles.street, { color: text }]} numberOfLines={1}>
          Meter {meter.meter_id}
        </Text>
        <Badge variant={free ? 'green' : 'grey'}>
          {free ? 'Free now' : rateLabel}
        </Badge>
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

function formatLimit(meter: NearbyMeterResult): string {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const dow = now.getDay();
  const isSat = dow === 6;
  const isSun = dow === 0;

  let limit: number | null = null;
  if (mins >= 9 * 60 && mins < 18 * 60) {
    limit = isSat ? meter.time_limit_sa_9am_6pm
      : isSun ? meter.time_limit_su_9am_6pm
      : meter.time_limit_9am_6pm;
  } else if (mins >= 18 * 60 && mins < 22 * 60) {
    limit = isSat ? meter.time_limit_sa_6pm_10pm
      : isSun ? meter.time_limit_su_6pm_10pm
      : meter.time_limit_6pm_10pm;
  }

  if (limit == null) return 'No limit';
  return limit >= 60 ? `${limit / 60} hr` : `${limit} min`;
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
