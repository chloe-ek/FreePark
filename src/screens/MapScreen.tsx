import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Linking, StyleSheet,
  Text, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { FloatingPill } from '../components/ui/FloatingPill';
import { LocateButton } from '../components/ui/LocateButton';
import { MapFilterPanel } from '../components/ui/MapFilterPanel';
import { MapMarkers } from '../components/markers/MapMarkers';
import { MapSheets } from '../components/sheets/MapSheets';
import { SearchBar } from '../components/search/SearchBar';
import { SearchOverlay } from '../components/search/SearchOverlay';
import { TabBar, TabName } from '../components/ui/TabBar';
import { isInsideVancouver, VANCOUVER_CENTER } from '../constants/geo';
import { LayerKind, LAYER_EMPTY_LABELS } from '../constants/layers';
import { LOCATE_BUTTON_BOTTOM, MAP_DELTAS, SHEET_HEIGHT_PX } from '../constants/map';
import { useParkingData } from '../contexts/ParkingDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMapData } from '../hooks/useMapData';
import { useMapFilters } from '../hooks/useMapFilters';
import { useSpotReports } from '../hooks/useSpotReports';
import { ResolvedPlace } from '../lib/geocoding';
import { DARK_MAP_STYLE } from '../theme';
import type {
  DisabilityParkingResult,
  EvChargingResult,
  MotorcycleParkingResult,
  NearbyMeterResult,
} from '../types/database';
import type { Selection } from '../types/map';
import { getFreeAfterTime, isMeterFreeNow } from '../utils/parkingUtils';

interface Props {
  onNavigate: (tab: TabName) => void;
  pendingFocusMeter?: NearbyMeterResult | null;
  onClearFocus?: () => void;
}

export function MapScreen({ onNavigate, pendingFocusMeter, onClearFocus }: Props) {
  const mapRef       = useRef<MapView>(null);
  const mapReadyRef  = useRef(false);
  const pendingFocusRef   = useRef<{ lat: number; lng: number } | null>(null);
  const markerPressedRef  = useRef(false);
  const { height: windowHeight } = useWindowDimensions();
  const { theme } = useTheme();
  const { latitude, longitude, locLoading, locError, permissionDenied, fetchLayerIfNeeded, locationKey } = useParkingData();

  const [activeLayer, setActiveLayer] = useState<LayerKind>('meter');
  const [selection, setSelection]     = useState<Selection>(null);
  const [searching, setSearching]     = useState(false);

  const {
    meters, accessibleSpots, motoSpots, evStations,
    metersLoading, metersError,
    queryLat, queryLng, queryCenter, setQueryCenter, isTapCenter,
  } = useMapData(activeLayer);

  const meterIds = useMemo(() => meters.map((m) => m.meter_id), [meters]);
  const { getReport, submitReport } = useSpotReports(meterIds);
  const filters = useMapFilters(meters, motoSpots);
  const { visibleMeters, visibleMotoSpots, closeDropdown } = filters;

  useEffect(() => {
    fetchLayerIfNeeded(activeLayer);
  }, [activeLayer, locationKey, fetchLayerIfNeeded]);

  useEffect(() => {
    if (!pendingFocusMeter) return;
    animateToMarker(pendingFocusMeter.latitude, pendingFocusMeter.longitude);
    setSelection({ kind: 'meter', item: pendingFocusMeter });
    setQueryCenter({ name: '', sub: '', lat: pendingFocusMeter.latitude, lng: pendingFocusMeter.longitude });
    onClearFocus?.();
  }, [pendingFocusMeter]);

  const freeCount    = useMemo(() => visibleMeters.filter(isMeterFreeNow).length, [visibleMeters]);
  const freeAfterTime = useMemo(() => getFreeAfterTime(meters), [meters]);

  const emptyHint = useMemo((): 'area' | 'filters' | null => {
    if (queryLat == null || queryLng == null || !isInsideVancouver(queryLat, queryLng)) return null;
    switch (activeLayer) {
      case 'meter':
        if (metersLoading) return null;
        if (meters.length > 0 && visibleMeters.length === 0) return 'filters';
        return meters.length === 0 ? 'area' : null;
      case 'disability': return accessibleSpots.length === 0 ? 'area' : null;
      case 'motorcycle':
        if (motoSpots.length > 0 && visibleMotoSpots.length === 0) return 'filters';
        return motoSpots.length === 0 ? 'area' : null;
      case 'ev': return evStations.length === 0 ? 'area' : null;
    }
  }, [activeLayer, meters, visibleMeters, accessibleSpots, motoSpots, visibleMotoSpots, evStations, metersLoading, queryLat, queryLng]);

  function animateToMarker(lat: number, lng: number) {
    if (!mapReadyRef.current) { pendingFocusRef.current = { lat, lng }; return; }
    const latOffset = (SHEET_HEIGHT_PX / windowHeight / 2) * MAP_DELTAS.FOCUS.latitudeDelta;
    mapRef.current?.animateToRegion({ latitude: lat - latOffset, longitude: lng, ...MAP_DELTAS.FOCUS });
  }

  function handleMapReady() {
    mapReadyRef.current = true;
    if (pendingFocusRef.current) {
      const { lat, lng } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      animateToMarker(lat, lng);
    }
  }

  function recenter() {
    if (latitude == null || longitude == null) return;
    mapRef.current?.animateToRegion({ latitude, longitude, ...MAP_DELTAS.DEFAULT });
  }

  function handleSearchSelect(place: ResolvedPlace) {
    setQueryCenter(place);
    setSelection(null);
    mapRef.current?.animateToRegion({ latitude: place.lat, longitude: place.lng, ...MAP_DELTAS.DEFAULT });
  }

  function handleLayerChange(layer: LayerKind) {
    setActiveLayer(layer);
    setSelection(null);
  }

  function handleMapPress(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    if (searching) return;
    if (markerPressedRef.current) { markerPressedRef.current = false; return; }
    closeDropdown();
    if (selection) { setSelection(null); return; }
    setQueryCenter({ name: '', sub: '', lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude });
  }

  function handleMeterPress(meter: NearbyMeterResult) {
    if (searching) return;
    markerPressedRef.current = true;
    const isSame = selection?.kind === 'meter' && selection.item.id === meter.id;
    if (!isSame) animateToMarker(meter.latitude, meter.longitude);
    setSelection(isSame ? null : { kind: 'meter', item: meter });
  }

  function handleDisabilityPress(spot: DisabilityParkingResult) {
    if (searching) return;
    markerPressedRef.current = true;
    const isSame = selection?.kind === 'disability' && selection.item.id === spot.id;
    if (!isSame) animateToMarker(spot.latitude, spot.longitude);
    setSelection(isSame ? null : { kind: 'disability', item: spot });
  }

  function handleMotoPress(spot: MotorcycleParkingResult) {
    if (searching) return;
    markerPressedRef.current = true;
    const isSame = selection?.kind === 'motorcycle' && selection.item.id === spot.id;
    if (!isSame) animateToMarker(spot.latitude, spot.longitude);
    setSelection(isSame ? null : { kind: 'motorcycle', item: spot });
  }

  function handleEvPress(station: EvChargingResult) {
    if (searching) return;
    markerPressedRef.current = true;
    const isSame = selection?.kind === 'ev' && selection.item.id === station.id;
    if (!isSame) animateToMarker(station.latitude, station.longitude);
    setSelection(isSame ? null : { kind: 'ev', item: station });
  }

  if (locLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.text3} />
      </View>
    );
  }

  const pillLabel = queryCenter
    ? (isTapCenter ? 'Nearby' : queryCenter.name.split('&')[0].trim())
    : freeAfterTime ? 'All free after' : 'All free';
  const pillHighlight = queryCenter ? undefined : freeAfterTime ?? undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <MapFilterPanel
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
        filters={filters}
        queryCenter={queryCenter}
        isTapCenter={isTapCenter}
        onClearQueryCenter={() => { setQueryCenter(null); recenter(); }}
      />

      {queryLat != null && queryLng != null && !isInsideVancouver(queryLat, queryLng) && (
        <View style={styles.coverageBanner}>
          <Text style={styles.coverageBannerText}>Outside Vancouver — no parking data available</Text>
        </View>
      )}

      {locError && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText} numberOfLines={1}>{locError}</Text>
          {permissionDenied && (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.locationBannerAction}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          customMapStyle={theme.scheme === 'dark' ? DARK_MAP_STYLE : undefined}
          showsUserLocation
          showsMyLocationButton={false}
          onMapReady={handleMapReady}
          onPress={handleMapPress}
          initialRegion={{
            latitude:  queryLat ?? VANCOUVER_CENTER.latitude,
            longitude: queryLng ?? VANCOUVER_CENTER.longitude,
            ...MAP_DELTAS.DEFAULT,
          }}
        >
          <MapMarkers
            activeLayer={activeLayer}
            visibleMeters={visibleMeters}
            accessibleSpots={accessibleSpots}
            visibleMotoSpots={visibleMotoSpots}
            evStations={evStations}
            onMeterPress={handleMeterPress}
            onDisabilityPress={handleDisabilityPress}
            onMotoPress={handleMotoPress}
            onEvPress={handleEvPress}
            getReport={getReport}
            isTapCenter={isTapCenter}
            queryCenter={queryCenter}
          />
        </MapView>

        {activeLayer === 'meter' && !searching && (
          <FloatingPill freeCount={freeCount} label={pillLabel} highlight={pillHighlight} />
        )}

        <LocateButton
          onPress={recenter}
          bottom={selection ? LOCATE_BUTTON_BOTTOM.ACTIVE : LOCATE_BUTTON_BOTTOM.DEFAULT}
        />

        {metersLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        )}
        {!metersLoading && metersError && (
          <View style={[styles.loadingBadge, styles.errorBadge]}>
            <Text style={styles.loadingText}>Failed to load meters</Text>
          </View>
        )}
        {!selection && emptyHint && (
          <View style={styles.emptyHintBadge}>
            <Text style={styles.emptyHintText}>
              {emptyHint === 'filters'
                ? 'No results — try adjusting filters'
                : `No ${LAYER_EMPTY_LABELS[activeLayer]} in this area`}
            </Text>
          </View>
        )}

        {!selection && !searching && <SearchBar onOpen={() => setSearching(true)} />}
        {searching && (
          <SearchOverlay onClose={() => setSearching(false)} onSelect={handleSearchSelect} />
        )}

        <MapSheets
          selection={selection}
          onDismiss={() => setSelection(null)}
          getReport={getReport}
          submitReport={submitReport}
        />
      </View>

      <TabBar active="map" onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapArea:      { flex: 1, minHeight: 0 },
  loadingBadge: {
    position: 'absolute', bottom: 70, alignSelf: 'center',
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    gap: 8, alignItems: 'center', zIndex: 10,
  },
  loadingText:       { color: '#fff', fontSize: 12 },
  errorBadge:        { backgroundColor: 'rgba(239,68,68,0.75)' },
  coverageBanner:    { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center' },
  coverageBannerText:{ color: '#fff', fontSize: 12, fontWeight: '500' },
  locationBanner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#7c3a00', paddingHorizontal: 14, paddingVertical: 8, gap: 12 },
  locationBannerText:{ flex: 1, color: '#fde68a', fontSize: 12 },
  locationBannerAction: { color: '#fde68a', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  emptyHintBadge:    { position: 'absolute', bottom: 70, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, zIndex: 10 },
  emptyHintText:     { color: '#fff', fontSize: 12 },
});
