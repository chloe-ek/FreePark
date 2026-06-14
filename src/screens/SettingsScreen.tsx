import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { OnboardingModal } from '../components/OnboardingModal';
import { TabBar, TabName } from '../components/ui/TabBar';
import { GREEN } from '../theme';
import { version } from '../../package.json';

interface Props {
  onNavigate: (tab: TabName) => void;
}

export function SettingsScreen({ onNavigate }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { settings, setRadiusMeters } = useSettings();
  const insets = useSafeAreaInsets();
  const { bg2, surface, border, text, text2, text3 } = theme.colors;
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: bg2 }]}>
      <View style={[styles.header, { backgroundColor: bg2, borderBottomColor: border, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Appearance */}
        <SectionLabel label="Appearance" color={text3} />
        <SettingsGroup surface={surface} border={border}>
          <SettingsRow icon="◑" label="Dark Mode" surface={surface} border={border} text={text}>
            <Toggle on={theme.scheme === 'dark'} onToggle={toggleTheme} />
          </SettingsRow>
        </SettingsGroup>

        {/* Search Radius */}
        <SectionLabel label="Search Radius" color={text3} />
        <View style={[styles.radiusCard, { backgroundColor: surface }]}>
          <View style={styles.radiusTop}>
            <Text style={[styles.radiusLabel, { color: text }]}>Radius</Text>
            <Text style={[styles.radiusVal, { color: GREEN }]}>{settings.radiusMeters} m</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => setRadiusMeters(Math.max(100, settings.radiusMeters - 100))}
              style={[styles.stepBtn, { borderColor: border }]}
            >
              <Text style={[styles.stepBtnText, { color: text }]}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepTrack}>
              <View style={[styles.stepFill, { flex: (settings.radiusMeters - 100) / 900, backgroundColor: GREEN }]} />
              <View style={[styles.stepFill, { flex: (1000 - settings.radiusMeters) / 900, backgroundColor: border }]} />
            </View>
            <TouchableOpacity
              onPress={() => setRadiusMeters(Math.min(1000, settings.radiusMeters + 100))}
              style={[styles.stepBtn, { borderColor: border }]}
            >
              <Text style={[styles.stepBtnText, { color: text }]}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.radiusRange}>
            <Text style={[styles.rangeText, { color: text2 }]}>100 m</Text>
            <Text style={[styles.rangeText, { color: text2 }]}>1 km</Text>
          </View>
        </View>

        {/* Help */}
        <SectionLabel label="Help" color={text3} />
        <SettingsGroup surface={surface} border={border}>
          <TappableRow icon="?" label="How to use" surface={surface} border={border} text={text} onPress={() => setShowOnboarding(true)} />
        </SettingsGroup>

        {/* About */}
        <SectionLabel label="About" color={text3} />
        <SettingsGroup surface={surface} border={border}>
          {([
            ['Data source', 'City of Vancouver Open Data'],
            ['Coverage',    'Vancouver, BC'],
            ['Version',     version],
          ] as [string, string][]).map(([k, v], i, arr) => (
            <SettingsRow
              key={k}
              label={k}
              surface={surface}
              border={border}
              text={text}
              divider={i < arr.length - 1}
            >
              <Text style={[styles.rowValue, { color: text2 }]}>{v}</Text>
            </SettingsRow>
          ))}
        </SettingsGroup>

        <Text style={[styles.attribution, { color: text3 }]}>
          Contains information licensed under the{'\n'}Open Government Licence – Vancouver.
        </Text>

      </ScrollView>

      <TabBar active="settings" onNavigate={onNavigate} />

      <OnboardingModal
        visible={showOnboarding}
        variant="manual"
        onClose={() => setShowOnboarding(false)}
        onDismiss={() => setShowOnboarding(false)}
      />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SectionLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{label}</Text>;
}

function SettingsGroup({ children, surface, border }: {
  children: React.ReactNode; surface: string; border: string;
}) {
  return (
    <View style={[styles.group, { backgroundColor: surface, borderColor: border }]}>
      {children}
    </View>
  );
}

interface RowProps {
  icon?: string;
  label: string;
  children?: React.ReactNode;
  surface: string;
  border: string;
  text: string;
  divider?: boolean;
}

function SettingsRow({ icon, label, children, surface, border, text, divider }: RowProps) {
  return (
    <View style={[
      styles.row,
      { backgroundColor: surface },
      divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
    ]}>
      {icon != null && <Text style={[styles.rowIcon, { color: GREEN }]}>{icon}</Text>}
      <Text style={[styles.rowLabel, { color: text }]}>{label}</Text>
      {children}
    </View>
  );
}

function TappableRow({ icon, label, surface, border, text, onPress }: Omit<RowProps, 'children' | 'divider'> & { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon != null && <Text style={[styles.rowIcon, { color: GREEN }]}>{icon}</Text>}
      <Text style={[styles.rowLabel, { color: text }]}>{label}</Text>
      <Text style={{ color: border, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [on]);

  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 21] });
  const bg   = anim.interpolate({ inputRange: [0, 1], outputRange: ['#cccccc', GREEN] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.knob, { left }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:         { fontSize: 17, fontWeight: '600' },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  sectionLabel:  {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6,
  },
  group:         { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  rowIcon:       { fontSize: 16, width: 24, textAlign: 'center' },
  rowLabel:      { flex: 1, fontSize: 14 },
  rowValue:      { fontSize: 13 },
  radiusCard:    { marginHorizontal: 16, borderRadius: 12, padding: 14 },
  radiusTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  radiusLabel:   { fontSize: 14 },
  radiusVal:     { fontSize: 13, fontWeight: '500' },
  stepper:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  stepBtn:       { width: 28, height: 28, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  stepBtnText:   { fontSize: 16, lineHeight: 20 },
  stepTrack:     { flex: 1, flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden' },
  stepFill:      { height: 4 },
  radiusRange:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  rangeText:     { fontSize: 10 },
  attribution:   { fontSize: 10, textAlign: 'center', lineHeight: 16, marginTop: 28, marginBottom: 8, opacity: 0.5 },
  track:         { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  knob:          { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2, top: 3 },
});
