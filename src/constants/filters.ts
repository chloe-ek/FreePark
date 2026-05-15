export type MaxRateFilter   = null | 0 | 2 | 3;
export type TimeLimitFilter = null | 120 | 180 | -1;
export type PaymentFilter   = 'all' | 'card' | 'cash';
export type DropdownId      = 'price' | 'time' | 'payment';

export const PRICE_FILTER_OPTIONS: { value: MaxRateFilter; label: string }[] = [
  { value: null, label: 'Any price' },
  { value: 0,    label: 'Free only' },
  { value: 2,    label: 'Under $2 / hr' },
  { value: 3,    label: 'Under $3 / hr' },
];

export const DURATION_FILTER_OPTIONS: { value: TimeLimitFilter; label: string }[] = [
  { value: null, label: 'Any duration' },
  { value: 120,  label: 'Need 2 hrs' },
  { value: 180,  label: 'Need 3 hrs' },
  { value: -1,   label: 'No time limit' },
];

export const PAYMENT_FILTER_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'all',  label: 'Any payment' },
  { value: 'card', label: 'Card only' },
  { value: 'cash', label: 'Cash only' },
];
