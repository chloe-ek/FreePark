import { useFetchNearby } from './useFetchNearby';
import type { EvChargingResult } from '../types/database';

export function useNearbyEvCharging(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled = true,
) {
  const { data, loading, error } = useFetchNearby<EvChargingResult>(
    'get_nearby_ev_charging',
    latitude,
    longitude,
    radiusMeters,
    enabled,
  );
  return { stations: data, loading, error };
}
