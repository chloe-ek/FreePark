import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

// Vancouver city centre fallback
const VANCOUVER_DEFAULT = { latitude: 49.2827, longitude: -123.1207 };

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState({
          ...VANCOUVER_DEFAULT,
          error: "Location permission denied — showing Vancouver centre.",
          loading: false,
        });
        return;
      }

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState({
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
        error: null,
        loading: false,
      });

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
        (loc) => {
          setState((prev) => ({
            ...prev,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }));
        }
      );
    }

    start();
    return () => { subscription?.remove(); };
  }, []);

  return state;
}
