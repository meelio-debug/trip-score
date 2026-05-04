import type { DailyWeather } from '../../weather/types.js';

/**
 * Build a DailyWeather record with sensible defaults; override only the
 * fields a test cares about. Defaults describe a mild, dry, calm spring day.
 */
export function makeDay(overrides: Partial<DailyWeather> = {}): DailyWeather {
  return {
    date: '2026-05-04',
    tempMaxC: 18,
    tempMinC: 10,
    precipitationMm: 0,
    snowfallCm: 0,
    windSpeedMaxKmh: 12,
    uvIndexMax: 5,
    weatherCode: 1,
    waveHeightMaxM: 0,
    wavePeriodMaxS: 0,
    ...overrides,
  };
}
