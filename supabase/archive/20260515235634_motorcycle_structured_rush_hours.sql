
ALTER TABLE public.motorcycle_parking
  ADD COLUMN am_rush_start text,
  ADD COLUMN am_rush_end   text,
  ADD COLUMN pm_rush_start text,
  ADD COLUMN pm_rush_end   text;

ALTER TABLE public.motorcycle_parking
  DROP COLUMN rush_hr;

DROP FUNCTION IF EXISTS public.get_nearby_motorcycle_parking(double precision, double precision, integer);

CREATE FUNCTION public.get_nearby_motorcycle_parking(
  user_lat      double precision,
  user_lng      double precision,
  radius_meters integer DEFAULT 500
)
RETURNS TABLE(
  id                      integer,
  spot_type               text,
  location                text,
  intersectn              text,
  rate_9am_6pm            double precision,
  rate_6pm_10pm           double precision,
  rate_sa_9am_6pm         double precision,
  rate_sa_6pm_10pm        double precision,
  rate_su_9am_6pm         double precision,
  rate_su_6pm_10pm        double precision,
  time_limit_9am_6pm      integer,
  time_limit_6pm_10pm     integer,
  time_limit_sa_9am_6pm   integer,
  time_limit_sa_6pm_10pm  integer,
  time_limit_su_9am_6pm   integer,
  time_limit_su_6pm_10pm  integer,
  credit_card             boolean,
  am_rush_start           text,
  am_rush_end             text,
  pm_rush_start           text,
  pm_rush_end             text,
  geo_local_area          text,
  latitude                double precision,
  longitude               double precision,
  distance_meters         double precision
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
    credit_card,
    am_rush_start, am_rush_end,
    pm_rush_start, pm_rush_end,
    geo_local_area, latitude, longitude,
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
;
