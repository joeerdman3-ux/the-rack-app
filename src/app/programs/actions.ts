"use server";

// Program Builder Phase 1: create/view only. Phase 2 adds training-max
// storage (setTrainingMax below) for percent_of_max resolution — still no
// wiring into LogForm/workouts/accessory_logs/diagnosis/leaderboards.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toKg } from "@/lib/standards/benchmarks";

export async function createProgram(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = ((formData.get("name") as string) || "").trim() || "Untitled Program";

  const { data, error } = await supabase
    .from("programs")
    .insert({ user_id: user.id, name })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/programs");
  redirect(`/programs/${data.id}`);
}

export async function updateProgramName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const name = ((formData.get("name") as string) || "").trim();
  if (!programId || !name) return;

  await supabase.from("programs").update({ name }).eq("id", programId);

  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
}

export async function addWeek(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const nextWeekNumber = parseInt(formData.get("next_week_number") as string, 10);
  if (!programId || !Number.isFinite(nextWeekNumber)) return;

  await supabase.from("program_weeks").insert({
    program_id: programId,
    week_number: nextWeekNumber,
  });

  revalidatePath(`/programs/${programId}`);
}

export async function addSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const weekId = formData.get("week_id") as string;
  const nextSessionNumber = parseInt(formData.get("next_session_number") as string, 10);
  const nameRaw = (formData.get("name") as string) || "";
  const name = nameRaw.trim() || null;

  if (!programId || !weekId || !Number.isFinite(nextSessionNumber)) return;

  await supabase.from("program_sessions").insert({
    program_week_id: weekId,
    session_number: nextSessionNumber,
    name,
  });

  revalidatePath(`/programs/${programId}`);
}

export async function addProgramExercise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const sessionId = formData.get("session_id") as string;
  const exerciseId = formData.get("exercise_id") as string;
  const sets = parseInt(formData.get("sets") as string, 10);
  const reps = parseInt(formData.get("reps") as string, 10);
  const percentRaw = formData.get("percent_of_max") as string;
  const percentOfMax = percentRaw ? parseFloat(percentRaw) : null;
  const sortOrderRaw = parseInt(formData.get("sort_order") as string, 10);
  const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;

  if (
    !programId ||
    !sessionId ||
    !exerciseId ||
    !Number.isInteger(sets) ||
    sets < 1 ||
    !Number.isInteger(reps) ||
    reps < 1
  ) {
    return;
  }

  await supabase.from("program_exercises").insert({
    program_session_id: sessionId,
    exercise_id: exerciseId,
    sets,
    reps,
    percent_of_max: percentOfMax,
    sort_order: sortOrder,
  });

  revalidatePath(`/programs/${programId}`);
}

export async function updateProgramExercise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const programExerciseId = formData.get("program_exercise_id") as string;
  const sets = parseInt(formData.get("sets") as string, 10);
  const reps = parseInt(formData.get("reps") as string, 10);
  const percentRaw = formData.get("percent_of_max") as string;
  const percentOfMax = percentRaw ? parseFloat(percentRaw) : null;

  if (
    !programId ||
    !programExerciseId ||
    !Number.isInteger(sets) ||
    sets < 1 ||
    !Number.isInteger(reps) ||
    reps < 1
  ) {
    return;
  }

  await supabase
    .from("program_exercises")
    .update({ sets, reps, percent_of_max: percentOfMax })
    .eq("id", programExerciseId);

  revalidatePath(`/programs/${programId}`, "layout");
}

export async function setTrainingMax(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const exerciseId = formData.get("exercise_id") as string;
  const valueRaw = formData.get("training_max") as string;
  const value = parseFloat(valueRaw);

  if (!programId || !exerciseId || !Number.isFinite(value) || value <= 0) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit")
    .eq("id", user.id)
    .single();
  const unit = profile?.unit ?? "lb";

  const trainingMaxKg = toKg(value, unit);

  await supabase.from("program_training_maxes").upsert(
    { program_id: programId, exercise_id: exerciseId, training_max_kg: trainingMaxKg },
    { onConflict: "program_id,exercise_id" },
  );

  revalidatePath(`/programs/${programId}`, "layout");
}
