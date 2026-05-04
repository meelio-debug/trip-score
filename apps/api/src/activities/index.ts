import type { Activity } from './types.js';
import { skiing } from './skiing.js';
import { surfing } from './surfing.js';
import { outdoorSightseeing } from './outdoorSightseeing.js';
import { indoorSightseeing } from './indoorSightseeing.js';

/**
 * Registry of all scoreable activities. Adding a new activity is one new file
 * and one entry here — nothing else changes.
 */
export const activities: readonly Activity[] = [
  skiing,
  surfing,
  outdoorSightseeing,
  indoorSightseeing,
];

export type { Activity, ActivityVerdict } from './types.js';
