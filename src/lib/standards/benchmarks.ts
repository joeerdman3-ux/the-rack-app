import type { RatioThresholds } from "./tables";

// Matches the age_bucket values used in the lift_benchmarks table.
export const AGE_BUCKETS = [
  "Sub-Junior",
  "Junior",
  "Open",
  "Master1",
  "Master2",
  "Master3",
  "Master4",
] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export function computeAgeBucket(birthdateISO: string, asOf: Date = new Date()): AgeBucket {
  const birth = new Date(birthdateISO);
  let age = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    asOf.getUTCMonth() > birth.getUTCMonth() ||
    (asOf.getUTCMonth() === birth.getUTCMonth() && asOf.getUTCDate() >= birth.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  if (age < 18) return "Sub-Junior";
  if (age <= 22) return "Junior";
  if (age <= 39) return "Open";
  if (age <= 49) return "Master1";
  if (age <= 59) return "Master2";
  if (age <= 69) return "Master3";
  return "Master4";
}

// lift_benchmarks.weight_class values span multiple federations (e.g. "83",
// "83+", "82.5", a stray bare "+"). "X+" means "X or heavier"; the bare "+"
// is bad data and is filtered out by returning null.
export function parseWeightClass(raw: string): number | null {
  const trimmed = raw.trim();
  const numericPart = trimmed.endsWith("+") ? trimmed.slice(0, -1) : trimmed;
  if (numericPart === "") return null;
  const value = parseFloat(numericPart);
  return Number.isFinite(value) ? value : null;
}

export interface LiftBenchmarkRow {
  weight_class: string;
  squat_p10: number | null;
  squat_p25: number | null;
  squat_p50: number | null;
  squat_p75: number | null;
  squat_p90: number | null;
  squat_p95: number | null;
  squat_p99: number | null;
  bench_p10: number | null;
  bench_p25: number | null;
  bench_p50: number | null;
  bench_p75: number | null;
  bench_p90: number | null;
  bench_p95: number | null;
  bench_p99: number | null;
  deadlift_p10: number | null;
  deadlift_p25: number | null;
  deadlift_p50: number | null;
  deadlift_p75: number | null;
  deadlift_p90: number | null;
  deadlift_p95: number | null;
  deadlift_p99: number | null;
}

// Nearest-numeric-match on the parsed weight_class value. When two rows tie
// (e.g. "83" and "83+" both parse to 83), prefer whichever side the bodyweight
// actually falls on: the "+" (heavier) row if bodyweight exceeds the boundary,
// otherwise the non-"+" row.
export function pickNearestBenchmarkRow<T extends LiftBenchmarkRow>(
  rows: T[],
  bodyweightKg: number,
): T | null {
  let best: T | null = null;
  let bestDist = Infinity;

  for (const row of rows) {
    const parsed = parseWeightClass(row.weight_class);
    if (parsed === null) continue;
    const dist = Math.abs(parsed - bodyweightKg);

    if (dist < bestDist) {
      best = row;
      bestDist = dist;
      continue;
    }

    if (dist === bestDist && best) {
      const wantsPlus = bodyweightKg > parsed;
      const rowIsPlus = row.weight_class.trim().endsWith("+");
      const bestIsPlus = best.weight_class.trim().endsWith("+");
      if (rowIsPlus === wantsPlus && bestIsPlus !== wantsPlus) {
        best = row;
      }
    }
  }

  return best;
}

const LIFT_COLUMN_PREFIX = {
  Squat: "squat",
  "Bench Press": "bench",
  Deadlift: "deadlift",
} as const;

export type SBDLift = keyof typeof LIFT_COLUMN_PREFIX;

// p25 = Novice floor, p50 = Intermediate floor, p75 = Advanced floor, p90 =
// Elite floor. Chosen to mirror the existing Untrained->Elite tier shape
// (below p25 = Untrained) rather than the literal 4-bucket/no-Untrained
// reading, per the confirmed answer. p90 (not p95/p99) was picked for the
// Elite floor to land near "top ~10%", consistent with how Elite is framed
// for Overhead Press elsewhere in this file's sibling table — flag if you
// want Elite pinned to p95 or p99 instead.
export function getSBDThresholdsKg(
  row: LiftBenchmarkRow,
  lift: SBDLift,
): RatioThresholds | null {
  const prefix = LIFT_COLUMN_PREFIX[lift];
  const record = row as unknown as Record<string, number | null>;
  const Novice = record[`${prefix}_p25`];
  const Intermediate = record[`${prefix}_p50`];
  const Advanced = record[`${prefix}_p75`];
  const Elite = record[`${prefix}_p90`];
  if (Novice == null || Intermediate == null || Advanced == null || Elite == null) {
    return null;
  }
  return { Novice, Intermediate, Advanced, Elite };
}

const PERCENTILE_POINTS = [10, 25, 50, 75, 90, 95, 99] as const;

// Estimates where a lifted weight falls among the matched row's percentile
// columns via linear interpolation between the two nearest points. Purely
// additive/display logic — does not feed tier calculation, which stays on
// getSBDThresholdsKg's p25/p50/p75/p90 floors untouched.
//
// Returns "<N" below the lowest available point (N is normally 10), "N+"
// above the highest (normally 99), a rounded integer string for an
// interpolated value in between, or null if the row has no percentile data
// for this lift at all.
export function estimatePercentile(
  row: LiftBenchmarkRow,
  lift: SBDLift,
  liftedWeightKg: number,
): string | null {
  const prefix = LIFT_COLUMN_PREFIX[lift];
  const record = row as unknown as Record<string, number | null>;

  const points = PERCENTILE_POINTS.map((p) => ({ p, value: record[`${prefix}_p${p}`] })).filter(
    (pt): pt is { p: (typeof PERCENTILE_POINTS)[number]; value: number } => pt.value != null,
  );

  if (points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];

  if (liftedWeightKg <= first.value) {
    return first.p === 10 ? "<10" : `<${first.p}`;
  }
  if (liftedWeightKg >= last.value) {
    return last.p === 99 ? "99+" : `${last.p}+`;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i];
    const hi = points[i + 1];
    if (liftedWeightKg < lo.value || liftedWeightKg > hi.value) continue;
    if (hi.value === lo.value) return String(lo.p);
    const fraction = (liftedWeightKg - lo.value) / (hi.value - lo.value);
    return String(Math.round(lo.p + fraction * (hi.p - lo.p)));
  }

  return null;
}

const LB_PER_KG = 2.20462;

export function toKg(value: number, unit: "lb" | "kg"): number {
  return unit === "kg" ? value : value / LB_PER_KG;
}

export function fromKg(valueKg: number, unit: "lb" | "kg"): number {
  return unit === "kg" ? valueKg : valueKg * LB_PER_KG;
}

export function genderToSex(gender: "male" | "female"): "M" | "F" {
  return gender === "male" ? "M" : "F";
}
