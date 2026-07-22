import { calculatePlates, type PlateResult, type Unit } from "./plates";
import { toKg, fromKg } from "@/lib/standards/benchmarks";

export interface WarmupStep {
  label: string;
  reps: string;
  weight: number;
  plates: PlateResult;
  kind: "bar" | "percentage" | "workset";
}

interface WarmupStepDef {
  label: string;
  reps: string;
  // null = bar only. 100 = the work set itself (uses the raw working
  // weight, unrounded). Everything else is a percentage of the working
  // weight, coarse-rounded (see roundToCoarseWarmupIncrement below).
  percent: number | null;
}

// The widely-used generic percentage ramp for building up to a work
// weight — essentially what most lifting-log apps (Strong, Boostcamp,
// Juggernaut AI) generate by default for warm-ups, and standard
// strength-coaching convention. Unlike the RPE chart's RTS system, this
// isn't attributable to one single named source — it's a de facto
// convention, not a citable published chart.
//
// Three tiers by absolute working weight (not just percentage) — a
// serious single at 500lb+ needs more, smaller rungs near the top than a
// moderate 275lb work set does, since the absolute jump (not just the
// percentage jump) is what makes an under-warmed heavy attempt risky.
const LIGHT_STEPS: WarmupStepDef[] = [
  { label: "Bar only", reps: "8-10", percent: null },
  { label: "50%", reps: "5", percent: 50 },
  { label: "75%", reps: "3", percent: 75 },
  { label: "Work set (100%)", reps: "—", percent: 100 },
];

const MODERATE_STEPS: WarmupStepDef[] = [
  { label: "Bar only", reps: "8-10", percent: null },
  { label: "40%", reps: "5", percent: 40 },
  { label: "60%", reps: "3", percent: 60 },
  { label: "80%", reps: "2", percent: 80 },
  { label: "90%", reps: "1", percent: 90 },
  { label: "Work set (100%)", reps: "—", percent: 100 },
];

const HEAVY_STEPS: WarmupStepDef[] = [
  { label: "Bar only", reps: "8-10", percent: null },
  { label: "20%", reps: "8", percent: 20 },
  { label: "40%", reps: "5", percent: 40 },
  { label: "60%", reps: "3", percent: 60 },
  { label: "75%", reps: "2", percent: 75 },
  { label: "85%", reps: "1", percent: 85 },
  { label: "92%", reps: "1", percent: 92 },
  { label: "Work set (100%)", reps: "—", percent: 100 },
];

// Tier thresholds are in lb — the working weight is converted to its
// lb-equivalent purely for this comparison (regardless of which unit the
// user is actually working in), since "225lb" and "400lb" are the natural
// units these thresholds were reasoned in.
const LIGHT_THRESHOLD_LB = 225;
const HEAVY_THRESHOLD_LB = 400;

function selectStepScheme(workingWeight: number, unit: Unit): WarmupStepDef[] {
  const workingWeightLb = unit === "lb" ? workingWeight : fromKg(toKg(workingWeight, unit), "lb");
  if (workingWeightLb < LIGHT_THRESHOLD_LB) return LIGHT_STEPS;
  if (workingWeightLb > HEAVY_THRESHOLD_LB) return HEAVY_STEPS;
  return MODERATE_STEPS;
}

// Total (both-sides) increment warm-up steps round to — 10lb/5kg, i.e.
// 5lb/2.5kg PER SIDE, which is the plate set's second-smallest
// denomination. Deliberately not the plate calculator's own
// LOADABLE_INCREMENT (5lb/2.5kg total = 2.5lb/1.25kg per side): rounding
// a warm-up step to a multiple of that finer increment routinely still
// requires the smallest plate per side, purely because standard bars
// (45lb, an ODD multiple of 5) make (weight - barWeight)/2 land on a
// same X.5 value most of the time. This coarser increment, applied
// relative to the bar's own weight (see roundToCoarseWarmupIncrement),
// avoids that unless the working weight genuinely requires it — a
// warm-up set doesn't need the same precision as the work set itself.
const WARMUP_COARSE_INCREMENT: Record<Unit, number> = { lb: 10, kg: 5 };

// Rounds `weight` to the nearest value where (weight - barWeight) is an
// exact multiple of the coarse increment — not just the nearest multiple
// of the increment itself. Anchoring to the bar's own weight (rather than
// to zero) is what actually guarantees the smallest plate isn't needed,
// regardless of whether the bar is a "round" number (a 45lb bar's own
// remainder mod 10 is 5, not 0 — anchoring to 0 would still produce
// values requiring the smallest plate half the time).
function roundToCoarseWarmupIncrement(weight: number, unit: Unit, barWeight: number): number {
  const increment = WARMUP_COARSE_INCREMENT[unit];
  const offset = ((barWeight % increment) + increment) % increment;
  return Math.round((weight - offset) / increment) * increment + offset;
}

// Reuses calculatePlates() (plates.ts) for every step rather than
// re-implementing any plate math — this function only decides each
// step's target weight, not how to load it.
export function generateWarmupSets(
  workingWeight: number,
  unit: Unit,
  barWeight: number,
): WarmupStep[] {
  const scheme = selectStepScheme(workingWeight, unit);

  return scheme.map(({ label, reps, percent }) => {
    let weight: number;
    let kind: WarmupStep["kind"];
    if (percent === null) {
      weight = barWeight;
      kind = "bar";
    } else if (percent === 100) {
      // The user's own typed target, left exactly as entered — matches
      // the plate calculator, which never rounds the user's own input,
      // only shows a remainder if it isn't exactly loadable.
      weight = workingWeight;
      kind = "workset";
    } else {
      weight = roundToCoarseWarmupIncrement((workingWeight * percent) / 100, unit, barWeight);
      kind = "percentage";
    }

    return { label, reps, weight, kind, plates: calculatePlates(weight, unit, barWeight) };
  });
}
