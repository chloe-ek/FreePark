/**
 * Fetches Vancouver parking meter data from the Open Data API and
 * upserts it into Supabase.  Run once (or on a schedule) to keep
 * the database in sync.
 *
 * Usage:
 *   npx ts-node scripts/seed-meters.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment
 * (NOT the anon key — seeding requires write access).
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vancouver Open Data field names (v2.1 API)
interface VancouverMeter {
  meterid: string;
  geo_point_2d: { lat: number; lon: number };

  // Weekday rates/limits
  r_mf_9a_6p:  string | null;  // e.g. '$2.00', 'n/a'
  r_mf_6p_10:  string | null;
  t_mf_9a_6p:  string | null;  // e.g. '120' (minutes)
  t_mf_6p_10:  string | null;

  // Saturday rates/limits
  r_sa_9a_6p:  string | null;
  r_sa_6p_10:  string | null;
  t_sa_9a_6p:  string | null;
  t_sa_6p_10:  string | null;

  // Sunday rates/limits
  r_su_9a_6p:  string | null;
  r_su_6p_10:  string | null;
  t_su_9a_6p:  string | null;
  t_su_6p_10:  string | null;

  // Prohibition windows — the API returns these as free-text strings
  // e.g. '8:00 AM' or '08:00'
  proh_time1:  string | null;
  proh_time2:  string | null;
  proh_days1:  string | null;  // e.g. 'Mon Tue Wed Thu Fri'
  proh_days2:  string | null;

  // Second prohibition window
  proh_time3:  string | null;
  proh_time4:  string | null;
  proh_days3:  string | null;

  // Payment & status
  creditcard:  string | null;  // 'Yes' / 'No'
  meterstat:   string | null;  // 'Active' / 'Inactive' / 'Removed'
}

// Strips currency symbols, whitespace, and other non-numeric chars,
// then parses to a float.  Returns null for blank/n/a/free values.
function parseRate(raw: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "" || trimmed === "n/a" || trimmed === "free") return null;
  // Remove $, commas, spaces — keep digits and decimal point
  const cleaned = trimmed.replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseMinutes(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw.trim(), 10);
  return isNaN(n) ? null : n;
}

// Normalises '8:00 AM' → '08:00', '14:30' → '14:30', etc.
function parseTime(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // Already HH:MM 24-hour
  const iso = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (iso) {
    const h = iso[1].padStart(2, "0");
    return `${h}:${iso[2]}`;
  }

  // 12-hour with AM/PM
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const period = ampm[3].toUpperCase();
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${m}`;
  }

  return trimmed; // return as-is if unrecognised, seed log will surface it
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

  const rows = meters.map((m) => ({
    meter_id:                m.meterid,
    location:                `SRID=4326;POINT(${m.geo_point_2d.lon} ${m.geo_point_2d.lat})`,
    longitude:               m.geo_point_2d.lon,
    latitude:                m.geo_point_2d.lat,

    rate_9am_6pm:            parseRate(m.r_mf_9a_6p),
    rate_6pm_10pm:           parseRate(m.r_mf_6p_10),
    rate_sa_9am_6pm:         parseRate(m.r_sa_9a_6p),
    rate_sa_6pm_10pm:        parseRate(m.r_sa_6p_10),
    rate_su_9am_6pm:         parseRate(m.r_su_9a_6p),
    rate_su_6pm_10pm:        parseRate(m.r_su_6p_10),

    time_limit_9am_6pm:      parseMinutes(m.t_mf_9a_6p),
    time_limit_6pm_10pm:     parseMinutes(m.t_mf_6p_10),
    time_limit_sa_9am_6pm:   parseMinutes(m.t_sa_9a_6p),
    time_limit_sa_6pm_10pm:  parseMinutes(m.t_sa_6p_10),
    time_limit_su_9am_6pm:   parseMinutes(m.t_su_9a_6p),
    time_limit_su_6pm_10pm:  parseMinutes(m.t_su_6p_10),

    prohibition_start:        parseTime(m.proh_time1),
    prohibition_end:          parseTime(m.proh_time2),
    prohibition_days:         m.proh_days1 ?? null,
    prohibition2_start:       parseTime(m.proh_time3),
    prohibition2_end:         parseTime(m.proh_time4),
    prohibition2_days:        m.proh_days3 ?? null,

    credit_card:              m.creditcard?.trim().toLowerCase() === "yes",
    service_status:           parseServiceStatus(m.meterstat),
  }));

  // Upsert in batches of 500
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
