import { describe, expect, it } from 'vitest';
import { scoreSurfing } from '../surfing.js';
import { makeDay } from './_fixtures.js';

describe('scoreSurfing', () => {
  it('rates clean shoulder-high conditions a strong day', () => {
    const verdict = scoreSurfing(
      makeDay({ waveHeightMaxM: 1.5, windSpeedMaxKmh: 15, tempMaxC: 22 }),
    );
    expect(verdict.score).toBeGreaterThanOrEqual(90);
  });

  it('downgrades dangerous swell even with otherwise good conditions', () => {
    const verdict = scoreSurfing(
      makeDay({ waveHeightMaxM: 5, windSpeedMaxKmh: 15, tempMaxC: 22 }),
    );
    expect(verdict.score).toBeLessThan(60);
    expect(verdict.reasons.some((r) => /dangerous/i.test(r))).toBe(true);
  });
});
