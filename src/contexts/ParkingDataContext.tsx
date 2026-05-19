import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { callRpc } from '../lib/supabase';
import { useLocation } from '../hooks/useLocation';
import { useSettings } from './SettingsContext';
import { isValidCoordinates } from '../utils/validation';
import { LayerKind } from '../constants/layers';
import type {
  NearbyMeterResult,
  DisabilityParkingResult,
  MotorcycleParkingResult,
  EvChargingResult,
} from '../types/database';

const REFETCH_DISTANCE_METERS = 200;

const LAYER_RPC: Record<LayerKind, string> = {
  meter:      'get_nearby_meters',
  disability: 'get_nearby_disability_parking',
  motorcycle: 'get_nearby_motorcycle_parking',
  ev:         'get_nearby_ev_charging',
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface LayerState {
  data: unknown[];
  loading: boolean;
  error: string | null;
}

interface LayerDataState {
  meter:      LayerState;
  disability: LayerState;
  motorcycle: LayerState;
  ev:         LayerState;
}

const EMPTY_LAYER: LayerState = { data: [], loading: false, error: null };

interface ParkingDataContextValue {
  latitude: number | null;
  longitude: number | null;
  locLoading: boolean;
  locError: string | null;
  permissionDenied: boolean;
  meters: NearbyMeterResult[];
  accessibleSpots: DisabilityParkingResult[];
  motoSpots: MotorcycleParkingResult[];
  evStations: EvChargingResult[];
  metersLoading: boolean;
  metersError: string | null;
  anyLoading: boolean;
  anyError: string | null;
  fetchLayerIfNeeded: (layer: LayerKind) => void;
  locationKey: number;
}

const ParkingDataContext = createContext<ParkingDataContextValue>({
  latitude: null,
  longitude: null,
  locLoading: true,
  locError: null,
  permissionDenied: false,
  meters: [],
  accessibleSpots: [],
  motoSpots: [],
  evStations: [],
  metersLoading: false,
  metersError: null,
  anyLoading: false,
  anyError: null,
  fetchLayerIfNeeded: () => {},
  locationKey: 0,
});

export function ParkingDataProvider({ children }: { children: React.ReactNode }) {
  const { latitude, longitude, loading: locLoading, error: locError, permissionDenied } = useLocation();
  const { settings } = useSettings();

  const [layerData, setLayerData] = useState<LayerDataState>({
    meter:      { ...EMPTY_LAYER },
    disability: { ...EMPTY_LAYER },
    motorcycle: { ...EMPTY_LAYER },
    ev:         { ...EMPTY_LAYER },
  });

  // Increments when GPS moves 200m+ or radius changes — screens depend on
  // this to know when to re-call fetchLayerIfNeeded for their active layer.
  const [locationKey, setLocationKey] = useState(0);

  const fetchedLayersRef  = useRef<Set<LayerKind>>(new Set());
  const lastGPSRef        = useRef<{ lat: number; lng: number } | null>(null);
  const fetchCoordsRef    = useRef<{ lat: number; lng: number } | null>(null);
  const fetchIdRef        = useRef<Record<LayerKind, number>>({ meter: 0, disability: 0, motorcycle: 0, ev: 0 });
  const settingsRef       = useRef(settings);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // GPS update: bump locationKey only after REFETCH_DISTANCE_METERS movement.
  // Raw latitude/longitude still flows through to context for UI (map dot, recenter).
  useEffect(() => {
    if (latitude == null || longitude == null) return;

    if (lastGPSRef.current === null) {
      lastGPSRef.current  = { lat: latitude, lng: longitude };
      fetchCoordsRef.current = { lat: latitude, lng: longitude };
      setLocationKey(k => k + 1);
      return;
    }

    const dist = haversineDistance(
      lastGPSRef.current.lat, lastGPSRef.current.lng,
      latitude, longitude,
    );

    if (dist >= REFETCH_DISTANCE_METERS) {
      lastGPSRef.current  = { lat: latitude, lng: longitude };
      fetchCoordsRef.current = { lat: latitude, lng: longitude };
      fetchedLayersRef.current.clear();
      setLocationKey(k => k + 1);
    }
  }, [latitude, longitude]);

  // Radius change: all cached layer results are stale.
  useEffect(() => {
    if (fetchCoordsRef.current == null) return;
    fetchedLayersRef.current.clear();
    setLocationKey(k => k + 1);
  }, [settings.radiusMeters]);

  // Fetch a layer only if not already fetched for the current location+radius.
  // Screens call this when their active layer changes or locationKey changes.
  const fetchLayerIfNeeded = useCallback((layer: LayerKind) => {
    if (fetchedLayersRef.current.has(layer)) return;
    const coords = fetchCoordsRef.current;
    if (coords == null) return;
    if (!isValidCoordinates(coords.lat, coords.lng, settingsRef.current.radiusMeters)) return;

    fetchedLayersRef.current.add(layer);
    const myId = ++fetchIdRef.current[layer];
    const args = { user_lat: coords.lat, user_lng: coords.lng, radius_meters: settingsRef.current.radiusMeters };

    setLayerData(prev => ({ ...prev, [layer]: { ...prev[layer], loading: true, error: null } }));

    callRpc<never>(LAYER_RPC[layer], args).then(({ data, error }) => {
      if (fetchIdRef.current[layer] !== myId) return;
      setLayerData(prev => ({
        ...prev,
        [layer]: { data: data ?? [], loading: false, error: error?.message ?? null },
      }));
    });
  }, []);

  return (
    <ParkingDataContext.Provider value={{
      latitude,
      longitude,
      locLoading,
      locError,
      permissionDenied,
      meters:          layerData.meter.data      as NearbyMeterResult[],
      accessibleSpots: layerData.disability.data as DisabilityParkingResult[],
      motoSpots:       layerData.motorcycle.data as MotorcycleParkingResult[],
      evStations:      layerData.ev.data         as EvChargingResult[],
      metersLoading:   layerData.meter.loading,
      metersError:     layerData.meter.error,
      anyLoading: layerData.meter.loading || layerData.disability.loading || layerData.motorcycle.loading || layerData.ev.loading,
      anyError:   layerData.meter.error ?? layerData.disability.error ?? layerData.motorcycle.error ?? layerData.ev.error,
      fetchLayerIfNeeded,
      locationKey,
    }}>
      {children}
    </ParkingDataContext.Provider>
  );
}

export function useParkingData(): ParkingDataContextValue {
  return useContext(ParkingDataContext);
}
