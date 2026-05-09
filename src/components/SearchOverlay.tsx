import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FEATURED, SUGGESTIONS, Suggestion } from '../data/suggestions';
import { searchPlaces, getPlaceCoords, ResolvedPlace } from '../lib/geocoding';
import { GREEN } from '../theme';

interface Props {
  onClose: () => void;
  onSelect: (place: ResolvedPlace) => void;
}

interface ApiCandidate {
  placeId: string;
  name: string;
  sub: string;
}

export function SearchOverlay({ onClose, onSelect }: Props) {
  const { theme } = useTheme();
  const isDark = theme.scheme === 'dark';
  const { surface, border, text, text2, text3 } = theme.colors;

  const [query, setQuery] = useState('');
  const [apiResults, setApiResults] = useState<ApiCandidate[]>([]);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    // Check local dataset first — only call Places API if local results < 3
    const q = text.toLowerCase();
    const localHits = SUGGESTIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q),
    );

    if (localHits.length >= 3) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setApiResults(results);
      setSearching(false);
    }, 350);
  }

  async function handleSelectSuggestion(s: Suggestion) {
    onSelect({ name: s.name, sub: s.sub, lat: s.lat, lng: s.lng });
    onClose();
  }

  async function handleSelectApiResult(candidate: ApiCandidate) {
    if (selectingId) return;
    setSelectingId(candidate.placeId);
    try {
      const coords = await getPlaceCoords(candidate.placeId);
      if (!coords) return;
      onSelect({ name: candidate.name, sub: candidate.sub, lat: coords.lat, lng: coords.lng });
      onClose();
    } finally {
      setSelectingId(null);
    }
  }

  const showSuggestions = query.length < 2;

  const localResults: Suggestion[] = showSuggestions
    ? FEATURED
    : SUGGESTIONS.filter((s) => {
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q);
      });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.panel, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={styles.inputRow}>
          <Text style={[styles.searchIcon, { color: isDark ? 'rgba(255,255,255,0.4)' : '#bbb' }]}>
            ⌕
          </Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: text }]}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search area or address…"
            placeholderTextColor={text3}
            returnKeyType="search"
          />
          {searching
            ? <ActivityIndicator size="small" color={text3} />
            : <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
          }
        </View>

        <Text style={[styles.sectionLabel, { color: text3 }]}>
          {showSuggestions ? 'Nearby areas' : 'Results'}
        </Text>

        <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
          {/* Local results (always shown first) */}
          {localResults.map((s, i) => (
            <TouchableOpacity
              key={`local-${i}`}
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: border }]}
              onPress={() => handleSelectSuggestion(s)}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                <Text style={styles.rowIconText}>{s.icon}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowName, { color: text }]}>{s.name}</Text>
                <Text style={[styles.rowSub, { color: text2 }]}>{s.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Places API fallback — only shown when local results < 3 */}
          {!showSuggestions && apiResults.map((c, i) => (
            <TouchableOpacity
              key={c.placeId}
              style={[styles.row, i < apiResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}
              onPress={() => handleSelectApiResult(c)}
              activeOpacity={0.7}
              disabled={selectingId === c.placeId}
            >
              <View style={[styles.rowIcon, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                {selectingId === c.placeId
                  ? <ActivityIndicator size="small" color={GREEN} />
                  : <Text style={styles.rowIconText}>📍</Text>
                }
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowName, { color: text }]}>{c.name}</Text>
                <Text style={[styles.rowSub, { color: text2 }]}>{c.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {!showSuggestions && localResults.length === 0 && apiResults.length === 0 && !searching && (
            <Text style={[styles.empty, { color: text3 }]}>No results</Text>
          )}
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
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
