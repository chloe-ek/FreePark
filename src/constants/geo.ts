export const VANCOUVER_CENTER = { latitude: 49.2827, longitude: -123.1207 } as const;

// Derived from actual parking_meters data extent (active meters only), with a small buffer.
export const VANCOUVER_BOUNDS = {
  minLat:  49.205,
  maxLat:  49.299,
  minLng: -123.220,
  maxLng: -123.027,
} as const;

export function isInsideVancouver(lat: number, lng: number): boolean {
  return (
    lat  >= VANCOUVER_BOUNDS.minLat &&
    lat  <= VANCOUVER_BOUNDS.maxLat &&
    lng >= VANCOUVER_BOUNDS.minLng &&
    lng <= VANCOUVER_BOUNDS.maxLng
  );
}
