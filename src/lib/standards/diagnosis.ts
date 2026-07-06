import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import { getStandardsTable, type Tier } from "./tables";
import { getTier, tierIndex } from "./tier";

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

export interface Diagnosis {
  standings: LiftStanding[];
  weakestLifts: MainLift[];
  laggingRatios: LaggingRatio[];
}

export function diagnose(
  bests: Bests,
  gender: "male" | "female" | null,
  bodyweight: number | null,
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

  return { standings, weakestLifts, laggingRatios };
}
