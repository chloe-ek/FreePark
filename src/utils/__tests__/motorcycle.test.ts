/**
 * @jest-environment node
 */
import {
  getMotoCurrentRate,
  getMotoCurrentTimeLimit,
  isMotoRushHour,
  isBCStatutoryHoliday,
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

// ─── isMotoRushHour ───────────────────────────────────────────────────────────

describe('isMotoRushHour', () => {
  test('returns true during AM rush hour on weekday', () => {
    setTime(2, 8); // Tuesday 8 AM
    expect(isMotoRushHour(makeMoto({ am_rush_start: '07:00', am_rush_end: '10:00' }))).toBe(true);
  });

  test('returns true during PM rush hour on weekday', () => {
    setTime(2, 16); // Tuesday 4 PM
    expect(isMotoRushHour(makeMoto({ pm_rush_start: '15:00', pm_rush_end: '19:00' }))).toBe(true);
  });

  test('returns false before AM rush hour', () => {
    setTime(2, 6, 59);
    expect(isMotoRushHour(makeMoto({ am_rush_start: '07:00', am_rush_end: '10:00' }))).toBe(false);
  });

  test('returns false at end of rush hour (exclusive)', () => {
    setTime(2, 10, 0);
    expect(isMotoRushHour(makeMoto({ am_rush_start: '07:00', am_rush_end: '10:00' }))).toBe(false);
  });

  test('returns false on Saturday', () => {
    setTime(6, 8);
    expect(isMotoRushHour(makeMoto({ am_rush_start: '07:00', am_rush_end: '10:00' }))).toBe(false);
  });

  test('returns false on Sunday', () => {
    setTime(0, 8);
    expect(isMotoRushHour(makeMoto({ am_rush_start: '07:00', am_rush_end: '10:00' }))).toBe(false);
  });

  test('returns false when no rush hours set', () => {
    setTime(2, 8);
    expect(isMotoRushHour(makeMoto({}))).toBe(false);
  });
});

// ─── isBCStatutoryHoliday ─────────────────────────────────────────────────────

describe('isBCStatutoryHoliday', () => {
  test('New Year\'s Day', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 0, 1))).toBe(true);
  });

  test('Canada Day', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 6, 1))).toBe(true);
  });

  test('Christmas Day', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 11, 25))).toBe(true);
  });

  test('Family Day 2026 (3rd Monday of February)', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 1, 16))).toBe(true);
  });

  test('Victoria Day 2026 (last Monday on or before May 24)', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 4, 18))).toBe(true);
  });

  test('Labour Day 2026 (1st Monday of September)', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 8, 7))).toBe(true);
  });

  test('regular weekday is not a holiday', () => {
    expect(isBCStatutoryHoliday(new Date(2026, 4, 15))).toBe(false); // Friday May 15
  });

  test('rush hour is suppressed on a statutory holiday', () => {
    // Canada Day 2026 is a Wednesday
    jest.setSystemTime(new Date(2026, 6, 1, 8, 0, 0));
    expect(isMotoRushHour(makeMoto({ am_rush_start: '07:00', am_rush_end: '10:00' }))).toBe(false);
  });
});
