import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GREEN } from '../../theme';

interface Props {
  freeCount: number;
  label: string;
  highlight?: string;
}

export function FloatingPill({ freeCount, label, highlight }: Props) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        <Text style={[styles.badge, freeCount === 0 && styles.badgeZero]}>{freeCount} free</Text>
        <Text style={styles.text}>{label}</Text>
        {highlight != null && (
          <Text style={styles.countdown}>{highlight}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  pill: {
    backgroundColor: 'rgba(20,20,20,0.82)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: GREEN,
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    overflow: 'hidden',
  },
  badgeZero: {
    backgroundColor: '#4b5563',
  },
  text: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  countdown: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '500',
  },
});
