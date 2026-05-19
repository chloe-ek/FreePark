import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── AsyncStorage mock ─────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

// ── Supabase mock ─────────────────────────────────────────────────────────────
//
// The mock keeps mutable state in a closure so tests can change return values
// without re-declaring the mock. Access via getMockState().

jest.mock('../../lib/supabase', () => {
  const state = {
    fetchData:         [],
    fetchError:        null,
    fetchShouldThrow:  false,
    insertError:       null,
    insertShouldThrow: false,
    realtimeCallback:  null,
  };

  return {
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockImplementation(() => {
                if (state.fetchShouldThrow) throw new Error('network timeout');
                return Promise.resolve({ data: state.fetchData, error: state.fetchError });
              }),
            }),
          }),
        }),
        insert: jest.fn().mockImplementation(() => {
          if (state.insertShouldThrow) throw new Error('network timeout');
          return Promise.resolve({ error: state.insertError });
        }),
      }),
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockImplementation((_ev, _cfg, cb) => {
          state.realtimeCallback = cb;
          return { subscribe: jest.fn() };
        }),
      }),
      removeChannel: jest.fn(),
    },
    __state: state,
  };
});

function getMockState(): {
  fetchData:         any[];
  fetchError:        any;
  fetchShouldThrow:  boolean;
  insertError:       any;
  insertShouldThrow: boolean;
  realtimeCallback:  ((payload: any) => void) | null;
} {
  return (jest.requireMock('../../lib/supabase') as any).__state;
}

function fireInsert(payload: object) {
  const cb = getMockState().realtimeCallback;
  if (cb) cb({ new: payload });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReport(meterId: string, expiresInMs = 60 * 60 * 1000) {
  const now = new Date();
  return {
    id:          `r-${meterId}-${Date.now()}`,
    meter_id:    meterId,
    report_type: 'no_vacancy' as const,
    reported_at: now.toISOString(),
    expires_at:  new Date(now.getTime() + expiresInMs).toISOString(),
  };
}

const COOLDOWN_MS = 60 * 60 * 1000; // must mirror the constant in useSpotReports

// ── Import hook (AFTER all mocks so the module gets mocked deps) ──────────────

import { useSpotReports } from '../useSpotReports';

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);

  const s = getMockState();
  s.fetchData         = [];
  s.fetchError        = null;
  s.fetchShouldThrow  = false;
  s.insertError       = null;
  s.insertShouldThrow = false;
  s.realtimeCallback  = null;
});

// ─────────────────────────────────────────────────────────────────────────────
// loadCooldowns
//
// NOTE: useSpotReports has a module-level `cooldownsLoaded` boolean that flips
// to true after the very first renderHook call in this file. The tests in this
// block MUST execute first to observe the load-on-mount behaviour. Subsequent
// tests use `jest.isolateModules` when they need a fresh flag, or use unique
// meter IDs to avoid cross-test cooldown contamination.
// ─────────────────────────────────────────────────────────────────────────────

describe('loadCooldowns — first-mount behaviour', () => {
  test('active persisted cooldown blocks submit; expired one does not', async () => {
    const now        = Date.now();
    const activeTs   = now - 30 * 60 * 1000; // 30 min ago → inside 1-hour window
    const expiredTs  = now - 90 * 60 * 1000; // 90 min ago → past 1-hour window

    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({ 'LOAD-ACTIVE': activeTs, 'LOAD-EXPIRED': expiredTs }),
    );

    const { result } = renderHook(() =>
      useSpotReports(['LOAD-ACTIVE', 'LOAD-EXPIRED']),
    );
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());

    let blocked!: boolean;
    await act(async () => {
      blocked = await result.current.submitReport('LOAD-ACTIVE', 'no_vacancy');
    });
    expect(blocked).toBe(false);

    let allowed!: boolean;
    await act(async () => {
      allowed = await result.current.submitReport('LOAD-EXPIRED', 'no_vacancy');
    });
    expect(allowed).toBe(true);
  });

  test('hook stays functional even if getItem later returns corrupted JSON', async () => {
    // loadCooldowns is already done by this point. We verify the hook is still
    // stable when AsyncStorage returns garbage on unrelated calls.
    mockGetItem.mockResolvedValueOnce('not-json{{{');
    const { result } = renderHook(() => useSpotReports(['CORRUPT-002']));

    let ok!: boolean;
    await act(async () => { ok = await result.current.submitReport('CORRUPT-002', 'no_vacancy'); });
    expect(typeof ok).toBe('boolean'); // didn't throw — hook is intact
  });

  test('null storage is a no-op — hook still works normally', async () => {
    // cooldownsLoaded is already true at this point, but we still verify
    // the hook mounts cleanly and can submit.
    mockGetItem.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useSpotReports(['NULL-001']));

    let ok!: boolean;
    await act(async () => {
      ok = await result.current.submitReport('NULL-001', 'no_vacancy');
    });
    expect(ok).toBe(true);
  });
});

// ── submitReport ──────────────────────────────────────────────────────────────

describe('submitReport', () => {
  test('returns true on first submit for a meter', async () => {
    const { result } = renderHook(() => useSpotReports(['SR-FIRST']));

    let ok!: boolean;
    await act(async () => { ok = await result.current.submitReport('SR-FIRST', 'no_vacancy'); });
    expect(ok).toBe(true);
  });

  test('returns false when same meter is submitted within the 1-hour cooldown', async () => {
    const { result } = renderHook(() => useSpotReports(['SR-COOL']));

    await act(async () => { await result.current.submitReport('SR-COOL', 'no_vacancy'); });

    let second!: boolean;
    await act(async () => { second = await result.current.submitReport('SR-COOL', 'no_vacancy'); });
    expect(second).toBe(false);
  });

  test('cooldown is per-meter and does not bleed to other meters', async () => {
    const { result } = renderHook(() => useSpotReports(['SR-A', 'SR-B']));

    await act(async () => { await result.current.submitReport('SR-A', 'no_vacancy'); });

    let okB!: boolean;
    await act(async () => { okB = await result.current.submitReport('SR-B', 'no_vacancy'); });
    expect(okB).toBe(true);
  });

  test('returns false when supabase returns an error object', async () => {
    getMockState().insertError = { message: 'duplicate key violation' };

    const { result } = renderHook(() => useSpotReports(['SR-ERR']));

    let ok!: boolean;
    await act(async () => { ok = await result.current.submitReport('SR-ERR', 'no_vacancy'); });
    expect(ok).toBe(false);
  });

  test('does NOT set cooldown when supabase insert fails — retry is allowed', async () => {
    getMockState().insertError = { message: 'network error' };
    const { result } = renderHook(() => useSpotReports(['SR-NOCOOL']));

    await act(async () => { await result.current.submitReport('SR-NOCOOL', 'no_vacancy'); });

    getMockState().insertError = null;

    let retry!: boolean;
    await act(async () => { retry = await result.current.submitReport('SR-NOCOOL', 'no_vacancy'); });
    expect(retry).toBe(true);
  });

  test('returns false when supabase throws an unexpected exception', async () => {
    getMockState().insertShouldThrow = true;
    const { result } = renderHook(() => useSpotReports(['SR-THROW']));

    let ok!: boolean;
    await act(async () => { ok = await result.current.submitReport('SR-THROW', 'no_vacancy'); });
    expect(ok).toBe(false);
  });

  test('persists cooldowns to AsyncStorage after a successful submit', async () => {
    const { result } = renderHook(() => useSpotReports(['SR-PERSIST']));

    await act(async () => { await result.current.submitReport('SR-PERSIST', 'no_vacancy'); });

    expect(mockSetItem).toHaveBeenCalledWith(
      '@freepark_report_cooldowns',
      expect.stringContaining('SR-PERSIST'),
    );
  });

  test('does NOT write to AsyncStorage when insert fails', async () => {
    getMockState().insertError = { message: 'fail' };
    const { result } = renderHook(() => useSpotReports(['SR-NOPERSIST']));

    await act(async () => { await result.current.submitReport('SR-NOPERSIST', 'no_vacancy'); });

    const cooldownWrite = mockSetItem.mock.calls.find(
      (c) => c[0] === '@freepark_report_cooldowns',
    );
    expect(cooldownWrite).toBeUndefined();
  });

  test('allows re-submit after the 1-hour cooldown expires (fake timers)', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSpotReports(['SR-EXPIRE']));

    await act(async () => { await result.current.submitReport('SR-EXPIRE', 'no_vacancy'); });

    act(() => { jest.advanceTimersByTime(COOLDOWN_MS + 1); });

    let ok!: boolean;
    await act(async () => { ok = await result.current.submitReport('SR-EXPIRE', 'no_vacancy'); });
    expect(ok).toBe(true);

    jest.useRealTimers();
  });

  test('condition is strict (<): at exactly COOLDOWN_MS elapsed the submit is allowed', async () => {
    // The guard is `Date.now() - lastTime < COOLDOWN_MS`.
    // At exactly COOLDOWN_MS the expression is false → not blocked.
    jest.useFakeTimers();
    const { result } = renderHook(() => useSpotReports(['SR-BOUND']));

    await act(async () => { await result.current.submitReport('SR-BOUND', 'no_vacancy'); });

    act(() => { jest.advanceTimersByTime(COOLDOWN_MS); });

    let atBoundary!: boolean;
    await act(async () => { atBoundary = await result.current.submitReport('SR-BOUND', 'no_vacancy'); });
    expect(atBoundary).toBe(true); // allowed: elapsed == COOLDOWN_MS is NOT < COOLDOWN_MS

    jest.useRealTimers();
  });
});

// ── getReport ─────────────────────────────────────────────────────────────────

describe('getReport', () => {
  test('returns undefined when no reports exist', () => {
    const { result } = renderHook(() => useSpotReports([]));
    expect(result.current.getReport('GR-NONE')).toBeUndefined();
  });

  test('returns undefined for a meterId not in the report list', async () => {
    getMockState().fetchData = [makeReport('GR-OTHER')];
    const { result } = renderHook(() => useSpotReports(['GR-OTHER']));
    await waitFor(() => expect(result.current.getReport('GR-OTHER')).toBeDefined());

    expect(result.current.getReport('GR-MISSING')).toBeUndefined();
  });

  test('returns undefined for an expired report (expired_at in the past)', async () => {
    getMockState().fetchData = [makeReport('GR-EXP', -1000)]; // expired 1 sec ago
    const { result } = renderHook(() => useSpotReports(['GR-EXP']));

    await waitFor(() => expect(result.current.getReport('GR-EXP')).toBeUndefined());
  });

  test('returns an active report when expires_at is in the future', async () => {
    const active = makeReport('GR-ACTIVE');
    getMockState().fetchData = [active];
    const { result } = renderHook(() => useSpotReports(['GR-ACTIVE']));

    await waitFor(() => expect(result.current.getReport('GR-ACTIVE')).toBeDefined());
    expect(result.current.getReport('GR-ACTIVE')?.meter_id).toBe('GR-ACTIVE');
  });

  test('returns undefined when meterIds list is empty (no fetch attempted)', () => {
    const { result } = renderHook(() => useSpotReports([]));
    expect(result.current.getReport('GR-EMPTY')).toBeUndefined();
  });
});

// ── Realtime INSERT ───────────────────────────────────────────────────────────

describe('realtime INSERT via supabase channel', () => {
  test('ignores INSERT whose meter_id is not in the tracked list', async () => {
    const { result } = renderHook(() => useSpotReports(['RT-TRACKED']));
    await waitFor(() => expect(getMockState().realtimeCallback).not.toBeNull());

    act(() => { fireInsert(makeReport('RT-UNRELATED')); });

    expect(result.current.getReport('RT-UNRELATED')).toBeUndefined();
  });

  test('adds realtime INSERT for a tracked meter to state', async () => {
    const { result } = renderHook(() => useSpotReports(['RT-ADD']));
    await waitFor(() => expect(getMockState().realtimeCallback).not.toBeNull());

    const report = makeReport('RT-ADD');
    act(() => { fireInsert(report); });

    await waitFor(() => expect(result.current.getReport('RT-ADD')).toBeDefined());
    expect(result.current.getReport('RT-ADD')?.id).toBe(report.id);
  });

  test('newer INSERT for same meter replaces the older report in state', async () => {
    const first = makeReport('RT-REPLACE');
    getMockState().fetchData = [first];
    const { result } = renderHook(() => useSpotReports(['RT-REPLACE']));
    await waitFor(() => expect(result.current.getReport('RT-REPLACE')).toBeDefined());

    const newer = { ...makeReport('RT-REPLACE'), id: 'r-newer' };
    act(() => { fireInsert(newer); });

    await waitFor(() => expect(result.current.getReport('RT-REPLACE')?.id).toBe('r-newer'));
  });
});

// ── Purge interval ────────────────────────────────────────────────────────────

describe('purge interval (every 60 s)', () => {
  test('removes expired reports after the interval fires', async () => {
    jest.useFakeTimers();
    getMockState().fetchData = [makeReport('PURGE-OUT', 20_000)]; // expires in 20 s

    const { result } = renderHook(() => useSpotReports(['PURGE-OUT']));
    await waitFor(() => expect(result.current.getReport('PURGE-OUT')).toBeDefined());

    // Advance past report expiry and the 60 s purge tick
    act(() => { jest.advanceTimersByTime(80_000); });

    expect(result.current.getReport('PURGE-OUT')).toBeUndefined();
    jest.useRealTimers();
  });

  test('does not remove still-active reports during the purge tick', async () => {
    jest.useFakeTimers();
    getMockState().fetchData = [makeReport('PURGE-KEEP', 5 * 60 * 60 * 1000)]; // expires in 5 h

    const { result } = renderHook(() => useSpotReports(['PURGE-KEEP']));
    await waitFor(() => expect(result.current.getReport('PURGE-KEEP')).toBeDefined());

    act(() => { jest.advanceTimersByTime(60_000); });

    expect(result.current.getReport('PURGE-KEEP')).toBeDefined();
    jest.useRealTimers();
  });
});

// ── fetchActive error handling ────────────────────────────────────────────────

describe('fetchActive — network error handling', () => {
  test('hook stays functional when fetchActive throws (does not crash)', async () => {
    getMockState().fetchShouldThrow = true;

    // Before the fix this would cause an unhandled promise rejection and
    // potentially crash the test / the app. Now it's swallowed silently.
    const { result } = renderHook(() => useSpotReports(['FA-THROW']));

    // Hook is still usable — getReport and submitReport work normally
    expect(result.current.getReport('FA-THROW')).toBeUndefined();

    getMockState().fetchShouldThrow = false;
    let ok!: boolean;
    await act(async () => { ok = await result.current.submitReport('FA-THROW', 'no_vacancy'); });
    expect(ok).toBe(true);
  });

  test('reports list stays empty (not stale data) when fetchActive throws', async () => {
    getMockState().fetchShouldThrow = true;

    const { result } = renderHook(() => useSpotReports(['FA-EMPTY']));

    // Wait a tick for the async fetchActive to complete (and throw)
    await act(async () => {});

    expect(result.current.getReport('FA-EMPTY')).toBeUndefined();
  });
});
