import { useFetchNearby } from './useFetchNearby';
import type { NearbyMeterResult } from '../types/database';

export function useNearbyMeters(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled = true,
) {
  const { data, loading, error } = useFetchNearby<NearbyMeterResult>(
    'get_nearby_meters',
    latitude,
    longitude,
    radiusMeters,
    enabled,
  );
  return { meters: data, loading, error };
}
