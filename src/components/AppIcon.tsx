import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GREEN } from '../theme';

interface Props {
  size?: number;
}

export function AppIcon({ size = 72 }: Props) {
  const scale = size / 72;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Text style={[styles.letter, { fontSize: 38 * scale, lineHeight: 46 * scale }]}>P</Text>
      <View style={[styles.dot, { width: 10 * scale, height: 10 * scale, borderRadius: 5 * scale }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  letter: {
    color: '#fff',
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: '22%',
    right: '22%',
    backgroundColor: GREEN,
  },
});
