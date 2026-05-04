import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { GREEN } from '../theme';

interface Props {
  children: React.ReactNode;
  variant?: 'green' | 'grey';
}

export function Badge({ children, variant = 'green' }: Props) {
  return (
    <Text style={[styles.base, variant === 'green' ? styles.green : styles.grey]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    overflow: 'hidden',
    color: '#fff',
  },
  green: { backgroundColor: GREEN },
  grey:  { backgroundColor: '#555' },
});
