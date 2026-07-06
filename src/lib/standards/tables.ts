import type { MainLift } from "@/lib/lifting/constants";

export const TIERS = ["Untrained", "Novice", "Intermediate", "Advanced", "Elite"] as const;
export type Tier = (typeof TIERS)[number];

export interface RatioThresholds {
  Novice: number;
  Intermediate: number;
  Advanced: number;
  Elite: number;
}

// How much to trust a lift's standards table. Surfaced in the UI so a
// weak-point flag on a low-confidence lift doesn't read as equally certain
// to one backed by verified competition results.
export type Confidence = "verified_competition" | "crowdsourced" | "unverified_placeholder";

export interface StandardsMeta {
  confidence: Confidence;
  source: string;
}

// Squat/Bench/Deadlift: no live data access in this environment to compute
// real percentile-derived tables from OpenPowerlifting (data.openpowerlifting.org
// and its Kaggle mirror are both unreachable here) — these three are still the
// original memory-reconstructed approximation and are NOT verified. Pending a
// real rebuild once bodyweight-binned percentile data is available (see
// scripts/opl-standards.py).
//
// Overhead Press: rebuilt 2026-07-06 from crowdsourced 1RM-to-bodyweight
// ratios (StrengthLevel-style, ~5.6M lifts, cross-validated against multiple
// independent sources). Not competition-verified, no bodyweight-bin data
// available, so thresholds are flat rather than bodyweight-interpolated.
export const STANDARDS_META: Record<MainLift, StandardsMeta> = {
  Squat: {
    confidence: "unverified_placeholder",
    source: "Approximated from memory; pending rebuild from OpenPowerlifting competition data",
  },
  "Bench Press": {
    confidence: "unverified_placeholder",
    source: "Approximated from memory; pending rebuild from OpenPowerlifting competition data",
  },
  Deadlift: {
    confidence: "unverified_placeholder",
    source: "Approximated from memory; pending rebuild from OpenPowerlifting competition data",
  },
  "Overhead Press": {
    confidence: "crowdsourced",
    source: "Crowdsourced 1RM data (StrengthLevel-style, ~5.6M lifts); not competition-verified",
  },
};

// Bodyweight-multiplier thresholds (1RM / bodyweight).
export const MALE_STANDARDS: Record<MainLift, RatioThresholds> = {
  Squat: { Novice: 0.75, Intermediate: 1.5, Advanced: 2.0, Elite: 2.5 },
  "Bench Press": { Novice: 0.75, Intermediate: 1.25, Advanced: 1.75, Elite: 2.0 },
  Deadlift: { Novice: 1.25, Intermediate: 1.75, Advanced: 2.25, Elite: 2.75 },
  "Overhead Press": { Novice: 0.5, Intermediate: 0.725, Advanced: 1.0, Elite: 1.25 },
};

export const FEMALE_STANDARDS: Record<MainLift, RatioThresholds> = {
  Squat: { Novice: 0.55, Intermediate: 1.0, Advanced: 1.5, Elite: 2.0 },
  "Bench Press": { Novice: 0.45, Intermediate: 0.75, Advanced: 1.15, Elite: 1.5 },
  Deadlift: { Novice: 0.95, Intermediate: 1.4, Advanced: 1.9, Elite: 2.35 },
  // ~65% of the male ratios, per the middle of the commonly cited 60-70% band.
  "Overhead Press": { Novice: 0.33, Intermediate: 0.47, Advanced: 0.65, Elite: 0.81 },
};

export function getStandardsTable(gender: "male" | "female"): Record<MainLift, RatioThresholds> {
  return gender === "male" ? MALE_STANDARDS : FEMALE_STANDARDS;
}

export function isLowConfidence(lift: MainLift): boolean {
  return STANDARDS_META[lift].confidence !== "verified_competition";
}
