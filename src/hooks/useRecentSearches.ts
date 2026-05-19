import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, RECENT_SEARCHES_MAX } from '../constants/storage';
import type { ResolvedPlace } from '../lib/geocoding';

export function useRecentSearches() {
  const [recents, setRecents] = useState<ResolvedPlace[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES).then((raw) => {
      if (!raw) return;
      try {
        setRecents(JSON.parse(raw));
      } catch {
        AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
      }
    });
  }, []);

  const addRecent = useCallback(async (place: ResolvedPlace) => {
    setRecents((prev) => {
      const deduped = prev.filter((p) => p.lat !== place.lat || p.lng !== place.lng);
      const next = [place, ...deduped].slice(0, RECENT_SEARCHES_MAX);
      AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recents, addRecent };
}
