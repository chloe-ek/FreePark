import { useState, useMemo } from 'react';
import type { NearbyMeterResult, MotorcycleParkingResult } from '../types/database';
import {
  isMeterFreeNow,
  getCurrentRate,
  getCurrentTimeLimit,
  getMotoCurrentRate,
  getMotoCurrentTimeLimit,
} from '../utils/parkingUtils';
import type { MaxRateFilter, TimeLimitFilter, PaymentFilter, DropdownId } from '../constants/filters';

function applyParkingFilters<T extends { credit_card?: boolean | null }>(
  list: T[],
  maxRate: MaxRateFilter,
  minTimeLimit: TimeLimitFilter,
  paymentFilter: PaymentFilter,
  getRate: (item: T) => number | null,
  getTimeLimit: (item: T) => number | null,
  isFreeNow?: (item: T) => boolean,
): T[] {
  if (maxRate === 0) {
    list = isFreeNow
      ? list.filter(isFreeNow)
      : list.filter((m) => { const r = getRate(m); return r == null || r === 0; });
  } else if (maxRate !== null) {
    list = list.filter((m) => { const r = getRate(m); return r == null || r === 0 || r < maxRate; });
  }
  if (minTimeLimit === -1) {
    list = list.filter((m) => getTimeLimit(m) === null);
  } else if (minTimeLimit !== null) {
    list = list.filter((m) => { const tl = getTimeLimit(m); return tl === null || tl >= minTimeLimit; });
  }
  if (paymentFilter === 'card') list = list.filter((m) => m.credit_card === true);
  else if (paymentFilter === 'cash') list = list.filter((m) => m.credit_card === false);
  return list;
}

export function useMapFilters(
  meters: NearbyMeterResult[],
  motoSpots: MotorcycleParkingResult[],
) {
  const [maxRate, setMaxRate]           = useState<MaxRateFilter>(null);
  const [minTimeLimit, setMinTimeLimit] = useState<TimeLimitFilter>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);

  function toggleDropdown(id: DropdownId) {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }

  const visibleMeters = useMemo(() =>
    applyParkingFilters(meters, maxRate, minTimeLimit, paymentFilter, getCurrentRate, getCurrentTimeLimit, isMeterFreeNow),
    [meters, maxRate, minTimeLimit, paymentFilter],
  );

  const visibleMotoSpots = useMemo(() =>
    applyParkingFilters(motoSpots, maxRate, minTimeLimit, paymentFilter, getMotoCurrentRate, getMotoCurrentTimeLimit),
    [motoSpots, maxRate, minTimeLimit, paymentFilter],
  );

  function closeDropdown() {
    setOpenDropdown(null);
  }

  return {
    maxRate,       setMaxRate,
    minTimeLimit,  setMinTimeLimit,
    paymentFilter, setPaymentFilter,
    openDropdown,  toggleDropdown, closeDropdown,
    visibleMeters,
    visibleMotoSpots,
  };
}
