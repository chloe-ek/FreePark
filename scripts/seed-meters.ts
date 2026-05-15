/// <reference types="node" />
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface VancouverMeter {
  meter_id: string;
  geo_point_2d: { lat: number; lon: number };
  service_status: string | null;
  credit_card: string | null;

  rate_9am_6pm: string | null;
  rate_6pm_10pm: string | null;

  time_limit_9am_6pm: string | null;
  time_limit_6pm_10pm: string | null;
  time_limit_weekend_9am_6pm: string | null;
  time_limit_weekend_6pm_10pm: string | null;

  prohibition_1_days: string | null;
  prohibition_1_time: string | null;
  prohibition_2_days: string | null;
  prohibition_2_time: string | null;

  am_rush_hours: string | null;
  pm_rush_hours: string | null;
}

function parseRate(raw: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "" || trimmed === "n/a" || trimmed === "free") return null;
  const cleaned = trimmed.replace(/[^0-9.]/g, "");
  if (!cleaned || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// "2 Hr" → 120, "30 Min" → 30
function parseMinutes(raw: string | null): number | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  const hrMatch = t.match(/^(\d+(?:\.\d+)?)\s*hr/);
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);
  const minMatch = t.match(/^(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10);
  const plain = parseInt(t, 10);
  return isNaN(plain) ? null : plain;
}

// "7:00am" / "3:00pm" / "Noon" → "HH:MM"
function parseTime(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (t === "noon") return "12:00";
  if (t === "midnight") return "00:00";
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = m[3] as 'am' | 'pm';
  if (period === "am" && h === 12) h = 0;
  if (period === "pm" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${min}`;
}

// "7:00am to 1:00pm" → { start: "07:00", end: "13:00" }
function parseProhibitionTime(raw: string | null): { start: string | null; end: string | null } {
  if (!raw) return { start: null, end: null };
  const parts = raw.toLowerCase().split(/\s+to\s+/);
  if (parts.length !== 2) return { start: null, end: null };
  return { start: parseTime(parts[0].trim()), end: parseTime(parts[1].trim()) };
}

function parseServiceStatus(raw: string | null): "active" | "inactive" | "removed" {
  switch (raw?.trim().toLowerCase()) {
    case "inactive": return "inactive";
    case "removed":  return "removed";
    default:         return "active";
  }
}

async function fetchAllMeters(): Promise<VancouverMeter[]> {
  const all: VancouverMeter[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/parking-meters/records?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { results: VancouverMeter[]; total_count: number };
    all.push(...json.results);
    process.stdout.write(`\r  fetched ${all.length} / ${json.total_count}`);
    if (all.length >= json.total_count) break;
    offset += limit;
  }

  process.stdout.write("\n");
  return all;
}

async function seed() {
  console.log("Fetching Vancouver parking meter data…");
  const meters = await fetchAllMeters();
  console.log(`Fetched ${meters.length} meters.`);

  const rows = meters.map((m) => {
    const rate9to6  = parseRate(m.rate_9am_6pm);
    const rate6to10 = parseRate(m.rate_6pm_10pm);
    const proh1     = parseProhibitionTime(m.prohibition_1_time);
    const proh2     = parseProhibitionTime(m.prohibition_2_time);

    const amRush = parseProhibitionTime(m.am_rush_hours);
    const pmRush = parseProhibitionTime(m.pm_rush_hours);

    return {
      meter_id:               m.meter_id,
      location:               `SRID=4326;POINT(${m.geo_point_2d.lon} ${m.geo_point_2d.lat})`,
      longitude:              m.geo_point_2d.lon,
      latitude:               m.geo_point_2d.lat,

      rate_9am_6pm:           rate9to6,
      rate_6pm_10pm:          rate6to10,
      // API has no separate Sat/Sun rates — weekday rates apply to weekends too
      rate_sa_9am_6pm:        rate9to6,
      rate_sa_6pm_10pm:       rate6to10,
      rate_su_9am_6pm:        rate9to6,
      rate_su_6pm_10pm:       rate6to10,

      time_limit_9am_6pm:     parseMinutes(m.time_limit_9am_6pm),
      time_limit_6pm_10pm:    parseMinutes(m.time_limit_6pm_10pm),
      time_limit_sa_9am_6pm:  parseMinutes(m.time_limit_weekend_9am_6pm),
      time_limit_sa_6pm_10pm: parseMinutes(m.time_limit_weekend_6pm_10pm),
      time_limit_su_9am_6pm:  parseMinutes(m.time_limit_weekend_9am_6pm),
      time_limit_su_6pm_10pm: parseMinutes(m.time_limit_weekend_6pm_10pm),

      prohibition_start:      proh1.start,
      prohibition_end:        proh1.end,
      prohibition_days:       m.prohibition_1_days ?? null,
      prohibition2_start:     proh2.start,
      prohibition2_end:       proh2.end,
      prohibition2_days:      m.prohibition_2_days ?? null,

      am_rush_start:          amRush.start,
      am_rush_end:            amRush.end,
      pm_rush_start:          pmRush.start,
      pm_rush_end:            pmRush.end,

      credit_card:            m.credit_card?.trim().toLowerCase() === "yes",
      service_status:         parseServiceStatus(m.service_status),
    };
  });

  let failed = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("parking_meters")
      .upsert(batch, { onConflict: "meter_id" });

    if (error) {
      console.error(`Batch ${i / 500 + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      console.log(`Upserted batch ${i / 500 + 1} (${batch.length} rows)`);
    }
  }

  if (failed > 0) {
    console.warn(`Done with ${failed} row(s) failed.`);
  } else {
    console.log("Done.");
  }
}

seed().catch(console.error);
