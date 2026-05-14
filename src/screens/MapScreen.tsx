import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
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
import { DARK_MAP_STYLE } from '../theme';
import { isMeterFreeNow, getFreeAfterTime, getCurrentTimeLimit, getCurrentRate, getMotoCurrentRate, getMotoCurrentTimeLimit } from '../utils/parkingUtils';
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
  const { latitude, longitude, loading: locLoading } = useLocation();

  // When non-null, meters are queried around this location instead of GPS.
  // name === '' means the center was set by a map tap (no named place).
  const [queryCenter, setQueryCenter] = useState<ResolvedPlace | null>(null);

  const queryLat = queryCenter?.lat ?? latitude;
  const queryLng = queryCenter?.lng ?? longitude;

  type LayerKind = 'meter' | 'accessible' | 'motorcycle' | 'ev';
  const [activeLayer, setActiveLayer] = useState<LayerKind>('meter');

  const [selected, setSelected] = useState<NearbyMeterResult | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<DisabilityParkingResult | null>(null);
  const [selectedMoto, setSelectedMoto] = useState<MotorcycleParkingResult | null>(null);
  const [selectedEv, setSelectedEv] = useState<EvChargingResult | null>(null);
  const [searching, setSearching] = useState(false);

  function handleLayerChange(layer: LayerKind) {
    setActiveLayer(layer);
    setSelected(null); setSelectedSpot(null); setSelectedMoto(null); setSelectedEv(null);
  }

  const { meters, loading: metersLoading, error: metersError } = useNearbyMeters(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'meter',
  );

  const meterIds = useMemo(() => meters.map((m) => m.meter_id), [meters]);
  const { getReport, submitReport } = useSpotReports(meterIds);

  // null = any price, 0 = free only, 2/3 = under $X/hr
  const [maxRate, setMaxRate] = useState<null | 0 | 2 | 3>(null);
  const [minTimeLimit, setMinTimeLimit] = useState<null | 120 | 180 | -1>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'card' | 'cash'>('all');
  const [openDropdown, setOpenDropdown] = useState<'price' | 'time' | 'payment' | null>(null);

  function toggleDropdown(id: 'price' | 'time' | 'payment') {
    setOpenDropdown(prev => prev === id ? null : id);
  }

  useEffect(() => {
    if (!pendingFocusMeter) return;
    mapRef.current?.animateToRegion({
      latitude: pendingFocusMeter.latitude,
      longitude: pendingFocusMeter.longitude,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    });
    setSelected(pendingFocusMeter);
    setQueryCenter({ name: '', sub: '', lat: pendingFocusMeter.latitude, lng: pendingFocusMeter.longitude });
    onClearFocus?.();
  }, [pendingFocusMeter]);

  const { spots: accessibleSpots } = useNearbyDisabilityParking(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'accessible',
  );
  const { spots: motoSpots } = useNearbyMotorcycleParking(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'motorcycle',
  );
  const { stations: evStations } = useNearbyEvCharging(
    queryLat, queryLng, settings.radiusMeters, activeLayer === 'ev',
  );

  const { bg } = theme.colors;

  const visibleMeters = useMemo(() => {
    let list = meters;

    if (maxRate === 0) {
      list = list.filter((m) => isMeterFreeNow(m));
    } else if (maxRate !== null) {
      list = list.filter((m) => {
        const rate = getCurrentRate(m);
        return rate === null || rate === 0 || rate < maxRate;
      });
    }

    if (minTimeLimit === -1) {
      list = list.filter((m) => getCurrentTimeLimit(m) === null);
    } else if (minTimeLimit !== null) {
      list = list.filter((m) => {
        const limit = getCurrentTimeLimit(m);
        return limit === null || limit >= minTimeLimit;
      });
    }

    if (paymentFilter === 'card') {
      list = list.filter((m) => m.credit_card === true);
    } else if (paymentFilter === 'cash') {
      list = list.filter((m) => m.credit_card === false);
    }

    return list;
  }, [meters, maxRate, minTimeLimit, paymentFilter]);

  const visibleMotoSpots = useMemo(() => {
    let list = motoSpots;

    if (maxRate === 0) {
      list = list.filter((m) => { const r = getMotoCurrentRate(m); return r == null || r === 0; });
    } else if (maxRate !== null) {
      list = list.filter((m) => { const r = getMotoCurrentRate(m); return r == null || r === 0 || r < maxRate; });
    }

    if (minTimeLimit === -1) {
      list = list.filter((m) => getMotoCurrentTimeLimit(m) === null);
    } else if (minTimeLimit !== null) {
      list = list.filter((m) => { const tl = getMotoCurrentTimeLimit(m); return tl === null || tl >= minTimeLimit; });
    }

    if (paymentFilter === 'card') {
      list = list.filter((m) => m.credit_card === true);
    } else if (paymentFilter === 'cash') {
      list = list.filter((m) => m.credit_card === false);
    }

    return list;
  }, [motoSpots, maxRate, minTimeLimit, paymentFilter]);

  const freeCount = useMemo(
    () => visibleMeters.filter(isMeterFreeNow).length,
    [visibleMeters],
  );
  const freeAfterTime = useMemo(() => getFreeAfterTime(meters), [meters]);

  function recenter() {
    if (latitude == null || longitude == null) return;
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
  }

  function handleSearchSelect(place: ResolvedPlace) {
    setQueryCenter(place);
    setSelected(null);
    mapRef.current?.animateToRegion({
      latitude: place.lat,
      longitude: place.lng,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
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
    setOpenDropdown(null);
    if (selected || selectedSpot || selectedMoto || selectedEv) {
      setSelected(null);
      setSelectedSpot(null);
      setSelectedMoto(null);
      setSelectedEv(null);
      return;
    }
    setQueryCenter({ name: '', sub: '', lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude });
  }

  function handlePinPress(meter: NearbyMeterResult) {
    if (searching) return;
    markerPressedRef.current = true;
    setSelected((prev) => (prev?.id === meter.id ? null : meter));
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
            { key: 'accessible', label: 'Accessible' },
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
              onChange={(v) => { setMaxRate(v as null | 0 | 2 | 3); setOpenDropdown(null); }}
              options={[
                { value: null, label: 'Any price' },
                { value: 0,    label: 'Free only' },
                { value: 2,    label: 'Under $2 / hr' },
                { value: 3,    label: 'Under $3 / hr' },
              ]}
            />
            <FilterDropdown
              label="Duration"
              selectedValue={minTimeLimit}
              defaultValue={null}
              isOpen={openDropdown === 'time'}
              onToggle={() => toggleDropdown('time')}
              onChange={(v) => { setMinTimeLimit(v as null | 120 | 180 | -1); setOpenDropdown(null); }}
              options={[
                { value: null, label: 'Any duration' },
                { value: 120,  label: 'Need 2 hrs' },
                { value: 180,  label: 'Need 3 hrs' },
                { value: -1,   label: 'No time limit' },
              ]}
            />
            <FilterDropdown
              label="Payment"
              selectedValue={paymentFilter}
              defaultValue="all"
              isOpen={openDropdown === 'payment'}
              onToggle={() => toggleDropdown('payment')}
              onChange={(v) => { setPaymentFilter(v as 'all' | 'card' | 'cash'); setOpenDropdown(null); }}
              options={[
                { value: 'all',  label: 'Any payment' },
                { value: 'card', label: 'Card only' },
                { value: 'cash', label: 'Cash only' },
              ]}
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

      {/* Map area */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          customMapStyle={DARK_MAP_STYLE}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
          initialRegion={{
            latitude: queryLat ?? VANCOUVER_CENTER.latitude,
            longitude: queryLng ?? VANCOUVER_CENTER.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
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
          {activeLayer === 'accessible' && accessibleSpots.map((spot) => (
            <DisabilityMarker
              key={`acc-${spot.id}`}
              spot={spot}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelectedSpot((prev) => (prev?.id === s.id ? null : s));
              }}
            />
          ))}
          {activeLayer === 'motorcycle' && visibleMotoSpots.map((spot) => (
            <MotorcycleMarker
              key={`moto-${spot.id}`}
              spot={spot}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelectedMoto((prev) => (prev?.id === s.id ? null : s));
              }}
            />
          ))}
          {activeLayer === 'ev' && evStations.map((station) => (
            <EvMarker
              key={`ev-${station.id}`}
              station={station}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelectedEv((prev) => (prev?.id === s.id ? null : s));
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

        <LocateButton onPress={recenter} bottom={selected ? 178 : 64} />

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

        {!selected && !searching && (
          <SearchBar onOpen={() => setSearching(true)} />
        )}

        {searching && (
          <SearchOverlay
            onClose={() => setSearching(false)}
            onSelect={handleSearchSelect}
          />
        )}

        {selected && (
          <MeterSheet
            meter={selected}
            onDismiss={() => setSelected(null)}
            report={getReport(selected.meter_id)}
            onReport={(type) => submitReport(selected.meter_id, type)}
          />
        )}
        {selectedSpot && !selected && (
          <DisabilitySheet spot={selectedSpot} onDismiss={() => setSelectedSpot(null)} />
        )}
        {selectedMoto && !selected && !selectedSpot && (
          <MotorcycleSheet spot={selectedMoto} onDismiss={() => setSelectedMoto(null)} />
        )}
        {selectedEv && !selected && !selectedSpot && !selectedMoto && (
          <EvSheet station={selectedEv} onDismiss={() => setSelectedEv(null)} />
        )}
      </View>

      <TabBar active="map" onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterPanel: {
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
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
    backgroundColor: 'rgba(94,194,106,0.15)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 140,
  },
  locationChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5ec26a',
  },
  tapPin: {
    fontSize: 28,
  },
});
