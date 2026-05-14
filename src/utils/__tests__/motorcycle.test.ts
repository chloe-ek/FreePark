/**
 * @jest-environment node
 */
import {
  getMotoCurrentRate,
  getMotoCurrentTimeLimit,
} from '../parkingUtils';
import { setTime, makeMoto } from './helpers';

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

// ─── getMotoCurrentRate ───────────────────────────────────────────────────────

describe('getMotoCurrentRate', () => {
  test('weekday daytime rate', () => {
    setTime(2, 10);
    expect(getMotoCurrentRate(makeMoto({ rate_9am_6pm: 1.00 }))).toBe(1.00);
  });

  test('weekday evening rate', () => {
    setTime(2, 19);
    expect(getMotoCurrentRate(makeMoto({ rate_6pm_10pm: 0.75 }))).toBe(0.75);
  });

  test('saturday daytime rate', () => {
    setTime(6, 11);
    expect(getMotoCurrentRate(makeMoto({ rate_sa_9am_6pm: 0.50 }))).toBe(0.50);
  });

  test('saturday evening rate', () => {
    setTime(6, 19);
    expect(getMotoCurrentRate(makeMoto({ rate_sa_6pm_10pm: 0.25 }))).toBe(0.25);
  });

  test('sunday daytime rate', () => {
    setTime(0, 11);
    expect(getMotoCurrentRate(makeMoto({ rate_su_9am_6pm: 0.50 }))).toBe(0.50);
  });

  test('sunday evening rate', () => {
    setTime(0, 19);
    expect(getMotoCurrentRate(makeMoto({ rate_su_6pm_10pm: 0.25 }))).toBe(0.25);
  });

  test('null outside metered hours', () => {
    setTime(2, 23);
    expect(getMotoCurrentRate(makeMoto({ rate_9am_6pm: 1.00 }))).toBeNull();
  });

  test('null before metered hours', () => {
    setTime(2, 8, 59);
    expect(getMotoCurrentRate(makeMoto({ rate_9am_6pm: 1.00 }))).toBeNull();
  });

  test('returns rate at exactly 9 AM', () => {
    setTime(2, 9, 0);
    expect(getMotoCurrentRate(makeMoto({ rate_9am_6pm: 1.00 }))).toBe(1.00);
  });

  test('null at exactly 10 PM', () => {
    setTime(2, 22, 0);
    expect(getMotoCurrentRate(makeMoto({ rate_6pm_10pm: 0.75 }))).toBeNull();
  });

  test('saturday rate isolated from weekday rate', () => {
    setTime(6, 10); // Saturday
    // weekday rate set, saturday rate null → should return null (free on Saturday)
    expect(getMotoCurrentRate(makeMoto({ rate_9am_6pm: 1.00, rate_sa_9am_6pm: null }))).toBeNull();
  });
});

// ─── getMotoCurrentTimeLimit ──────────────────────────────────────────────────

describe('getMotoCurrentTimeLimit', () => {
  test('weekday daytime limit', () => {
    setTime(2, 10);
    expect(getMotoCurrentTimeLimit(makeMoto({ time_limit_9am_6pm: 120 }))).toBe(120);
  });

  test('weekday evening limit', () => {
    setTime(2, 19);
    expect(getMotoCurrentTimeLimit(makeMoto({ time_limit_6pm_10pm: 60 }))).toBe(60);
  });

  test('saturday daytime limit', () => {
    setTime(6, 11);
    expect(getMotoCurrentTimeLimit(makeMoto({ time_limit_sa_9am_6pm: 60 }))).toBe(60);
  });

  test('sunday daytime limit', () => {
    setTime(0, 11);
    expect(getMotoCurrentTimeLimit(makeMoto({ time_limit_su_9am_6pm: 30 }))).toBe(30);
  });

  test('null outside metered hours', () => {
    setTime(2, 23);
    expect(getMotoCurrentTimeLimit(makeMoto({ time_limit_9am_6pm: 120 }))).toBeNull();
  });

  test('null at exactly 10 PM', () => {
    setTime(2, 22, 0);
    expect(getMotoCurrentTimeLimit(makeMoto({ time_limit_6pm_10pm: 60 }))).toBeNull();
  });
});
