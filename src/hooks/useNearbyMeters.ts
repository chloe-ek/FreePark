import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { NearbyMeterResult } from '../types/database';

export function useNearbyMeters(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
) {
  const [meters, setMeters] = useState<NearbyMeterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetchMeters() {
      setMeters([]);
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_nearby_meters' as never,
        { user_lat: lat, user_lng: lng, radius_meters: radiusMeters } as never,
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as NearbyMeterResult[];
      setMeters(rows.filter((m) => m.service_status === 'active'));
      setLoading(false);
    }

    fetchMeters();
    return () => { cancelled = true; };
  }, [latitude, longitude, radiusMeters]);

  return { meters, loading, error };
}
