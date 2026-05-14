import React from 'react';
import type { EvChargingResult } from '../types/database';
import { PinMarker } from './PinMarker';

interface Props {
  station: EvChargingResult;
  onPress: (station: EvChargingResult) => void;
}

export function EvMarker({ station, onPress }: Props) {
  return (
    <PinMarker
      coordinate={{ latitude: station.latitude, longitude: station.longitude }}
      color="#16a34a"
      icon="⚡"
      onPress={() => onPress(station)}
    />
  );
}
