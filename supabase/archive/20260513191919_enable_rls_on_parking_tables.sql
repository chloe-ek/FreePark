
ALTER TABLE public.disability_parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycle_parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ev_charging_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.disability_parking
  FOR SELECT USING (true);

CREATE POLICY "public read" ON public.motorcycle_parking
  FOR SELECT USING (true);

CREATE POLICY "public read" ON public.ev_charging_stations
  FOR SELECT USING (true);
;
