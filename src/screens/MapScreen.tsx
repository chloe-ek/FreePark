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
import { FilterChip } from '../components/FilterChip';
import { SearchBar } from '../components/SearchBar';
import { SearchOverlay } from '../components/SearchOverlay';
import { LocateButton } from '../components/LocateButton';
import { TabBar, TabName } from '../components/TabBar';
import { DARK_MAP_STYLE } from '../theme';
import { isMeterFreeNow, getFreeAfterTime, getCurrentTimeLimit } from '../utils/parkingUtils';
import { getMeterTier, TierKey } from '../components/MeterMarker';
import { NearbyMeterResult, DisabilityParkingResult, MotorcycleParkingResult, EvChargingResult } from '../types/database';
import { ResolvedPlace } from '../lib/geocoding';
import { useNearbyDisabilityParking } from '../hooks/useNearbyDisabilityParking';
import { useNearbyMotorcycleParking } from '../hooks/useNearbyMotorcycleParking';
import { useNearbyEvCharging } from '../hooks/useNearbyEvCharging';
import { DisabilityMarker } from '../components/DisabilityMarker';
import { DisabilitySheet } from '../components/DisabilitySheet';
import { MotorcycleMarker } from '../components/MotorcycleMarker';
import { MotorcycleSheet } from '../components/MotorcycleSheet';
import { EvMarker } from '../components/EvMarker';
import { EvSheet } from '../components/EvSheet';

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

  const { meters, loading: metersLoading } = useNearbyMeters(
    queryLat, queryLng, settings.radiusMeters,
  );

  const [selected, setSelected] = useState<NearbyMeterResult | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<DisabilityParkingResult | null>(null);
  const [selectedMoto, setSelectedMoto] = useState<MotorcycleParkingResult | null>(null);
  const [selectedEv, setSelectedEv] = useState<EvChargingResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [dayFilter, setDayFilter] = useState<'Weekday' | 'Weekend'>('Weekday');
  const [showAccessible, setShowAccessible] = useState(false);
  const [showMotorcycle, setShowMotorcycle] = useState(false);
  const [showEv, setShowEv] = useState(false);

  // Price tier filter — each level shows dots up to that tier (inclusive)
  const TIER_OPTS: Array<TierKey | 'all'> = ['all', 'free', 'cheap', 'mid'];
  const TIER_LABELS = ['$ All', 'Free', '≤ $', '≤ $$'];
  const [tierIdx, setTierIdx] = useState(0);
  const maxTier = TIER_OPTS[tierIdx];

  const TIER_ORDER: TierKey[] = ['free', 'cheap', 'mid', 'exp'];

  // -1 = no limit only, null = any
  const TIME_LIMIT_OPTS = [null, -1, 60, 120, 240] as const;
  const TIME_LIMIT_LABELS = ['Any', 'No limit', '1hr+', '2hr+', '4hr+'] as const;
  const [timeLimitIdx, setTimeLimitIdx] = useState(0);
  const minTimeLimit = TIME_LIMIT_OPTS[timeLimitIdx];

  const PAYMENT_OPTS = ['all', 'card', 'cash'] as const;
  const PAYMENT_LABELS = ['All pay', 'Card', 'Cash'] as const;
  const [paymentIdx, setPaymentIdx] = useState(0);
  const paymentFilter = PAYMENT_OPTS[paymentIdx];

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
    queryLat, queryLng, settings.radiusMeters, showAccessible,
  );
  const { spots: motoSpots } = useNearbyMotorcycleParking(
    queryLat, queryLng, settings.radiusMeters, showMotorcycle,
  );
  const { stations: evStations } = useNearbyEvCharging(
    queryLat, queryLng, settings.radiusMeters, showEv,
  );

  const { bg } = theme.colors;

  const visibleMeters = useMemo(() => {
    let list = meters;

    if (maxTier !== 'all') {
      const maxIdx = TIER_ORDER.indexOf(maxTier as TierKey);
      list = list.filter((m) => TIER_ORDER.indexOf(getMeterTier(m)) <= maxIdx);
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
  }, [meters, maxTier, minTimeLimit, paymentFilter]);

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
    setSelected(null);
    setSelectedSpot(null);
    setSelectedMoto(null);
    setSelectedEv(null);
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setQueryCenter({ name: '', sub: '', lat, lng });
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
      {/* Filter strip — paddingTop pushes below notch/status bar */}
      <View style={[styles.filterStrip, { backgroundColor: bg, paddingTop: insets.top + 6 }]}>
        <FilterChip
          label={TIER_LABELS[tierIdx]}
          active={tierIdx > 0}
          onPress={() => setTierIdx((i) => (i + 1) % TIER_OPTS.length)}
        />
        {(['Weekday', 'Weekend'] as const).map((d) => (
          <FilterChip
            key={d}
            label={d}
            active={dayFilter === d}
            onPress={() => setDayFilter(d)}
          />
        ))}
        <FilterChip
          label={PAYMENT_LABELS[paymentIdx]}
          active={paymentIdx > 0}
          onPress={() => setPaymentIdx((i) => (i + 1) % PAYMENT_OPTS.length)}
        />
        <FilterChip
          label={`T ${TIME_LIMIT_LABELS[timeLimitIdx]}`}
          active={minTimeLimit !== null}
          onPress={() => setTimeLimitIdx((i) => (i + 1) % TIME_LIMIT_OPTS.length)}
        />
        <FilterChip
          label="♿"
          active={showAccessible}
          onPress={() => setShowAccessible((v) => !v)}
        />
        <FilterChip
          label="🏍"
          active={showMotorcycle}
          onPress={() => setShowMotorcycle((v) => !v)}
        />
        <FilterChip
          label="⚡"
          active={showEv}
          onPress={() => setShowEv((v) => !v)}
        />
        {queryCenter && (
          <TouchableOpacity
            onPress={clearQueryCenter}
            style={styles.locationChip}
          >
            <Text style={styles.locationChipText} numberOfLines={1}>
              × {isTapCenter ? 'Selected area' : queryCenter.name.split(',')[0]}
            </Text>
          </TouchableOpacity>
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
            latitude: queryLat ?? 49.2827,
            longitude: queryLng ?? -123.1207,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
        >
          {visibleMeters.map((meter) => (
            <MeterMarker
              key={meter.id}
              meter={meter}
              onPress={handlePinPress}
            />
          ))}
          {showAccessible && accessibleSpots.map((spot) => (
            <DisabilityMarker
              key={`acc-${spot.id}`}
              spot={spot}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelected(null); setSelectedMoto(null); setSelectedEv(null);
                setSelectedSpot((prev) => (prev?.id === s.id ? null : s));
              }}
            />
          ))}
          {showMotorcycle && motoSpots.map((spot) => (
            <MotorcycleMarker
              key={`moto-${spot.id}`}
              spot={spot}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelected(null); setSelectedSpot(null); setSelectedEv(null);
                setSelectedMoto((prev) => (prev?.id === s.id ? null : s));
              }}
            />
          ))}
          {showEv && evStations.map((station) => (
            <EvMarker
              key={`ev-${station.id}`}
              station={station}
              onPress={(s) => {
                markerPressedRef.current = true;
                setSelected(null); setSelectedSpot(null); setSelectedMoto(null);
                setSelectedEv((prev) => (prev?.id === s.id ? null : s));
              }}
            />
          ))}
          {isTapCenter && queryCenter && (
            <Marker
              coordinate={{ latitude: queryCenter.lat, longitude: queryCenter.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.tapPin}>
                <View style={styles.tapPinInner} />
              </View>
            </Marker>
          )}
        </MapView>

        <FloatingPill
          freeCount={freeCount}
          label={pillLabel}
          highlight={pillHighlight}
        />

        <LocateButton onPress={recenter} bottom={selected ? 178 : 64} />

        {metersLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Loading…</Text>
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
          <MeterSheet meter={selected} onDismiss={() => setSelected(null)} />
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
  filterStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexShrink: 0,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(94,194,106,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5ec26a',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
