import { MUSCLE_GROUPS, type MuscleGroup, type ExerciseMuscleGroup } from "@/lib/lifting/muscleGroups";

export interface WorkoutSetRow {
  lift: string;
}

export interface AccessorySetRow {
  exercise_id: string;
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  sets: number;
}

// Weighted set count per muscle group over whatever window the caller
// already filtered workoutSets/accessorySets to (this function does no
// date filtering itself — see /volume/page.tsx for the trailing-7-days
// query). Every set contributes its ratio (not a flat 1) to each of its
// exercise's muscle groups, so a single Deadlift set can add e.g. 0.4 to
// back, 0.35 to hamstrings, 0.25 to glutes rather than counting once
// against a single group.
//
// Includes missed sets — matches weeklyTonnage's existing "hit + missed"
// convention in aggregate.ts; a missed rep is still real training volume.
//
// exerciseIdByLiftName bridges workouts.lift (free text, no FK) to
// exercises.id via an exact exercises.name match — confirmed as the safe
// join (primary_lift is shared by many variation exercises and would
// misattribute volume). An exercise with no exercise_muscle_groups rows
// yet (including the pending-backfill unclassified ones) silently
// contributes nothing — under-counts rather than errors.
export function computeMuscleGroupVolume(
  workoutSets: WorkoutSetRow[],
  accessorySets: AccessorySetRow[],
  exerciseIdByLiftName: Map<string, string>,
  muscleGroupsByExerciseId: Map<string, ExerciseMuscleGroup[]>,
): MuscleGroupVolume[] {
  const totals = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((mg) => [mg, 0]));

  function addSet(exerciseId: string | undefined) {
    if (!exerciseId) return;
    const groups = muscleGroupsByExerciseId.get(exerciseId);
    if (!groups) return;
    for (const { muscle_group, ratio } of groups) {
      totals.set(muscle_group, (totals.get(muscle_group) ?? 0) + ratio);
    }
  }

  for (const set of workoutSets) {
    addSet(exerciseIdByLiftName.get(set.lift));
  }
  for (const set of accessorySets) {
    addSet(set.exercise_id);
  }

  return MUSCLE_GROUPS.map((muscleGroup) => ({ muscleGroup, sets: totals.get(muscleGroup)! })).sort(
    (a, b) => b.sets - a.sets,
  );
}

export interface MuscleGroupTier {
  muscleGroup: MuscleGroup;
  // 0 means "no volume this window" — the caller should omit it from
  // whatever it's rendering rather than treat it as tier 1.
  tier: number;
}

// Matches react-body-highlighter's <Model> frequency prop: an integer
// index into a fixed-length color array, so this can't be a continuous
// 0-1 value — it has to land on a whole number 1-6.
export const BODY_MAP_TIERS = 6;

// Buckets each group's continuous weighted-sum volume into a 1-6 tier,
// relative to the SAME maxSets denominator MuscleGroupHeatmap.tsx already
// uses for its bar-width percentage (Math.max across all groups in the
// window) — not a per-group historical max, so the two visualizations of
// the same data stay proportionally consistent with each other.
export function bucketMuscleGroupVolume(volumes: MuscleGroupVolume[]): MuscleGroupTier[] {
  const maxSets = Math.max(...volumes.map((v) => v.sets), 0);
  return volumes.map(({ muscleGroup, sets }) => {
    if (maxSets === 0 || sets === 0) return { muscleGroup, tier: 0 };
    const pct = sets / maxSets;
    const tier = Math.min(BODY_MAP_TIERS, Math.max(1, Math.ceil(pct * BODY_MAP_TIERS)));
    return { muscleGroup, tier };
  });
}
