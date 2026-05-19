import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useParkingData } from '../contexts/ParkingDataContext';
import { TabBar, TabName } from '../components/ui/TabBar';
import { getMeterTier, TIER_COLORS } from '../components/markers/MeterMarker';
import { LAYER_COLORS, LAYER_LABELS, LayerKind } from '../constants/layers';
import { NearbyMeterResult, DisabilityParkingResult, MotorcycleParkingResult, EvChargingResult } from '../types/database';
import {
  isMeterFreeNow,
  isMeterProhibited,
  getCurrentRate,
  getCurrentRateLabel,
  getCurrentTimeLimit,
  minutesUntilFree,
  formatMinutes,
  getRushHours,
  getMotoCurrentRate,
  getMotoCurrentTimeLimit,
} from '../utils/parkingUtils';
import { GREEN } from '../theme';

interface Props {
  onNavigate: (tab: TabName) => void;
  onSelectMeter: (meter: NearbyMeterResult) => void;
}

type SortKey = 'distance' | 'rate';

type AnySpot =
  | { kind: 'meter';      data: NearbyMeterResult }
  | { kind: 'disability'; data: DisabilityParkingResult }
  | { kind: 'motorcycle'; data: MotorcycleParkingResult }
  | { kind: 'ev';         data: EvChargingResult };

function getSortRate(spot: AnySpot): number {
  switch (spot.kind) {
    case 'meter': {
      if (isMeterProhibited(spot.data)) return 9999;
      if (isMeterFreeNow(spot.data)) return -1;
      return getCurrentRate(spot.data) ?? 0;
    }
    case 'motorcycle': {
      const r = getMotoCurrentRate(spot.data);
      return r == null || r === 0 ? -1 : r;
    }
    case 'disability': return -2; // always show near top when sorted by rate
    case 'ev':         return 9998;
  }
}

export function NearbyListScreen({ onNavigate, onSelectMeter }: Props) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { meters, accessibleSpots: accSpots, motoSpots, evStations, anyLoading: loading, anyError, fetchLayerIfNeeded, locationKey } = useParkingData();
  const { bg, surface, border, text, text2, text3 } = theme.colors;

  const [sortBy, setSortBy] = useState<SortKey>('rate');
  const [activeKind, setActiveKind] = useState<LayerKind>('meter');
  const [paymentFilter, setPaymentFilter] = useState<'any' | 'card' | 'cash'>('any');

  useEffect(() => {
    fetchLayerIfNeeded(activeKind);
  }, [activeKind, locationKey, fetchLayerIfNeeded]);

  const combined = useMemo<AnySpot[]>(() => {
    let all: AnySpot[];
    switch (activeKind) {
      case 'meter':      all = meters.map((d): AnySpot => ({ kind: 'meter', data: d })); break;
      case 'disability': all = accSpots.map((d): AnySpot => ({ kind: 'disability', data: d })); break;
      case 'motorcycle': all = motoSpots.map((d): AnySpot => ({ kind: 'motorcycle', data: d })); break;
      case 'ev':         all = evStations.map((d): AnySpot => ({ kind: 'ev', data: d })); break;
    }

    const filtered = paymentFilter === 'any' ? all : all.filter((spot) => {
      if (spot.kind !== 'meter' && spot.kind !== 'motorcycle') return true;
      return paymentFilter === 'card' ? spot.data.credit_card : !spot.data.credit_card;
    });

    if (sortBy === 'distance') {
      return filtered.sort((a, b) => a.data.distance_meters - b.data.distance_meters);
    }
    return filtered.sort((a, b) => getSortRate(a) - getSortRate(b));
  }, [meters, accSpots, motoSpots, evStations, sortBy, activeKind, paymentFilter]);

  function handleSelect(spot: AnySpot) {
    if (spot.kind === 'meter') {
      onSelectMeter(spot.data);
      onNavigate('map');
    }
  }

  function renderItem({ item }: { item: AnySpot }) {
    const dist = Math.round(item.data.distance_meters);
    const kindColor = LAYER_COLORS[item.kind];

    let dotColor = kindColor;
    let title = '';
    let sub = '';
    let subWarn = false;
    let payTag: string | null = null;

    switch (item.kind) {
      case 'meter': {
        const m = item.data;
        const tier = getMeterTier(m);
        dotColor = TIER_COLORS[tier];
        const prohibited = isMeterProhibited(m);
        const free = !prohibited && isMeterFreeNow(m);
        title = prohibited ? 'No parking' : getCurrentRateLabel(m);
        payTag = m.credit_card ? 'Card' : 'Cash';
        if (prohibited) {
          const rh = getRushHours(m);
          sub = rh.length > 0 ? `No parking · ${rh.map(w => w.label).join(', ')}` : 'No parking now';
          subWarn = true;
        } else {
          const timeLimit = getCurrentTimeLimit(m);
          const limitStr = timeLimit == null ? 'No limit'
            : timeLimit >= 60 ? `${timeLimit / 60}hr limit` : `${timeLimit}min limit`;
          const minsUntil = minutesUntilFree(m);
          sub = minsUntil != null && !free
            ? `Free in ${formatMinutes(minsUntil)} · ${limitStr}`
            : limitStr;
        }
        break;
      }
      case 'disability': {
        const d = item.data;
        dotColor = LAYER_COLORS.disability;
        title = 'Accessible Parking';
        sub = `${d.spaces} space${d.spaces !== 1 ? 's' : ''}${d.geo_local_area ? ` · ${d.geo_local_area}` : ''}`;
        break;
      }
      case 'motorcycle': {
        const m = item.data;
        const rate = getMotoCurrentRate(m);
        const isFree = rate == null || rate === 0;
        dotColor = isFree ? TIER_COLORS.free : LAYER_COLORS.motorcycle;
        title = isFree ? 'Free now' : `$${rate!.toFixed(2)}/hr`;
        payTag = m.credit_card ? 'Card' : 'Cash';
        const tl = getMotoCurrentTimeLimit(m);
        sub = tl == null ? 'No limit' : tl >= 60 ? `${tl / 60}hr limit` : `${tl}min limit`;
        break;
      }
      case 'ev': {
        dotColor = LAYER_COLORS.ev;
        title = 'EV Charging';
        sub = item.data.lot_operator ?? item.data.geo_local_area ?? '';
        break;
      }
    }

    const isSelectable = item.kind === 'meter';

    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: border }]}
        onPress={() => handleSelect(item)}
        activeOpacity={isSelectable ? 0.7 : 1}
      >
        <View style={[styles.kindBadge, { backgroundColor: kindColor + '22', borderColor: kindColor + '55' }]}>
          <Text style={[styles.kindLabel, { color: kindColor }]}>{LAYER_LABELS[item.kind]}</Text>
        </View>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.rate, { color: text }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.dist, { color: text3 }]}>{dist}m</Text>
          </View>
          <View style={styles.tagRow}>
            {payTag && (
              <View style={[styles.tag, { borderColor: border }]}>
                <Text style={[styles.tagText, { color: text3 }]}>{payTag}</Text>
              </View>
            )}
            {sub.length > 0 && (
              <Text style={[styles.sub, { color: subWarn ? '#ef4444' : text3 }]} numberOfLines={1}>
                {sub}
              </Text>
            )}
          </View>
        </View>
        {isSelectable && <Text style={[styles.chevron, { color: text3 }]}>›</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: border, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: text }]}>Nearby</Text>
        <Text style={[styles.subtitle, { color: text2 }]}>within {settings.radiusMeters}m</Text>
      </View>

      {/* Row 1 — kind + sort */}
      <View style={[styles.kindBar, { backgroundColor: surface, borderBottomColor: border }]}>
        {(['meter', 'disability', 'motorcycle', 'ev'] as LayerKind[]).map((k) => {
          const active = activeKind === k;
          const color = LAYER_COLORS[k];
          return (
            <TouchableOpacity
              key={k}
              style={[styles.kindChip, active && { borderBottomColor: color, borderBottomWidth: 2 }]}
              onPress={() => setActiveKind(k)}
              activeOpacity={0.7}
            >
              <Text style={[styles.kindChipLabel, { color: active ? color : text3 }]}>
                {LAYER_LABELS[k]}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.kindDivider} />
        {(['rate', 'distance'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.kindChip, sortBy === s && { borderBottomColor: GREEN, borderBottomWidth: 2 }]}
            onPress={() => setSortBy(s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.kindChipLabel, { color: sortBy === s ? GREEN : text3 }]}>
              {s === 'distance' ? 'Nearest' : 'Cheapest'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Row 2 — payment filter */}
      <View style={[styles.paymentBar, { borderBottomColor: border }]}>
        {([
          { key: 'any',  label: 'All'  },
          { key: 'card', label: '💳 Card' },
          { key: 'cash', label: '💵 Cash' },
        ] as const).map(({ key, label }) => {
          const active = paymentFilter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.paymentChip, active && styles.paymentChipActive]}
              onPress={() => setPaymentFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.paymentLabel, { color: active ? '#fff' : text3 }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={GREEN} />
        ) : anyError ? (
          <Text style={[styles.empty, { color: '#ef4444' }]}>
            Failed to load spots. Check your connection.
          </Text>
        ) : combined.length === 0 ? (
          <Text style={[styles.empty, { color: text3 }]}>No spots found nearby</Text>
        ) : (
          <FlatList
            data={combined}
            keyExtractor={(item) => `${item.kind}-${item.data.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <TabBar active="nearby" onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  title:    { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 12 },
  kindBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  kindChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  kindChipLabel: { fontSize: 13, fontWeight: '600' },
  kindDivider: { width: 1, height: 20, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: 2 },
  paymentBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  paymentChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  paymentChipActive: {
    backgroundColor: GREEN,
  },
  paymentLabel: { fontSize: 13, fontWeight: '600' },
  loader: { marginTop: 48 },
  empty:  { textAlign: 'center', marginTop: 48, fontSize: 14 },
  listContent: { paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  kindBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  kindLabel: { fontSize: 12, fontWeight: '700' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  rowBody:  { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  tagText:  { fontSize: 10, fontWeight: '500' },
  rate:     { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  dist:     { fontSize: 12, flexShrink: 0, marginLeft: 4 },
  sub:      { fontSize: 12, flexShrink: 1 },
  chevron:  { fontSize: 18, paddingLeft: 4 },
});
