import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MotorcycleParkingResult } from '../types/database';

export function useNearbyMotorcycleParking(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 500,
  enabled: boolean = true,
) {
  const [spots, setSpots] = useState<MotorcycleParkingResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) {
      setSpots([]);
      return;
    }

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetch() {
      setSpots([]);
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'get_nearby_motorcycle_parking' as never,
        { user_lat: lat, user_lng: lng, radius_meters: radiusMeters } as never,
      );
      if (cancelled) return;
      if (!error) setSpots((data ?? []) as MotorcycleParkingResult[]);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [latitude, longitude, radiusMeters, enabled]);

  return { spots, loading };
}
