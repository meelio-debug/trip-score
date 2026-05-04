import { describe, expect, it } from 'vitest';
import { scoreIndoorSightseeing } from '../indoorSightseeing.js';
import { makeDay } from './_fixtures.js';

describe('scoreIndoorSightseeing', () => {
  it('rises sharply on heavy rain', () => {
    const verdict = scoreIndoorSightseeing(makeDay({ precipitationMm: 15 }));
    expect(verdict.score).toBeGreaterThanOrEqual(85);
    expect(verdict.reasons.some((r) => /rain/i.test(r))).toBe(true);
  });

  it('drops on a beautiful outdoor day', () => {
    const verdict = scoreIndoorSightseeing(
      makeDay({ tempMaxC: 22, precipitationMm: 0, windSpeedMaxKmh: 8 }),
    );
    expect(verdict.score).toBeLessThan(40);
    expect(verdict.reasons.some((r) => /lovely/i.test(r))).toBe(true);
  });

  it('rises on either temperature extreme', () => {
    const hot = scoreIndoorSightseeing(makeDay({ tempMaxC: 35, tempMinC: 25 }));
    const cold = scoreIndoorSightseeing(makeDay({ tempMaxC: -2, tempMinC: -10 }));
    expect(hot.score).toBeGreaterThanOrEqual(70);
    expect(cold.score).toBeGreaterThanOrEqual(70);
  });
});
