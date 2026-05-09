import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { DisabilityParkingResult } from '../types/database';

interface Props {
  spot: DisabilityParkingResult;
  onPress: (spot: DisabilityParkingResult) => void;
}

export function DisabilityMarker({ spot, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={() => onPress(spot)}
    >
      <View style={styles.pin}>
        <Text style={styles.icon}>♿</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  icon: {
    fontSize: 12,
    lineHeight: 14,
  },
});
