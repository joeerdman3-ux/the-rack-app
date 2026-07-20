import type { MainLift } from "@/lib/lifting/constants";

export type StickingPoint =
  | "bench_off_chest" | "bench_midrange" | "bench_lockout"
  | "squat_hole" | "squat_parallel" | "squat_above_parallel"
  | "deadlift_floor" | "deadlift_below_knee" | "deadlift_knee" | "deadlift_lockout"
  | "ohp_bottom" | "ohp_midrange" | "ohp_lockout";

export type PrescriptionCategory = "compound" | "isolation";

export interface ExercisePrescription {
  exercise: string;
  rationale: string;
  setsReps: string;
  category: PrescriptionCategory;
  // % of the user's e1RM for the related main lift; null when this
  // prescription isn't naturally percent-based (e.g. banded work).
  targetPercent: number | null;
  // Computed from targetPercent * e1RM, already in the caller's display
  // unit — null when targetPercent is null OR the user has no e1RM yet
  // for the related lift (e.g. only missed sets logged, no hits).
  weight: number | null;
}

export const STICKING_POINT_LABELS: Record<StickingPoint, string> = {
  bench_off_chest: "Off the chest",
  bench_midrange: "Midrange",
  bench_lockout: "Lockout",
  squat_hole: "The hole (bottom)",
  squat_parallel: "Parallel",
  squat_above_parallel: "Above parallel",
  deadlift_floor: "Off the floor",
  deadlift_below_knee: "Below the knee",
  deadlift_knee: "At the knee",
  deadlift_lockout: "Lockout",
  ohp_bottom: "Bottom",
  ohp_midrange: "Midrange",
  ohp_lockout: "Lockout",
};

export const STICKING_POINTS_BY_LIFT: Record<MainLift, StickingPoint[]> = {
  Squat: ["squat_hole", "squat_parallel", "squat_above_parallel"],
  "Bench Press": ["bench_off_chest", "bench_midrange", "bench_lockout"],
  Deadlift: ["deadlift_floor", "deadlift_below_knee", "deadlift_knee", "deadlift_lockout"],
  "Overhead Press": ["ohp_bottom", "ohp_midrange", "ohp_lockout"],
};

// Row shapes matching the sticking_point_prescriptions / exercises tables,
// selected minimally (only the columns the merge actually needs).
export interface PrescriptionRow {
  exercise_id: string;
  rationale: string;
  sets_reps: string;
  sort_order: number;
  category: PrescriptionCategory;
  target_percent: number | null;
}

export interface ExerciseRow {
  id: string;
  name: string;
}

// Pure join: matches prescription rows to their exercise name in JS rather
// than relying on a typed PostgREST embed (avoids the fragile FK-embed
// typing that's bitten this hand-written Database type before). Rows are
// assumed pre-sorted by sort_order by the caller's query.
//
// e1rm must already be in the caller's display unit, not kg — unlike
// program_training_maxes.training_max_kg, workouts.e1rm (and so bests[lift]
// in dashboard/page.tsx) is computed directly from whatever the user typed
// into the form, never normalized to kg. No fromKg/toKg conversion belongs
// here; applying one would double-convert.
export function mapPrescriptionRows(
  prescriptionRows: PrescriptionRow[],
  exerciseRows: ExerciseRow[],
  e1rm: number | null,
): ExercisePrescription[] {
  const nameById = new Map(exerciseRows.map((e) => [e.id, e.name]));
  return prescriptionRows.map((row) => ({
    exercise: nameById.get(row.exercise_id) ?? "Unknown exercise",
    rationale: row.rationale,
    setsReps: row.sets_reps,
    category: row.category,
    targetPercent: row.target_percent,
    weight:
      row.target_percent != null && e1rm != null
        ? Math.round(e1rm * (row.target_percent / 100) * 10) / 10
        : null,
  }));
}

// Compact "@ ..." suffix for a prescription's setsReps line — omitted
// entirely when targetPercent is null (not a percent-based prescription).
// Explicitly labeled "of e1RM" since Program Builder has a separate,
// unrelated "% of TM" concept elsewhere in the app.
export function formatPrescriptionDetail(
  p: Pick<ExercisePrescription, "targetPercent" | "weight">,
  unit: "lb" | "kg",
): string | null {
  if (p.targetPercent == null) return null;
  if (p.weight != null) return `${p.weight}${unit} (${p.targetPercent}% of e1RM)`;
  return `${p.targetPercent}% of e1RM`;
}
