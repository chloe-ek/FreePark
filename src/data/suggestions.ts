export interface Suggestion {
  icon: string;
  name: string;
  sub: string;
  freeCount: number;
}

export const SUGGESTIONS: Suggestion[] = [
  { icon: '📍', name: 'Robson St & Burrard',      sub: 'Downtown',       freeCount: 4 },
  { icon: '📍', name: 'Davie St & Granville',     sub: 'West End',       freeCount: 2 },
  { icon: '🅿️', name: 'Kitsilano Beach',          sub: '2.3 km away',    freeCount: 6 },
  { icon: '📍', name: 'Main St & Broadway',        sub: 'Mount Pleasant', freeCount: 3 },
  { icon: '🕙', name: 'Gastown (free after 6pm)',  sub: 'Water St',       freeCount: 0 },
  { icon: '📍', name: 'Granville Island Area',     sub: '1.8 km away',    freeCount: 5 },
];
