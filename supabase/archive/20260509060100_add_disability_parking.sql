
CREATE TABLE IF NOT EXISTS disability_parking (
  id          SERIAL PRIMARY KEY,
  description TEXT,
  location    TEXT NOT NULL,
  spaces      INTEGER NOT NULL DEFAULT 1,
  notes       TEXT,
  geo_local_area TEXT,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS disability_parking_geo_idx
  ON disability_parking USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  );

CREATE OR REPLACE FUNCTION get_nearby_disability_parking(
  user_lat      DOUBLE PRECISION,
  user_lng      DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  id             INTEGER,
  description    TEXT,
  location       TEXT,
  spaces         INTEGER,
  notes          TEXT,
  geo_local_area TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, description, location, spaces, notes, geo_local_area, latitude, longitude,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM disability_parking
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
$$;
;
