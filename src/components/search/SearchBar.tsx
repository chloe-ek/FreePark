import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  onOpen: () => void;
}

export function SearchBar({ onOpen }: Props) {
  const { theme } = useTheme();
  const isLight = theme.scheme === 'light';

  return (
    <TouchableOpacity
      style={[styles.bar, isLight ? styles.barLight : styles.barDark]}
      onPress={onOpen}
      activeOpacity={0.9}
    >
      <Text style={[styles.icon, { color: isLight ? '#bbb' : 'rgba(255,255,255,0.4)' }]}>
        ⌕
      </Text>
      <Text style={[styles.placeholder, { color: isLight ? '#aaa' : 'rgba(255,255,255,0.5)' }]}>
        Search area or address…
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 12,
  },
  barDark: {
    backgroundColor: 'rgba(20,20,20,0.88)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  barLight: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(0,0,0,0.09)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: { fontSize: 15, flexShrink: 0 },
  placeholder: { flex: 1, fontSize: 14 },
});
