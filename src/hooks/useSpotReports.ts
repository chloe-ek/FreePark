import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { STORAGE_KEYS } from '../constants/storage';

export interface SpotReport {
  id: string;
  meter_id: string;
  report_type: 'no_vacancy';
  reported_at: string;
  expires_at: string;
}

const REPORT_COOLDOWN_MS = 60 * 60 * 1000;
const reportCooldowns = new Map<string, number>();

async function loadCooldowns() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REPORT_COOLDOWNS);
    if (!raw) return;
    const stored: Record<string, number> = JSON.parse(raw);
    const now = Date.now();
    for (const [id, ts] of Object.entries(stored)) {
      if (now - ts < REPORT_COOLDOWN_MS) reportCooldowns.set(id, ts);
    }
  } catch {}
}

async function persistCooldowns() {
  const obj: Record<string, number> = {};
  for (const [id, ts] of reportCooldowns) obj[id] = ts;
  await AsyncStorage.setItem(STORAGE_KEYS.REPORT_COOLDOWNS, JSON.stringify(obj));
}

let cooldownsLoaded = false;

// Returns active (non-expired) reports, updated in real time.
export function useSpotReports(meterIds: string[]) {
  const [reports, setReports] = useState<SpotReport[]>([]);

  useEffect(() => {
    if (!cooldownsLoaded) {
      cooldownsLoaded = true;
      loadCooldowns();
    }
  }, []);

  const fetchActive = useCallback(async () => {
    if (meterIds.length === 0) return;
    const { data } = await supabase
      .from('spot_reports')
      .select('*')
      .in('meter_id', meterIds)
      .gt('expires_at', new Date().toISOString())
      .order('reported_at', { ascending: false });
    setReports((data as SpotReport[]) ?? []);
  }, [meterIds.join(',')]);

  useEffect(() => {
    fetchActive();

    const channel = supabase
      .channel('spot-reports-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'spot_reports' },
        (payload) => {
          const r = payload.new as SpotReport;
          if (!meterIds.includes(r.meter_id)) return;
          setReports((prev) => {
            // Remove any older report for the same meter, add the new one
            const filtered = prev.filter((p) => p.meter_id !== r.meter_id);
            return [r, ...filtered];
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchActive]);

  // Purge expired reports every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setReports((prev) => prev.filter((r) => r.expires_at > now));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  function getReport(meterId: string): SpotReport | undefined {
    const now = new Date().toISOString();
    return reports.find((r) => r.meter_id === meterId && r.expires_at > now);
  }

  async function submitReport(meterId: string, type: SpotReport['report_type']): Promise<boolean> {
    const lastTime = reportCooldowns.get(meterId);
    if (lastTime !== undefined && Date.now() - lastTime < REPORT_COOLDOWN_MS) {
      return false;
    }
    try {
      const { error } = await supabase.from('spot_reports').insert({
        meter_id: meterId,
        report_type: type,
      });
      if (error) {
        if (__DEV__) console.warn('[spot_reports] Insert failed:', error.message);
        return false;
      }
      reportCooldowns.set(meterId, Date.now());
      persistCooldowns();
      return true;
    } catch (err) {
      if (__DEV__) console.warn('[spot_reports] Unexpected error:', err);
      return false;
    }
  }

  return { getReport, submitReport };
}
