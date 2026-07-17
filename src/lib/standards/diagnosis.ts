import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import { getOverheadPressThresholds, type RatioThresholds, type Tier } from "./tables";
import { getTier, tierIndex } from "./tier";
import { toKg, type SBDLift } from "./benchmarks";
import {
  STICKING_POINT_LABELS,
  type ExercisePrescription,
  type StickingPoint,
} from "./stickingPoints";

export type Bests = Partial<Record<MainLift, number>>;

export interface LiftStanding {
  lift: MainLift;
  best: number | null;
  ratio: number | null;
  tier: Tier | null;
}

interface RatioBenchmark {
  key: string;
  label: string;
  numerator: MainLift;
  denominator: MainLift;
  expected: number;
}

const RATIO_BENCHMARKS: RatioBenchmark[] = [
  { key: "benchToSquat", label: "Bench relative to squat", numerator: "Bench Press", denominator: "Squat", expected: 0.75 },
  { key: "deadliftToSquat", label: "Deadlift relative to squat", numerator: "Deadlift", denominator: "Squat", expected: 1.2 },
  { key: "ohpToBench", label: "Overhead press relative to bench", numerator: "Overhead Press", denominator: "Bench Press", expected: 0.6 },
];

// A ratio more than 15% below the typical raw-lifting benchmark counts as lagging.
const LAG_TOLERANCE = 0.85;

export interface LaggingRatio {
  label: string;
  actual: number;
  expected: number;
}

export interface MissedSet {
  lift: string;
  sticking_point: string | null;
}

// Below this many missed-and-tagged sets for a lift, the most-common
// sticking point is too noisy to act on — a single bad rep shouldn't drive
// a full accessory-work recommendation.
export const MIN_MISSED_SETS_FOR_DIAGNOSIS = 3;

export interface StickingPointDiagnosis {
  status: "ready";
  lift: MainLift;
  stickingPoint: StickingPoint;
  label: string;
  prescriptions: ExercisePrescription[];
}

export interface PendingStickingPointDiagnosis {
  status: "pending";
  lift: MainLift;
  currentCount: number;
  remainingCount: number;
  threshold: number;
}

export type StickingPointDiagnosisResult = StickingPointDiagnosis | PendingStickingPointDiagnosis;

export interface Diagnosis {
  standings: LiftStanding[];
  weakestLifts: MainLift[];
  laggingRatios: LaggingRatio[];
  stickingPointDiagnoses: StickingPointDiagnosisResult[];
}

export function diagnose(
  bests: Bests,
  gender: "male" | "female" | null,
  bodyweight: number | null,
  missedSets: MissedSet[] = [],
  unit: "lb" | "kg" = "lb",
  sbdThresholdsKg: Partial<Record<SBDLift, RatioThresholds>> = {},
): Diagnosis {
  const standings: LiftStanding[] = MAIN_LIFTS.map((lift) => {
    const best = bests[lift] ?? null;
    if (best === null || !gender || !bodyweight) {
      return { lift, best, ratio: null, tier: null };
    }
    const ratio = best / bodyweight;

    if (lift === "Overhead Press") {
      const tier = getTier(ratio, getOverheadPressThresholds(gender));
      return { lift, best, ratio, tier };
    }

    const thresholds = sbdThresholdsKg[lift as SBDLift];
    if (!thresholds) {
      return { lift, best, ratio, tier: null };
    }
    const tier = getTier(toKg(best, unit), thresholds);
    return { lift, best, ratio, tier };
  });

  const ranked = standings.filter((s): s is LiftStanding & { tier: Tier } => s.tier !== null);
  let weakestLifts: MainLift[] = [];
  if (ranked.length > 0) {
    const lowestIndex = Math.min(...ranked.map((s) => tierIndex(s.tier)));
    weakestLifts = ranked.filter((s) => tierIndex(s.tier) === lowestIndex).map((s) => s.lift);
  }

  const laggingRatios: LaggingRatio[] = [];
  for (const benchmark of RATIO_BENCHMARKS) {
    const numeratorBest = bests[benchmark.numerator];
    const denominatorBest = bests[benchmark.denominator];
    if (!numeratorBest || !denominatorBest) continue;

    const actual = numeratorBest / denominatorBest;
    if (actual < benchmark.expected * LAG_TOLERANCE) {
      laggingRatios.push({ label: benchmark.label, actual, expected: benchmark.expected });
    }
  }

  // For every lift tied for lowest tier, find its most commonly reported
  // sticking point (from missed sets where one was logged). Below
  // MIN_MISSED_SETS_FOR_DIAGNOSIS total tagged misses for that lift, a
  // "pending" entry is returned instead of a prescription — a single bad
  // rep shouldn't drive a full recommendation, but the UI still needs to
  // tell the user how many more they need rather than showing nothing.
  // Iterating all of weakestLifts (not just weakestLifts[0]) ensures a tie
  // doesn't silently drop lifts ordered later in MAIN_LIFTS (e.g. Overhead
  // Press) from ever getting a diagnosis when they tie with an earlier lift.
  //
  // prescriptions is intentionally left empty here: this function stays
  // synchronous/DB-free, so the caller (dashboard/page.tsx) is responsible
  // for querying sticking_point_prescriptions + exercises for each "ready"
  // stickingPoint and filling the arrays in before rendering.
  const stickingPointDiagnoses: StickingPointDiagnosisResult[] = [];
  for (const lift of weakestLifts) {
    const counts = new Map<string, number>();
    let taggedMisses = 0;
    for (const set of missedSets) {
      if (set.lift !== lift || !set.sticking_point) continue;
      taggedMisses++;
      counts.set(set.sticking_point, (counts.get(set.sticking_point) ?? 0) + 1);
    }

    if (taggedMisses < MIN_MISSED_SETS_FOR_DIAGNOSIS) {
      stickingPointDiagnoses.push({
        status: "pending",
        lift,
        currentCount: taggedMisses,
        remainingCount: MIN_MISSED_SETS_FOR_DIAGNOSIS - taggedMisses,
        threshold: MIN_MISSED_SETS_FOR_DIAGNOSIS,
      });
      continue;
    }

    let topPoint: string | null = null;
    let topCount = 0;
    for (const [point, count] of counts) {
      if (count > topCount) {
        topPoint = point;
        topCount = count;
      }
    }
    if (topPoint) {
      const stickingPoint = topPoint as StickingPoint;
      stickingPointDiagnoses.push({
        status: "ready",
        lift,
        stickingPoint,
        label: STICKING_POINT_LABELS[stickingPoint],
        prescriptions: [],
      });
    }
  }

  return { standings, weakestLifts, laggingRatios, stickingPointDiagnoses };
}
