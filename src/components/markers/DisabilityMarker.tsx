import React from 'react';
import type { DisabilityParkingResult } from '../../types/database';
import { PinMarker } from './PinMarker';
import { LAYER_COLORS } from '../../constants/layers';

interface Props {
  spot: DisabilityParkingResult;
  onPress: (spot: DisabilityParkingResult) => void;
}

export function DisabilityMarker({ spot, onPress }: Props) {
  return (
    <PinMarker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      color={LAYER_COLORS.disability}
      icon="♿"
      onPress={() => onPress(spot)}
    />
  );
}
