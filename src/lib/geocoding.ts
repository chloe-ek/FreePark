import { VANCOUVER_CENTER } from '../constants/geo';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY && __DEV__) {
  console.warn('[geocoding] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set — place search will not work');
}

export interface ResolvedPlace {
  name: string;
  sub: string;
  lat: number;
  lng: number;
}

interface PlaceCandidate {
  placeId: string;
  name: string;
  sub: string;
}

interface PredictionResult {
  place_id: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

export async function searchPlaces(query: string): Promise<PlaceCandidate[]> {
  if (!API_KEY) return [];
  try {
    const params = new URLSearchParams({
      input: query,
      components: 'country:ca',
      location: `${VANCOUVER_CENTER.latitude},${VANCOUVER_CENTER.longitude}`,
      radius: '50000',
      key: API_KEY,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
    );
    const json = await res.json();
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      if (__DEV__) console.warn('[geocoding] searchPlaces API error:', json.status);
      return [];
    }
    return (json.predictions as PredictionResult[]).map((p) => ({
      placeId: p.place_id,
      name: p.structured_formatting.main_text,
      sub: p.structured_formatting.secondary_text,
    }));
  } catch (err) {
    if (__DEV__) console.warn('[geocoding] searchPlaces failed:', err);
    return [];
  }
}

export async function getPlaceCoords(
  placeId: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!API_KEY) return null;
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry',
      key: API_KEY,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    );
    const json = await res.json();
    if (json.status !== 'OK') {
      if (__DEV__) console.warn('[geocoding] getPlaceCoords API error:', json.status);
      return null;
    }
    const loc = json.result?.geometry?.location;
    if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch (err) {
    if (__DEV__) console.warn('[geocoding] getPlaceCoords failed:', err);
    return null;
  }
}
