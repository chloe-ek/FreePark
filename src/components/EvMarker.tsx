import React from 'react';
import type { EvChargingResult } from '../types/database';
import { PinMarker } from './PinMarker';
import { LAYER_COLORS } from '../constants/layers';

interface Props {
  station: EvChargingResult;
  onPress: (station: EvChargingResult) => void;
}

export function EvMarker({ station, onPress }: Props) {
  return (
    <PinMarker
      coordinate={{ latitude: station.latitude, longitude: station.longitude }}
      color={LAYER_COLORS.ev}
      icon="⚡"
      onPress={() => onPress(station)}
    />
  );
}
