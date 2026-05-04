import type { DailyWeather } from '../weather/types.js';
import type { Activity, ActivityVerdict } from './types.js';

/**
 * Indoor sightseeing isn't a strict inverse of outdoor — museums and galleries
 * have inherent appeal independent of weather. Scoring starts from a baseline
 * of 55 (a "reliable plan" floor) and adjusts in both directions, then clamps
 * to [0, 100].
 *
 *   +35  heavy rain (precipitationMm ≥ 10) — perfect to be inside
 *   +20  wet day (≥ 3mm)
 *   +10  light rain (≥ 0.5mm)
 *   +20  hot day (tempMaxC ≥ 32°C) — climate-controlled venues become attractive
 *   +20  very cold morning (tempMinC ≤ -5°C) — escape the chill
 *   +15  strong winds (windSpeedMaxKmh ≥ 50)
 *   -25  lovely outdoor day (17–26°C, dry, calm) — feels wasteful indoors
 *
 * The asymmetric structure — many positive contributions, one negative —
 * means indoor stays above the floor on most days but yields to outdoor on
 * objectively-perfect ones.
 *
 */
export function scoreIndoorSightseeing(d: DailyWeather): ActivityVerdict {
  const items: Array<{ delta: number; reason: string }> = [];
  let score = 55;

  if (d.precipitationMm >= 10) {
    score += 35;
    items.push({ delta: 35, reason: `Heavy rain (${Math.round(d.precipitationMm)}mm) — perfect to be inside` });
  } else if (d.precipitationMm >= 3) {
    score += 20;
    items.push({ delta: 20, reason: `Wet day (${d.precipitationMm.toFixed(1)}mm)` });
  } else if (d.precipitationMm >= 0.5) {
    score += 10;
    items.push({ delta: 10, reason: `Light rain (${d.precipitationMm.toFixed(1)}mm)` });
  }

  if (d.tempMaxC >= 32) {
    score += 20;
    items.push({ delta: 20, reason: `Hot (${Math.round(d.tempMaxC)}°C) — climate-controlled venues appeal` });
  } else if (d.tempMinC <= -5) {
    score += 20;
    items.push({ delta: 20, reason: `Very cold (${Math.round(d.tempMinC)}°C) — escape the chill` });
  }

  if (d.windSpeedMaxKmh >= 50) {
    score += 15;
    items.push({ delta: 15, reason: `Strong winds (${Math.round(d.windSpeedMaxKmh)} km/h)` });
  }

  const isLovelyOutside =
    d.tempMaxC >= 17 &&
    d.tempMaxC <= 26 &&
    d.precipitationMm < 1 &&
    d.windSpeedMaxKmh < 25;
  if (isLovelyOutside) {
    score -= 25;
    items.push({ delta: -25, reason: 'Lovely outside — feels wasteful indoors' });
  }

  const clamped = Math.max(0, Math.min(100, score));
  items.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const reasons = items.length > 0 ? items.map((i) => i.reason) : ['Reliable any-weather option'];
  return { score: clamped, reasons };
}

export const indoorSightseeing: Activity = {
  id: 'indoor-sightseeing',
  name: 'Indoor sightseeing',
  score: scoreIndoorSightseeing,
};
