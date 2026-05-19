import { useState } from 'react';
import { useParkingData } from '../contexts/ParkingDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNearbyDisabilityParking } from './useNearbyDisabilityParking';
import { useNearbyEvCharging } from './useNearbyEvCharging';
import { useNearbyMeters } from './useNearbyMeters';
import { useNearbyMotorcycleParking } from './useNearbyMotorcycleParking';
import type { LayerKind } from '../constants/layers';
import type { ResolvedPlace } from '../lib/geocoding';

export function useMapData(activeLayer: LayerKind) {
  const {
    latitude, longitude,
    meters: gpsMeters, accessibleSpots: gpsAccessibleSpots,
    motoSpots: gpsMotoSpots, evStations: gpsEvStations,
    metersLoading: gpsMetersLoading, metersError: gpsMetersError,
  } = useParkingData();
  const { settings } = useSettings();

  const [queryCenter, setQueryCenter] = useState<ResolvedPlace | null>(null);

  const queryLat  = queryCenter?.lat ?? latitude;
  const queryLng  = queryCenter?.lng ?? longitude;
  const isCustom  = queryCenter !== null;
  const isTapCenter = isCustom && queryCenter.name === '';

  const { meters: customMeters, loading: customMetersLoading, error: customMetersError } = useNearbyMeters(
    queryLat, queryLng, settings.radiusMeters, isCustom && activeLayer === 'meter',
  );
  const { spots: customAccessibleSpots } = useNearbyDisabilityParking(
    queryLat, queryLng, settings.radiusMeters, isCustom && activeLayer === 'disability',
  );
  const { spots: customMotoSpots } = useNearbyMotorcycleParking(
    queryLat, queryLng, settings.radiusMeters, isCustom && activeLayer === 'motorcycle',
  );
  const { stations: customEvStations } = useNearbyEvCharging(
    queryLat, queryLng, settings.radiusMeters, isCustom && activeLayer === 'ev',
  );

  return {
    meters:          isCustom ? customMeters          : gpsMeters,
    accessibleSpots: isCustom ? customAccessibleSpots : gpsAccessibleSpots,
    motoSpots:       isCustom ? customMotoSpots        : gpsMotoSpots,
    evStations:      isCustom ? customEvStations       : gpsEvStations,
    metersLoading:   isCustom ? customMetersLoading    : gpsMetersLoading,
    metersError:     isCustom ? customMetersError      : gpsMetersError,
    queryLat, queryLng, queryCenter, setQueryCenter, isCustom, isTapCenter,
  };
}
