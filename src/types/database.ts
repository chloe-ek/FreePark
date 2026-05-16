export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      parking_meters: {
        Row: {
          am_rush_end: string | null;
          am_rush_start: string | null;
          created_at: string;
          credit_card: boolean;
          id: number;
          latitude: number;
          longitude: number;
          meter_id: string;
          pm_rush_end: string | null;
          pm_rush_start: string | null;
          prohibition_days: string | null;
          prohibition_end: string | null;
          prohibition_start: string | null;
          prohibition2_days: string | null;
          prohibition2_end: string | null;
          prohibition2_start: string | null;
          rate_6pm_10pm: number | null;
          rate_9am_6pm: number | null;
          rate_sa_6pm_10pm: number | null;
          rate_sa_9am_6pm: number | null;
          rate_su_6pm_10pm: number | null;
          rate_su_9am_6pm: number | null;
          service_status: string;
          time_limit_6pm_10pm: number | null;
          time_limit_9am_6pm: number | null;
          time_limit_sa_6pm_10pm: number | null;
          time_limit_sa_9am_6pm: number | null;
          time_limit_su_6pm_10pm: number | null;
          time_limit_su_9am_6pm: number | null;
          updated_at: string;
        };
        Insert: {
          am_rush_end?: string | null;
          am_rush_start?: string | null;
          created_at?: string;
          credit_card?: boolean;
          latitude: number;
          longitude: number;
          meter_id: string;
          pm_rush_end?: string | null;
          pm_rush_start?: string | null;
          prohibition_days?: string | null;
          prohibition_end?: string | null;
          prohibition_start?: string | null;
          prohibition2_days?: string | null;
          prohibition2_end?: string | null;
          prohibition2_start?: string | null;
          rate_6pm_10pm?: number | null;
          rate_9am_6pm?: number | null;
          rate_sa_6pm_10pm?: number | null;
          rate_sa_9am_6pm?: number | null;
          rate_su_6pm_10pm?: number | null;
          rate_su_9am_6pm?: number | null;
          service_status?: string;
          time_limit_6pm_10pm?: number | null;
          time_limit_9am_6pm?: number | null;
          time_limit_sa_6pm_10pm?: number | null;
          time_limit_sa_9am_6pm?: number | null;
          time_limit_su_6pm_10pm?: number | null;
          time_limit_su_9am_6pm?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['parking_meters']['Insert']>;
        Relationships: [];
      };
      spot_reports: {
        Row: {
          expires_at: string;
          id: string;
          meter_id: string;
          report_type: string;
          reported_at: string;
        };
        Insert: {
          expires_at?: string;
          id?: string;
          meter_id: string;
          report_type?: string;
          reported_at?: string;
        };
        Update: {
          expires_at?: string;
          id?: string;
          meter_id?: string;
          report_type?: string;
          reported_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_nearby_meters: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number };
        Returns: NearbyMeterResult[];
      };
      get_nearby_disability_parking: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number };
        Returns: DisabilityParkingResult[];
      };
      get_nearby_motorcycle_parking: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number };
        Returns: MotorcycleParkingResult[];
      };
      get_nearby_ev_charging: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number };
        Returns: EvChargingResult[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

// ─── App-level types ──────────────────────────────────────────────────────────

export interface ParkingMeter {
  id: number;
  meter_id: string;
  latitude: number;
  longitude: number;
  rate_9am_6pm: number | null;
  rate_6pm_10pm: number | null;
  rate_sa_9am_6pm: number | null;
  rate_sa_6pm_10pm: number | null;
  rate_su_9am_6pm: number | null;
  rate_su_6pm_10pm: number | null;
  time_limit_9am_6pm: number | null;
  time_limit_6pm_10pm: number | null;
  time_limit_sa_9am_6pm: number | null;
  time_limit_sa_6pm_10pm: number | null;
  time_limit_su_9am_6pm: number | null;
  time_limit_su_6pm_10pm: number | null;
  prohibition_start: string | null;
  prohibition_end: string | null;
  prohibition_days: string | null;
  prohibition2_start: string | null;
  prohibition2_end: string | null;
  prohibition2_days: string | null;
  am_rush_start: string | null;
  am_rush_end: string | null;
  pm_rush_start: string | null;
  pm_rush_end: string | null;
  credit_card: boolean;
  service_status: "active" | "inactive" | "removed";
  created_at: string;
  updated_at: string;
}

export interface NearbyMeterResult extends Omit<ParkingMeter, "created_at" | "updated_at"> {
  distance_meters: number;
}

export interface DisabilityParkingResult {
  id: number;
  description: string | null;
  location: string;
  spaces: number;
  notes: string | null;
  geo_local_area: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

export interface MotorcycleParkingResult {
  id: number;
  spot_type: string | null;
  location: string | null;
  intersectn: string | null;
  rate_9am_6pm: number | null;
  rate_6pm_10pm: number | null;
  rate_sa_9am_6pm: number | null;
  rate_sa_6pm_10pm: number | null;
  rate_su_9am_6pm: number | null;
  rate_su_6pm_10pm: number | null;
  time_limit_9am_6pm: number | null;
  time_limit_6pm_10pm: number | null;
  time_limit_sa_9am_6pm: number | null;
  time_limit_sa_6pm_10pm: number | null;
  time_limit_su_9am_6pm: number | null;
  time_limit_su_6pm_10pm: number | null;
  credit_card: boolean;
  am_rush_start: string | null;
  am_rush_end: string | null;
  pm_rush_start: string | null;
  pm_rush_end: string | null;
  geo_local_area: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

export interface EvChargingResult {
  id: number;
  address: string;
  lot_operator: string | null;
  geo_local_area: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
}
