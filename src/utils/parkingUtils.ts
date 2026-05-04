import type { ParkingMeter, NearbyMeterResult } from "../types/database";

type Meter = ParkingMeter | NearbyMeterResult;

const DAY_ABBR: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

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

function getRateAndLimit(meter: Meter, currentMinutes: number, dayOfWeek: number) {
  const isSat = dayOfWeek === 6;
  const isSun = dayOfWeek === 0;

  if (currentMinutes >= 9 * 60 && currentMinutes < 18 * 60) {
    if (isSat) return { rate: meter.rate_sa_9am_6pm,  limit: meter.time_limit_sa_9am_6pm };
    if (isSun) return { rate: meter.rate_su_9am_6pm,  limit: meter.time_limit_su_9am_6pm };
    return            { rate: meter.rate_9am_6pm,      limit: meter.time_limit_9am_6pm };
  }
  if (currentMinutes >= 18 * 60 && currentMinutes < 22 * 60) {
    if (isSat) return { rate: meter.rate_sa_6pm_10pm, limit: meter.time_limit_sa_6pm_10pm };
    if (isSun) return { rate: meter.rate_su_6pm_10pm, limit: meter.time_limit_su_6pm_10pm };
    return            { rate: meter.rate_6pm_10pm,     limit: meter.time_limit_6pm_10pm };
  }
  return { rate: null, limit: null };
}

export function isMeterFreeNow(meter: Meter): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayAbbr = DAY_ABBR[now.getDay()];

  if (
    isProhibited(currentMinutes, todayAbbr, meter.prohibition_start, meter.prohibition_end, meter.prohibition_days) ||
    isProhibited(currentMinutes, todayAbbr, meter.prohibition2_start, meter.prohibition2_end, meter.prohibition2_days)
  ) {
    return false;
  }

  const { rate } = getRateAndLimit(meter, currentMinutes, now.getDay());
  // null rate outside metered hours = free; 0 = explicitly free
  return rate == null || rate === 0;
}

export function getCurrentRateLabel(meter: Meter): string {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const { rate, limit } = getRateAndLimit(meter, currentMinutes, now.getDay());

  if (rate == null) return "Free";
  if (rate === 0)   return `Free${limit ? ` (${limit} min)` : ""}`;
  return `$${rate.toFixed(2)}/hr${limit ? ` · ${limit} min` : ""}`;
}
