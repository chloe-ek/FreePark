/**
 * @jest-environment node
 */
import {
  isMeterFreeNow,
  isMeterProhibited,
  getCurrentRate,
  getCurrentRateLabel,
  getCurrentTimeLimit,
  minutesUntilFree,
  formatMinutes,
  getFreeAfterTime,
  getRushHours,
} from '../parkingUtils';
import { setTime, makeMeter } from './helpers';

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

// ─── formatMinutes ────────────────────────────────────────────────────────────

describe('formatMinutes', () => {
  test('0 shows 0 min', () => expect(formatMinutes(0)).toBe('0 min'));
  test('1 shows 1 min', () => expect(formatMinutes(1)).toBe('1 min'));
  test('under 60 shows minutes', () => expect(formatMinutes(45)).toBe('45 min'));
  test('59 shows 59 min', () => expect(formatMinutes(59)).toBe('59 min'));
  test('exactly 60 shows 1h', () => expect(formatMinutes(60)).toBe('1h'));
  test('90 shows 1h 30m', () => expect(formatMinutes(90)).toBe('1h 30m'));
  test('120 shows 2h', () => expect(formatMinutes(120)).toBe('2h'));
  test('150 shows 2h 30m', () => expect(formatMinutes(150)).toBe('2h 30m'));
});

// ─── isMeterProhibited ────────────────────────────────────────────────────────

describe('isMeterProhibited', () => {
  test('false with no restrictions', () => {
    setTime(2, 10); // Tuesday 10 AM
    expect(isMeterProhibited(makeMeter())).toBe(false);
  });

  test('true inside prohibition window on matching day', () => {
    setTime(2, 8, 30); // Tuesday 8:30 AM
    expect(isMeterProhibited(makeMeter({
      prohibition_start: '08:00',
      prohibition_end: '09:30',
      prohibition_days: 'Mon Tue Wed Thu Fri',
    }))).toBe(true);
  });

  test('false when prohibition day does not match', () => {
    setTime(6, 8, 30); // Saturday 8:30 AM
    expect(isMeterProhibited(makeMeter({
      prohibition_start: '08:00',
      prohibition_end: '09:30',
      prohibition_days: 'Mon Tue Wed Thu Fri',
    }))).toBe(false);
  });

  test('false before prohibition window starts', () => {
    setTime(2, 7, 59); // Tuesday 7:59 AM
    expect(isMeterProhibited(makeMeter({
      prohibition_start: '08:00',
      prohibition_end: '09:30',
      prohibition_days: 'Mon Tue Wed Thu Fri',
    }))).toBe(false);
  });

  test('false at prohibition end time (exclusive)', () => {
    setTime(2, 9, 30); // Tuesday 9:30 AM
    expect(isMeterProhibited(makeMeter({
      prohibition_start: '08:00',
      prohibition_end: '09:30',
      prohibition_days: 'Mon Tue Wed Thu Fri',
    }))).toBe(false);
  });

  test('true during AM rush hour on weekday', () => {
    setTime(2, 8); // Tuesday 8 AM
    expect(isMeterProhibited(makeMeter({
      am_rush_start: '07:00',
      am_rush_end: '09:00',
    }))).toBe(true);
  });

  test('false during AM rush hour on weekend', () => {
    setTime(6, 8); // Saturday 8 AM
    expect(isMeterProhibited(makeMeter({
      am_rush_start: '07:00',
      am_rush_end: '09:00',
    }))).toBe(false);
  });

  test('true during PM rush hour on weekday', () => {
    setTime(3, 17); // Wednesday 5 PM
    expect(isMeterProhibited(makeMeter({
      pm_rush_start: '16:00',
      pm_rush_end: '18:30',
    }))).toBe(true);
  });

  test('false during PM rush hour on weekend', () => {
    setTime(0, 17); // Sunday 5 PM
    expect(isMeterProhibited(makeMeter({
      pm_rush_start: '16:00',
      pm_rush_end: '18:30',
    }))).toBe(false);
  });

  test('false just before PM rush start', () => {
    setTime(2, 15, 59); // Tuesday 3:59 PM
    expect(isMeterProhibited(makeMeter({
      pm_rush_start: '16:00',
      pm_rush_end: '18:30',
    }))).toBe(false);
  });

  test('true inside second prohibition window', () => {
    setTime(2, 17, 30); // Tuesday 5:30 PM
    expect(isMeterProhibited(makeMeter({
      prohibition2_start: '16:00',
      prohibition2_end: '18:30',
      prohibition2_days: 'Tue',
    }))).toBe(true);
  });

  test('false when second prohibition day does not match', () => {
    setTime(3, 17, 30); // Wednesday 5:30 PM
    expect(isMeterProhibited(makeMeter({
      prohibition2_start: '16:00',
      prohibition2_end: '18:30',
      prohibition2_days: 'Tue',
    }))).toBe(false);
  });
});

// ─── isMeterFreeNow ───────────────────────────────────────────────────────────

describe('isMeterFreeNow', () => {
  test('free outside metered hours (11 PM)', () => {
    setTime(2, 23); // Tuesday 11 PM
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: 2.00 }))).toBe(true);
  });

  test('free before metered hours (8:59 AM)', () => {
    setTime(2, 8, 59);
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: 2.00 }))).toBe(true);
  });

  test('not free at exactly 9 AM (meter window starts)', () => {
    setTime(2, 9, 0);
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: 2.00 }))).toBe(false);
  });

  test('free when daytime rate is null', () => {
    setTime(2, 10);
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: null }))).toBe(true);
  });

  test('free when daytime rate is zero', () => {
    setTime(2, 10);
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: 0 }))).toBe(true);
  });

  test('not free when daytime rate is positive', () => {
    setTime(2, 10);
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: 2.00 }))).toBe(false);
  });

  test('not free during evening with evening rate set', () => {
    setTime(2, 19); // Tuesday 7 PM
    expect(isMeterFreeNow(makeMeter({ rate_6pm_10pm: 1.50 }))).toBe(false);
  });

  test('free at exactly 10 PM (metered window ends)', () => {
    setTime(2, 22, 0);
    expect(isMeterFreeNow(makeMeter({ rate_6pm_10pm: 1.50 }))).toBe(true);
  });

  test('not free during rush hour even with zero rate', () => {
    setTime(2, 8); // Tuesday 8 AM — inside rush window
    expect(isMeterFreeNow(makeMeter({
      rate_9am_6pm: 0,
      am_rush_start: '07:30',
      am_rush_end: '09:00',
    }))).toBe(false);
  });

  test('uses saturday rate on saturday', () => {
    setTime(6, 10); // Saturday 10 AM
    expect(isMeterFreeNow(makeMeter({ rate_sa_9am_6pm: 1.00 }))).toBe(false);
  });

  test('free on saturday when saturday rate is null (weekday rate irrelevant)', () => {
    setTime(6, 10);
    expect(isMeterFreeNow(makeMeter({ rate_9am_6pm: 2.00, rate_sa_9am_6pm: null }))).toBe(true);
  });

  test('uses sunday rate on sunday', () => {
    setTime(0, 10); // Sunday 10 AM
    expect(isMeterFreeNow(makeMeter({ rate_su_9am_6pm: null }))).toBe(true);
  });

  test('not free on sunday with sunday rate', () => {
    setTime(0, 10);
    expect(isMeterFreeNow(makeMeter({ rate_su_9am_6pm: 1.50 }))).toBe(false);
  });
});

// ─── getCurrentRate ───────────────────────────────────────────────────────────

describe('getCurrentRate', () => {
  test('null at 8:59 AM (before metered window)', () => {
    setTime(2, 8, 59);
    expect(getCurrentRate(makeMeter({ rate_9am_6pm: 2.00 }))).toBeNull();
  });

  test('returns rate at exactly 9:00 AM', () => {
    setTime(2, 9, 0);
    expect(getCurrentRate(makeMeter({ rate_9am_6pm: 2.00 }))).toBe(2.00);
  });

  test('weekday daytime rate', () => {
    setTime(2, 10); // Tuesday 10 AM
    expect(getCurrentRate(makeMeter({ rate_9am_6pm: 2.00 }))).toBe(2.00);
  });

  test('returns evening rate at exactly 6:00 PM', () => {
    setTime(2, 18, 0);
    expect(getCurrentRate(makeMeter({ rate_9am_6pm: 2.00, rate_6pm_10pm: 1.50 }))).toBe(1.50);
  });

  test('weekday evening rate', () => {
    setTime(2, 19); // Tuesday 7 PM
    expect(getCurrentRate(makeMeter({ rate_6pm_10pm: 1.50 }))).toBe(1.50);
  });

  test('null at exactly 10:00 PM (metered window ends)', () => {
    setTime(2, 22, 0);
    expect(getCurrentRate(makeMeter({ rate_6pm_10pm: 1.50 }))).toBeNull();
  });

  test('saturday daytime rate', () => {
    setTime(6, 11); // Saturday 11 AM
    expect(getCurrentRate(makeMeter({ rate_sa_9am_6pm: 0.75 }))).toBe(0.75);
  });

  test('saturday evening rate', () => {
    setTime(6, 19);
    expect(getCurrentRate(makeMeter({ rate_sa_6pm_10pm: 1.00 }))).toBe(1.00);
  });

  test('sunday evening rate', () => {
    setTime(0, 20); // Sunday 8 PM
    expect(getCurrentRate(makeMeter({ rate_su_6pm_10pm: 0.50 }))).toBe(0.50);
  });

  test('null outside metered hours', () => {
    setTime(2, 23); // Tuesday 11 PM
    expect(getCurrentRate(makeMeter({ rate_9am_6pm: 2.00 }))).toBeNull();
  });

  test('null when prohibited (rush hour)', () => {
    setTime(2, 8); // Tuesday 8 AM
    expect(getCurrentRate(makeMeter({
      rate_9am_6pm: 2.00,
      am_rush_start: '07:30',
      am_rush_end: '09:00',
    }))).toBeNull();
  });

  test('null when prohibited by street cleaning during metered hours', () => {
    setTime(2, 9, 30); // Tuesday 9:30 AM — inside metered AND prohibition window
    expect(getCurrentRate(makeMeter({
      rate_9am_6pm: 2.00,
      prohibition_start: '08:00',
      prohibition_end: '10:00',
      prohibition_days: 'Mon Tue Wed Thu Fri',
    }))).toBeNull();
  });
});

// ─── getCurrentTimeLimit ──────────────────────────────────────────────────────

describe('getCurrentTimeLimit', () => {
  test('weekday daytime limit', () => {
    setTime(2, 10);
    expect(getCurrentTimeLimit(makeMeter({ time_limit_9am_6pm: 120 }))).toBe(120);
  });

  test('weekday evening limit', () => {
    setTime(2, 19);
    expect(getCurrentTimeLimit(makeMeter({ time_limit_6pm_10pm: 60 }))).toBe(60);
  });

  test('saturday daytime limit', () => {
    setTime(6, 10);
    expect(getCurrentTimeLimit(makeMeter({ time_limit_sa_9am_6pm: 90 }))).toBe(90);
  });

  test('sunday evening limit', () => {
    setTime(0, 19);
    expect(getCurrentTimeLimit(makeMeter({ time_limit_su_6pm_10pm: 30 }))).toBe(30);
  });

  test('null outside metered hours', () => {
    setTime(2, 23);
    expect(getCurrentTimeLimit(makeMeter({ time_limit_9am_6pm: 120 }))).toBeNull();
  });

  test('null at exactly 10 PM', () => {
    setTime(2, 22, 0);
    expect(getCurrentTimeLimit(makeMeter({ time_limit_6pm_10pm: 60 }))).toBeNull();
  });
});

// ─── getCurrentRateLabel ──────────────────────────────────────────────────────

describe('getCurrentRateLabel', () => {
  test('Free when rate is null (off hours)', () => {
    setTime(2, 23);
    expect(getCurrentRateLabel(makeMeter({ rate_9am_6pm: 2.00 }))).toBe('Free');
  });

  test('Free when rate is null (in-hours, no rate set)', () => {
    setTime(2, 10);
    expect(getCurrentRateLabel(makeMeter())).toBe('Free');
  });

  test('Free with no time limit when rate is zero', () => {
    setTime(2, 10);
    expect(getCurrentRateLabel(makeMeter({ rate_9am_6pm: 0 }))).toBe('Free');
  });

  test('Free with time limit when rate is zero', () => {
    setTime(2, 10);
    expect(getCurrentRateLabel(makeMeter({ rate_9am_6pm: 0, time_limit_9am_6pm: 120 }))).toBe('Free (120 min)');
  });

  test('rate label without time limit', () => {
    setTime(2, 10);
    expect(getCurrentRateLabel(makeMeter({ rate_9am_6pm: 2.00 }))).toBe('$2.00/hr');
  });

  test('rate label with time limit', () => {
    setTime(2, 10);
    expect(getCurrentRateLabel(makeMeter({ rate_9am_6pm: 2.50, time_limit_9am_6pm: 120 }))).toBe('$2.50/hr · 120 min');
  });

  test('No parking when meter is prohibited by rush hour', () => {
    setTime(2, 8); // Tuesday 8 AM — rush hour
    expect(getCurrentRateLabel(makeMeter({
      rate_9am_6pm: 2.00,
      am_rush_start: '07:00',
      am_rush_end: '09:00',
    }))).toBe('No parking');
  });

  test('No parking when meter is prohibited by street cleaning during metered hours', () => {
    setTime(2, 9, 30); // Tuesday 9:30 AM — inside both prohibition and metered window
    expect(getCurrentRateLabel(makeMeter({
      rate_9am_6pm: 2.00,
      prohibition_start: '08:00',
      prohibition_end: '10:00',
      prohibition_days: 'Mon Tue Wed Thu Fri',
    }))).toBe('No parking');
  });

  test('No parking when meter is prohibited by PM rush hour', () => {
    setTime(3, 17); // Wednesday 5 PM — PM rush
    expect(getCurrentRateLabel(makeMeter({
      rate_9am_6pm: 2.00,
      pm_rush_start: '16:00',
      pm_rush_end: '18:30',
    }))).toBe('No parking');
  });
});

// ─── minutesUntilFree ─────────────────────────────────────────────────────────

describe('minutesUntilFree', () => {
  test('null when already free (off hours)', () => {
    setTime(2, 23); // Tuesday 11 PM
    expect(minutesUntilFree(makeMeter({ rate_9am_6pm: 2.00 }))).toBeNull();
  });

  test('null when free (no rate set)', () => {
    setTime(2, 10);
    expect(minutesUntilFree(makeMeter())).toBeNull();
  });

  test('minutes to 6 PM when evening slot is free (weekday)', () => {
    setTime(2, 10); // Tuesday 10:00 AM
    expect(minutesUntilFree(makeMeter({
      rate_9am_6pm: 2.00,
      rate_6pm_10pm: null,
    }))).toBe(18 * 60 - 10 * 60); // 480
  });

  test('minutes to 10 PM when evening slot is also paid (weekday)', () => {
    setTime(2, 10); // Tuesday 10:00 AM
    expect(minutesUntilFree(makeMeter({
      rate_9am_6pm: 2.00,
      rate_6pm_10pm: 1.50,
    }))).toBe(22 * 60 - 10 * 60); // 720
  });

  test('minutes to 10 PM when in evening slot (weekday)', () => {
    setTime(2, 19); // Tuesday 7:00 PM
    expect(minutesUntilFree(makeMeter({ rate_6pm_10pm: 1.50 }))).toBe(22 * 60 - 19 * 60); // 180
  });

  test('minutes to 6 PM on saturday when evening slot is free', () => {
    setTime(6, 10); // Saturday 10:00 AM
    expect(minutesUntilFree(makeMeter({
      rate_sa_9am_6pm: 1.00,
      rate_sa_6pm_10pm: null,
    }))).toBe(18 * 60 - 10 * 60); // 480
  });

  test('minutes to 10 PM on saturday when both slots are paid', () => {
    setTime(6, 10); // Saturday 10:00 AM
    expect(minutesUntilFree(makeMeter({
      rate_sa_9am_6pm: 1.00,
      rate_sa_6pm_10pm: 0.75,
    }))).toBe(22 * 60 - 10 * 60); // 720
  });

  test('minutes to 6 PM on sunday when evening slot is free', () => {
    setTime(0, 11); // Sunday 11:00 AM
    expect(minutesUntilFree(makeMeter({
      rate_su_9am_6pm: 0.50,
      rate_su_6pm_10pm: null,
    }))).toBe(18 * 60 - 11 * 60); // 420
  });

  test('does not use saturday slot when calculating for sunday', () => {
    setTime(0, 10); // Sunday 10 AM
    // Saturday rate is paid, but Sunday rate is null → should be free
    expect(minutesUntilFree(makeMeter({
      rate_sa_9am_6pm: 1.00,
      rate_su_9am_6pm: null,
    }))).toBeNull();
  });
});

// ─── getFreeAfterTime ─────────────────────────────────────────────────────────

describe('getFreeAfterTime', () => {
  test('null for empty array', () => {
    setTime(2, 10);
    expect(getFreeAfterTime([])).toBeNull();
  });

  test('null when all rates are null', () => {
    setTime(2, 10);
    expect(getFreeAfterTime([makeMeter()])).toBeNull();
  });

  test('6 PM when only daytime is paid (weekday)', () => {
    setTime(2, 10);
    expect(getFreeAfterTime([makeMeter({ rate_9am_6pm: 2.00 })])).toBe('6 PM');
  });

  test('10 PM when any evening rate is paid (weekday)', () => {
    setTime(2, 10);
    expect(getFreeAfterTime([
      makeMeter({ rate_9am_6pm: 2.00 }),
      makeMeter({ rate_6pm_10pm: 1.50 }),
    ])).toBe('10 PM');
  });

  test('uses saturday rates on saturday — 6 PM', () => {
    setTime(6, 10); // Saturday
    expect(getFreeAfterTime([
      makeMeter({ rate_sa_9am_6pm: 1.00 }),
    ])).toBe('6 PM');
  });

  test('uses saturday rates on saturday — 10 PM', () => {
    setTime(6, 10); // Saturday
    expect(getFreeAfterTime([
      makeMeter({ rate_sa_9am_6pm: 1.00, rate_sa_6pm_10pm: 0.75 }),
    ])).toBe('10 PM');
  });

  test('does not use weekday rates on saturday', () => {
    setTime(6, 10); // Saturday
    expect(getFreeAfterTime([
      makeMeter({ rate_9am_6pm: 2.00 }), // weekday-only rate, sat slots null
    ])).toBeNull();
  });

  test('uses sunday rates on sunday', () => {
    setTime(0, 10); // Sunday
    expect(getFreeAfterTime([
      makeMeter({ rate_su_9am_6pm: 0.50 }),
    ])).toBe('6 PM');
  });

  test('10 PM when one of multiple meters has evening rate', () => {
    setTime(2, 10);
    expect(getFreeAfterTime([
      makeMeter({ rate_9am_6pm: 2.00 }),      // no evening rate
      makeMeter({ rate_6pm_10pm: 1.00 }),     // has evening rate
    ])).toBe('10 PM');
  });
});

// ─── getRushHours ─────────────────────────────────────────────────────────────

describe('getRushHours', () => {
  test('empty array when no rush hours defined', () => {
    expect(getRushHours(makeMeter())).toEqual([]);
  });

  test('one window when only AM rush is set', () => {
    const windows = getRushHours(makeMeter({
      am_rush_start: '07:00',
      am_rush_end: '09:00',
    }));
    expect(windows).toHaveLength(1);
    expect(windows[0].start).toBe('07:00');
    expect(windows[0].end).toBe('09:00');
    expect(windows[0].label).toBe('7 AM – 9 AM');
  });

  test('one window when only PM rush is set', () => {
    const windows = getRushHours(makeMeter({
      pm_rush_start: '16:00',
      pm_rush_end: '18:30',
    }));
    expect(windows).toHaveLength(1);
    expect(windows[0].label).toBe('4 PM – 6:30 PM');
  });

  test('two windows when both AM and PM rush are set', () => {
    const windows = getRushHours(makeMeter({
      am_rush_start: '07:00',
      am_rush_end: '09:00',
      pm_rush_start: '16:00',
      pm_rush_end: '18:30',
    }));
    expect(windows).toHaveLength(2);
    expect(windows[0].label).toBe('7 AM – 9 AM');
    expect(windows[1].label).toBe('4 PM – 6:30 PM');
  });

  test('handles noon correctly (12:00 PM)', () => {
    const windows = getRushHours(makeMeter({
      am_rush_start: '12:00',
      am_rush_end: '13:00',
    }));
    expect(windows[0].label).toBe('12 PM – 1 PM');
  });

  test('handles midnight boundary (00:00 AM)', () => {
    const windows = getRushHours(makeMeter({
      am_rush_start: '00:00',
      am_rush_end: '01:00',
    }));
    expect(windows[0].label).toBe('12 AM – 1 AM');
  });

  test('shows minutes when not on the hour', () => {
    const windows = getRushHours(makeMeter({
      am_rush_start: '07:30',
      am_rush_end: '09:15',
    }));
    expect(windows[0].label).toBe('7:30 AM – 9:15 AM');
  });
});
