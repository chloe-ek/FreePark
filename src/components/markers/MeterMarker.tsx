import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { NearbyMeterResult } from '../../types/database';
import {
  isMeterFreeNow,
  isMeterProhibited,
  getCurrentRate,
} from '../../utils/parkingUtils';
import { GREEN } from '../../theme';

interface Props {
  meter: NearbyMeterResult;
  onPress?: (meter: NearbyMeterResult) => void;
  hasReport?: boolean;
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
  if (rate < 2.00) return 'cheap';
  if (rate < 3.00) return 'mid';
  return 'exp';
}

export function MeterMarker({ meter, onPress, hasReport }: Props) {
  const [captured, setCaptured] = useState(false);
  const tier = getMeterTier(meter);
  const color = TIER_COLORS[tier];

  // Keep tracking until first layout capture, or whenever report icon is shown
  // (report changes visual content, so bitmap must be re-captured on Android)
  const tracksViewChanges = !captured || !!hasReport;

  return (
    <Marker
      coordinate={{ latitude: meter.latitude, longitude: meter.longitude }}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress?.(meter)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={styles.wrapper}
        collapsable={false}
        onLayout={() => setCaptured(true)}
      >
        <View style={[styles.dot, { backgroundColor: color }]} />
        {hasReport && <Text style={styles.reportIcon}>⚠️</Text>}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 28,
    height: 28,
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
  reportIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 11,
  },
});
