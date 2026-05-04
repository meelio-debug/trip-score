import type { DailyWeather } from '../weather/types.js';
import type { Activity, ActivityVerdict } from './types.js';

/**
 * Outdoor sightseeing is dominated by precipitation — rain ruins outdoor plans
 * regardless of how mild the day is.
 *
 *   precipitationMm (50%)
 *     < 0.5 → 100   dry
 *     < 3.0 →  60   light rain — uncomfortable but workable
 *     < 10  →  25   rainy
 *     ≥ 10  →   0   heavy rain
 *
 *   tempMaxC (30%) — comfort band. 14–25°C is ideal, with progressively
 *     stronger penalties at each extreme. The reason text distinguishes
 *     "too hot" from "too cold" so the UI can explain the call.
 *
 *   windSpeedMaxKmh (20%) — < 20 is fine, 35–50 is "windy", ≥ 50 zeroes the
 *     contribution (sightseeing becomes a survival activity).
 *
 */
export function scoreOutdoorSightseeing(d: DailyWeather): ActivityVerdict {
  const items: Array<{ subScore: number; reason: string }> = [];

  let tempScore: number;
  if (d.tempMaxC >= 14 && d.tempMaxC <= 25) {
    tempScore = 100;
    items.push({ subScore: tempScore, reason: `Comfortable (${Math.round(d.tempMaxC)}°C)` });
  } else if (d.tempMaxC >= 10 && d.tempMaxC <= 28) {
    tempScore = 70;
  } else if (d.tempMaxC >= 5 && d.tempMaxC <= 32) {
    tempScore = 40;
    items.push({ subScore: tempScore, reason: d.tempMaxC > 28 ? `Warm (${Math.round(d.tempMaxC)}°C)` : `Cool (${Math.round(d.tempMaxC)}°C)` });
  } else {
    tempScore = 10;
    items.push({ subScore: tempScore, reason: d.tempMaxC > 32 ? `Very hot (${Math.round(d.tempMaxC)}°C)` : `Cold (${Math.round(d.tempMaxC)}°C)` });
  }

  let precipScore: number;
  if (d.precipitationMm < 0.5) {
    precipScore = 100;
    items.push({ subScore: precipScore, reason: 'Dry' });
  } else if (d.precipitationMm < 3) {
    precipScore = 60;
    items.push({ subScore: precipScore, reason: `Light rain (${d.precipitationMm.toFixed(1)}mm)` });
  } else if (d.precipitationMm < 10) {
    precipScore = 25;
    items.push({ subScore: precipScore, reason: `Rainy (${Math.round(d.precipitationMm)}mm)` });
  } else {
    precipScore = 0;
    items.push({ subScore: precipScore, reason: `Heavy rain (${Math.round(d.precipitationMm)}mm)` });
  }

  let windScore: number;
  if (d.windSpeedMaxKmh < 20) windScore = 100;
  else if (d.windSpeedMaxKmh < 35) {
    windScore = 65;
    items.push({ subScore: windScore, reason: `Breezy (${Math.round(d.windSpeedMaxKmh)} km/h)` });
  } else if (d.windSpeedMaxKmh < 50) {
    windScore = 30;
    items.push({ subScore: windScore, reason: `Windy (${Math.round(d.windSpeedMaxKmh)} km/h)` });
  } else {
    windScore = 0;
    items.push({ subScore: windScore, reason: `Strong winds (${Math.round(d.windSpeedMaxKmh)} km/h) — sightseeing unpleasant` });
  }

  const score = Math.round(precipScore * 0.5 + tempScore * 0.3 + windScore * 0.2);
  items.sort((a, b) => a.subScore - b.subScore);
  return { score, reasons: items.map((i) => i.reason) };
}

export const outdoorSightseeing: Activity = {
  id: 'outdoor-sightseeing',
  name: 'Outdoor sightseeing',
  score: scoreOutdoorSightseeing,
};
