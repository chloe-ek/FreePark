import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { NearbyMeterResult } from '../types/database';
import {
  isMeterFreeNow,
  isMeterProhibited,
  getCurrentRateLabel,
  getCurrentRate,
  minutesUntilFree,
  formatMinutes,
} from '../utils/parkingUtils';
import { GREEN } from '../theme';

interface Props {
  meter: NearbyMeterResult;
  onPress?: (meter: NearbyMeterResult) => void;
}

export const TIER_COLORS = {
  prohibited: '#6b7280',
  free:       '#5ec26a',
  cheap:      '#60a5fa',
  mid:        '#f97316',
  exp:        '#ef4444',
} as const;

export type TierKey = keyof typeof TIER_COLORS;

export function getMeterTier(meter: NearbyMeterResult): TierKey {
  if (isMeterProhibited(meter)) return 'prohibited';
  if (isMeterFreeNow(meter)) return 'free';
  const rate = getCurrentRate(meter);
  if (rate == null || rate === 0) return 'free';
  if (rate <= 1.50) return 'cheap';
  if (rate <= 3.00) return 'mid';
  return 'exp';
}

export function MeterMarker({ meter, onPress }: Props) {
  const tier = getMeterTier(meter);
  const color = TIER_COLORS[tier];
  const free = tier === 'free';
  const minsUntilFree = minutesUntilFree(meter);

  return (
    <Marker
      coordinate={{ latitude: meter.latitude, longitude: meter.longitude }}
      tracksViewChanges={false}
      onPress={() => onPress?.(meter)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.wrapper}>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>

      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutId}>Meter {meter.meter_id}</Text>
          <Text style={[styles.calloutRate, { color }]}>
            {getCurrentRateLabel(meter)}
          </Text>
          {!free && minsUntilFree != null && (
            <Text style={styles.calloutFreeIn}>
              Free in {formatMinutes(minsUntilFree)}
            </Text>
          )}
          <Text style={styles.calloutDist}>
            {Math.round(meter.distance_meters)} m away
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  callout: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutId:     { fontWeight: '700', fontSize: 13, color: '#f0f0f0', marginBottom: 4 },
  calloutRate:   { fontSize: 13, marginBottom: 2, fontWeight: '500' },
  calloutFreeIn: { fontSize: 11, color: '#facc15', marginBottom: 2 },
  calloutDist:   { fontSize: 11, color: '#666' },
});
