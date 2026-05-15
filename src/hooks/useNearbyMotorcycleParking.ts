import { useFetchNearby } from './useFetchNearby';
import type { MotorcycleParkingResult } from '../types/database';

export function useNearbyMotorcycleParking(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled = true,
) {
  const { data, loading, error } = useFetchNearby<MotorcycleParkingResult>(
    'get_nearby_motorcycle_parking',
    latitude,
    longitude,
    radiusMeters,
    enabled,
  );
  return { spots: data, loading, error };
}
