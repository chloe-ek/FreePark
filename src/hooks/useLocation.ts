import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { VANCOUVER_CENTER } from "../constants/geo";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function start() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setState({
            ...VANCOUVER_CENTER,
            error: "Location permission denied — showing Vancouver centre.",
            loading: false,
            permissionDenied: true,
          });
          return;
        }

        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setState({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          error: null,
          loading: false,
          permissionDenied: false,
        });

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
          (loc) => {
            setState((prev) => ({
              ...prev,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            }));
          }
        );
      } catch {
        setState({
          ...VANCOUVER_CENTER,
          error: "Unable to access location — showing Vancouver centre.",
          loading: false,
          permissionDenied: false,
        });
      }
    }

    start();
    return () => { subscription?.remove(); };
  }, []);

  return state;
}
