import { renderHook, waitFor } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../utils/validation', () => ({
  isValidCoordinates: jest.fn().mockReturnValue(true),
}));

jest.mock('../../lib/supabase', () => {
  const state = {
    data:        [] as unknown[],
    error:       null as { message: string } | null,
    shouldThrow: false,
  };
  return {
    callRpc: jest.fn().mockImplementation(() => {
      if (state.shouldThrow) throw new Error('network timeout');
      return Promise.resolve({ data: state.data, error: state.error });
    }),
    __state: state,
  };
});

import { isValidCoordinates } from '../../utils/validation';
import { useFetchNearby } from '../useFetchNearby';

const mockIsValid = isValidCoordinates as jest.Mock;

function getMockState(): { data: unknown[]; error: { message: string } | null; shouldThrow: boolean } {
  return (jest.requireMock('../../lib/supabase') as any).__state;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsValid.mockReturnValue(true);
  const s = getMockState();
  s.data        = [];
  s.error       = null;
  s.shouldThrow = false;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFetchNearby', () => {
  const RPC = 'get_nearby_meters';
  const LAT  = 49.2827;
  const LNG  = -123.1207;
  const R    = 400;

  test('starts with empty state and not loading', () => {
    const { result } = renderHook(() =>
      useFetchNearby(RPC, LAT, LNG, R, false),
    );
    expect(result.current).toEqual({ data: [], loading: false, error: null });
  });

  test('does not fetch when enabled=false', async () => {
    const { callRpc } = jest.requireMock('../../lib/supabase');
    renderHook(() => useFetchNearby(RPC, LAT, LNG, R, false));
    await waitFor(() => expect(callRpc).not.toHaveBeenCalled());
  });

  test('does not fetch when latitude is null', () => {
    const { callRpc } = jest.requireMock('../../lib/supabase');
    renderHook(() => useFetchNearby(RPC, null, LNG, R, true));
    expect(callRpc).not.toHaveBeenCalled();
  });

  test('does not fetch when longitude is null', () => {
    const { callRpc } = jest.requireMock('../../lib/supabase');
    renderHook(() => useFetchNearby(RPC, LAT, null, R, true));
    expect(callRpc).not.toHaveBeenCalled();
  });

  test('does not fetch when isValidCoordinates returns false', () => {
    mockIsValid.mockReturnValue(false);
    const { callRpc } = jest.requireMock('../../lib/supabase');
    renderHook(() => useFetchNearby(RPC, LAT, LNG, R, true));
    expect(callRpc).not.toHaveBeenCalled();
  });

  test('sets data on successful fetch', async () => {
    getMockState().data = [{ id: 1 }, { id: 2 }];

    const { result } = renderHook(() => useFetchNearby(RPC, LAT, LNG, R, true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.error).toBeNull();
  });

  test('sets error when RPC returns an error object', async () => {
    getMockState().error = { message: 'permission denied' };

    const { result } = renderHook(() => useFetchNearby(RPC, LAT, LNG, R, true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('permission denied');
    expect(result.current.data).toEqual([]);
  });

  test('sets "Network error" and stops loading when callRpc throws', async () => {
    getMockState().shouldThrow = true;

    const { result } = renderHook(() => useFetchNearby(RPC, LAT, LNG, R, true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toEqual([]);
  });

  test('loading does not get stuck when callRpc throws', async () => {
    getMockState().shouldThrow = true;

    const { result } = renderHook(() => useFetchNearby(RPC, LAT, LNG, R, true));

    // Before the fix, loading would stay true forever
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test('does not throw when unmounted before fetch resolves', async () => {
    const { unmount } = renderHook(() => useFetchNearby(RPC, LAT, LNG, R, true));
    // Unmount immediately while the fetch is in-flight.
    // If the cancelled flag weren't checked, React would warn about a state
    // update on an unmounted component. The test passing without error is the assertion.
    expect(() => unmount()).not.toThrow();
  });

  test('resets to empty state when enabled switches to false', async () => {
    getMockState().data = [{ id: 1 }];

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useFetchNearby(RPC, LAT, LNG, R, enabled),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    rerender({ enabled: false });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
