/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VancouverEv {
  address: string;
  lot_operator: string | null;
  geo_local_area: string | null;
  geo_point_2d: { lat: number; lon: number };
}

async function fetchAll(): Promise<VancouverEv[]> {
  const limit = 100;
  let offset = 0;
  const all: VancouverEv[] = [];
  while (true) {
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/electric-vehicle-charging-stations/records?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { results: VancouverEv[]; total_count: number };
    all.push(...json.results);
    if (all.length >= json.total_count) break;
    offset += limit;
  }
  return all;
}

async function main() {
  console.log('Fetching EV charging stations from Vancouver Open Data…');
  const records = await fetchAll();
  console.log(`Fetched ${records.length} records`);

  const rows = records
    .filter((r) => r.geo_point_2d?.lat != null)
    .map((r) => ({
      address:        r.address,
      lot_operator:   r.lot_operator ?? null,
      geo_local_area: r.geo_local_area ?? null,
      latitude:       r.geo_point_2d.lat,
      longitude:      r.geo_point_2d.lon,
    }));

  console.log(`Inserting ${rows.length} rows…`);
  await supabase.from('ev_charging_stations').delete().gte('id', 0);

  const { error } = await supabase.from('ev_charging_stations').insert(rows);
  if (error) throw error;
  console.log(`Done — ${rows.length} EV stations inserted.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
