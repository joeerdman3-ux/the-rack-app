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

// Squat/Bench/Deadlift: rebuilt 2026-07-07 from real competition data via the
// lift_benchmarks table (percentiles by sex/age_bucket/weight_class, sourced
// from OpenPowerlifting: openpowerlifting.org, public domain, attribution
// appreciated). See src/lib/standards/benchmarks.ts for the lookup logic —
// thresholds are absolute kg values per bodyweight bracket, not a flat ratio,
// so they're computed per-user in diagnosis.ts rather than stored here.
//
// Overhead Press: rebuilt 2026-07-06 from crowdsourced 1RM-to-bodyweight
// ratios (StrengthLevel-style, ~5.6M lifts, cross-validated against multiple
// independent sources). Not competition-verified, no bodyweight-bin data
// available, so thresholds stay flat rather than bodyweight-interpolated.
export const STANDARDS_META: Record<MainLift, StandardsMeta> = {
  Squat: {
    confidence: "verified_competition",
    source: "OpenPowerlifting competition results (openpowerlifting.org, public domain)",
  },
  "Bench Press": {
    confidence: "verified_competition",
    source: "OpenPowerlifting competition results (openpowerlifting.org, public domain)",
  },
  Deadlift: {
    confidence: "verified_competition",
    source: "OpenPowerlifting competition results (openpowerlifting.org, public domain)",
  },
  "Overhead Press": {
    confidence: "crowdsourced",
    source: "Crowdsourced 1RM data (StrengthLevel-style, ~5.6M lifts); not competition-verified",
  },
};

// Overhead Press is the only lift still on flat bodyweight-multiplier
// thresholds — Squat/Bench/Deadlift now come from the lift_benchmarks lookup
// (see src/lib/standards/benchmarks.ts) since real percentile-by-bodyweight
// data exists for them.
export const OHP_STANDARDS: Record<"male" | "female", RatioThresholds> = {
  male: { Novice: 0.5, Intermediate: 0.725, Advanced: 1.0, Elite: 1.25 },
  // ~65% of the male ratios, per the middle of the commonly cited 60-70% band.
  female: { Novice: 0.33, Intermediate: 0.47, Advanced: 0.65, Elite: 0.81 },
};

export function getOverheadPressThresholds(gender: "male" | "female"): RatioThresholds {
  return OHP_STANDARDS[gender];
}

export function isLowConfidence(lift: MainLift): boolean {
  return STANDARDS_META[lift].confidence !== "verified_competition";
}
