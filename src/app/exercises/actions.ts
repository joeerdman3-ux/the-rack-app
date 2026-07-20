"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_GROUPS, type ExerciseMuscleGroup, type MuscleGroup } from "@/lib/lifting/muscleGroups";

// Only mutation the Exercise Library currently needs — creating an
// exercise still goes through accessoryActions.ts's createExercise (born
// from the Log Sets flow, still the only creation entry point). Needs the
// exercises/exercise_muscle_groups update (and exercise_muscle_groups
// delete) RLS policies from 0023, tightened to owner-only in 0024. RLS
// doesn't error on a blocked update — it just matches/affects zero rows —
// so the exercises update below checks its result explicitly rather than
// only checking for a Postgres error, otherwise editing an exercise you
// don't own would silently no-op and still report success.
export async function updateExercise(formData: FormData): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const id = (formData.get("id") as string) || "";
  if (!id) return { success: false };

  const nameRaw = (formData.get("name") as string) || "";
  const name = nameRaw.trim();
  if (!name) return { success: false };

  const muscleGroupValues = formData.getAll("muscle_group") as string[];
  const ratioValues = formData.getAll("ratio") as string[];
  if (muscleGroupValues.length === 0 || muscleGroupValues.length !== ratioValues.length) {
    return { success: false };
  }

  const isMuscleGroup = (value: string): value is MuscleGroup =>
    (MUSCLE_GROUPS as readonly string[]).includes(value);

  const muscleGroups: ExerciseMuscleGroup[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < muscleGroupValues.length; i++) {
    const muscleGroup = muscleGroupValues[i];
    const ratio = parseFloat(ratioValues[i]);
    if (!isMuscleGroup(muscleGroup) || seen.has(muscleGroup)) return { success: false };
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 1) return { success: false };
    seen.add(muscleGroup);
    muscleGroups.push({ muscle_group: muscleGroup, ratio });
  }

  const { data: updatedRows, error: nameError } = await supabase
    .from("exercises")
    .update({ name })
    .eq("id", id)
    .select("id");
  if (nameError) {
    console.error("[updateExercise] exercises update failed:", nameError);
    return { success: false };
  }
  if (!updatedRows || updatedRows.length === 0) {
    // RLS silently matched zero rows rather than erroring — most likely
    // this exercise isn't owned by the current user (a preset, or someone
    // else's). Report failure instead of a false "success".
    console.error("[updateExercise] no rows updated — exercise not owned by this user:", id);
    return { success: false };
  }

  // Full replace rather than diffing rows: simplest correct approach for
  // the small (1-3) row count per exercise, and matches createExercise's
  // one-shot insert shape.
  const { error: deleteError } = await supabase
    .from("exercise_muscle_groups")
    .delete()
    .eq("exercise_id", id);
  if (deleteError) {
    console.error("[updateExercise] exercise_muscle_groups delete failed:", deleteError);
    return { success: false };
  }

  const { error: insertError } = await supabase.from("exercise_muscle_groups").insert(
    muscleGroups.map((mg) => ({
      exercise_id: id,
      muscle_group: mg.muscle_group,
      ratio: mg.ratio,
    })),
  );
  if (insertError) {
    console.error("[updateExercise] exercise_muscle_groups insert failed:", insertError);
    return { success: false };
  }

  revalidatePath("/exercises");
  revalidatePath("/dashboard");
  revalidatePath("/programs");
  return { success: true };
}
