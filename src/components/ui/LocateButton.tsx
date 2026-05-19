import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onPress: () => void;
  bottom?: number;
}

export function LocateButton({ onPress, bottom = 16 }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, { bottom }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>⊙</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(20,20,20,0.82)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  icon: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.7)',
  },
});
