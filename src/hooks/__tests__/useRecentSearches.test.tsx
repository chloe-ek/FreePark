import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecentSearches } from '../useRecentSearches';
import { RECENT_SEARCHES_MAX } from '../../constants/storage';
import type { ResolvedPlace } from '../../lib/geocoding';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItem  = AsyncStorage.getItem  as jest.Mock;
const mockSetItem  = AsyncStorage.setItem  as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

function place(lat: number, lng: number, name = 'Test'): ResolvedPlace {
  return { lat, lng, name, sub: '' };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSetItem.mockResolvedValue(undefined);
  mockRemoveItem.mockResolvedValue(undefined);
});

// ── initial load from AsyncStorage ───────────────────────────────────────────

describe('initial load', () => {
  test('parses valid JSON and populates recents', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([place(49.28, -123.12, 'Vancouver')]));

    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => expect(result.current.recents).toHaveLength(1));
    expect(result.current.recents[0].name).toBe('Vancouver');
  });

  test('stays empty when storage returns null', async () => {
    mockGetItem.mockResolvedValue(null);

    const { result } = renderHook(() => useRecentSearches());
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());

    expect(result.current.recents).toEqual([]);
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  test('stays empty on corrupted JSON and clears storage', async () => {
    mockGetItem.mockResolvedValue('not-valid-json{{{');

    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() =>
      expect(mockRemoveItem).toHaveBeenCalledWith('@freepark_recent_searches'),
    );
    expect(result.current.recents).toEqual([]);
  });

  test('stays empty on truncated JSON and clears storage', async () => {
    mockGetItem.mockResolvedValue('[{"lat":49.28');

    renderHook(() => useRecentSearches());

    await waitFor(() =>
      expect(mockRemoveItem).toHaveBeenCalledWith('@freepark_recent_searches'),
    );
  });

  test('empty-array JSON is valid — does not call removeItem', async () => {
    mockGetItem.mockResolvedValue('[]');

    renderHook(() => useRecentSearches());
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());

    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  test('loads multiple items preserving order', async () => {
    const stored = [place(1, 1, 'A'), place(2, 2, 'B'), place(3, 3, 'C')];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useRecentSearches());
    await waitFor(() => expect(result.current.recents).toHaveLength(3));

    expect(result.current.recents.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });
});

// ── addRecent ─────────────────────────────────────────────────────────────────

describe('addRecent', () => {
  async function boot() {
    mockGetItem.mockResolvedValue(null);
    const hook = renderHook(() => useRecentSearches());
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());
    return hook;
  }

  test('prepends first place to empty list', async () => {
    const { result } = await boot();

    act(() => { result.current.addRecent(place(49.28, -123.12, 'A')); });

    expect(result.current.recents).toHaveLength(1);
    expect(result.current.recents[0].name).toBe('A');
  });

  test('newest item appears at index 0', async () => {
    const { result } = await boot();

    act(() => { result.current.addRecent(place(49.28, -123.12, 'First')); });
    act(() => { result.current.addRecent(place(49.29, -123.13, 'Second')); });

    expect(result.current.recents[0].name).toBe('Second');
    expect(result.current.recents[1].name).toBe('First');
  });

  test('deduplicates by exact lat+lng — moves existing entry to front', async () => {
    const { result } = await boot();

    act(() => { result.current.addRecent(place(49.28, -123.12, 'A')); });
    act(() => { result.current.addRecent(place(49.29, -123.13, 'B')); });
    act(() => { result.current.addRecent(place(49.28, -123.12, 'A-duplicate')); });

    expect(result.current.recents).toHaveLength(2);
    expect(result.current.recents[0].lat).toBe(49.28);
    expect(result.current.recents[1].lat).toBe(49.29);
  });

  test('same lat + different lng is NOT a duplicate', async () => {
    const { result } = await boot();

    act(() => { result.current.addRecent(place(49.28, -123.12, 'A')); });
    act(() => { result.current.addRecent(place(49.28, -123.13, 'B')); });

    expect(result.current.recents).toHaveLength(2);
  });

  test('same lng + different lat is NOT a duplicate', async () => {
    const { result } = await boot();

    act(() => { result.current.addRecent(place(49.28, -123.12, 'A')); });
    act(() => { result.current.addRecent(place(49.29, -123.12, 'B')); });

    expect(result.current.recents).toHaveLength(2);
  });

  test(`list is capped at ${RECENT_SEARCHES_MAX} items`, async () => {
    const { result } = await boot();

    for (let i = 0; i <= RECENT_SEARCHES_MAX; i++) {
      act(() => { result.current.addRecent(place(i, i * 2, `Place ${i}`)); });
    }

    expect(result.current.recents).toHaveLength(RECENT_SEARCHES_MAX);
  });

  test('oldest item is dropped when cap is exceeded', async () => {
    const { result } = await boot();

    for (let i = 0; i < RECENT_SEARCHES_MAX; i++) {
      act(() => { result.current.addRecent(place(i, i * 2, `Place ${i}`)); });
    }
    // Place 0 was added first and should be the one dropped
    act(() => { result.current.addRecent(place(99, 99, 'New')); });

    expect(result.current.recents[0].name).toBe('New');
    expect(result.current.recents.find((p) => p.name === 'Place 0')).toBeUndefined();
  });

  test('persists updated list to AsyncStorage', async () => {
    const { result } = await boot();

    act(() => { result.current.addRecent(place(49.28, -123.12, 'Persist-Me')); });

    expect(mockSetItem).toHaveBeenCalledWith(
      '@freepark_recent_searches',
      expect.stringContaining('"name":"Persist-Me"'),
    );
  });

  test('persists exactly MAX items when list overflows', async () => {
    const { result } = await boot();

    for (let i = 0; i <= RECENT_SEARCHES_MAX; i++) {
      act(() => { result.current.addRecent(place(i, i * 2, `P${i}`)); });
    }

    const lastArg = mockSetItem.mock.calls.at(-1)?.[1] as string;
    expect(JSON.parse(lastArg)).toHaveLength(RECENT_SEARCHES_MAX);
  });
});
