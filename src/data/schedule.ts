export interface ScheduleSlot {
  time: string;
  freeCount: number;
  note: string;
}

export const WEEKDAY_SLOTS: ScheduleSlot[] = [
  { time: 'Now',      freeCount: 3,  note: 'Robson 840, Davie 1140, Howe 750, Alberni 790' },
  { time: '6:00 PM',  freeCount: 4,  note: '+ Seymour 610' },
  { time: '8:00 PM',  freeCount: 5,  note: '+ 1 more spot opens' },
  { time: '10:00 PM', freeCount: 11, note: 'All downtown meters free' },
  { time: '11:00 PM', freeCount: 11, note: 'Same — all free' },
];

export const WEEKEND_SLOTS: ScheduleSlot[] = [
  { time: 'Now',      freeCount: 5,  note: 'Robson 840, Davie 1140, Howe 750, Alberni 790, + 1' },
  { time: '6:00 PM',  freeCount: 8,  note: '+ Seymour 610, Granville 890' },
  { time: '10:00 PM', freeCount: 11, note: 'All downtown meters free' },
];

export const METER_HOURS_NOTE = 'Meters active 8 AM – 10 PM weekdays';
