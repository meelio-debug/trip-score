import type { DailyWeather } from '../weather/types.js';
import type { Activity, ActivityVerdict } from './types.js';

/**
 * Surfing prefers organised swell, manageable wind, and tolerable air temp.
 * Wave height carries the heaviest weight (70%) so dangerous conditions can't
 * be redeemed by perfect wind or warm air. Inland locations naturally score
 * low because the Marine API returns no wave data — see README.
 *
 *   waveHeightMaxM (70%)
 *     < 0.3m  →  10  flat (also where inland lands — Marine API gives no waves)
 *     < 0.8m  →  50  small but rideable
 *     ≤ 2.5m  → 100  ideal range (waist to overhead)
 *     ≤ 4.0m  →  60  big — experienced surfers only
 *     > 4.0m  →  20  dangerous swell; effective final-score cap around 44
 *
 *   windSpeedMaxKmh (20%) — under 8 km/h is too clean (waves go small),
 *     8–25 is the sweet spot, 25–40 is choppy, above 40 is blown out.
 *
 *   tempMaxC (10%) — comfort weighting only. Doesn't drive the call, but a 5°C
 *     paddle is materially worse than a 22°C one.
 *
 */
export function scoreSurfing(d: DailyWeather): ActivityVerdict {
  const items: Array<{ subScore: number; reason: string }> = [];

  let waveScore: number;
  if (d.waveHeightMaxM < 0.3) {
    waveScore = 10;
    items.push({ subScore: waveScore, reason: `Flat (${d.waveHeightMaxM.toFixed(1)}m waves)` });
  } else if (d.waveHeightMaxM < 0.8) {
    waveScore = 50;
    items.push({ subScore: waveScore, reason: `Small (${d.waveHeightMaxM.toFixed(1)}m waves)` });
  } else if (d.waveHeightMaxM <= 2.5) {
    waveScore = 100;
    items.push({ subScore: waveScore, reason: `Good wave height (${d.waveHeightMaxM.toFixed(1)}m)` });
  } else if (d.waveHeightMaxM <= 4) {
    waveScore = 60;
    items.push({ subScore: waveScore, reason: `Big (${d.waveHeightMaxM.toFixed(1)}m) — experienced surfers only` });
  } else {
    waveScore = 20;
    items.push({ subScore: waveScore, reason: `Dangerous swell (${d.waveHeightMaxM.toFixed(1)}m)` });
  }

  let windScore: number;
  if (d.windSpeedMaxKmh < 8) {
    windScore = 60;
    items.push({ subScore: windScore, reason: 'Light wind — clean but small' });
  } else if (d.windSpeedMaxKmh <= 25) {
    windScore = 100;
  } else if (d.windSpeedMaxKmh <= 40) {
    windScore = 50;
    items.push({ subScore: windScore, reason: `Choppy (${Math.round(d.windSpeedMaxKmh)} km/h winds)` });
  } else {
    windScore = 10;
    items.push({ subScore: windScore, reason: `Blown out (${Math.round(d.windSpeedMaxKmh)} km/h winds)` });
  }

  let tempScore: number;
  if (d.tempMaxC >= 18) tempScore = 100;
  else if (d.tempMaxC >= 12) tempScore = 70;
  else if (d.tempMaxC >= 5) tempScore = 40;
  else tempScore = 20;

  const score = Math.round(waveScore * 0.7 + windScore * 0.2 + tempScore * 0.1);
  items.sort((a, b) => a.subScore - b.subScore);
  return { score, reasons: items.map((i) => i.reason) };
}

export const surfing: Activity = {
  id: 'surfing',
  name: 'Surfing',
  score: scoreSurfing,
};
