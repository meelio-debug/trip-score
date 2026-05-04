import type { DailyWeather } from '../weather/types.js';

export type ActivityVerdict = {
  /** Integer 0–100, higher is better. */
  score: number;
  /** Short human-readable factors that drove the score. */
  reasons: string[];
};

export interface Activity {
  readonly id: string;
  readonly name: string;
  score(day: DailyWeather): ActivityVerdict;
}
