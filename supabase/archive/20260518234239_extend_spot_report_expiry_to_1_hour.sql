ALTER TABLE public.spot_reports
  ALTER COLUMN expires_at SET DEFAULT now() + interval '1 hour';;
