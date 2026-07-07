import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import { getStandardsTable, type Tier } from "./tables";
import { getTier, tierIndex } from "./tier";
import {
  PRESCRIPTIONS,
  STICKING_POINT_LABELS,
  type ExercisePrescription,
  type StickingPoint,
} from "./prescriptions";

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

export interface StickingPointDiagnosis {
  lift: MainLift;
  stickingPoint: StickingPoint;
  label: string;
  prescriptions: ExercisePrescription[];
}

export interface Diagnosis {
  standings: LiftStanding[];
  weakestLifts: MainLift[];
  laggingRatios: LaggingRatio[];
  stickingPointDiagnosis: StickingPointDiagnosis | null;
}

export function diagnose(
  bests: Bests,
  gender: "male" | "female" | null,
  bodyweight: number | null,
  missedSets: MissedSet[] = [],
): Diagnosis {
  const standings: LiftStanding[] = MAIN_LIFTS.map((lift) => {
    const best = bests[lift] ?? null;
    if (best === null || !gender || !bodyweight) {
      return { lift, best, ratio: null, tier: null };
    }
    const ratio = best / bodyweight;
    const tier = getTier(ratio, getStandardsTable(gender)[lift]);
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

  // For the weakest lift, find its most commonly reported sticking point
  // (from missed sets where one was logged) and pull the matching
  // prescriptions. No fabricated default — if nothing was ever reported,
  // this stays null rather than guessing.
  let stickingPointDiagnosis: StickingPointDiagnosis | null = null;
  const focusLift = weakestLifts[0];
  if (focusLift) {
    const counts = new Map<string, number>();
    for (const set of missedSets) {
      if (set.lift !== focusLift || !set.sticking_point) continue;
      counts.set(set.sticking_point, (counts.get(set.sticking_point) ?? 0) + 1);
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
      stickingPointDiagnosis = {
        lift: focusLift,
        stickingPoint,
        label: STICKING_POINT_LABELS[stickingPoint],
        prescriptions: PRESCRIPTIONS[stickingPoint],
      };
    }
  }

  return { standings, weakestLifts, laggingRatios, stickingPointDiagnosis };
}
