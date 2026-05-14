-- Enable PostGIS
create extension if not exists postgis;

-- ============================================================
-- parking_meters
-- Populated from Vancouver Open Data (https://opendata.vancouver.ca)
-- ============================================================
create table if not exists public.parking_meters (
  id                      bigint generated always as identity primary key,
  meter_id                text        not null unique,

  -- PostGIS geography column for spatial queries (SRID 4326 = WGS-84)
  location                geography(Point, 4326) not null,

  -- Denormalised lat/lng for fast non-spatial reads
  latitude                double precision not null,
  longitude               double precision not null,

  -- Weekday rates in CAD per hour; 0 = free, null = not applicable / unmetered
  rate_9am_6pm            numeric(5, 2),
  rate_6pm_10pm           numeric(5, 2),

  -- Weekend rates (Sat/Sun may differ from Mon–Fri)
  rate_sa_9am_6pm         numeric(5, 2),
  rate_sa_6pm_10pm        numeric(5, 2),
  rate_su_9am_6pm         numeric(5, 2),
  rate_su_6pm_10pm        numeric(5, 2),

  -- Weekday time limits in minutes
  time_limit_9am_6pm      integer,
  time_limit_6pm_10pm     integer,

  -- Weekend time limits in minutes
  time_limit_sa_9am_6pm   integer,
  time_limit_sa_6pm_10pm  integer,
  time_limit_su_9am_6pm   integer,
  time_limit_su_6pm_10pm  integer,

  -- First prohibition window
  prohibition_start       text,   -- e.g. '08:00'
  prohibition_end         text,   -- e.g. '10:00'
  prohibition_days        text,   -- e.g. 'Mon Tue Wed Thu Fri'

  -- Second prohibition window (e.g. street cleaning opposite side)
  prohibition2_start      text,
  prohibition2_end        text,
  prohibition2_days       text,

  -- Rush-hour no-parking windows (Mon–Fri only, enforced in app logic)
  am_rush_start           text,   -- e.g. '07:00'
  am_rush_end             text,   -- e.g. '09:00'
  pm_rush_start           text,   -- e.g. '16:00'
  pm_rush_end             text,   -- e.g. '18:30'

  -- Payment & operational metadata
  credit_card             boolean not null default false,
  service_status          text not null default 'active'
    check (service_status in ('active', 'inactive', 'removed')),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Spatial index — used by ST_DWithin in the RPC below
create index if not exists parking_meters_location_idx
  on public.parking_meters using gist (location);

-- Regular index for meter_id lookups
create index if not exists parking_meters_meter_id_idx
  on public.parking_meters (meter_id);

-- Index to quickly skip inactive/removed meters in queries
create index if not exists parking_meters_service_status_idx
  on public.parking_meters (service_status);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger parking_meters_updated_at
  before update on public.parking_meters
  for each row execute function public.set_updated_at();

-- ============================================================
-- RPC: get_nearby_meters
-- Returns active meters within `radius_meters` of a lat/lng,
-- ordered by distance.  Called from the React Native app.
-- ============================================================
create or replace function public.get_nearby_meters(
  user_lat      double precision,
  user_lng      double precision,
  radius_meters double precision default 500
)
returns table (
  id                      bigint,
  meter_id                text,
  latitude                double precision,
  longitude               double precision,
  rate_9am_6pm            numeric,
  rate_6pm_10pm           numeric,
  rate_sa_9am_6pm         numeric,
  rate_sa_6pm_10pm        numeric,
  rate_su_9am_6pm         numeric,
  rate_su_6pm_10pm        numeric,
  time_limit_9am_6pm      integer,
  time_limit_6pm_10pm     integer,
  time_limit_sa_9am_6pm   integer,
  time_limit_sa_6pm_10pm  integer,
  time_limit_su_9am_6pm   integer,
  time_limit_su_6pm_10pm  integer,
  prohibition_start       text,
  prohibition_end         text,
  prohibition_days        text,
  prohibition2_start      text,
  prohibition2_end        text,
  prohibition2_days       text,
  am_rush_start           text,
  am_rush_end             text,
  pm_rush_start           text,
  pm_rush_end             text,
  credit_card             boolean,
  service_status          text,
  distance_meters         double precision
)
language sql
stable
as $$
  select
    m.id,
    m.meter_id,
    m.latitude,
    m.longitude,
    m.rate_9am_6pm,
    m.rate_6pm_10pm,
    m.rate_sa_9am_6pm,
    m.rate_sa_6pm_10pm,
    m.rate_su_9am_6pm,
    m.rate_su_6pm_10pm,
    m.time_limit_9am_6pm,
    m.time_limit_6pm_10pm,
    m.time_limit_sa_9am_6pm,
    m.time_limit_sa_6pm_10pm,
    m.time_limit_su_9am_6pm,
    m.time_limit_su_6pm_10pm,
    m.prohibition_start,
    m.prohibition_end,
    m.prohibition_days,
    m.prohibition2_start,
    m.prohibition2_end,
    m.prohibition2_days,
    m.am_rush_start,
    m.am_rush_end,
    m.pm_rush_start,
    m.pm_rush_end,
    m.credit_card,
    m.service_status,
    st_distance(
      m.location,
      st_point(user_lng, user_lat)::geography
    ) as distance_meters
  from public.parking_meters m
  where m.service_status = 'active'
    and st_dwithin(
      m.location,
      st_point(user_lng, user_lat)::geography,
      radius_meters
    )
  order by distance_meters
  limit 200;
$$;

-- ============================================================
-- Row-Level Security (read-only public access)
-- ============================================================
alter table public.parking_meters enable row level security;

create policy "public read"
  on public.parking_meters
  for select
  using (true);

alter table public.disability_parking enable row level security;

create policy "public read"
  on public.disability_parking
  for select
  using (true);

alter table public.motorcycle_parking enable row level security;

create policy "public read"
  on public.motorcycle_parking
  for select
  using (true);

alter table public.ev_charging_stations enable row level security;

create policy "public read"
  on public.ev_charging_stations
  for select
  using (true);

-- ============================================================
-- Migration: add new columns to an existing table
-- Run this block instead of the CREATE TABLE above if the table
-- already exists in your Supabase project.
-- ============================================================
-- alter table public.parking_meters
--   add column if not exists rate_sa_9am_6pm        numeric(5, 2),
--   add column if not exists rate_sa_6pm_10pm       numeric(5, 2),
--   add column if not exists rate_su_9am_6pm        numeric(5, 2),
--   add column if not exists rate_su_6pm_10pm       numeric(5, 2),
--   add column if not exists time_limit_sa_9am_6pm  integer,
--   add column if not exists time_limit_sa_6pm_10pm integer,
--   add column if not exists time_limit_su_9am_6pm  integer,
--   add column if not exists time_limit_su_6pm_10pm integer,
--   add column if not exists prohibition2_start     text,
--   add column if not exists prohibition2_end       text,
--   add column if not exists prohibition2_days      text,
--   add column if not exists credit_card            boolean not null default false,
--   add column if not exists service_status         text not null default 'active'
--     check (service_status in ('active', 'inactive', 'removed')),
--   add column if not exists updated_at             timestamptz not null default now();
