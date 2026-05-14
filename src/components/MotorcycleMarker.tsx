import React from 'react';
import type { MotorcycleParkingResult } from '../types/database';
import { PinMarker } from './PinMarker';

interface Props {
  spot: MotorcycleParkingResult;
  onPress: (spot: MotorcycleParkingResult) => void;
}

export function MotorcycleMarker({ spot, onPress }: Props) {
  return (
    <PinMarker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      color="#7c3aed"
      icon="🏍"
      iconSize={11}
      onPress={() => onPress(spot)}
    />
  );
}
