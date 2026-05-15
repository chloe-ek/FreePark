import { useFetchNearby } from './useFetchNearby';
import type { DisabilityParkingResult } from '../types/database';

export function useNearbyDisabilityParking(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled = true,
) {
  const { data, loading, error } = useFetchNearby<DisabilityParkingResult>(
    'get_nearby_disability_parking',
    latitude,
    longitude,
    radiusMeters,
    enabled,
  );
  return { spots: data, loading, error };
}
