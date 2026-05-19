import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterDropdown } from './FilterDropdown';
import { SelectChip } from './SelectChip';
import {
  DURATION_FILTER_OPTIONS,
  PAYMENT_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
} from '../../constants/filters';
import type { DropdownId, MaxRateFilter, PaymentFilter, TimeLimitFilter } from '../../constants/filters';
import type { LayerKind } from '../../constants/layers';
import { useTheme } from '../../contexts/ThemeContext';
import type { ResolvedPlace } from '../../lib/geocoding';
import { GREEN } from '../../theme';

export interface FilterState {
  maxRate: MaxRateFilter;
  setMaxRate: (v: MaxRateFilter) => void;
  minTimeLimit: TimeLimitFilter;
  setMinTimeLimit: (v: TimeLimitFilter) => void;
  paymentFilter: PaymentFilter;
  setPaymentFilter: (v: PaymentFilter) => void;
  openDropdown: DropdownId | null;
  toggleDropdown: (id: DropdownId) => void;
  closeDropdown: () => void;
}

interface Props {
  activeLayer: LayerKind;
  onLayerChange: (layer: LayerKind) => void;
  filters: FilterState;
  queryCenter: ResolvedPlace | null;
  isTapCenter: boolean;
  onClearQueryCenter: () => void;
}

const LAYER_CHIPS = [
  { key: 'meter'      as const, label: 'Parking' },
  { key: 'disability' as const, label: 'Accessible' },
  { key: 'motorcycle' as const, label: 'Motorcycle' },
  { key: 'ev'         as const, label: 'EV' },
];

export function MapFilterPanel({
  activeLayer, onLayerChange, filters, queryCenter, isTapCenter, onClearQueryCenter,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { bg, border } = theme.colors;
  const {
    maxRate, setMaxRate, minTimeLimit, setMinTimeLimit,
    paymentFilter, setPaymentFilter, openDropdown, toggleDropdown, closeDropdown,
  } = filters;

  return (
    <View style={[styles.panel, { backgroundColor: bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.layerRow}>
        {LAYER_CHIPS.map(({ key, label }) => (
          <SelectChip key={key} label={label} active={activeLayer === key} onPress={() => onLayerChange(key)} />
        ))}
      </View>

      {(activeLayer === 'meter' || activeLayer === 'motorcycle') && (
        <View style={[styles.filterRow, { borderTopColor: border }]}>
          <FilterDropdown
            label="Price"
            selectedValue={maxRate}
            defaultValue={null}
            isOpen={openDropdown === 'price'}
            onToggle={() => toggleDropdown('price')}
            onChange={(v) => { setMaxRate(v as MaxRateFilter); closeDropdown(); }}
            options={PRICE_FILTER_OPTIONS}
          />
          <FilterDropdown
            label="Duration"
            selectedValue={minTimeLimit}
            defaultValue={null}
            isOpen={openDropdown === 'time'}
            onToggle={() => toggleDropdown('time')}
            onChange={(v) => { setMinTimeLimit(v as TimeLimitFilter); closeDropdown(); }}
            options={DURATION_FILTER_OPTIONS}
          />
          <FilterDropdown
            label="Payment"
            selectedValue={paymentFilter}
            defaultValue="all"
            isOpen={openDropdown === 'payment'}
            onToggle={() => toggleDropdown('payment')}
            onChange={(v) => { setPaymentFilter(v as PaymentFilter); closeDropdown(); }}
            options={PAYMENT_FILTER_OPTIONS}
          />
          {queryCenter && (
            <TouchableOpacity onPress={onClearQueryCenter} style={styles.locationChip}>
              <Text style={styles.locationChipText} numberOfLines={1}>
                × {isTapCenter ? 'Selected area' : queryCenter.name.split(',')[0]}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const chipRow = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 7,
  paddingHorizontal: 12,
  paddingTop: 8,
  paddingBottom: 10,
};

const styles = StyleSheet.create({
  panel:     { flexShrink: 0 },
  layerRow:  chipRow,
  filterRow: { ...chipRow, borderTopWidth: StyleSheet.hairlineWidth, zIndex: 20 },
  locationChip: {
    backgroundColor: GREEN + '26',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 140,
  },
  locationChipText: { fontSize: 11, fontWeight: '500', color: GREEN },
});
