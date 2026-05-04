import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { GREEN } from '../theme';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ label, active, onPress }: Props) {
  const { theme } = useTheme();
  const { surface, border, text2 } = theme.colors;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        active
          ? styles.chipActive
          : { backgroundColor: surface, borderColor: border },
      ]}
    >
      <Text style={[styles.label, { color: active ? '#fff' : text2 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  chipActive: {
    backgroundColor: GREEN,
    borderColor: 'transparent',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
