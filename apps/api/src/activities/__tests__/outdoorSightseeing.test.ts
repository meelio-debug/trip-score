import { describe, expect, it } from 'vitest';
import { scoreOutdoorSightseeing } from '../outdoorSightseeing.js';
import { makeDay } from './_fixtures.js';

describe('scoreOutdoorSightseeing', () => {
  it('rates a mild, dry, calm day near perfect', () => {
    const verdict = scoreOutdoorSightseeing(
      makeDay({ tempMaxC: 20, precipitationMm: 0, windSpeedMaxKmh: 10 }),
    );
    expect(verdict.score).toBeGreaterThanOrEqual(95);
  });

  it('crashes on heavy rain regardless of temperature', () => {
    const verdict = scoreOutdoorSightseeing(
      makeDay({ tempMaxC: 20, precipitationMm: 15, windSpeedMaxKmh: 10 }),
    );
    expect(verdict.score).toBeLessThan(60);
    expect(verdict.reasons.some((r) => /heavy rain/i.test(r))).toBe(true);
  });

  it('penalises high winds and surfaces it as a reason', () => {
    const verdict = scoreOutdoorSightseeing(
      makeDay({ tempMaxC: 20, precipitationMm: 0, windSpeedMaxKmh: 60 }),
    );
    expect(verdict.reasons.some((r) => /strong winds|unpleasant/i.test(r))).toBe(true);
    expect(verdict.score).toBeLessThan(85);
  });
});
