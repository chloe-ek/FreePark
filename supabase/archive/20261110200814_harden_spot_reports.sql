-- Harden spot_reports: the table is anon-writable (anon key ships in the app
-- bundle), so all validation must live in the DB, not the client.
--
-- NOTE: meter_id FK uses ON DELETE CASCADE. scripts/seed-meters.ts only
-- upserts parking_meters (never deletes), so the weekly sync does not wipe
-- reports. If that script is ever changed to delete-then-insert, active
-- reports will be cascaded away on every sync.

-- (1) Remove existing rows that would violate the new constraints
--     (7 rows from early development: report_type 'vacancy' / unknown meter_id)
delete from public.spot_reports sr
where sr.report_type <> 'no_vacancy'
   or not exists (select 1 from public.parking_meters m where m.meter_id = sr.meter_id);

-- (2) Value validation
alter table public.spot_reports
  add constraint spot_reports_report_type_check
    check (report_type in ('no_vacancy')),
  add constraint spot_reports_meter_id_fkey
    foreign key (meter_id) references public.parking_meters (meter_id) on delete cascade;

create index if not exists spot_reports_meter_id_expires_idx
  on public.spot_reports (meter_id, expires_at);

-- (3) Server decides timestamps and enforces per-meter cooldown
create or replace function public.spot_reports_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Ignore client-supplied values
  new.reported_at := now();
  new.expires_at  := now() + interval '1 hour';

  -- Serialize concurrent inserts for the same meter so both can't pass the check
  perform pg_advisory_xact_lock(hashtext('spot_reports:' || new.meter_id));

  if exists (
    select 1 from public.spot_reports
    where meter_id = new.meter_id and expires_at > now()
  ) then
    raise exception 'A report for this meter was submitted recently.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger spot_reports_before_insert
  before insert on public.spot_reports
  for each row execute function public.spot_reports_before_insert();;
