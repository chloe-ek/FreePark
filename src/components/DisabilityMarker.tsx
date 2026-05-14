import React from 'react';
import type { DisabilityParkingResult } from '../types/database';
import { PinMarker } from './PinMarker';

interface Props {
  spot: DisabilityParkingResult;
  onPress: (spot: DisabilityParkingResult) => void;
}

export function DisabilityMarker({ spot, onPress }: Props) {
  return (
    <PinMarker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      color="#2563eb"
      icon="♿"
      onPress={() => onPress(spot)}
    />
  );
}
