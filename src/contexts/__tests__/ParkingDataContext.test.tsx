import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mutable object so tests can update location between renders
const mockLocState = {
  latitude:         null as number | null,
  longitude:        null as number | null,
  loading:          true,
  error:            null as string | null,
  permissionDenied: false,
};

jest.mock('../../hooks/useLocation', () => ({
  useLocation: () => ({ ...mockLocState }),
}));

// Mutable settings object so tests can change radiusMeters
const mockSettingsState = {
  settings:        { radiusMeters: 500 },
  setRadiusMeters: jest.fn(),
};

jest.mock('../SettingsContext', () => ({
  useSettings: () => mockSettingsState,
}));

// AsyncStorage mock (SettingsContext reads from it; we don't care about it here)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/supabase', () => ({
  callRpc: jest.fn().mockResolvedValue({ data: [], error: null }),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { ParkingDataProvider, useParkingData } from '../ParkingDataContext';
import { callRpc } from '../../lib/supabase';

const mockCallRpc = callRpc as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <ParkingDataProvider>{children}</ParkingDataProvider>;
}

// renderHook infers Props from the callback, but with a no-arg callback TypeScript
// picks a non-void Props, making rerender require an argument. Cast it away.
function renderParkingHook() {
  const hook = renderHook(() => useParkingData(), { wrapper });
  const rerender = hook.rerender as () => void;
  return { result: hook.result, rerender, unmount: hook.unmount };
}

function setLocation(lat: number | null, lng: number | null, loading = false) {
  mockLocState.latitude  = lat;
  mockLocState.longitude = lng;
  mockLocState.loading   = loading;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockCallRpc.mockResolvedValue({ data: [], error: null });

  // Reset to "no location yet"
  mockLocState.latitude         = null;
  mockLocState.longitude        = null;
  mockLocState.loading          = true;
  mockLocState.error            = null;
  mockLocState.permissionDenied = false;

  mockSettingsState.settings.radiusMeters = 500;
});

// ── locationKey / GPS movement threshold ─────────────────────────────────────

describe('locationKey and GPS movement threshold', () => {
  test('locationKey is 0 before any GPS fix arrives', () => {
    const { result } = renderParkingHook();
    expect(result.current.locationKey).toBe(0);
  });

  test('locationKey increments to 1 on first GPS fix', async () => {
    const { result, rerender } = renderParkingHook();

    act(() => { setLocation(49.28, -123.12); rerender(); });

    await waitFor(() => expect(result.current.locationKey).toBe(1));
  });

  test('locationKey does NOT change when moving less than 200 m', async () => {
    const { result, rerender } = renderParkingHook();

    act(() => { setLocation(49.28, -123.12); rerender(); });
    await waitFor(() => expect(result.current.locationKey).toBe(1));

    // 0.001° latitude ≈ 111 m — below the 200 m threshold
    act(() => { setLocation(49.281, -123.12); rerender(); });
    await new Promise((r) => setTimeout(r, 50));

    expect(result.current.locationKey).toBe(1);
  });

  test('locationKey increments when moving 200 m or more', async () => {
    const { result, rerender } = renderParkingHook();

    act(() => { setLocation(49.28, -123.12); rerender(); });
    await waitFor(() => expect(result.current.locationKey).toBe(1));

    // 0.002° latitude ≈ 222 m — above the 200 m threshold
    act(() => { setLocation(49.282, -123.12); rerender(); });

    await waitFor(() => expect(result.current.locationKey).toBe(2));
  });

  test('locationKey increments again on each subsequent ≥200 m move', async () => {
    const { result, rerender } = renderParkingHook();

    act(() => { setLocation(49.28, -123.12); rerender(); });
    await waitFor(() => expect(result.current.locationKey).toBe(1));

    act(() => { setLocation(49.282, -123.12); rerender(); }); // +222 m
    await waitFor(() => expect(result.current.locationKey).toBe(2));

    act(() => { setLocation(49.284, -123.12); rerender(); }); // another +222 m
    await waitFor(() => expect(result.current.locationKey).toBe(3));
  });
});

// ── fetchLayerIfNeeded deduplication ─────────────────────────────────────────

describe('fetchLayerIfNeeded', () => {
  async function bootWithGPS(lat = 49.28, lng = -123.12) {
    const hook = renderParkingHook();
    act(() => { setLocation(lat, lng); hook.rerender(); });
    await waitFor(() => expect(hook.result.current.locationKey).toBe(1));
    return hook;
  }

  test('does not fetch when no GPS coordinates are available', async () => {
    const { result } = renderParkingHook();
    // locationKey = 0, no coords

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await new Promise((r) => setTimeout(r, 50));

    expect(mockCallRpc).not.toHaveBeenCalled();
  });

  test('fetches the requested layer on first call', async () => {
    const { result } = await bootWithGPS();

    act(() => { result.current.fetchLayerIfNeeded('meter'); });

    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(1));
    expect(mockCallRpc).toHaveBeenCalledWith('get_nearby_meters', expect.any(Object));
  });

  test('does NOT re-fetch the same layer when called a second time', async () => {
    const { result } = await bootWithGPS();

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(1));

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await new Promise((r) => setTimeout(r, 50));

    expect(mockCallRpc).toHaveBeenCalledTimes(1);
  });

  test('fetches different layers independently (no cross-dedup)', async () => {
    const { result } = await bootWithGPS();

    act(() => {
      result.current.fetchLayerIfNeeded('meter');
      result.current.fetchLayerIfNeeded('disability');
    });

    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(2));
    const rpcNames = mockCallRpc.mock.calls.map((c) => c[0]);
    expect(rpcNames).toContain('get_nearby_meters');
    expect(rpcNames).toContain('get_nearby_disability_parking');
  });

  test('passes lat, lng, and radius to callRpc', async () => {
    mockSettingsState.settings.radiusMeters = 800;
    const { result } = await bootWithGPS(49.28, -123.12);

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalled());

    expect(mockCallRpc).toHaveBeenCalledWith('get_nearby_meters', {
      user_lat:      49.28,
      user_lng:      -123.12,
      radius_meters: 800,
    });
  });

  test('clears layer cache and re-fetches after GPS moves ≥200 m', async () => {
    const { result, rerender } = await bootWithGPS();

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(1));

    // Move far enough to bust the cache
    act(() => { setLocation(49.282, -123.12); rerender(); });
    await waitFor(() => expect(result.current.locationKey).toBe(2));

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(2));
  });

  test('clears layer cache and re-fetches after radius changes', async () => {
    const { result, rerender } = await bootWithGPS();

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(1));

    act(() => {
      mockSettingsState.settings = { radiusMeters: 1000 };
      rerender();
    });
    await waitFor(() => expect(result.current.locationKey).toBeGreaterThan(1));

    act(() => { result.current.fetchLayerIfNeeded('meter'); });
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(2));
  });
});

// ── stale fetch cancellation ──────────────────────────────────────────────────

describe('stale fetch cancellation', () => {
  test('discards a fetch response that arrives after a newer fetch started', async () => {
    let resolveFirst!: (v: any) => void;
    const firstResponse = new Promise((r) => { resolveFirst = r; });

    mockCallRpc
      .mockImplementationOnce(() => firstResponse)                      // slow, stale
      .mockResolvedValueOnce({ data: [{ meter_id: 'FRESH' }], error: null }); // fast, fresh

    const { result, rerender } = renderParkingHook();

    act(() => { setLocation(49.28, -123.12); rerender(); });
    await waitFor(() => expect(result.current.locationKey).toBe(1));

    // Trigger first (slow) fetch
    act(() => { result.current.fetchLayerIfNeeded('meter'); });

    // Move far enough to clear cache, then trigger second (fast) fetch
    act(() => { setLocation(49.282, -123.12); rerender(); });
    await waitFor(() => expect(result.current.locationKey).toBe(2));
    act(() => { result.current.fetchLayerIfNeeded('meter'); });

    // Wait for the second (fast) fetch to settle
    await waitFor(() => expect(mockCallRpc).toHaveBeenCalledTimes(2));

    // Now resolve the slow stale response — should be ignored
    act(() => { resolveFirst({ data: [{ meter_id: 'STALE' }], error: null }); });
    await new Promise((r) => setTimeout(r, 50));

    // The stale data should NOT have overwritten the fresh data
    expect(result.current.meters.some((m) => m.meter_id === 'STALE')).toBe(false);
  });
});
