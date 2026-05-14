import { useState, useEffect } from 'react';
import { callRpc } from '../lib/supabase';
import type { NearbyMeterResult } from '../types/database';

export function useNearbyMeters(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled = true,
) {
  const [meters, setMeters] = useState<NearbyMeterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) { setMeters([]); setLoading(false); return; }
    if (latitude == null || longitude == null) return;

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetchMeters() {
      setMeters([]);
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await callRpc<NearbyMeterResult>(
        'get_nearby_meters',
        { user_lat: lat, user_lng: lng, radius_meters: radiusMeters },
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      setMeters(data ?? []);
      setLoading(false);
    }

    fetchMeters();
    return () => { cancelled = true; };
  }, [latitude, longitude, radiusMeters, enabled]);

  return { meters, loading, error };
}
