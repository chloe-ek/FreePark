import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SUGGESTIONS, Suggestion } from '../data/suggestions';
import { GREEN } from '../theme';

interface Props {
  onClose: () => void;
  onSelect: (suggestion: Suggestion) => void;
}

export function SearchOverlay({ onClose, onSelect }: Props) {
  const { theme } = useTheme();
  const isDark = theme.scheme === 'dark';
  const { surface, border, text, text2, text3 } = theme.colors;
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.length > 0
    ? SUGGESTIONS.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.sub.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Panel */}
      <View style={[
        styles.panel,
        { backgroundColor: surface, borderBottomColor: border },
      ]}>
        {/* Input row */}
        <View style={styles.inputRow}>
          <Text style={[styles.searchIcon, { color: isDark ? 'rgba(255,255,255,0.4)' : '#bbb' }]}>
            ⌕
          </Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search area or address…"
            placeholderTextColor={text3}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Section label */}
        <Text style={[styles.sectionLabel, { color: text3 }]}>
          {query ? 'Results' : 'Nearby areas'}
        </Text>

        {/* Results */}
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
          {filtered.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.row,
                i < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: border },
              ]}
              onPress={() => { onSelect(s); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                <Text style={styles.rowIconText}>{s.icon}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowName, { color: text }]}>{s.name}</Text>
                <Text style={[styles.rowSub, { color: text2 }]}>{s.sub}</Text>
              </View>
              {s.freeCount > 0 && (
                <Text style={styles.freeBadge}>{s.freeCount} free</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    borderBottomWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  cancel: {
    fontSize: 13,
    fontWeight: '500',
    color: GREEN,
    paddingVertical: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  list: { maxHeight: 300 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowIconText: { fontSize: 14 },
  rowBody: { flex: 1 },
  rowName: { fontSize: 13, fontWeight: '500' },
  rowSub: { fontSize: 11 },
  freeBadge: {
    fontSize: 10,
    fontWeight: '500',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: 'rgba(94,194,106,0.15)',
    color: GREEN,
  },
});
