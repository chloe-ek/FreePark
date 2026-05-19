import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '../components/ui/AppIcon';
import { GREEN, LIGHT_THEME } from '../theme';

interface Props {
  onReady: () => void;
}

export function EntryScreen({ onReady }: Props) {
  const [phase, setPhase] = useState<'loading' | 'locating'>('loading');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('locating'), 1200);
    const t2 = setTimeout(() => onReady(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onReady]);

  const { bg, text, text3 } = LIGHT_THEME.colors;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.lockup}>
        <View style={styles.iconWrapper}>
          <AppIcon size={72} />
        </View>
        <View style={styles.wordmark}>
          <View style={styles.wordmarkRow}>
            <Text style={[styles.wordFree, { color: GREEN }]}>Free</Text>
            <Text style={[styles.wordPark, { color: text }]}>Park</Text>
          </View>
          <View style={styles.subRow}>
            <View style={styles.greenDot} />
            <Text style={[styles.city, { color: text3 }]}>VANCOUVER</Text>
          </View>
        </View>
      </View>

      {phase === 'loading' && (
        <Text style={[styles.status, { color: text3 }]}>Loading…</Text>
      )}
      {phase === 'locating' && (
        <View style={styles.locatingRow}>
          <View style={styles.pulseDot} />
          <Text style={[styles.status, { color: text3 }]}>Finding your location…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockup: {
    alignItems: 'center',
    gap: 18,
    marginBottom: 52,
  },
  iconWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  wordmark: {
    alignItems: 'flex-start',
    gap: 4,
  },
  wordmarkRow: {
    flexDirection: 'row',
  },
  wordPark: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 36,
  },
  wordFree: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 36,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 1,
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GREEN,
  },
  city: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GREEN,
  },
  status: { fontSize: 13 },
});
