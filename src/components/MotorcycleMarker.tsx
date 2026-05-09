import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { MotorcycleParkingResult } from '../types/database';

interface Props {
  spot: MotorcycleParkingResult;
  onPress: (spot: MotorcycleParkingResult) => void;
}

export function MotorcycleMarker({ spot, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={() => onPress(spot)}
    >
      <View style={styles.pin}>
        <Text style={styles.icon}>🏍</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  icon: { fontSize: 11, lineHeight: 13 },
});
