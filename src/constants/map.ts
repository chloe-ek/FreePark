export const MAP_DELTAS = {
  FOCUS:   { latitudeDelta: 0.004, longitudeDelta: 0.004 },
  DEFAULT: { latitudeDelta: 0.008, longitudeDelta: 0.008 },
} as const;

export const LOCATE_BUTTON_BOTTOM = {
  ACTIVE:  178,
  DEFAULT: 64,
} as const;

// Approximate sheet height used to offset the map when a marker is selected,
// so the marker sits in the visible area above the sheet. Adjust if off.
export const SHEET_HEIGHT_PX = 300;
