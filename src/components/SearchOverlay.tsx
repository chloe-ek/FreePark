import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Pressable, ActivityIndicator, Platform,
} from 'react-native';

const IS_IOS = Platform.OS === 'ios';
import { useTheme } from '../contexts/ThemeContext';
import { SUGGESTIONS, Suggestion } from '../data/suggestions';
import { searchPlaces, getPlaceCoords, ResolvedPlace } from '../lib/geocoding';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { GREEN } from '../theme';
import { SEARCH_CONFIG } from '../constants/search';

interface SearchResultRowProps {
  icon: React.ReactNode;
  name: string;
  sub: string;
  onPress: () => void;
  divider?: boolean;
  disabled?: boolean;
  isDark: boolean;
  border: string;
  text: string;
  text2: string;
}

function SearchResultRow({ icon, name, sub, onPress, divider = true, disabled, isDark, border, text, text2 }: SearchResultRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, divider && { borderBottomWidth: 1, borderBottomColor: border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.rowIcon, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
        {icon}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: text }]}>{name}</Text>
        <Text style={[styles.rowSub, { color: text2 }]}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

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

  const { recents, addRecent } = useRecentSearches();

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
    if (text.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    // Check local dataset first — only call Places API if local results < threshold
    const q = text.toLowerCase();
    const localHits = SUGGESTIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q),
    );

    if (localHits.length >= SEARCH_CONFIG.LOCAL_RESULTS_THRESHOLD) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setApiResults(results);
      setSearching(false);
    }, SEARCH_CONFIG.DEBOUNCE_MS);
  }

  function selectAndClose(place: ResolvedPlace) {
    addRecent(place);
    onSelect(place);
    onClose();
  }

  function handleSelectSuggestion(s: Suggestion) {
    selectAndClose(s);
  }

  async function handleSelectApiResult(candidate: ApiCandidate) {
    if (selectingId) return;
    setSelectingId(candidate.placeId);
    try {
      const coords = await getPlaceCoords(candidate.placeId);
      if (!coords) return;
      selectAndClose({ name: candidate.name, sub: candidate.sub, lat: coords.lat, lng: coords.lng });
    } finally {
      setSelectingId(null);
    }
  }

  const showSuggestions = query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH;

  const localResults: Suggestion[] = showSuggestions
    ? []
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
          {showSuggestions ? 'Recent searches' : 'Results'}
        </Text>

        <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
          {/* Recent searches (shown when idle) */}
          {showSuggestions && recents.length === 0 && (
            <Text style={[styles.empty, { color: text3 }]}>No recent searches</Text>
          )}
          {showSuggestions && recents.map((r, i) => (
            <SearchResultRow
              key={`recent-${i}`}
              icon={<Text style={styles.rowIconText}>🕐</Text>}
              name={r.name}
              sub={r.sub}
              onPress={() => selectAndClose(r)}
              isDark={isDark} border={border} text={text} text2={text2}
            />
          ))}

          {/* Local results (shown when typing) */}
          {!showSuggestions && localResults.map((s, i) => (
            <SearchResultRow
              key={`local-${i}`}
              icon={<Text style={styles.rowIconText}>{s.icon}</Text>}
              name={s.name}
              sub={s.sub}
              onPress={() => handleSelectSuggestion(s)}
              isDark={isDark} border={border} text={text} text2={text2}
            />
          ))}

          {/* Places API fallback — only shown when local results < 3 */}
          {!showSuggestions && apiResults.map((c, i) => (
            <SearchResultRow
              key={c.placeId}
              icon={selectingId === c.placeId
                ? <ActivityIndicator size="small" color={GREEN} />
                : <Text style={styles.rowIconText}>📍</Text>
              }
              name={c.name}
              sub={c.sub}
              onPress={() => handleSelectApiResult(c)}
              divider={i < apiResults.length - 1}
              disabled={selectingId === c.placeId}
              isDark={isDark} border={border} text={text} text2={text2}
            />
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
    paddingHorizontal: IS_IOS ? 16 : 12,
    paddingTop: IS_IOS ? 14 : 10,
    paddingBottom: IS_IOS ? 18 : 14,
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
    marginBottom: IS_IOS ? 12 : 8,
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
  list: { maxHeight: IS_IOS ? 320 : 300 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: IS_IOS ? 12 : 9,
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
