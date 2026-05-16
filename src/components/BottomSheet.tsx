import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import type { RushHourWindow } from '../utils/parkingUtils';
import { useTheme } from '../contexts/ThemeContext';
import { GREEN } from '../theme';

// ─── BottomSheet ─────────────────────────────────────────────────────────────

interface BottomSheetProps {
  children: React.ReactNode;
  onNavigate: () => void;
  onDismiss: () => void;
}

export function BottomSheet({ children, onNavigate, onDismiss }: BottomSheetProps) {
  const { theme } = useTheme();
  const { surface, border } = theme.colors;

  const translateY = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 80 || vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onDismissRef.current());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.sheet, { backgroundColor: surface, borderTopColor: border }, { transform: [{ translateY }] }]}
    >
      <View style={styles.handleArea} {...panResponder.panHandlers}>
        <View style={[styles.handle, { backgroundColor: border }]} />
      </View>
      {children}
      <TouchableOpacity style={styles.navigateBtn} onPress={onNavigate} activeOpacity={0.8}>
        <Text style={styles.navigateBtnText}>Navigate</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── InfoGrid ────────────────────────────────────────────────────────────────

interface InfoGridProps {
  rows: [string, string][];
}

export function InfoGrid({ rows }: InfoGridProps) {
  const { theme } = useTheme();
  const { text2, text3 } = theme.colors;

  return (
    <View style={styles.grid}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.cell}>
          <Text style={[styles.cellKey, { color: text3 }]}>{k}</Text>
          <Text style={[styles.cellVal, { color: text2 }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── RushHourBanner ──────────────────────────────────────────────────────────

interface RushHourBannerProps {
  windows: RushHourWindow[];
  active: boolean; // true = currently in rush hour, false = upcoming warning
}

export function RushHourBanner({ windows, active }: RushHourBannerProps) {
  if (windows.length === 0) return null;
  return (
    <View style={active ? styles.rushBannerActive : styles.rushBannerWarn}>
      <Text style={active ? styles.rushTitleActive : styles.rushTitleWarn}>
        {active ? 'No parking — Rush hour (Mon–Fri)' : 'Rush hour restriction (Mon–Fri)'}
      </Text>
      {windows.map((w) => (
        <Text key={w.label} style={active ? styles.rushTimeActive : styles.rushTimeWarn}>
          {active ? w.label : `${w.label} — No parking`}
        </Text>
      ))}
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 20,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  navigateBtn: {
    marginTop: 14,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 12,
  },
  cell: { minWidth: '40%' },
  cellKey: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cellVal: {
    fontSize: 13,
    fontWeight: '500',
  },
  rushBannerActive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 10,
    marginBottom: 12,
  },
  rushTitleActive: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  rushTimeActive:  { color: '#ef4444', fontSize: 12, fontWeight: '500' },
  rushBannerWarn: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    padding: 10,
    marginBottom: 12,
  },
  rushTitleWarn: { color: '#f97316', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  rushTimeWarn:  { color: '#f97316', fontSize: 11 },
});
