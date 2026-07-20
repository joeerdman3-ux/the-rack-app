// Canonical list — keep in lockstep with the CHECK constraint in
// supabase/migrations/0022_exercise_muscle_groups.sql and the inline
// literal union in database.types.ts. Same manual-sync pattern already
// used for StickingPoint / the sticking_point_prescriptions CHECK.
export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes",
  "biceps",
  "triceps",
  "calves",
  "core",
  "forearms",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  biceps: "Biceps",
  triceps: "Triceps",
  calves: "Calves",
  core: "Core",
  forearms: "Forearms",
};

export interface ExerciseMuscleGroup {
  muscle_group: MuscleGroup;
  ratio: number;
}

// Compact, ratio-free label for the exercise-picker/library rows (e.g.
// "Back, Hamstrings") — ratios matter for future volume aggregation, not
// for a one-line list item, so they're intentionally left out here.
export function formatMuscleGroups(muscleGroups: ExerciseMuscleGroup[]): string {
  return muscleGroups.map((mg) => MUSCLE_GROUP_LABELS[mg.muscle_group]).join(", ");
}
