import { calculatePlates, roundToLoadableIncrement, type PlateResult, type Unit } from "./plates";

export interface WarmupStep {
  label: string;
  reps: string;
  weight: number;
  plates: PlateResult;
}

interface WarmupStepDef {
  label: string;
  reps: string;
  // null = bar only. 100 = the work set itself (uses the raw working
  // weight, unrounded). Everything else is rounded to the nearest
  // loadable increment, since it's a derived number rather than direct
  // user input.
  percent: number | null;
}

// The widely-used generic percentage ramp for building up to a work
// weight — essentially what most lifting-log apps (Strong, Boostcamp,
// Juggernaut AI) generate by default for warm-ups, and standard
// strength-coaching convention. Unlike the RPE chart's RTS system, this
// isn't attributable to one single named source — it's a de facto
// convention, not a citable published chart.
const WARMUP_STEPS: WarmupStepDef[] = [
  { label: "Bar only", reps: "8-10", percent: null },
  { label: "40%", reps: "5", percent: 40 },
  { label: "60%", reps: "3", percent: 60 },
  { label: "80%", reps: "2", percent: 80 },
  { label: "90%", reps: "1", percent: 90 },
  { label: "Work set (100%)", reps: "—", percent: 100 },
];

// Reuses calculatePlates()/roundToLoadableIncrement() (plates.ts) for
// every step rather than re-implementing any plate math — this function
// only decides each step's target weight, not how to load it.
export function generateWarmupSets(
  workingWeight: number,
  unit: Unit,
  barWeight: number,
): WarmupStep[] {
  return WARMUP_STEPS.map(({ label, reps, percent }) => {
    let weight: number;
    if (percent === null) {
      weight = barWeight;
    } else if (percent === 100) {
      // The user's own typed target, left exactly as entered — matches
      // the plate calculator, which never rounds the user's own input,
      // only shows a remainder if it isn't exactly loadable.
      weight = workingWeight;
    } else {
      weight = roundToLoadableIncrement((workingWeight * percent) / 100, unit);
    }

    return { label, reps, weight, plates: calculatePlates(weight, unit, barWeight) };
  });
}
