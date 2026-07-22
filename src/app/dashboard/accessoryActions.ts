"use server";

// Deliberately kept separate from ./actions.ts (logSet/deleteSet, which
// power the main-lift flow that feeds standards/diagnosis/leaderboards) so
// this new accessory-logging path can never risk touching that code.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExercisePickerOption } from "@/components/ExerciseSearchPicker";
import { MUSCLE_GROUPS, type ExerciseMuscleGroup, type MuscleGroup } from "@/lib/lifting/muscleGroups";

// "sets" is a UI convenience for logging several identical sets in one
// submission (defaults to 1, matching every prior caller that never sent
// it) — it inserts `sets` separate rows in one batch, so every row still
// represents exactly one set, same as before. No new column/data shape.
export async function logAccessorySet(formData: FormData): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const exerciseId = formData.get("exercise_id") as string;
  const weight = parseFloat(formData.get("weight") as string);
  const reps = parseInt(formData.get("reps") as string, 10);
  const rpeRaw = formData.get("rpe") as string;
  const rpe = rpeRaw ? parseFloat(rpeRaw) : null;
  const notesRaw = (formData.get("notes") as string) || "";
  const notes = notesRaw.trim() || null;
  const setsRaw = formData.get("sets") as string;
  const sets = setsRaw ? parseInt(setsRaw, 10) : 1;

  if (
    !exerciseId ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    !Number.isInteger(sets) ||
    sets < 1
  ) {
    return { success: false };
  }

  const loggedDate = new Date().toISOString().slice(0, 10);

  const rows = Array.from({ length: sets }, () => ({
    user_id: user.id,
    exercise_id: exerciseId,
    weight,
    reps,
    rpe,
    notes,
    logged_date: loggedDate,
  }));

  const { error } = await supabase.from("accessory_logs").insert(rows);
  if (error) {
    console.error("[logAccessorySet] insert failed:", error);
    return { success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

// Inline "+ Add new exercise" from the Log Sets flow — a lightweight
// custom-exercise entry (name + one-or-more muscle_group/ratio pairs,
// primary_lift hardcoded to 'general' so it never gets treated as a
// competition lift). At least one muscle group is required so this path
// can't keep silently producing unclassified rows for a future
// volume-by-muscle-group feature. created_by is set to the creating user
// so this exercise is editable later — see updateExercise in
// src/app/exercises/actions.ts and the ownership-scoped RLS policies from
// 0024. Needs the exercises-insert and exercise_muscle_groups-insert RLS
// policies from 0021/0022/0024.
export async function createExercise(
  formData: FormData,
): Promise<{ success: true; exercise: ExercisePickerOption } | { success: false }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

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

  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({ name, primary_lift: "general", created_by: user.id })
    .select("id, name, equipment")
    .single();

  if (error || !exercise) {
    console.error("[createExercise] insert failed:", error);
    return { success: false };
  }

  // Best-effort, same tolerance as logSet's personal_records insert: the
  // exercise row is the primary record and already exists at this point.
  // A failure here leaves it with zero muscle-group rows — the same
  // "not yet classified" state as an unbackfilled exercise, recoverable
  // via the same backfill path, not a corrupted invariant.
  const { error: mgError } = await supabase.from("exercise_muscle_groups").insert(
    muscleGroups.map((mg) => ({
      exercise_id: exercise.id,
      muscle_group: mg.muscle_group,
      ratio: mg.ratio,
    })),
  );
  if (mgError) {
    console.error("[createExercise] exercise_muscle_groups insert failed:", mgError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/exercises");
  return {
    success: true,
    exercise: { id: exercise.id, name: exercise.name, equipment: exercise.equipment, muscle_groups: muscleGroups },
  };
}

export async function deleteAccessoryLog(id: string) {
  const supabase = await createClient();
  await supabase.from("accessory_logs").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
