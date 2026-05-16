/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { VANCOUVER_OPENDATA_BASE } from './opendata';

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

function parseOneWindow(s: string): { start: string; end: string } | null {
  // Handles "7-10am", "3-6pm", "7-9:30am" — period applies to both start and end
  const m = s.trim().match(/^(\d{1,2})-(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  if (!m) return null;
  let sh = parseInt(m[1], 10), eh = parseInt(m[2], 10);
  const endMins = m[3] ? parseInt(m[3], 10) : 0;
  const isPm = m[4].toLowerCase() === 'pm';
  if (isPm)  { if (sh !== 12) sh += 12; if (eh !== 12) eh += 12; }
  else       { if (sh === 12) sh = 0;   if (eh === 12) eh = 0; }
  return {
    start: `${String(sh).padStart(2, '0')}:00`,
    end:   `${String(eh).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
  };
}

function parseRushHr(raw: string | null): {
  am_rush_start: string | null; am_rush_end: string | null;
  pm_rush_start: string | null; pm_rush_end: string | null;
} {
  const none = { am_rush_start: null, am_rush_end: null, pm_rush_start: null, pm_rush_end: null };
  if (!raw || raw.trim().toLowerCase() === 'n/a') return none;
  let am_rush_start = null, am_rush_end = null, pm_rush_start = null, pm_rush_end = null;
  for (const part of raw.split('/')) {
    const isPm = /pm$/i.test(part.trim());
    const parsed = parseOneWindow(part.trim());
    if (!parsed) continue;
    if (isPm) { pm_rush_start = parsed.start; pm_rush_end = parsed.end; }
    else      { am_rush_start = parsed.start; am_rush_end = parsed.end; }
  }
  return { am_rush_start, am_rush_end, pm_rush_start, pm_rush_end };
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
    const url = `${VANCOUVER_OPENDATA_BASE}/motorcycle-parking/records?limit=${limit}&offset=${offset}`;
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
      ...parseRushHr(r.rush_hr ?? null),
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
