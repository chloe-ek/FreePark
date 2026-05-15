/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface VancouverMoto {
  type: string | null;
  location: string | null;
  intersectn: string | null;
  r_mf_9a_6p: string | null;
  r_mf_6p_10: string | null;
  r_sa_9a_6p: string | null;
  r_sa_6p_10: string | null;
  r_su_9a_6p: string | null;
  r_su_6p_10: string | null;
  t_mf_9a_6p: string | null;
  t_mf_6p_10: string | null;
  t_sa_9a_6p: string | null;
  t_sa_6p_10: string | null;
  t_su_9a_6p: string | null;
  t_su_6p_10: string | null;
  creditcard: string | null;
  rush_hr: string | null;
  geo_local_area: string | null;
  geo_point_2d: { lat: number; lon: number };
}

function parseRate(raw: string | null): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === '' || s === 'n/a' || s === 'free') return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function parseTimeLimit(raw: string | null): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === '' || s === 'no time limit' || s === 'n/a') return null;
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

async function fetchAll(): Promise<VancouverMoto[]> {
  const limit = 100;
  let offset = 0;
  const all: VancouverMoto[] = [];
  while (true) {
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/motorcycle-parking/records?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { results: VancouverMoto[]; total_count: number };
    all.push(...json.results);
    if (all.length >= json.total_count) break;
    offset += limit;
  }
  return all;
}

async function main() {
  console.log('Fetching motorcycle parking from Vancouver Open Data…');
  const records = await fetchAll();
  console.log(`Fetched ${records.length} records`);

  const rows = records
    .filter((r) => r.geo_point_2d?.lat != null)
    .map((r) => ({
      spot_type:              r.type ?? null,
      location:               r.location ?? null,
      intersectn:             r.intersectn ?? null,
      rate_9am_6pm:           parseRate(r.r_mf_9a_6p),
      rate_6pm_10pm:          parseRate(r.r_mf_6p_10),
      rate_sa_9am_6pm:        parseRate(r.r_sa_9a_6p),
      rate_sa_6pm_10pm:       parseRate(r.r_sa_6p_10),
      rate_su_9am_6pm:        parseRate(r.r_su_9a_6p),
      rate_su_6pm_10pm:       parseRate(r.r_su_6p_10),
      time_limit_9am_6pm:     parseTimeLimit(r.t_mf_9a_6p),
      time_limit_6pm_10pm:    parseTimeLimit(r.t_mf_6p_10),
      time_limit_sa_9am_6pm:  parseTimeLimit(r.t_sa_9a_6p),
      time_limit_sa_6pm_10pm: parseTimeLimit(r.t_sa_6p_10),
      time_limit_su_9am_6pm:  parseTimeLimit(r.t_su_9a_6p),
      time_limit_su_6pm_10pm: parseTimeLimit(r.t_su_6p_10),
      credit_card:            r.creditcard?.trim().toLowerCase() === 'yes',
      rush_hr:                r.rush_hr ?? null,
      geo_local_area:         r.geo_local_area ?? null,
      latitude:               r.geo_point_2d.lat,
      longitude:              r.geo_point_2d.lon,
    }));

  console.log(`Inserting ${rows.length} rows…`);
  await supabase.from('motorcycle_parking').delete().gte('id', 0);

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from('motorcycle_parking').insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
    console.log(`  inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
