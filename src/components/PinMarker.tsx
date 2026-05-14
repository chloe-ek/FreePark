import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface Props {
  coordinate: { latitude: number; longitude: number };
  color: string;
  icon: string;
  iconSize?: number;
  onPress: () => void;
}

export function PinMarker({ coordinate, color, icon, iconSize = 12, onPress }: Props) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={onPress}
    >
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Text style={[styles.icon, { fontSize: iconSize, lineHeight: iconSize + 2 }]}>{icon}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  icon: { color: '#fff' },
});
