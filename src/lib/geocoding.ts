const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

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
  const params = new URLSearchParams({
    input: query,
    components: 'country:ca',
    location: '49.2827,-123.1207',
    radius: '50000',
    key: API_KEY!,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
  );
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') return [];
  return (json.predictions as PredictionResult[]).map((p) => ({
    placeId: p.place_id,
    name: p.structured_formatting.main_text,
    sub: p.structured_formatting.secondary_text,
  }));
}

export async function getPlaceCoords(
  placeId: string,
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry',
    key: API_KEY!,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
  );
  const json = await res.json();
  if (json.status !== 'OK') return null;
  const loc = json.result.geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}
