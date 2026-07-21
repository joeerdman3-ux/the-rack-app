import type { Unit } from "./plates";

// The widely-reproduced RTS-style (Mike Tuchscherer, Reactive Training
// Systems) RPE-to-%1RM chart, as commonly cited across strength-coaching
// tools (Boostcamp, Juggernaut AI, and similar RPE calculators). Values
// are %1RM, one row per RPE (6-10 in 0.5 steps), one column per rep count
// (1-10). Different reproductions of this chart round slightly
// differently in places (~0.5-1%) since RTS never published one single
// canonical machine-readable table — this is the commonly-cited version.
export const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;
export type RPEValue = (typeof RPE_VALUES)[number];

export const REP_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type RepCount = (typeof REP_COUNTS)[number];

// Indexed by reps - 1 (index 0 = 1 rep ... index 9 = 10 reps).
export const RPE_PERCENT_1RM: Record<RPEValue, number[]> = {
  10: [100.0, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9],
  9.5: [97.8, 93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.8],
  9: [95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7],
  8.5: [93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.8, 70.6],
  8: [92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4],
  7.5: [90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.8, 70.6, 68.5],
  7: [89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.4],
  6.5: [87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.8, 70.6, 68.5, 66.4],
  6: [86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.4, 65.3],
};

export function getPercent1RM(rpe: RPEValue, reps: RepCount): number {
  return RPE_PERCENT_1RM[rpe][reps - 1];
}

// Rounding increment for an *estimated* working weight off a %1RM — 2.5lb
// or 1kg, deliberately finer/different from plates.ts's
// LOADABLE_INCREMENT (5lb/2.5kg), which is specifically about what's
// loadable on a barbell with standard plates. This is a reference
// estimate, not a barbell-loading calculation.
const ESTIMATE_ROUND_INCREMENT: Record<Unit, number> = { lb: 2.5, kg: 1 };

export function roundToEstimateIncrement(weight: number, unit: Unit): number {
  const increment = ESTIMATE_ROUND_INCREMENT[unit];
  return Math.round(weight / increment) * increment;
}
