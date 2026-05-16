import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { useNearbyMeters } from '../hooks/useNearbyMeters';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { MeterMarker } from '../components/MeterMarker';
import { MeterSheet } from '../components/MeterSheet';
import { FloatingPill } from '../components/FloatingPill';
import { SelectChip } from '../components/SelectChip';
import { FilterDropdown } from '../components/FilterDropdown';
import { SearchBar } from '../components/SearchBar';
import { SearchOverlay } from '../components/SearchOverlay';
import { LocateButton } from '../components/LocateButton';
import { TabBar, TabName } from '../components/TabBar';
import { DARK_MAP_STYLE, GREEN } from '../theme';
import { isMeterFreeNow, getFreeAfterTime } from '../utils/parkingUtils';
import { NearbyMeterResult, DisabilityParkingResult, MotorcycleParkingResult, EvChargingResult } from '../types/database';
import { ResolvedPlace } from '../lib/geocoding';
import { VANCOUVER_CENTER } from '../constants/geo';
import { useNearbyDisabilityParking } from '../hooks/useNearbyDisabilityParking';
import { useNearbyMotorcycleParking } from '../hooks/useNearbyMotorcycleParking';
import { useNearbyEvCharging } from '../hooks/useNearbyEvCharging';
import { DisabilityMarker } from '../components/DisabilityMarker';
import { DisabilitySheet } from '../components/DisabilitySheet';
import { MotorcycleMarker } from '../components/MotorcycleMarker';
import { MotorcycleSheet } from '../components/MotorcycleSheet';
import { EvMarker } from '../components/EvMarker';
import { EvSheet } from '../components/EvSheet';
import { useSpotReports } from '../hooks/useSpotReports';
import { useMapFilters } from '../hooks/useMapFilters';
import { LayerKind } from '../constants/layers';
import { MAP_DELTAS, LOCATE_BUTTON_BOTTOM } from '../constants/map';
import {
  PRICE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  PAYMENT_FILTER_OPTIONS,
} from '../constants/filters';

type Selection =
  | { kind: 'meter';      item: NearbyMeterResult }
  | { kind: 'disability'; item: DisabilityParkingResult }
  | { kind: 'motorcycle'; item: MotorcycleParkingResult }
  | { kind: 'ev';         item: EvChargingResult }
  | null;

interface Props {
  onNavigate: (tab: TabName) => void;
  pendingFocusMeter?: NearbyMeterResult | null;
  onClearFocus?: () => void;
}

export function MapScreen({ onNavigate, pendingFocusMeter, onClearFocus }: Props) {
  const mapRef = useRef<MapView>(null);
  const markerPressedRef = useRef(false);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const { latitude, longitude, loading: locLoading, error: locError, permissionDenied } = useLocation();

  // When non-null, meters are queried around this location instead of GPS.
  // name === '' means the center was set by a map tap (no named place).
  const [queryCenter, setQueryCenter] = useState<ResolvedPlace | null>(null);

  const queryLat = queryCenter?.lat ?? latitude;
  const queryLng = queryCenter?.lng ?? longitude;

  const [activeLayer, setActiveLayer] = useState<LayerKind>('meter');
  const [selection, setSelection] = useState<Selection>(null);
  const [searching, setSearching] = useState(false);

  function handleLayerChange(layer: LayerKind) {
    setActiveLayer(layer);
    setSelection(null);
  }

  const { meters, loading: metersLoading, error: metersError } = useNearbyMeters(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'meter',
  );
  const { spots: accessibleSpots } = useNearbyDisabilityParking(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'disability',
  );
  const { spots: motoSpots } = useNearbyMotorcycleParking(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'motorcycle',
  );
  const { stations: evStations } = useNearbyEvCharging(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'ev',
  );

  const meterIds = useMemo(() => meters.map((m) => m.meter_id), [meters]);
  const { getReport, submitReport } = useSpotReports(meterIds);

  const {
    maxRate, setMaxRate,
    minTimeLimit, setMinTimeLimit,
    paymentFilter, setPaymentFilter,
    openDropdown, toggleDropdown, closeDropdown,
    visibleMeters,
    visibleMotoSpots,
  } = useMapFilters(meters, motoSpots);

  useEffect(() => {
    if (!pendingFocusMeter) return;
    mapRef.current?.animateToRegion({
      latitude:  pendingFocusMeter.latitude,
      longitude: pendingFocusMeter.longitude,
      ...MAP_DELTAS.FOCUS,
    });
    setSelection({ kind: 'meter', item: pendingFocusMeter });
    setQueryCenter({ name: '', sub: '', lat: pendingFocusMeter.latitude, lng: pendingFocusMeter.longitude });
    onClearFocus?.();
  }, [pendingFocusMeter]);

  const { bg } = theme.colors;

  const freeCount = useMemo(
    () => visibleMeters.filter(isMeterFreeNow).length,
    [visibleMeters],
  );
  const freeAfterTime = useMemo(() => getFreeAfterTime(meters), [meters]);

  function recenter() {
    if (latitude == null || longitude == null) return;
    mapRef.current?.animateToRegion({ latitude, longitude, ...MAP_DELTAS.DEFAULT });
  }

  function handleSearchSelect(place: ResolvedPlace) {
    setQueryCenter(place);
    setSelection(null);
    mapRef.current?.animateToRegion({ latitude: place.lat, longitude: place.lng, ...MAP_DELTAS.DEFAULT });
  }

  function clearQueryCenter() {
    setQueryCenter(null);
    recenter();
  }

  function handleMapPress(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    if (searching) return;
    if (markerPressedRef.current) {
      markerPressedRef.current = false;
      return;
    }
    closeDropdown();
    if (selection) {
      setSelection(null);
      return;
    }
    setQueryCenter({ name: '', sub: '', lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude });
  }

  function handlePinPress(meter: NearbyMeterResult) {
    if (searching) return;
    markerPressedRef.current = true;
    setSelection((prev) => (prev?.kind === 'meter' && prev.item.id === meter.id ? null : { kind: 'meter', item: meter }));
  }

  if (locLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.text3} />
      </View>
    );
  }

  const isTapCenter = queryCenter !== null && queryCenter.name === '';
  const pillLabel = queryCenter
    ? (isTapCenter ? 'Nearby' : queryCenter.name.split('&')[0].trim())
    : freeAfterTime ? 'All free after' : 'All free';
  const pillHighlight = queryCenter ? undefined : freeAfterTime ?? undefined;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Filter panel */}
      <View style={[styles.filterPanel, { backgroundColor: bg, paddingTop: insets.top + 8 }]}>

        {/* Row 1 — spot type selector */}
        <View style={styles.layerRow}>
          {([
            { key: 'meter',      label: 'Parking' },
            { key: 'disability', label: 'Accessible' },
            { key: 'motorcycle', label: 'Motorcycle' },
            { key: 'ev',         label: 'EV' },
          ] as const).map(({ key, label }) => (
            <SelectChip key={key} label={label} active={activeLayer === key} onPress={() => handleLayerChange(key)} />
          ))}
        </View>

        {/* Row 2 — dropdown filters (meters + motorcycle) */}
        {(activeLayer === 'meter' || activeLayer === 'motorcycle') && (
          <View style={[styles.filterRow, { borderTopColor: theme.colors.border }]}>
            <FilterDropdown
              label="Price"
              selectedValue={maxRate}
              defaultValue={null}
              isOpen={openDropdown === 'price'}
              onToggle={() => toggleDropdown('price')}
              onChange={(v) => { setMaxRate(v as typeof maxRate); closeDropdown(); }}
              options={PRICE_FILTER_OPTIONS}
            />
            <FilterDropdown
              label="Duration"
              selectedValue={minTimeLimit}
              defaultValue={null}
              isOpen={openDropdown === 'time'}
              onToggle={() => toggleDropdown('time')}
              onChange={(v) => { setMinTimeLimit(v as typeof minTimeLimit); closeDropdown(); }}
              options={DURATION_FILTER_OPTIONS}
            />
            <FilterDropdown
              label="Payment"
              selectedValue={paymentFilter}
              defaultValue="all"
              isOpen={openDropdown === 'payment'}
              onToggle={() => toggleDropdown('payment')}
              onChange={(v) => { setPaymentFilter(v as typeof paymentFilter); closeDropdown(); }}
              options={PAYMENT_FILTER_OPTIONS}
            />
            {queryCenter && (
              <TouchableOpacity onPress={clearQueryCenter} style={styles.locationChip}>
                <Text style={styles.locationChipText} numberOfLines={1}>
                  × {isTapCenter ? 'Selected area' : queryCenter.name.split(',')[0]}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Location error banner */}
      {locError && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText} numberOfLines={1}>
            {locError}
          </Text>
          {permissionDenied && (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.locationBannerAction}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Map area */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          customMapStyle={theme.scheme === 'dark' ? DARK_MAP_STYLE : undefined}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
          initialRegion={{
            latitude:  queryLat ?? VANCOUVER_CENTER.latitude,
            longitude: queryLng ?? VANCOUVER_CENTER.longitude,
            ...MAP_DELTAS.DEFAULT,
          }}
        >
          {activeLayer === 'meter' && visibleMeters.map((meter) => (
            <MeterMarker
              key={meter.id}
              meter={meter}
              onPress={handlePinPress}
              hasReport={!!getReport(meter.meter_id)}
            />
          ))}
          {activeLayer === 'disability' && accessibleSpots.map((spot) => (
            <DisabilityMarker
              key={`acc-${spot.id}`}
              spot={spot}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelection((prev) => (prev?.kind === 'disability' && prev.item.id === s.id ? null : { kind: 'disability', item: s }));
              }}
            />
          ))}
          {activeLayer === 'motorcycle' && visibleMotoSpots.map((spot) => (
            <MotorcycleMarker
              key={`moto-${spot.id}`}
              spot={spot}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelection((prev) => (prev?.kind === 'motorcycle' && prev.item.id === s.id ? null : { kind: 'motorcycle', item: s }));
              }}
            />
          ))}
          {activeLayer === 'ev' && evStations.map((station) => (
            <EvMarker
              key={`ev-${station.id}`}
              station={station}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelection((prev) => (prev?.kind === 'ev' && prev.item.id === s.id ? null : { kind: 'ev', item: s }));
              }}
            />
          ))}
          {isTapCenter && queryCenter && (
            <Marker
              coordinate={{ latitude: queryCenter.lat, longitude: queryCenter.lng }}
              anchor={{ x: 0.5, y: 1.0 }}
              tracksViewChanges={false}
            >
              <Text style={styles.tapPin}>📍</Text>
            </Marker>
          )}
        </MapView>

        {activeLayer === 'meter' && (
          <FloatingPill
            freeCount={freeCount}
            label={pillLabel}
            highlight={pillHighlight}
          />
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

        {!selection && !searching && (
          <SearchBar onOpen={() => setSearching(true)} />
        )}

        {searching && (
          <SearchOverlay
            onClose={() => setSearching(false)}
            onSelect={handleSearchSelect}
          />
        )}

        {selection?.kind === 'meter' && (
          <MeterSheet
            meter={selection.item}
            onDismiss={() => setSelection(null)}
            report={getReport(selection.item.meter_id)}
            onReport={(type) => submitReport(selection.item.meter_id, type)}
          />
        )}
        {selection?.kind === 'disability' && (
          <DisabilitySheet spot={selection.item} onDismiss={() => setSelection(null)} />
        )}
        {selection?.kind === 'motorcycle' && (
          <MotorcycleSheet spot={selection.item} onDismiss={() => setSelection(null)} />
        )}
        {selection?.kind === 'ev' && (
          <EvSheet station={selection.item} onDismiss={() => setSelection(null)} />
        )}
      </View>

      <TabBar active="map" onNavigate={onNavigate} />
    </View>
  );
}

const chipRow = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 7,
  paddingHorizontal: 12,
  paddingTop: 8,
  paddingBottom: 10,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterPanel: {
    flexShrink: 0,
  },
  filterRow: {
    ...chipRow,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  layerRow: {
    ...chipRow,
  },
  mapArea: {
    flex: 1,
    minHeight: 0,
  },
  loadingBadge: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: { color: '#fff', fontSize: 12 },
  errorBadge: { backgroundColor: 'rgba(239,68,68,0.75)' },
  locationChip: {
    backgroundColor: GREEN + '26',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 140,
  },
  locationChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: GREEN,
  },
  tapPin: {
    fontSize: 28,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7c3a00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
  },
  locationBannerText: {
    flex: 1,
    color: '#fde68a',
    fontSize: 12,
  },
  locationBannerAction: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
