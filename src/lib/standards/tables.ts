import type { MainLift } from "@/lib/lifting/constants";

export const TIERS = ["Untrained", "Novice", "Intermediate", "Advanced", "Elite"] as const;
export type Tier = (typeof TIERS)[number];

export interface RatioThresholds {
  Novice: number;
  Intermediate: number;
  Advanced: number;
  Elite: number;
}

// Bodyweight-multiplier thresholds (1RM / bodyweight), ExRx/Kilgore-style.
export const MALE_STANDARDS: Record<MainLift, RatioThresholds> = {
  Squat: { Novice: 0.75, Intermediate: 1.5, Advanced: 2.0, Elite: 2.5 },
  "Bench Press": { Novice: 0.75, Intermediate: 1.25, Advanced: 1.75, Elite: 2.0 },
  Deadlift: { Novice: 1.25, Intermediate: 1.75, Advanced: 2.25, Elite: 2.75 },
  "Overhead Press": { Novice: 0.55, Intermediate: 0.8, Advanced: 1.1, Elite: 1.4 },
};

export const FEMALE_STANDARDS: Record<MainLift, RatioThresholds> = {
  Squat: { Novice: 0.55, Intermediate: 1.0, Advanced: 1.5, Elite: 2.0 },
  "Bench Press": { Novice: 0.45, Intermediate: 0.75, Advanced: 1.15, Elite: 1.5 },
  Deadlift: { Novice: 0.95, Intermediate: 1.4, Advanced: 1.9, Elite: 2.35 },
  "Overhead Press": { Novice: 0.35, Intermediate: 0.55, Advanced: 0.8, Elite: 1.05 },
};

export function getStandardsTable(gender: "male" | "female"): Record<MainLift, RatioThresholds> {
  return gender === "male" ? MALE_STANDARDS : FEMALE_STANDARDS;
}
