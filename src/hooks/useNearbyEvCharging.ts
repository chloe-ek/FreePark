import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EvChargingResult } from '../types/database';

export function useNearbyEvCharging(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled: boolean = true,
) {
  const [stations, setStations] = useState<EvChargingResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) {
      setStations([]);
      return;
    }

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetch() {
      setStations([]);
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'get_nearby_ev_charging' as never,
        { user_lat: lat, user_lng: lng, radius_meters: radiusMeters } as never,
      );
      if (cancelled) return;
      if (!error) setStations((data ?? []) as EvChargingResult[]);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [latitude, longitude, radiusMeters, enabled]);

  return { stations, loading };
}
