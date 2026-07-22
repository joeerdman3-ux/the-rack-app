"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildExportRows, toCsv } from "@/lib/export/trainingExport";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nicknameRaw = (formData.get("nickname") as string) || "";
  const nickname = nicknameRaw.trim().slice(0, 20) || null;
  const bodyweightRaw = formData.get("bodyweight") as string;
  const bodyweight = bodyweightRaw ? parseFloat(bodyweightRaw) : null;
  const gender = (formData.get("gender") as string) || null;
  const unit = (formData.get("unit") as string) === "kg" ? "kg" : "lb";
  const birthdate = (formData.get("birthdate") as string) || null;

  const mainRestRaw = formData.get("main_rest_seconds") as string;
  const mainRestSeconds = mainRestRaw ? parseInt(mainRestRaw, 10) : NaN;
  const accessoryRestRaw = formData.get("accessory_rest_seconds") as string;
  const accessoryRestSeconds = accessoryRestRaw ? parseInt(accessoryRestRaw, 10) : NaN;

  await supabase
    .from("profiles")
    .update({
      nickname,
      bodyweight: bodyweight && bodyweight > 0 ? bodyweight : null,
      gender: gender === "male" || gender === "female" ? gender : null,
      birthdate,
      unit,
      // Falls back to the column's own DB default (180/90) rather than a
      // hardcoded literal here, so there's one source of truth for the
      // default — matches the check constraint's floor of > 0.
      ...(Number.isInteger(mainRestSeconds) && mainRestSeconds > 0 ? { main_rest_seconds: mainRestSeconds } : {}),
      ...(Number.isInteger(accessoryRestSeconds) && accessoryRestSeconds > 0
        ? { accessory_rest_seconds: accessoryRestSeconds }
        : {}),
    })
    .eq("id", user.id);

  redirect("/dashboard");
}

// unique(user_id) on premium_waitlist means a repeat call is a conflict
// (Postgres 23505), not a duplicate row — treated as success either way,
// since the user ends up on the list regardless.
export async function joinPremiumWaitlist(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from("premium_waitlist").insert({ user_id: user.id });
  if (error && error.code !== "23505") {
    console.error("[joinPremiumWaitlist] insert failed:", error);
    return { success: false };
  }

  revalidatePath("/settings");
  return { success: true };
}

// Exports every workouts + accessory_logs row belonging to the requesting
// user as one combined CSV. Both queries add an explicit .eq("user_id",
// user.id) rather than relying on RLS alone: accessory_logs' single SELECT
// policy is already owner-only, but workouts also has "leaderboard
// opt-in" and "accepted coach" SELECT policies that legitimately let a
// bare, unfiltered select return OTHER users' rows too (anyone opted into
// the leaderboard, or any athlete who's accepted this user as their
// coach) — those policies exist for real features elsewhere, but an
// export explicitly scoped to "my own data" can't rely on them not
// applying, so the .eq() filter here is load-bearing, not defensive
// boilerplate.
export async function exportTrainingData(): Promise<
  { success: true; csv: string } | { success: false }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit")
    .eq("id", user.id)
    .single();
  const unit = profile?.unit ?? "lb";

  const { data: workoutRows, error: workoutsError } = await supabase
    .from("workouts")
    .select("lift, weight, reps, rpe, missed, stalled, sticking_point, e1rm, logged_date, logged_at")
    .eq("user_id", user.id);
  if (workoutsError) {
    console.error("[exportTrainingData] workouts query failed:", workoutsError);
    return { success: false };
  }

  const { data: accessoryRows, error: accessoryError } = await supabase
    .from("accessory_logs")
    .select("exercise_id, weight, reps, rpe, notes, logged_date, logged_at")
    .eq("user_id", user.id);
  if (accessoryError) {
    console.error("[exportTrainingData] accessory_logs query failed:", accessoryError);
    return { success: false };
  }

  const exerciseIds = [...new Set((accessoryRows ?? []).map((r) => r.exercise_id))];
  const { data: exerciseRows } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
      : { data: [] };
  const exerciseNameById = new Map((exerciseRows ?? []).map((e) => [e.id, e.name]));

  const rows = buildExportRows(workoutRows ?? [], accessoryRows ?? [], exerciseNameById);
  return { success: true, csv: toCsv(rows, unit) };
}
