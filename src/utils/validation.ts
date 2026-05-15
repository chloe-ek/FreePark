const MAX_RADIUS_METERS = 50_000;

export function isValidCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number,
): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    radiusMeters > 0 && radiusMeters <= MAX_RADIUS_METERS
  );
}
