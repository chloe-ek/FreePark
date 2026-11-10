
CREATE TABLE IF NOT EXISTS motorcycle_parking (
  id                      SERIAL PRIMARY KEY,
  spot_type               TEXT,
  location                TEXT,
  intersectn              TEXT,
  rate_9am_6pm            DOUBLE PRECISION,
  rate_6pm_10pm           DOUBLE PRECISION,
  rate_sa_9am_6pm         DOUBLE PRECISION,
  rate_sa_6pm_10pm        DOUBLE PRECISION,
  rate_su_9am_6pm         DOUBLE PRECISION,
  rate_su_6pm_10pm        DOUBLE PRECISION,
  time_limit_9am_6pm      INTEGER,
  time_limit_6pm_10pm     INTEGER,
  time_limit_sa_9am_6pm   INTEGER,
  time_limit_sa_6pm_10pm  INTEGER,
  time_limit_su_9am_6pm   INTEGER,
  time_limit_su_6pm_10pm  INTEGER,
  credit_card             BOOLEAN NOT NULL DEFAULT false,
  rush_hr                 TEXT,
  geo_local_area          TEXT,
  latitude                DOUBLE PRECISION NOT NULL,
  longitude               DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS motorcycle_parking_geo_idx
  ON motorcycle_parking USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  );

CREATE OR REPLACE FUNCTION get_nearby_motorcycle_parking(
  user_lat      DOUBLE PRECISION,
  user_lng      DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  id                      INTEGER,
  spot_type               TEXT,
  location                TEXT,
  intersectn              TEXT,
  rate_9am_6pm            DOUBLE PRECISION,
  rate_6pm_10pm           DOUBLE PRECISION,
  rate_sa_9am_6pm         DOUBLE PRECISION,
  rate_sa_6pm_10pm        DOUBLE PRECISION,
  rate_su_9am_6pm         DOUBLE PRECISION,
  rate_su_6pm_10pm        DOUBLE PRECISION,
  time_limit_9am_6pm      INTEGER,
  time_limit_6pm_10pm     INTEGER,
  time_limit_sa_9am_6pm   INTEGER,
  time_limit_sa_6pm_10pm  INTEGER,
  time_limit_su_9am_6pm   INTEGER,
  time_limit_su_6pm_10pm  INTEGER,
  credit_card             BOOLEAN,
  rush_hr                 TEXT,
  geo_local_area          TEXT,
  latitude                DOUBLE PRECISION,
  longitude               DOUBLE PRECISION,
  distance_meters         DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, spot_type, location, intersectn,
    rate_9am_6pm, rate_6pm_10pm,
    rate_sa_9am_6pm, rate_sa_6pm_10pm,
    rate_su_9am_6pm, rate_su_6pm_10pm,
    time_limit_9am_6pm, time_limit_6pm_10pm,
    time_limit_sa_9am_6pm, time_limit_sa_6pm_10pm,
    time_limit_su_9am_6pm, time_limit_su_6pm_10pm,
    credit_card, rush_hr, geo_local_area, latitude, longitude,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM motorcycle_parking
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
$$;

CREATE TABLE IF NOT EXISTS ev_charging_stations (
  id             SERIAL PRIMARY KEY,
  address        TEXT NOT NULL,
  lot_operator   TEXT,
  geo_local_area TEXT,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS ev_charging_geo_idx
  ON ev_charging_stations USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  );

CREATE OR REPLACE FUNCTION get_nearby_ev_charging(
  user_lat      DOUBLE PRECISION,
  user_lng      DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  id             INTEGER,
  address        TEXT,
  lot_operator   TEXT,
  geo_local_area TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, address, lot_operator, geo_local_area, latitude, longitude,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM ev_charging_stations
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
$$;
;
