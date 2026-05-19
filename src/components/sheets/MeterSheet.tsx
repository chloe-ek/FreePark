import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { navigateTo } from '../../utils/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../ui/Badge';
import { NearbyMeterResult } from '../../types/database';
import {
  isMeterFreeNow,
  isMeterProhibited,
  getCurrentRateLabel,
  getCurrentTimeLimit,
  minutesUntilFree,
  formatMinutes,
  getRushHours,
} from '../../utils/parkingUtils';
import { SpotReport } from '../../hooks/useSpotReports';
import { BottomSheet, InfoGrid, RushHourBanner } from './BottomSheet';
import { getMeterTier, TIER_COLORS } from '../markers/MeterMarker';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

interface Props {
  meter: NearbyMeterResult;
  onDismiss: () => void;
  report?: SpotReport;
  onReport: (type: SpotReport['report_type']) => Promise<boolean>;
}

export function MeterSheet({ meter, onDismiss, report, onReport }: Props) {
  const { theme } = useTheme();
  const { border, text, text2, text3 } = theme.colors;
  const prohibited = isMeterProhibited(meter);
  const free = !prohibited && isMeterFreeNow(meter);
  const rateLabel = prohibited ? 'No parking' : getCurrentRateLabel(meter);
  const minsUntilFree = minutesUntilFree(meter);
  const timeLimit = getCurrentTimeLimit(meter);
  const timeLimitLabel = timeLimit == null ? 'No limit'
    : timeLimit >= 60 ? `${timeLimit / 60} hr` : `${timeLimit} min`;
  const rushHours = getRushHours(meter);

  const [submitted, setSubmitted] = useState(false);

  const tier = getMeterTier(meter);
  const tierColor = TIER_COLORS[tier];

  async function handleReport(type: SpotReport['report_type']) {
    const ok = await onReport(type);
    if (ok) setSubmitted(true);
  }

  const rows: [string, string][] = [
    ...(!free && !prohibited && minsUntilFree != null
      ? [['Free in', formatMinutes(minsUntilFree)] as [string, string]]
      : []),
    ['Time limit',    timeLimitLabel],
    ['Card accepted', meter.credit_card ? 'Yes' : 'No'],
    ['Distance',      `${Math.round(meter.distance_meters)} m`],
  ];

  return (
    <BottomSheet
      onNavigate={() => navigateTo(meter.latitude, meter.longitude)}
      onDismiss={onDismiss}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: tierColor }]} />
        <Text style={[styles.street, { color: text }]} numberOfLines={1}>
          Meter {meter.meter_id}
        </Text>
        <Badge color={tierColor}>
          {prohibited ? 'No parking' : free ? 'Free now' : rateLabel}
        </Badge>
      </View>

      <RushHourBanner windows={rushHours} active={prohibited} />

      <View style={[styles.reportSection, { borderColor: border }]}>
        {report ? (
          <View style={styles.reportBanner}>
            <Text style={styles.reportIcon}>⚠</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportText}>Full — reported by a user</Text>
              <Text style={styles.reportTime}>{timeAgo(report.reported_at)}</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.reportLabel, { color: text3 }]}>No spots available here?</Text>
        )}

        {submitted ? (
          <Text style={[styles.reportThanks, { color: text3 }]}>Thanks for reporting!</Text>
        ) : (
          <TouchableOpacity
            style={[styles.reportBtn, { borderColor: border }]}
            onPress={() => handleReport('no_vacancy')}
          >
            <Text style={[styles.reportBtnText, { color: text2 }]}>Report full</Text>
          </TouchableOpacity>
        )}
      </View>

      <InfoGrid rows={rows} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  street: { flex: 1, fontSize: 15, fontWeight: '600' },
  reportSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
  },
  reportLabel:  { flex: 1, fontSize: 12 },
  reportBanner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  reportIcon:   { fontSize: 13, color: '#ef4444' },
  reportText:   { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  reportTime:   { fontSize: 11, color: '#ef4444', opacity: 0.7 },
  reportBtn:    { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  reportBtnText:  { fontSize: 12, fontWeight: '500' },
  reportThanks:   { fontSize: 12 },
});
