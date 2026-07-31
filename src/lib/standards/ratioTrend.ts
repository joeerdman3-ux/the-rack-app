import type { MainLift } from "@/lib/lifting/constants";
import type { LaggingRatio } from "./diagnosis";

export interface PersonalRecordRow {
  lift: string;
  e1rm: number;
  // Added in 0030 — null for any PR predating that column (no
  // retroactive backfill). A null unit is treated as "unknown, use
  // best-effort" rather than a hard block; only a known conflict (both
  // sides set and disagreeing) is treated as unusable.
  unit: "lb" | "kg" | null;
  achieved_at: string;
}

export type RatioTrendDirection = "improving" | "worsening" | "stable";

export interface RatioTrendResult {
  lift: MainLift;
  referenceLift: MainLift;
  // null when there's no PR for either lift at-or-before the reference
  // cutoff to compare against — insufficient data, not a real "stable".
  direction: RatioTrendDirection | null;
  currentRatio: number;
  priorRatio: number | null;
  // Whichever side's CURRENT best PR is older than REFERENCE_WINDOW_DAYS
  // (the staler of the two, if both qualify) — flags that the number
  // currently feeding this ratio hasn't been reconfirmed recently, not
  // that the lift itself hasn't been trained.
  staleLift: MainLift | null;
  staleDays: number | null;
}

// Shared for both the "prior" comparison point and the staleness cutoff —
// one constant, one meaning: how old is too old for a best value to still
// be considered fresh. PR events are sparse and irregular (unlike
// diagnosis_snapshots, which fires on every tagged miss), so a
// trend.ts-style 28-day window would come up empty for most users most of
// the time; 90 days gives most actively-tracked lifts a real "before" PR
// to compare against.
const REFERENCE_WINDOW_DAYS = 90;

// Expressed as a fraction of each benchmark's OWN expected ratio, not a
// flat number — a flat absolute band (e.g. ±0.03) is inconsistently sized
// across benchmarks with different expected magnitudes (±0.03 is ~2.5% of
// deadliftToSquat's 1.2 but ~5% of ohpToBench's 0.6), which is an
// unintended side effect of the shared magnitudes differing, not a
// deliberate design choice.
const RELATIVE_STABLE_THRESHOLD = 0.03;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Piecewise-constant reconstruction: a lift's "best" only changes on a PR,
// so its value at any past date is whatever the most recent PR at-or-
// before that date says it was. Returns null if there's no PR for this
// lift at or before the cutoff at all.
function mostRecentPrAsOf(
  records: PersonalRecordRow[],
  lift: string,
  cutoff: Date,
): PersonalRecordRow | null {
  let best: PersonalRecordRow | null = null;
  for (const record of records) {
    if (record.lift !== lift) continue;
    const achievedAt = new Date(record.achieved_at);
    if (achievedAt > cutoff) continue;
    if (!best || achievedAt > new Date(best.achieved_at)) best = record;
  }
  return best;
}

// Only meaningful for pairs already surfaced as lagging (the caller's
// contract — pass diagnosis.laggingRatios, not every RATIO_BENCHMARKS
// entry unconditionally): a lagging lift sits below `expected`, so a
// rising ratio unambiguously means it's closing the gap ("improving") and
// a falling ratio means it's falling further behind ("worsening"). That
// direction reading would flip for a lift that's already at or above
// expected, which is why this isn't applied to non-lagging pairs.
export function computeRatioTrends(
  laggingRatios: Pick<LaggingRatio, "lift" | "referenceLift" | "actual" | "expected">[],
  personalRecords: PersonalRecordRow[],
  now: Date = new Date(),
): RatioTrendResult[] {
  const cutoff = new Date(now.getTime() - REFERENCE_WINDOW_DAYS * MS_PER_DAY);

  return laggingRatios.map((ratio) => {
    const numeratorCurrent = mostRecentPrAsOf(personalRecords, ratio.lift, now);
    const denominatorCurrent = mostRecentPrAsOf(personalRecords, ratio.referenceLift, now);

    let staleLift: MainLift | null = null;
    let staleDays: number | null = null;
    for (const [lift, record] of [
      [ratio.lift, numeratorCurrent],
      [ratio.referenceLift, denominatorCurrent],
    ] as const) {
      if (!record) continue;
      const days = Math.floor((now.getTime() - new Date(record.achieved_at).getTime()) / MS_PER_DAY);
      if (days > REFERENCE_WINDOW_DAYS && (staleDays === null || days > staleDays)) {
        staleLift = lift;
        staleDays = days;
      }
    }

    const numeratorPrior = mostRecentPrAsOf(personalRecords, ratio.lift, cutoff);
    const denominatorPrior = mostRecentPrAsOf(personalRecords, ratio.referenceLift, cutoff);

    let priorRatio: number | null = null;
    if (numeratorPrior && denominatorPrior) {
      const unitsConflict =
        numeratorPrior.unit != null &&
        denominatorPrior.unit != null &&
        numeratorPrior.unit !== denominatorPrior.unit;
      if (!unitsConflict) {
        priorRatio = numeratorPrior.e1rm / denominatorPrior.e1rm;
      }
    }

    let direction: RatioTrendDirection | null = null;
    if (priorRatio !== null) {
      const threshold = RELATIVE_STABLE_THRESHOLD * ratio.expected;
      const delta = ratio.actual - priorRatio;
      direction = delta > threshold ? "improving" : delta < -threshold ? "worsening" : "stable";
    }

    return {
      lift: ratio.lift,
      referenceLift: ratio.referenceLift,
      direction,
      currentRatio: ratio.actual,
      priorRatio,
      staleLift,
      staleDays,
    };
  });
}
