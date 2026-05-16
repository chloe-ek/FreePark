import type { NearbyMeterResult, MotorcycleParkingResult } from '../../types/database';

// Sunday Jan 7 2024 (day=0) used as week anchor so day offset = JS day number
export const WEEK_ANCHOR = new Date('2024-01-07T00:00:00.000');

export function setTime(dayOfWeek: number, hour: number, minute = 0) {
  const d = new Date(WEEK_ANCHOR);
  d.setDate(d.getDate() + dayOfWeek);
  d.setHours(hour, minute, 0, 0);
  jest.setSystemTime(d);
}

export function makeMeter(overrides: Partial<NearbyMeterResult> = {}): NearbyMeterResult {
  return {
    id: 1,
    meter_id: 'TEST-001',
    latitude: 49.2827,
    longitude: -123.1207,
    rate_9am_6pm: null,
    rate_6pm_10pm: null,
    rate_sa_9am_6pm: null,
    rate_sa_6pm_10pm: null,
    rate_su_9am_6pm: null,
    rate_su_6pm_10pm: null,
    time_limit_9am_6pm: null,
    time_limit_6pm_10pm: null,
    time_limit_sa_9am_6pm: null,
    time_limit_sa_6pm_10pm: null,
    time_limit_su_9am_6pm: null,
    time_limit_su_6pm_10pm: null,
    prohibition_start: null,
    prohibition_end: null,
    prohibition_days: null,
    prohibition2_start: null,
    prohibition2_end: null,
    prohibition2_days: null,
    am_rush_start: null,
    am_rush_end: null,
    pm_rush_start: null,
    pm_rush_end: null,
    credit_card: true,
    service_status: 'active',
    distance_meters: 100,
    ...overrides,
  };
}

export function makeMoto(overrides: Partial<MotorcycleParkingResult> = {}): MotorcycleParkingResult {
  return {
    id: 1,
    spot_type: null,
    location: 'Test St',
    intersectn: null,
    rate_9am_6pm: null,
    rate_6pm_10pm: null,
    rate_sa_9am_6pm: null,
    rate_sa_6pm_10pm: null,
    rate_su_9am_6pm: null,
    rate_su_6pm_10pm: null,
    time_limit_9am_6pm: null,
    time_limit_6pm_10pm: null,
    time_limit_sa_9am_6pm: null,
    time_limit_sa_6pm_10pm: null,
    time_limit_su_9am_6pm: null,
    time_limit_su_6pm_10pm: null,
    credit_card: true,
    am_rush_start: null,
    am_rush_end: null,
    pm_rush_start: null,
    pm_rush_end: null,
    geo_local_area: null,
    latitude: 49.2827,
    longitude: -123.1207,
    distance_meters: 50,
    ...overrides,
  };
}
