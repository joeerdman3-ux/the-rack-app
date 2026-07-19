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
  // Why this ratio sits where it does biomechanically, and what a lag
  // usually (not definitely) implies — shown alongside every lagging-ratio
  // message so the number isn't presented without context.
  explanation: string;
}

const RATIO_BENCHMARKS: RatioBenchmark[] = [
  {
    key: "benchToSquat",
    label: "Bench relative to squat",
    numerator: "Bench Press",
    denominator: "Squat",
    expected: 0.75,
    explanation:
      "Bench typically runs about 0.75x squat — pressing recruits far less muscle mass than a hip-and-quad-dominant lift, so the ratio is naturally lower. A bench lagging well behind that usually points to a raw pressing-strength or triceps lockout gap, not a squat problem.",
  },
  {
    key: "deadliftToSquat",
    label: "Deadlift relative to squat",
    numerator: "Deadlift",
    denominator: "Squat",
    expected: 1.2,
    explanation:
      "Deadlift typically runs about 1.2x squat because the deadlift doesn't have the eccentric/stretch-reflex assistance a squat gets — a deadlift that's only matching your squat usually points to a posterior chain or pulling-strength gap, not a squat problem.",
  },
  {
    key: "ohpToBench",
    label: "Overhead press relative to bench",
    numerator: "Overhead Press",
    denominator: "Bench Press",
    expected: 0.6,
    explanation:
      "Overhead press typically runs about 0.6x bench because pressing overhead loses the chest's leverage and stability, putting more load on the shoulders and triceps alone. An OHP lagging well behind that usually points to a shoulder-pressing or overhead-stability gap, not a bench problem.",
  },
];

// A ratio more than 15% below the typical raw-lifting benchmark counts as lagging.
const LAG_TOLERANCE = 0.85;

export interface LaggingRatio {
  label: string;
  lift: MainLift;
  referenceLift: MainLift;
  actual: number;
  expected: number;
  explanation: string;
  // Set when `lift` also has a "ready" sticking-point diagnosis — lets the
  // UI fold the ratio-lag message and the sticking-point finding into one
  // statement instead of two disconnected cards. Reference to the actual
  // object in stickingPointDiagnoses (not a copy), so prescriptions filled
  // in later by the caller stay in sync. Only "ready" connects — "tied" and
  // "pending" stay standalone, since there's no single clear cause to point
  // to yet.
  connectedDiagnosis: StickingPointDiagnosis | null;
}

export interface MissedSet {
  lift: string;
  sticking_point: string | null;
  logged_date: string;
}

// Below this many missed-and-tagged sets for a lift, the most-common
// sticking point is too noisy to act on — a single bad rep shouldn't drive
// a full accessory-work recommendation. Always evaluated against the RAW,
// unweighted count — recency weighting (below) only ever affects which
// sticking point wins once a lift has cleared this gate, never whether it
// clears it, so a user can't regress from "ready" back to "pending" just
// because time passed.
export const MIN_MISSED_SETS_FOR_DIAGNOSIS = 3;

// Two-tier recency weighting for sticking-point winner selection: a miss
// counts fully for RECENCY_CUTOFF_MONTHS, then drops to a reduced (but
// never zero) weight — old data still counts, it just stops dominating a
// fresher trend. Two-tier rather than continuous decay specifically so
// ties stay exact and explainable (only two possible per-miss weights)
// instead of floating-point coincidences.
const RECENCY_CUTOFF_MONTHS = 6;
const RECENT_MISS_WEIGHT = 1.0;
const OLDER_MISS_WEIGHT = 0.5;

function isWithinRecencyCutoff(loggedDate: string, cutoff: Date): boolean {
  return new Date(loggedDate) >= cutoff;
}

export interface StickingPointDiagnosis {
  status: "ready";
  lift: MainLift;
  stickingPoint: StickingPoint;
  label: string;
  prescriptions: ExercisePrescription[];
  count: number;
  totalTaggedMisses: number;
}

// Two or more sticking points tied for most-frequent (by recency-weighted
// sum) — arbitrarily picking one would misrepresent the signal, so this
// carries all of them instead. counts is parallel to stickingPoints/labels
// rather than a single shared number: two points can tie on weighted sum
// while having different RAW counts (e.g. 2 recent misses at weight 1.0
// vs. 4 older ones at weight 0.5 both sum to 2.0), so each point's honest
// raw count has to be tracked individually.
export interface TiedStickingPointDiagnosis {
  status: "tied";
  lift: MainLift;
  stickingPoints: StickingPoint[];
  labels: string[];
  prescriptions: ExercisePrescription[];
  counts: number[];
  totalTaggedMisses: number;
}

export interface PendingStickingPointDiagnosis {
  status: "pending";
  lift: MainLift;
  currentCount: number;
  remainingCount: number;
  threshold: number;
}

export type StickingPointDiagnosisResult =
  | StickingPointDiagnosis
  | TiedStickingPointDiagnosis
  | PendingStickingPointDiagnosis;

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
      laggingRatios.push({
        label: benchmark.label,
        lift: benchmark.numerator,
        referenceLift: benchmark.denominator,
        actual,
        expected: benchmark.expected,
        explanation: benchmark.explanation,
        connectedDiagnosis: null,
      });
    }
  }

  // For EVERY main lift (not just the weakest-tier one(s)) with at least
  // one tagged miss, find its most commonly reported sticking point.
  // Below MIN_MISSED_SETS_FOR_DIAGNOSIS total tagged misses for a lift
  // that DOES have some, a "pending" entry is returned instead of a
  // prescription — a single bad rep shouldn't drive a full recommendation,
  // but the UI still needs to tell the user how many more they need rather
  // than showing nothing.
  //
  // Zero-tagged-miss lifts are handled asymmetrically: a weakest-tier lift
  // still gets a "pending 0/N" card — that's the nudge that gets a user to
  // start tagging misses on the lift that matters most, and losing it would
  // regress today's most valuable behavior. A non-weakest lift with zero
  // tagged misses is skipped entirely (no card) — there's no signal to act
  // on yet, and showing "0/3" for every lift the user isn't focused on
  // would just be clutter.
  //
  // "Weakest tier" no longer gates whether a lift gets ANALYZED once it has
  // misses — Bench Press misses are worth surfacing even when Bench isn't
  // your weakest lift right now. weakestLifts still drives prioritization:
  // entries are sorted so weakest-tier lifts come first (see the sort
  // below), and the UI can badge them distinctly.
  //
  // The winning sticking point (and ties) are picked by recency-weighted
  // sum, not raw count — see RECENCY_CUTOFF_MONTHS above. The count/
  // totalTaggedMisses on the returned diagnosis stay RAW (unweighted),
  // since those are the honest, easy-to-explain numbers shown in the UI
  // ("4 of 5 missed sets") — weighting is invisible except in which point
  // it selects.
  //
  // prescriptions is intentionally left empty here: this function stays
  // synchronous/DB-free, so the caller (dashboard/page.tsx) is responsible
  // for querying sticking_point_prescriptions + exercises for each "ready"/
  // "tied" stickingPoint and filling the arrays in before rendering.
  const recencyCutoff = new Date();
  recencyCutoff.setMonth(recencyCutoff.getMonth() - RECENCY_CUTOFF_MONTHS);

  const stickingPointDiagnoses: StickingPointDiagnosisResult[] = [];
  for (const lift of MAIN_LIFTS) {
    const weightedSums = new Map<string, number>();
    const rawCounts = new Map<string, number>();
    let taggedMisses = 0;
    for (const set of missedSets) {
      if (set.lift !== lift || !set.sticking_point) continue;
      taggedMisses++;
      const weight = isWithinRecencyCutoff(set.logged_date, recencyCutoff)
        ? RECENT_MISS_WEIGHT
        : OLDER_MISS_WEIGHT;
      weightedSums.set(set.sticking_point, (weightedSums.get(set.sticking_point) ?? 0) + weight);
      rawCounts.set(set.sticking_point, (rawCounts.get(set.sticking_point) ?? 0) + 1);
    }

    if (taggedMisses === 0 && !weakestLifts.includes(lift)) continue;

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

    // taggedMisses >= MIN_MISSED_SETS_FOR_DIAGNOSIS (> 0) guarantees
    // weightedSums is non-empty, so topPoints always has at least one
    // entry here. Only two possible per-miss weights (1.0 or 0.5) means
    // summed weights land on a small set of exact values, so this === is
    // a real tie, not a floating-point coincidence.
    let topWeight = 0;
    for (const weight of weightedSums.values()) {
      if (weight > topWeight) topWeight = weight;
    }
    const topPoints = [...weightedSums.entries()]
      .filter(([, weight]) => weight === topWeight)
      .map(([point]) => point as StickingPoint);

    if (topPoints.length > 1) {
      stickingPointDiagnoses.push({
        status: "tied",
        lift,
        stickingPoints: topPoints,
        labels: topPoints.map((sp) => STICKING_POINT_LABELS[sp]),
        prescriptions: [],
        counts: topPoints.map((sp) => rawCounts.get(sp)!),
        totalTaggedMisses: taggedMisses,
      });
    } else {
      const stickingPoint = topPoints[0];
      stickingPointDiagnoses.push({
        status: "ready",
        lift,
        stickingPoint,
        label: STICKING_POINT_LABELS[stickingPoint],
        prescriptions: [],
        count: rawCounts.get(stickingPoint)!,
        totalTaggedMisses: taggedMisses,
      });
    }
  }

  // weakestLifts entries come first (stable sort — ties keep MAIN_LIFTS
  // order) so the UI can lead with what to prioritize, even though every
  // lift with enough tagged misses now gets a diagnosis.
  stickingPointDiagnoses.sort((a, b) => {
    const aWeakest = weakestLifts.includes(a.lift) ? 0 : 1;
    const bWeakest = weakestLifts.includes(b.lift) ? 0 : 1;
    return aWeakest - bWeakest;
  });

  // Fold a lagging ratio and its lift's sticking-point diagnosis into one
  // statement wherever both exist, rather than showing two disconnected
  // cards. Only "ready" connects (one specific, nameable cause) — "tied"
  // and "pending" leave the ratio-lag message standalone, since there's
  // nothing single and concrete yet to point the ratio at.
  for (const ratio of laggingRatios) {
    const match = stickingPointDiagnoses.find(
      (d): d is StickingPointDiagnosis => d.status === "ready" && d.lift === ratio.lift,
    );
    if (match) ratio.connectedDiagnosis = match;
  }

  return { standings, weakestLifts, laggingRatios, stickingPointDiagnoses };
}
