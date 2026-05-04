import { describe, expect, it } from 'vitest';
import { scoreSkiing } from '../skiing.js';
import { makeDay } from './_fixtures.js';

describe('scoreSkiing', () => {
  it('rates a fresh-powder cold day near perfect', () => {
    const verdict = scoreSkiing(
      makeDay({ tempMaxC: -3, snowfallCm: 15, windSpeedMaxKmh: 10 }),
    );
    expect(verdict.score).toBeGreaterThanOrEqual(95);
    expect(verdict.reasons.some((r) => r.includes('powder'))).toBe(true);
  });

  it('collapses when temperatures climb above the melt line', () => {
    const verdict = scoreSkiing(makeDay({ tempMaxC: 20, snowfallCm: 0 }));
    expect(verdict.score).toBeLessThan(40);
    expect(verdict.reasons.some((r) => /warm/i.test(r))).toBe(true);
  });

  it('flags severe winds as a closure risk', () => {
    const verdict = scoreSkiing(
      makeDay({ tempMaxC: -5, snowfallCm: 10, windSpeedMaxKmh: 70 }),
    );
    expect(verdict.reasons.some((r) => /severe/i.test(r))).toBe(true);
    expect(verdict.score).toBeLessThan(85);
  });

  it('caps the score on frostbite-cold days even with perfect snow', () => {
    const verdict = scoreSkiing(
      makeDay({ tempMaxC: -20, snowfallCm: 15, windSpeedMaxKmh: 10 }),
    );
    expect(verdict.score).toBeLessThan(75);
    expect(verdict.reasons.some((r) => /frostbite/i.test(r))).toBe(true);
  });
});
