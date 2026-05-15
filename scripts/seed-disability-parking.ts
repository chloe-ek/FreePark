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

interface VancouverDisabilityRecord {
  description: string | null;
  location: string;
  spaces: number | null;
  notes: string | null;
  geo_local_area: string | null;
  geo_point_2d: { lat: number; lon: number };
}

async function fetchAll(): Promise<VancouverDisabilityRecord[]> {
  const limit = 100;
  let offset = 0;
  const all: VancouverDisabilityRecord[] = [];

  while (true) {
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/disability-parking/records?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { results: VancouverDisabilityRecord[]; total_count: number };
    all.push(...json.results);
    if (all.length >= json.total_count) break;
    offset += limit;
  }

  return all;
}

async function main() {
  console.log('Fetching disability parking from Vancouver Open Data…');
  const records = await fetchAll();
  console.log(`Fetched ${records.length} records`);

  const rows = records
    .filter((r) => r.geo_point_2d?.lat != null && r.geo_point_2d?.lon != null)
    .map((r) => ({
      description:    r.description ?? null,
      location:       r.location,
      spaces:         r.spaces ?? 1,
      notes:          r.notes ?? null,
      geo_local_area: r.geo_local_area ?? null,
      latitude:       r.geo_point_2d.lat,
      longitude:      r.geo_point_2d.lon,
    }));

  console.log(`Inserting ${rows.length} rows…`);

  const { error } = await supabase
    .from('disability_parking')
    .delete()
    .gte('id', 0);
  if (error) throw error;

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error: insertError } = await supabase
      .from('disability_parking')
      .insert(chunk);
    if (insertError) throw insertError;
    console.log(`  inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
