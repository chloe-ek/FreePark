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

  const visibleMeters = useMemo(() => {
    let list = meters;
    if (maxRate === 0) {
      list = list.filter(isMeterFreeNow);
    } else if (maxRate !== null) {
      list = list.filter((m) => {
        const rate = getCurrentRate(m);
        return rate === null || rate === 0 || rate < maxRate;
      });
    }
    if (minTimeLimit === -1) {
      list = list.filter((m) => getCurrentTimeLimit(m) === null);
    } else if (minTimeLimit !== null) {
      list = list.filter((m) => {
        const limit = getCurrentTimeLimit(m);
        return limit === null || limit >= minTimeLimit;
      });
    }
    if (paymentFilter === 'card') list = list.filter((m) => m.credit_card === true);
    else if (paymentFilter === 'cash') list = list.filter((m) => m.credit_card === false);
    return list;
  }, [meters, maxRate, minTimeLimit, paymentFilter]);

  const visibleMotoSpots = useMemo(() => {
    let list = motoSpots;
    if (maxRate === 0) {
      list = list.filter((m) => { const r = getMotoCurrentRate(m); return r == null || r === 0; });
    } else if (maxRate !== null) {
      list = list.filter((m) => { const r = getMotoCurrentRate(m); return r == null || r === 0 || r < maxRate; });
    }
    if (minTimeLimit === -1) {
      list = list.filter((m) => getMotoCurrentTimeLimit(m) === null);
    } else if (minTimeLimit !== null) {
      list = list.filter((m) => { const tl = getMotoCurrentTimeLimit(m); return tl === null || tl >= minTimeLimit; });
    }
    if (paymentFilter === 'card') list = list.filter((m) => m.credit_card === true);
    else if (paymentFilter === 'cash') list = list.filter((m) => m.credit_card === false);
    return list;
  }, [motoSpots, maxRate, minTimeLimit, paymentFilter]);

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
