import { useState, useEffect } from 'react';
import { callRpc } from '../lib/supabase';
import type { DisabilityParkingResult } from '../types/database';

export function useNearbyDisabilityParking(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled: boolean = true,
) {
  const [spots, setSpots] = useState<DisabilityParkingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) {
      setSpots([]);
      return;
    }

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetchSpots() {
      setSpots([]);
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await callRpc<DisabilityParkingResult>(
        'get_nearby_disability_parking',
        { user_lat: lat, user_lng: lng, radius_meters: radiusMeters },
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
      } else {
        setSpots(data ?? []);
      }
      setLoading(false);
    }

    fetchSpots();
    return () => { cancelled = true; };
  }, [latitude, longitude, radiusMeters, enabled]);

  return { spots, loading, error };
}
