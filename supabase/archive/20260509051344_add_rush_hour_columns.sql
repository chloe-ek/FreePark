
ALTER TABLE parking_meters
  ADD COLUMN IF NOT EXISTS am_rush_start text,
  ADD COLUMN IF NOT EXISTS am_rush_end   text,
  ADD COLUMN IF NOT EXISTS pm_rush_start text,
  ADD COLUMN IF NOT EXISTS pm_rush_end   text;
;
