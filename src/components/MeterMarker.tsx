import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Text } from 'react-native';
import type { NearbyMeterResult } from '../types/database';
import { isMeterFreeNow, getCurrentRateLabel } from '../utils/parkingUtils';
import { GREEN, GREEN_GLOW } from '../theme';

interface Props {
  meter: NearbyMeterResult;
  onPress?: (meter: NearbyMeterResult) => void;
}

export function MeterMarker({ meter, onPress }: Props) {
  const free = isMeterFreeNow(meter);

  return (
    <Marker
      coordinate={{ latitude: meter.latitude, longitude: meter.longitude }}
      tracksViewChanges={false}
      onPress={() => onPress?.(meter)}
    >
      <View style={styles.wrapper}>
        {free && <View style={styles.glow} />}
        <View style={[styles.pin, free ? styles.pinFree : styles.pinPaid]} />
      </View>
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutId}>Meter {meter.meter_id}</Text>
          <Text style={[styles.calloutRate, { color: free ? GREEN : '#ef4444' }]}>
            {getCurrentRateLabel(meter)}
          </Text>
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
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN_GLOW,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  pinFree: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  pinPaid: {
    backgroundColor: '#555',
    borderColor: '#444',
    borderWidth: 2,
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
  calloutId: { fontWeight: '700', fontSize: 13, color: '#f0f0f0', marginBottom: 4 },
  calloutRate: { fontSize: 13, marginBottom: 2, fontWeight: '500' },
  calloutDist: { fontSize: 11, color: '#666' },
});
