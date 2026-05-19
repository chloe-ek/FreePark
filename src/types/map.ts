import type {
  DisabilityParkingResult,
  EvChargingResult,
  MotorcycleParkingResult,
  NearbyMeterResult,
} from './database';

export type Selection =
  | { kind: 'meter';      item: NearbyMeterResult }
  | { kind: 'disability'; item: DisabilityParkingResult }
  | { kind: 'motorcycle'; item: MotorcycleParkingResult }
  | { kind: 'ev';         item: EvChargingResult }
  | null;
