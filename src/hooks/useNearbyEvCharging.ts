import { useState, useEffect } from 'react';
import { callRpc } from '../lib/supabase';
import type { EvChargingResult } from '../types/database';

export function useNearbyEvCharging(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled: boolean = true,
) {
  const [stations, setStations] = useState<EvChargingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) {
      setStations([]);
      return;
    }

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetchStations() {
      setStations([]);
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await callRpc<EvChargingResult>(
        'get_nearby_ev_charging',
        { user_lat: lat, user_lng: lng, radius_meters: radiusMeters },
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
      } else {
        setStations(data ?? []);
      }
      setLoading(false);
    }

    fetchStations();
    return () => { cancelled = true; };
  }, [latitude, longitude, radiusMeters, enabled]);

  return { stations, loading, error };
}
