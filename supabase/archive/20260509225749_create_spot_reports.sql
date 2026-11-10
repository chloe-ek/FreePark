
CREATE TABLE spot_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id    text NOT NULL,
  report_type text NOT NULL DEFAULT 'no_vacancy',
  reported_at timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '30 minutes'
);

-- Index for fast lookup by meter + expiry
CREATE INDEX idx_spot_reports_meter_expires
  ON spot_reports (meter_id, expires_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE spot_reports;

-- RLS: anyone can read, anyone can insert (anonymous reporting)
ALTER TABLE spot_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read spot reports"
  ON spot_reports FOR SELECT USING (true);

CREATE POLICY "Anyone can insert spot reports"
  ON spot_reports FOR INSERT WITH CHECK (true);
;
