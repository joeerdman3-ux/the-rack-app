import type { MainLift } from "@/lib/lifting/constants";

export type StickingPoint =
  | "bench_off_chest" | "bench_midrange" | "bench_lockout"
  | "squat_hole" | "squat_parallel" | "squat_above_parallel"
  | "deadlift_floor" | "deadlift_below_knee" | "deadlift_knee" | "deadlift_lockout"
  | "ohp_bottom" | "ohp_midrange" | "ohp_lockout";

export interface ExercisePrescription {
  exercise: string;
  rationale: string;
  setsReps: string;
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
}

export interface ExerciseRow {
  id: string;
  name: string;
}

// Pure join: matches prescription rows to their exercise name in JS rather
// than relying on a typed PostgREST embed (avoids the fragile FK-embed
// typing that's bitten this hand-written Database type before). Rows are
// assumed pre-sorted by sort_order by the caller's query.
export function mapPrescriptionRows(
  prescriptionRows: PrescriptionRow[],
  exerciseRows: ExerciseRow[],
): ExercisePrescription[] {
  const nameById = new Map(exerciseRows.map((e) => [e.id, e.name]));
  return prescriptionRows.map((row) => ({
    exercise: nameById.get(row.exercise_id) ?? "Unknown exercise",
    rationale: row.rationale,
    setsReps: row.sets_reps,
  }));
}
