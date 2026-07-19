"use server";

// Deliberately kept separate from ./actions.ts (logSet/deleteSet, which
// power the main-lift flow that feeds standards/diagnosis/leaderboards) so
// this new accessory-logging path can never risk touching that code.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExercisePickerOption } from "@/components/ExerciseSearchPicker";

// "sets" is a UI convenience for logging several identical sets in one
// submission (defaults to 1, matching every prior caller that never sent
// it) — it inserts `sets` separate rows in one batch, so every row still
// represents exactly one set, same as before. No new column/data shape.
export async function logAccessorySet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

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
    return;
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

  await supabase.from("accessory_logs").insert(rows);

  revalidatePath("/dashboard");
  revalidatePath("/history");
}

// Inline "+ Add new exercise" from the Log Sets flow — a lightweight
// custom-exercise entry (name only, primary_lift hardcoded to 'general' so
// it never gets treated as a competition lift). Needs the exercises-insert
// RLS policy added in 0021_exercises_insert_policy.sql.
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

  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({ name, primary_lift: "general" })
    .select("id, name, muscle_group, equipment")
    .single();

  if (error || !exercise) {
    console.error("[createExercise] insert failed:", error);
    return { success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/exercises");
  return { success: true, exercise };
}

export async function deleteAccessoryLog(id: string) {
  const supabase = await createClient();
  await supabase.from("accessory_logs").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
