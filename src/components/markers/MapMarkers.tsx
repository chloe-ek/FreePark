import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { DisabilityMarker } from './DisabilityMarker';
import { EvMarker } from './EvMarker';
import { MeterMarker } from './MeterMarker';
import { MotorcycleMarker } from './MotorcycleMarker';
import type { LayerKind } from '../../constants/layers';
import type { SpotReport } from '../../hooks/useSpotReports';
import type { ResolvedPlace } from '../../lib/geocoding';
import type {
  DisabilityParkingResult,
  EvChargingResult,
  MotorcycleParkingResult,
  NearbyMeterResult,
} from '../../types/database';

function TapPinMarker({ coordinate }: { coordinate: { latitude: number; longitude: number } }) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1.0 }} tracksViewChanges={tracksViewChanges}>
      <View collapsable={false} onLayout={() => setTracksViewChanges(false)}>
        <Text style={{ fontSize: 28 }}>📍</Text>
      </View>
    </Marker>
  );
}

interface Props {
  activeLayer: LayerKind;
  visibleMeters: NearbyMeterResult[];
  accessibleSpots: DisabilityParkingResult[];
  visibleMotoSpots: MotorcycleParkingResult[];
  evStations: EvChargingResult[];
  onMeterPress: (meter: NearbyMeterResult) => void;
  onDisabilityPress: (spot: DisabilityParkingResult) => void;
  onMotoPress: (spot: MotorcycleParkingResult) => void;
  onEvPress: (station: EvChargingResult) => void;
  getReport: (meterId: string) => SpotReport | undefined;
  isTapCenter: boolean;
  queryCenter: ResolvedPlace | null;
}

export function MapMarkers({
  activeLayer, visibleMeters, accessibleSpots, visibleMotoSpots, evStations,
  onMeterPress, onDisabilityPress, onMotoPress, onEvPress,
  getReport, isTapCenter, queryCenter,
}: Props) {
  return (
    <>
      {activeLayer === 'meter' && visibleMeters.map((meter) => (
        <MeterMarker
          key={meter.id}
          meter={meter}
          onPress={onMeterPress}
          hasReport={!!getReport(meter.meter_id)}
        />
      ))}
      {activeLayer === 'disability' && accessibleSpots.map((spot) => (
        <DisabilityMarker key={`acc-${spot.id}`} spot={spot} onPress={onDisabilityPress} />
      ))}
      {activeLayer === 'motorcycle' && visibleMotoSpots.map((spot) => (
        <MotorcycleMarker key={`moto-${spot.id}`} spot={spot} onPress={onMotoPress} />
      ))}
      {activeLayer === 'ev' && evStations.map((station) => (
        <EvMarker key={`ev-${station.id}`} station={station} onPress={onEvPress} />
      ))}
      {isTapCenter && queryCenter && (
        <TapPinMarker coordinate={{ latitude: queryCenter.lat, longitude: queryCenter.lng }} />
      )}
    </>
  );
}
