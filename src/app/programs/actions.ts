"use server";

// Program Builder Phase 1: create/view only. No wiring into logging or
// percent_of_max resolution here — that's Phase 2. Entirely new tables
// (programs/program_weeks/program_sessions/program_exercises), so nothing
// here touches workouts, accessory_logs, diagnosis, or leaderboards.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
