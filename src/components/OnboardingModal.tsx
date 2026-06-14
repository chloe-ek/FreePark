import React, { useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { TIER_COLORS } from './markers/MeterMarker';
import { LAYER_COLORS, LAYER_LABELS, LAYER_EMPTY_LABELS, LayerKind } from '../constants/layers';
import { GREEN } from '../theme';

interface Props {
  visible: boolean;
  variant: 'auto' | 'manual';
  onClose: () => void;
  onDismiss: () => void;
}

const TIER_ROWS: { color: string; label: string }[] = [
  { color: TIER_COLORS.free,       label: 'Free now' },
  { color: TIER_COLORS.cheap,      label: 'Under $2 / hr' },
  { color: TIER_COLORS.mid,        label: '$2 – $3 / hr' },
  { color: TIER_COLORS.exp,        label: 'Over $3 / hr' },
  { color: TIER_COLORS.prohibited, label: 'No parking / rush hour' },
];

const LAYER_KINDS: LayerKind[] = ['meter', 'disability', 'motorcycle', 'ev'];

const SLIDE_OUT_Y = 700;

export function OnboardingModal({ visible, variant, onClose, onDismiss }: Props) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(SLIDE_OUT_Y)).current;

  const onCloseRef  = useRef(onClose);
  const onDismissRef = useRef(onDismiss);
  onCloseRef.current  = onClose;
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      cardY.setValue(SLIDE_OUT_Y);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cardY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      ]).start();
    }
  }, [visible]);

  // Used by buttons — animates out then fires callback
  const animateOut = useRef((callback: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardY, { toValue: SLIDE_OUT_Y, duration: 220, useNativeDriver: true }),
    ]).start(() => callback());
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) cardY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 80 || vy > 0.5) {
          animateOut(() => onCloseRef.current());
        } else {
          Animated.spring(cardY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      <Animated.View style={[styles.card, { backgroundColor: surface, transform: [{ translateY: cardY }] }]}>
        <View style={styles.pillWrapper} {...panResponder.panHandlers}>
          <View style={styles.pill} />
        </View>

        <Text style={[styles.title, { color: text }]}>FreePark</Text>
        <Text style={[styles.sub, { color: text2 }]}>
          Vancouver parking data from{' '}
          <Text style={{ fontWeight: '600' }}>Vancouver Open Data</Text>
          , updated regularly. Find free or cheap spots near you.
        </Text>

        <View style={[styles.divider, { backgroundColor: border }]} />

        <Text style={[styles.sectionLabel, { color: text3 }]}>METER COLOURS</Text>
        {TIER_ROWS.map((row) => (
          <View key={row.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: row.color }]} />
            <Text style={[styles.legendText, { color: text2 }]}>{row.label}</Text>
          </View>
        ))}

        <View style={[styles.divider, { backgroundColor: border }]} />

        <Text style={[styles.sectionLabel, { color: text3 }]}>SPOT TYPES</Text>
        <View style={styles.layerRow}>
          {LAYER_KINDS.map((kind) => (
            <View
              key={kind}
              style={[styles.layerChip, { borderColor: LAYER_COLORS[kind] + '55', backgroundColor: LAYER_COLORS[kind] + '18' }]}
            >
              <Text style={styles.layerIcon}>{LAYER_LABELS[kind]}</Text>
              <Text style={[styles.layerLabel, { color: LAYER_COLORS[kind] }]}>
                {LAYER_EMPTY_LABELS[kind].split(' ')[0]}
              </Text>
            </View>
          ))}
        </View>

        {variant === 'auto' ? (
          <>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: GREEN }]}
              onPress={() => animateOut(() => onDismissRef.current())}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Got it — don't show again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => animateOut(() => onCloseRef.current())}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: text3 }]}>Close</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: GREEN }]}
            onPress={() => animateOut(() => onCloseRef.current())}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Got it</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  pillWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.25)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
  },
  layerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  layerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  layerIcon: {
    fontSize: 13,
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 14,
  },
});
