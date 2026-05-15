import React from 'react';
import type { MotorcycleParkingResult } from '../types/database';
import { PinMarker } from './PinMarker';
import { LAYER_COLORS } from '../constants/layers';

interface Props {
  spot: MotorcycleParkingResult;
  onPress: (spot: MotorcycleParkingResult) => void;
}

export function MotorcycleMarker({ spot, onPress }: Props) {
  return (
    <PinMarker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      color={LAYER_COLORS.motorcycle}
      icon="🏍"
      iconSize={11}
      onPress={() => onPress(spot)}
    />
  );
}
