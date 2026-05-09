import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { TabBar, TabName } from '../components/TabBar';
import { FilterChip } from '../components/FilterChip';
import { WEEKDAY_SLOTS, WEEKEND_SLOTS, METER_HOURS_NOTE } from '../data/schedule';
import { GREEN } from '../theme';

interface Props {
  onNavigate: (tab: TabName) => void;
}

export function ScheduleScreen({ onNavigate }: Props) {
  const { theme } = useTheme();
  const { setShowFreeOnly } = useSettings();
  const insets = useSafeAreaInsets();
  const [dayType, setDayType] = useState<'Weekday' | 'Weekend'>('Weekday');

  const { bg, surface, border, text, text2, text3 } = theme.colors;
  const slots = dayType === 'Weekday' ? WEEKDAY_SLOTS : WEEKEND_SLOTS;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  function handleNowPress() {
    setShowFreeOnly(true);
    onNavigate('map');
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: text }]}>Free Parking Schedule</Text>
        <Text style={[styles.date, { color: text2 }]}>{today}</Text>
      </View>

      {/* Filter strip */}
      <View style={[styles.filterStrip, { borderBottomColor: border }]}>
        {(['Weekday', 'Weekend'] as const).map((d) => (
          <FilterChip
            key={d}
            label={d}
            active={dayType === d}
            onPress={() => setDayType(d)}
          />
        ))}
      </View>

      {/* Slots */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {slots.map((slot, i) => {
          const isNow = slot.time === 'Now';
          const Row = isNow ? TouchableOpacity : View;
          const rowProps = isNow
            ? { onPress: handleNowPress, activeOpacity: 0.7 }
            : {};

          return (
            <Row
              key={i}
              {...rowProps}
              style={[
                styles.row,
                { borderBottomColor: border },
                isNow && { backgroundColor: 'rgba(94,194,106,0.06)' },
              ]}
            >
              <Text style={[styles.time, isNow && styles.timeNow]}>{slot.time}</Text>
              <View style={styles.rowBody}>
                <View style={styles.countRow}>
                  <Text style={[styles.count, { color: text }]}>{slot.freeCount}</Text>
                  <Text style={[styles.countLabel, { color: text2 }]}>free spots</Text>
                  {isNow && (
                    <Text style={styles.viewMapLabel}>→ See on map</Text>
                  )}
                </View>
                <Text style={[styles.note, { color: text3 }]}>{slot.note}</Text>
              </View>
            </Row>
          );
        })}
        <Text style={[styles.footer, { color: text3 }]}>{METER_HOURS_NOTE}</Text>
      </ScrollView>

      <TabBar active="nearby" onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '600' },
  date:  { fontSize: 12 },
  filterStrip: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  time: {
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    color: GREEN,
    width: 64,
    flexShrink: 0,
    paddingTop: 2,
  },
  timeNow: {
    fontWeight: '700',
  },
  rowBody: { flex: 1 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 3,
  },
  count: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  countLabel: { fontSize: 13 },
  viewMapLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
    marginLeft: 4,
  },
  note: { fontSize: 12 },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    padding: 16,
  },
});
