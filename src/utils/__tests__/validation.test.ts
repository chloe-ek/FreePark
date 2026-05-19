import { isValidCoordinates } from '../validation';

describe('isValidCoordinates', () => {
  describe('valid inputs', () => {
    test('typical Vancouver coordinates and radius pass', () => {
      expect(isValidCoordinates(49.28, -123.12, 500)).toBe(true);
    });
    test('lat at lower boundary (-90)', () => {
      expect(isValidCoordinates(-90, 0, 100)).toBe(true);
    });
    test('lat at upper boundary (90)', () => {
      expect(isValidCoordinates(90, 0, 100)).toBe(true);
    });
    test('lng at lower boundary (-180)', () => {
      expect(isValidCoordinates(0, -180, 100)).toBe(true);
    });
    test('lng at upper boundary (180)', () => {
      expect(isValidCoordinates(0, 180, 100)).toBe(true);
    });
    test('radius at lower boundary (1m)', () => {
      expect(isValidCoordinates(49.28, -123.12, 1)).toBe(true);
    });
    test('radius at upper boundary (50 000m)', () => {
      expect(isValidCoordinates(49.28, -123.12, 50_000)).toBe(true);
    });
    test('origin (0, 0) is valid', () => {
      expect(isValidCoordinates(0, 0, 500)).toBe(true);
    });
  });

  describe('invalid latitude', () => {
    test('lat just below -90 fails', () => {
      expect(isValidCoordinates(-90.001, 0, 500)).toBe(false);
    });
    test('lat just above 90 fails', () => {
      expect(isValidCoordinates(90.001, 0, 500)).toBe(false);
    });
    test('lat = -91 fails', () => {
      expect(isValidCoordinates(-91, 0, 500)).toBe(false);
    });
    test('lat = NaN fails', () => {
      expect(isValidCoordinates(NaN, 0, 500)).toBe(false);
    });
    test('lat = Infinity fails', () => {
      expect(isValidCoordinates(Infinity, 0, 500)).toBe(false);
    });
    test('lat = -Infinity fails', () => {
      expect(isValidCoordinates(-Infinity, 0, 500)).toBe(false);
    });
  });

  describe('invalid longitude', () => {
    test('lng just below -180 fails', () => {
      expect(isValidCoordinates(0, -180.001, 500)).toBe(false);
    });
    test('lng just above 180 fails', () => {
      expect(isValidCoordinates(0, 180.001, 500)).toBe(false);
    });
    test('lng = NaN fails', () => {
      expect(isValidCoordinates(0, NaN, 500)).toBe(false);
    });
    test('lng = Infinity fails', () => {
      expect(isValidCoordinates(0, Infinity, 500)).toBe(false);
    });
  });

  describe('invalid radius', () => {
    test('radius 0 fails (must be > 0)', () => {
      expect(isValidCoordinates(0, 0, 0)).toBe(false);
    });
    test('radius -1 fails', () => {
      expect(isValidCoordinates(0, 0, -1)).toBe(false);
    });
    test('radius 50 001 fails (above max)', () => {
      expect(isValidCoordinates(0, 0, 50_001)).toBe(false);
    });
    test('radius NaN fails', () => {
      expect(isValidCoordinates(0, 0, NaN)).toBe(false);
    });
    test('radius = Infinity fails', () => {
      expect(isValidCoordinates(0, 0, Infinity)).toBe(false);
    });
  });

  describe('each field fails independently', () => {
    test('valid lat+lng, invalid radius → false', () => {
      expect(isValidCoordinates(49.28, -123.12, 0)).toBe(false);
    });
    test('valid lat+radius, invalid lng → false', () => {
      expect(isValidCoordinates(49.28, 200, 500)).toBe(false);
    });
    test('valid lng+radius, invalid lat → false', () => {
      expect(isValidCoordinates(91, -123.12, 500)).toBe(false);
    });
  });
});
