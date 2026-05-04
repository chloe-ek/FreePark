import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
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
import { isMeterFreeNow } from '../utils/parkingUtils';
import { NearbyMeterResult } from '../types/database';
import { Suggestion } from '../data/suggestions';

interface Props {
  onNavigate: (tab: TabName) => void;
}

export function MapScreen({ onNavigate }: Props) {
  const mapRef = useRef<MapView>(null);
  const { theme } = useTheme();
  const { settings, setShowFreeOnly } = useSettings();
  const { latitude, longitude, loading: locLoading } = useLocation();
  const { meters, loading: metersLoading } = useNearbyMeters(
    latitude, longitude, settings.radiusMeters,
  );

  const [selected, setSelected] = useState<NearbyMeterResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Suggestion | null>(null);
  const [dayFilter, setDayFilter] = useState<'Weekday' | 'Weekend'>('Weekday');

  const { bg } = theme.colors;

  const visibleMeters = settings.showFreeOnly
    ? meters.filter(isMeterFreeNow)
    : meters;
  const freeCount = meters.filter(isMeterFreeNow).length;

  function recenter() {
    if (latitude == null || longitude == null) return;
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
  }

  function handlePinPress(meter: NearbyMeterResult) {
    if (searching) return;
    setSelected((prev) => (prev?.id === meter.id ? null : meter));
  }

  if (locLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.text3} />
      </View>
    );
  }

  const pillHighlight = searchResult == null ? '10 PM' : undefined;
  const pillLabel = searchResult
    ? searchResult.name.split('&')[0].trim()
    : 'All free after';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Filter strip */}
      <View style={[styles.filterStrip, { backgroundColor: bg }]}>
        <FilterChip
          label="● Free now"
          active={settings.showFreeOnly}
          onPress={() => setShowFreeOnly(!settings.showFreeOnly)}
        />
        {(['Weekday', 'Weekend'] as const).map((d) => (
          <FilterChip
            key={d}
            label={d}
            active={dayFilter === d}
            onPress={() => setDayFilter(d)}
          />
        ))}
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
          initialRegion={{
            latitude: latitude ?? 49.2827,
            longitude: longitude ?? -123.1207,
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
            onSelect={(s) => setSearchResult(s)}
          />
        )}

        {selected && (
          <MeterSheet meter={selected} onDismiss={() => setSelected(null)} />
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
