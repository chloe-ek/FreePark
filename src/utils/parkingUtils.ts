import type { ParkingMeter, NearbyMeterResult, MotorcycleParkingResult } from "../types/database";
import { BUSINESS_HOURS_MINS } from "../constants/businessHours";

type Meter = ParkingMeter | NearbyMeterResult;

interface HasRushHours {
  am_rush_start: string | null;
  am_rush_end:   string | null;
  pm_rush_start: string | null;
  pm_rush_end:   string | null;
}

const DAY_ABBR: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month - 1, 1);
  d.setDate(1 + ((weekday - d.getDay() + 7) % 7) + (n - 1) * 7);
  return d;
}

function easterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function isBCStatutoryHoliday(date: Date): boolean {
  const y = date.getFullYear(), mo = date.getMonth() + 1, d = date.getDate();

  // Fixed dates
  if (mo === 1  && d === 1)  return true; // New Year's Day
  if (mo === 7  && d === 1)  return true; // Canada Day
  if (mo === 9  && d === 30) return true; // National Day for Truth and Reconciliation
  if (mo === 11 && d === 11) return true; // Remembrance Day
  if (mo === 12 && d === 25) return true; // Christmas Day

  // Family Day: 3rd Monday in February
  if (mo === 2  && d === nthWeekday(y, 2, 1, 3).getDate())  return true;

  // Good Friday: 2 days before Easter Sunday
  const easter = easterSunday(y);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  if (mo === goodFriday.getMonth() + 1 && d === goodFriday.getDate()) return true;

  // Victoria Day: last Monday on or before May 24
  const may24 = new Date(y, 4, 24);
  const victoriaDay = new Date(y, 4, 24 - ((may24.getDay() + 6) % 7));
  if (mo === 5  && d === victoriaDay.getDate()) return true;

  // BC Day: 1st Monday in August
  if (mo === 8  && d === nthWeekday(y, 8, 1, 1).getDate())  return true;

  // Labour Day: 1st Monday in September
  if (mo === 9  && d === nthWeekday(y, 9, 1, 1).getDate())  return true;

  // Thanksgiving: 2nd Monday in October
  if (mo === 10 && d === nthWeekday(y, 10, 1, 2).getDate()) return true;

  return false;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isProhibited(
  currentMinutes: number,
  todayAbbr: string,
  start: string | null,
  end: string | null,
  days: string | null
): boolean {
  if (!start || !end || !days) return false;
  if (!days.split(" ").includes(todayAbbr)) return false;
  return currentMinutes >= toMinutes(start) && currentMinutes < toMinutes(end);
}

// Rush hours apply Mon–Fri only (Vancouver standard)
function isRushHour(
  currentMinutes: number,
  dayOfWeek: number,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  return currentMinutes >= toMinutes(start) && currentMinutes < toMinutes(end);
}

export function isMeterProhibited(meter: Meter): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayAbbr = DAY_ABBR[now.getDay()];
  const dow = now.getDay();
  const holiday = isBCStatutoryHoliday(now);

  return (
    isProhibited(currentMinutes, todayAbbr, meter.prohibition_start, meter.prohibition_end, meter.prohibition_days) ||
    isProhibited(currentMinutes, todayAbbr, meter.prohibition2_start, meter.prohibition2_end, meter.prohibition2_days) ||
    (!holiday && isRushHour(currentMinutes, dow, meter.am_rush_start, meter.am_rush_end)) ||
    (!holiday && isRushHour(currentMinutes, dow, meter.pm_rush_start, meter.pm_rush_end))
  );
}

function getRateAndLimit(meter: Meter, currentMinutes: number, dayOfWeek: number) {
  const isSat = dayOfWeek === 6;
  const isSun = dayOfWeek === 0;
  const { DAY_START, EVENING_START, EVENING_END } = BUSINESS_HOURS_MINS;

  if (currentMinutes >= DAY_START && currentMinutes < EVENING_START) {
    if (isSat) return { rate: meter.rate_sa_9am_6pm,  limit: meter.time_limit_sa_9am_6pm };
    if (isSun) return { rate: meter.rate_su_9am_6pm,  limit: meter.time_limit_su_9am_6pm };
    return            { rate: meter.rate_9am_6pm,      limit: meter.time_limit_9am_6pm };
  }
  if (currentMinutes >= EVENING_START && currentMinutes < EVENING_END) {
    if (isSat) return { rate: meter.rate_sa_6pm_10pm, limit: meter.time_limit_sa_6pm_10pm };
    if (isSun) return { rate: meter.rate_su_6pm_10pm, limit: meter.time_limit_su_6pm_10pm };
    return            { rate: meter.rate_6pm_10pm,     limit: meter.time_limit_6pm_10pm };
  }
  return { rate: null, limit: null };
}

export function isMeterFreeNow(meter: Meter): boolean {
  if (isMeterProhibited(meter)) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const { rate } = getRateAndLimit(meter, currentMinutes, now.getDay());
  return rate == null || rate === 0;
}

export function getCurrentRate(meter: Meter): number | null {
  if (isMeterProhibited(meter)) return null;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const { rate } = getRateAndLimit(meter, currentMinutes, now.getDay());
  return rate;
}

export function getCurrentTimeLimit(meter: Meter): number | null {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const dow = now.getDay();
  const isSat = dow === 6;
  const isSun = dow === 0;
  const { DAY_START, EVENING_START, EVENING_END } = BUSINESS_HOURS_MINS;

  if (mins >= DAY_START && mins < EVENING_START) {
    return isSat ? meter.time_limit_sa_9am_6pm
      : isSun ? meter.time_limit_su_9am_6pm
      : meter.time_limit_9am_6pm;
  }
  if (mins >= EVENING_START && mins < EVENING_END) {
    return isSat ? meter.time_limit_sa_6pm_10pm
      : isSun ? meter.time_limit_su_6pm_10pm
      : meter.time_limit_6pm_10pm;
  }
  return null;
}

export function minutesUntilFree(meter: Meter): number | null {
  if (isMeterFreeNow(meter)) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dow = now.getDay();
  const isSat = dow === 6;
  const isSun = dow === 0;
  const { DAY_START, EVENING_START, EVENING_END } = BUSINESS_HOURS_MINS;

  if (currentMinutes >= DAY_START && currentMinutes < EVENING_START) {
    const rate6to10 = isSat ? meter.rate_sa_6pm_10pm
      : isSun ? meter.rate_su_6pm_10pm
      : meter.rate_6pm_10pm;
    if (rate6to10 == null || rate6to10 === 0) return EVENING_START - currentMinutes;
    return EVENING_END - currentMinutes;
  }
  if (currentMinutes >= EVENING_START && currentMinutes < EVENING_END) {
    return EVENING_END - currentMinutes;
  }
  return null;
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getFreeAfterTime(meters: Meter[]): string | null {
  if (meters.length === 0) return null;
  const dow = new Date().getDay();
  const isSat = dow === 6;
  const isSun = dow === 0;

  const getEveningRate = (m: Meter) =>
    isSat ? m.rate_sa_6pm_10pm : isSun ? m.rate_su_6pm_10pm : m.rate_6pm_10pm;
  const getDayRate = (m: Meter) =>
    isSat ? m.rate_sa_9am_6pm : isSun ? m.rate_su_9am_6pm : m.rate_9am_6pm;

  if (meters.some((m) => { const r = getEveningRate(m); return r != null && r > 0; })) return '10 PM';
  if (meters.some((m) => { const r = getDayRate(m); return r != null && r > 0; })) return '6 PM';
  return null;
}

function fmt12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export interface RushHourWindow { label: string; start: string; end: string }

export function getRushHours(meter: HasRushHours): RushHourWindow[] {
  const windows: RushHourWindow[] = [];
  if (meter.am_rush_start && meter.am_rush_end) {
    windows.push({
      label: `${fmt12h(meter.am_rush_start)} – ${fmt12h(meter.am_rush_end)}`,
      start: meter.am_rush_start,
      end:   meter.am_rush_end,
    });
  }
  if (meter.pm_rush_start && meter.pm_rush_end) {
    windows.push({
      label: `${fmt12h(meter.pm_rush_start)} – ${fmt12h(meter.pm_rush_end)}`,
      start: meter.pm_rush_start,
      end:   meter.pm_rush_end,
    });
  }
  return windows;
}

export function getCurrentRateLabel(meter: Meter): string {
  if (isMeterProhibited(meter)) return "No parking";
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const { rate, limit } = getRateAndLimit(meter, currentMinutes, now.getDay());
  if (rate == null) return "Free";
  if (rate === 0)   return `Free${limit ? ` (${limit} min)` : ""}`;
  return `$${rate.toFixed(2)}/hr${limit ? ` · ${limit} min` : ""}`;
}

// ─── Motorcycle parking ───────────────────────────────────────────────────────

export function isMotoRushHour(spot: MotorcycleParkingResult): boolean {
  const now = new Date();
  if (isBCStatutoryHoliday(now)) return false;
  const dow = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  return (
    isRushHour(mins, dow, spot.am_rush_start, spot.am_rush_end) ||
    isRushHour(mins, dow, spot.pm_rush_start, spot.pm_rush_end)
  );
}


function getMotoRateAndLimit(
  spot: MotorcycleParkingResult,
  currentMinutes: number,
  dayOfWeek: number,
): { rate: number | null; limit: number | null } {
  const { DAY_START, EVENING_START, EVENING_END } = BUSINESS_HOURS_MINS;
  const is9to6  = currentMinutes >= DAY_START     && currentMinutes < EVENING_START;
  const is6to10 = currentMinutes >= EVENING_START && currentMinutes < EVENING_END;

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if (is9to6)  return { rate: spot.rate_9am_6pm,      limit: spot.time_limit_9am_6pm };
    if (is6to10) return { rate: spot.rate_6pm_10pm,     limit: spot.time_limit_6pm_10pm };
  } else if (dayOfWeek === 6) {
    if (is9to6)  return { rate: spot.rate_sa_9am_6pm,   limit: spot.time_limit_sa_9am_6pm };
    if (is6to10) return { rate: spot.rate_sa_6pm_10pm,  limit: spot.time_limit_sa_6pm_10pm };
  } else {
    if (is9to6)  return { rate: spot.rate_su_9am_6pm,   limit: spot.time_limit_su_9am_6pm };
    if (is6to10) return { rate: spot.rate_su_6pm_10pm,  limit: spot.time_limit_su_6pm_10pm };
  }
  return { rate: null, limit: null };
}

export function getMotoCurrentRate(spot: MotorcycleParkingResult): number | null {
  const now = new Date();
  return getMotoRateAndLimit(spot, now.getHours() * 60 + now.getMinutes(), now.getDay()).rate;
}

export function getMotoCurrentTimeLimit(spot: MotorcycleParkingResult): number | null {
  const now = new Date();
  return getMotoRateAndLimit(spot, now.getHours() * 60 + now.getMinutes(), now.getDay()).limit;
}
