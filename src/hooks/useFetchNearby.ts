import { useState, useEffect } from 'react';
import { callRpc } from '../lib/supabase';
import { isValidCoordinates } from '../utils/validation';

interface NearbyState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFetchNearby<T>(
  rpcName: string,
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number,
  enabled: boolean,
): NearbyState<T> {
  const [state, setState] = useState<NearbyState<T>>({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    if (latitude == null || longitude == null) return;
    if (!isValidCoordinates(latitude, longitude, radiusMeters)) return;

    const lat = latitude;
    const lng = longitude;
    let cancelled = false;

    async function fetch() {
      setState({ data: [], loading: true, error: null });

      const { data, error: rpcError } = await callRpc<T>(rpcName, {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusMeters,
      });

      if (cancelled) return;

      if (rpcError) {
        setState({ data: [], loading: false, error: rpcError.message });
      } else {
        setState({ data: data ?? [], loading: false, error: null });
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [rpcName, latitude, longitude, radiusMeters, enabled]);

  return state;
}
