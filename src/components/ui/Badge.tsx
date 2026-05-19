import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  color: string;
}

export function Badge({ children, color }: Props) {
  return (
    <Text style={[styles.base, { backgroundColor: color }]}>
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
});
