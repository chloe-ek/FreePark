import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { GREEN } from '../../theme';

export type TabName = 'map' | 'nearby' | 'settings';

interface Tab {
  id: TabName;
  label: string;
  icon: string;
  iconActive: string;
}

const TABS: Tab[] = [
  { id: 'map',     label: 'Map',     icon: '◎', iconActive: '⊛' },
  { id: 'nearby',  label: 'Nearby',  icon: '≋', iconActive: '≋' },
  { id: 'settings',label: 'Settings',icon: '⊙', iconActive: '⊙' },
];

interface Props {
  active: TabName;
  onNavigate: (tab: TabName) => void;
}

export function TabBar({ active, onNavigate }: Props) {
  const { theme } = useTheme();
  const { surface, border, text3 } = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { backgroundColor: surface, borderTopColor: border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const color = isActive ? GREEN : text3;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.item}
            onPress={() => onNavigate(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, { color }]}>
              {isActive ? tab.iconActive : tab.icon}
            </Text>
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    flexShrink: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
