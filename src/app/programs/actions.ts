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

// program_weeks/program_sessions/program_exercises/program_training_maxes all
// reference programs(id) on delete cascade (0010_program_builder.sql,
// 0011_program_training_maxes.sql), so deleting the program row alone is
// enough to remove all of them. workouts/accessory_logs have no foreign key
// to programs at all — lift is a free-text string on workouts, and
// accessory_logs.exercise_id points at exercises, not program_exercises — so
// logging history survives a program delete untouched, by construction.
export async function deleteProgram(programId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!programId) return;

  await supabase.from("programs").delete().eq("id", programId).eq("user_id", user.id);

  revalidatePath("/programs");
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
  const isAmrap = formData.get("is_amrap") === "on";

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
    is_amrap: isAmrap,
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
  const isAmrap = formData.get("is_amrap") === "on";

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
    .update({ sets, reps, percent_of_max: percentOfMax, is_amrap: isAmrap })
    .eq("id", programExerciseId);

  revalidatePath(`/programs/${programId}`, "layout");
}

// Swaps which exercise occupies an existing slot — updates exercise_id only,
// leaving sets/reps/percent_of_max/sort_order/is_amrap untouched. Neither
// accessory_logs nor workouts reference program_exercises (accessory_logs
// stores its own exercise_id per logged row; workouts stores lift as a
// free-text string, no exercise_id column at all), so past logged sets are
// entirely unaffected by what a program slot points to going forward.
export async function swapProgramExercise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const programExerciseId = formData.get("program_exercise_id") as string;
  const exerciseId = formData.get("exercise_id") as string;

  if (!programId || !programExerciseId || !exerciseId) return;

  await supabase
    .from("program_exercises")
    .update({ exercise_id: exerciseId })
    .eq("id", programExerciseId);

  revalidatePath(`/programs/${programId}`, "layout");
}

export async function copyWeekToNewWeek(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programId = formData.get("program_id") as string;
  const sourceWeekId = formData.get("source_week_id") as string;
  if (!programId || !sourceWeekId) return;

  const { data: sourceWeek } = await supabase
    .from("program_weeks")
    .select("program_id")
    .eq("id", sourceWeekId)
    .single();
  if (!sourceWeek || sourceWeek.program_id !== programId) return;

  const { data: weeksData } = await supabase
    .from("program_weeks")
    .select("week_number")
    .eq("program_id", programId);
  const weeks = weeksData ?? [];
  const nextWeekNumber =
    weeks.length > 0 ? Math.max(...weeks.map((w) => w.week_number)) + 1 : 1;

  const { data: newWeek, error: weekError } = await supabase
    .from("program_weeks")
    .insert({ program_id: programId, week_number: nextWeekNumber })
    .select("id")
    .single();
  if (weekError || !newWeek) return;

  const { data: sourceSessions } = await supabase
    .from("program_sessions")
    .select("id, session_number, name")
    .eq("program_week_id", sourceWeekId)
    .order("session_number", { ascending: true });

  // Structural copy only: no workouts/accessory_logs reference program_exercises
  // at all, so there's nothing logged to carry over even by omission.
  const sessionIdMap = new Map<string, string>();
  for (const session of sourceSessions ?? []) {
    const { data: newSession, error: sessionError } = await supabase
      .from("program_sessions")
      .insert({
        program_week_id: newWeek.id,
        session_number: session.session_number,
        name: session.name,
      })
      .select("id")
      .single();
    if (sessionError || !newSession) continue;
    sessionIdMap.set(session.id, newSession.id);
  }

  const sourceSessionIds = [...sessionIdMap.keys()];
  const { data: sourceExercises } =
    sourceSessionIds.length > 0
      ? await supabase
          .from("program_exercises")
          .select("program_session_id, exercise_id, sets, reps, percent_of_max, sort_order")
          .in("program_session_id", sourceSessionIds)
      : { data: [] };

  const newExercises = (sourceExercises ?? [])
    .map((pe) => {
      const newSessionId = sessionIdMap.get(pe.program_session_id);
      if (!newSessionId) return null;
      return {
        program_session_id: newSessionId,
        exercise_id: pe.exercise_id,
        sets: pe.sets,
        reps: pe.reps,
        percent_of_max: pe.percent_of_max,
        sort_order: pe.sort_order,
      };
    })
    .filter((pe): pe is NonNullable<typeof pe> => pe !== null);

  if (newExercises.length > 0) {
    await supabase.from("program_exercises").insert(newExercises);
  }

  revalidatePath(`/programs/${programId}`, "layout");
  redirect(`/programs/${programId}#week-${newWeek.id}`);
}

// Clones a shared program_templates entry into a brand-new real program for
// the current user — same id-remapping-via-Map structure as
// copyWeekToNewWeek, one level deeper (template -> weeks -> sessions ->
// exercises). Deliberately does not set any program_training_maxes: a
// template has no idea what the person's actual current maxes are, so they
// set those themselves via the existing "Set Training Max" UI once they see
// the new program. template_weeks.note/phase_name and template_exercises.note
// are carried over onto the cloned program_weeks/program_exercises rows so a
// template's guidance text isn't lost.
//
// Returns instead of calling redirect(): this is invoked through a Server
// Action passed as a prop into a Client Component (UseTemplateForm), and the
// caller navigates client-side with router.push() once it has the new
// program's id, rather than relying on redirect() to reach the browser.
export async function applyTemplate(
  formData: FormData,
): Promise<{ success: true; programId: string } | { success: false }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const templateId = formData.get("template_id") as string;
  const name = ((formData.get("name") as string) || "").trim();
  if (!templateId || !name) return { success: false };

  const { data: newProgram, error: programError } = await supabase
    .from("programs")
    .insert({ user_id: user.id, name })
    .select("id")
    .single();
  if (programError || !newProgram) return { success: false };

  const { data: templateWeeks } = await supabase
    .from("template_weeks")
    .select("id, week_number, note, phase_name")
    .eq("template_id", templateId)
    .order("week_number", { ascending: true });

  const weekIdMap = new Map<string, string>();
  for (const week of templateWeeks ?? []) {
    const { data: newWeek, error: weekError } = await supabase
      .from("program_weeks")
      .insert({
        program_id: newProgram.id,
        week_number: week.week_number,
        note: week.note,
        phase_name: week.phase_name,
      })
      .select("id")
      .single();
    if (weekError || !newWeek) continue;
    weekIdMap.set(week.id, newWeek.id);
  }

  const templateWeekIds = [...weekIdMap.keys()];
  const { data: templateSessions } =
    templateWeekIds.length > 0
      ? await supabase
          .from("template_sessions")
          .select("id, template_week_id, session_number, name")
          .in("template_week_id", templateWeekIds)
          .order("session_number", { ascending: true })
      : { data: [] };

  const sessionIdMap = new Map<string, string>();
  for (const session of templateSessions ?? []) {
    const newWeekId = weekIdMap.get(session.template_week_id);
    if (!newWeekId) continue;
    const { data: newSession, error: sessionError } = await supabase
      .from("program_sessions")
      .insert({
        program_week_id: newWeekId,
        session_number: session.session_number,
        name: session.name,
      })
      .select("id")
      .single();
    if (sessionError || !newSession) continue;
    sessionIdMap.set(session.id, newSession.id);
  }

  const templateSessionIds = [...sessionIdMap.keys()];
  const { data: templateExercisesData } =
    templateSessionIds.length > 0
      ? await supabase
          .from("template_exercises")
          .select(
            "template_session_id, exercise_id, sets, reps, percent_of_max, is_amrap, sort_order, note",
          )
          .in("template_session_id", templateSessionIds)
      : { data: [] };

  const newTemplateExercises = (templateExercisesData ?? [])
    .map((te) => {
      const newSessionId = sessionIdMap.get(te.template_session_id);
      if (!newSessionId) return null;
      return {
        program_session_id: newSessionId,
        exercise_id: te.exercise_id,
        sets: te.sets,
        reps: te.reps,
        percent_of_max: te.percent_of_max,
        is_amrap: te.is_amrap,
        sort_order: te.sort_order,
        note: te.note,
      };
    })
    .filter((te): te is NonNullable<typeof te> => te !== null);

  if (newTemplateExercises.length > 0) {
    const { error: exercisesInsertError } = await supabase
      .from("program_exercises")
      .insert(newTemplateExercises);
    if (exercisesInsertError) {
      console.error("[applyTemplate] program_exercises insert failed:", exercisesInsertError);
    }
  }

  revalidatePath("/programs");
  return { success: true, programId: newProgram.id };
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
