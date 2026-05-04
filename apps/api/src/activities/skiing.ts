import type { DailyWeather } from '../weather/types.js';
import type { Activity, ActivityVerdict } from './types.js';

/**
 * Skiing prefers cold, snowy, calm days. Three signals are weighted to a 0–100
 * score; weights sum to 1.0.
 *
 *   tempMaxC (40%)
 *     ≤ -15°C → 25   frostbite-risk band; caps the final score around ~75 even
 *                    with perfect snow so unsafe-cold can't read as "great"
 *     ≤ 0°C → 100    classic conditions; snow stays firm
 *     ≤ 5°C →  60    mild — surfaces soften
 *     ≤ 10°C →  25   slushy
 *     > 10°C →   0   the slope won't hold snow
 *
 *   snowfallCm (40%) — fresh-snow bonus. ≥10cm = powder, ≥3cm = decent,
 *     >0 = better than nothing, 0 = baseline 25 (assumes pre-existing depth).
 *
 *   windSpeedMaxKmh (20%) — comfort and lift operations. Above 60 km/h, resort
 *     lifts typically close, so wind drops to 0 there.
 *
 */
export function scoreSkiing(d: DailyWeather): ActivityVerdict {
  const items: Array<{ subScore: number; reason: string }> = [];

  let tempScore: number;
  if (d.tempMaxC <= -15) {
    tempScore = 25;
    items.push({ subScore: tempScore, reason: `Severely cold (${Math.round(d.tempMaxC)}°C) — frostbite risk` });
  } else if (d.tempMaxC <= 0) {
    tempScore = 100;
    items.push({ subScore: tempScore, reason: `Cold (${Math.round(d.tempMaxC)}°C max) — snow stays firm` });
  } else if (d.tempMaxC <= 5) {
    tempScore = 60;
    items.push({ subScore: tempScore, reason: `Mild (${Math.round(d.tempMaxC)}°C max) — snow may soften` });
  } else if (d.tempMaxC <= 10) {
    tempScore = 25;
    items.push({ subScore: tempScore, reason: `Warm (${Math.round(d.tempMaxC)}°C max) — snow likely melting` });
  } else {
    tempScore = 0;
    items.push({ subScore: tempScore, reason: `Too warm (${Math.round(d.tempMaxC)}°C max) for skiing` });
  }

  let snowScore: number;
  if (d.snowfallCm >= 10) {
    snowScore = 100;
    items.push({ subScore: snowScore, reason: `Fresh powder (${Math.round(d.snowfallCm)}cm)` });
  } else if (d.snowfallCm >= 3) {
    snowScore = 70;
    items.push({ subScore: snowScore, reason: `Light snowfall (${Math.round(d.snowfallCm)}cm)` });
  } else if (d.snowfallCm > 0) {
    snowScore = 40;
  } else {
    snowScore = 25;
  }

  let windScore: number;
  if (d.windSpeedMaxKmh < 25) {
    windScore = 100;
  } else if (d.windSpeedMaxKmh < 40) {
    windScore = 70;
    items.push({ subScore: windScore, reason: `Breezy (${Math.round(d.windSpeedMaxKmh)} km/h)` });
  } else if (d.windSpeedMaxKmh < 60) {
    windScore = 30;
    items.push({ subScore: windScore, reason: `Strong winds (${Math.round(d.windSpeedMaxKmh)} km/h) — lifts may close` });
  } else {
    windScore = 0;
    items.push({ subScore: windScore, reason: `Severe winds (${Math.round(d.windSpeedMaxKmh)} km/h)` });
  }

  const score = Math.round(tempScore * 0.4 + snowScore * 0.4 + windScore * 0.2);
  items.sort((a, b) => a.subScore - b.subScore);
  return { score, reasons: items.map((i) => i.reason) };
}

export const skiing: Activity = {
  id: 'skiing',
  name: 'Skiing',
  score: scoreSkiing,
};
