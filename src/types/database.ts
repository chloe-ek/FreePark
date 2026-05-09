export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      parking_meters: {
        Row: ParkingMeter;
        Insert: Omit<ParkingMeter, "id" | "created_at">;
        Update: Partial<Omit<ParkingMeter, "id" | "created_at">>;
      };
    };
    Functions: {
      get_nearby_meters: {
        Args: { user_lat: number; user_lng: number; radius_meters: number };
        Returns: NearbyMeterResult[];
      };
    };
  };
}

export interface ParkingMeter {
  id: number;
  meter_id: string;
  latitude: number;
  longitude: number;
  // Weekday rates (CAD/hr); 0 = free, null = unmetered at this time
  rate_9am_6pm: number | null;
  rate_6pm_10pm: number | null;
  // Weekend rates
  rate_sa_9am_6pm: number | null;
  rate_sa_6pm_10pm: number | null;
  rate_su_9am_6pm: number | null;
  rate_su_6pm_10pm: number | null;
  // Weekday time limits (minutes)
  time_limit_9am_6pm: number | null;
  time_limit_6pm_10pm: number | null;
  // Weekend time limits
  time_limit_sa_9am_6pm: number | null;
  time_limit_sa_6pm_10pm: number | null;
  time_limit_su_9am_6pm: number | null;
  time_limit_su_6pm_10pm: number | null;
  // First prohibition window
  prohibition_start: string | null;   // "HH:MM"
  prohibition_end: string | null;
  prohibition_days: string | null;    // "Mon Tue Wed Thu Fri"
  // Second prohibition window
  prohibition2_start: string | null;
  prohibition2_end: string | null;
  prohibition2_days: string | null;
  // Rush hour restrictions — no parking allowed (Mon–Fri), tow risk
  am_rush_start: string | null;   // "HH:MM"
  am_rush_end:   string | null;
  pm_rush_start: string | null;
  pm_rush_end:   string | null;
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
  rush_hr: string | null;
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
