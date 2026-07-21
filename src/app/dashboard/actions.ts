"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { epley1RM } from "@/lib/lifting/e1rm";

export async function logSet(formData: FormData): Promise<
  | { success: true; isNewPR: boolean; lift: string; e1rm: number }
  | { success: false }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const lift = formData.get("lift") as string;
  const weight = parseFloat(formData.get("weight") as string);
  const reps = parseInt(formData.get("reps") as string, 10);
  const rpeRaw = formData.get("rpe") as string;
  const rpe = rpeRaw ? parseFloat(rpeRaw) : null;
  const missed = formData.get("missed") === "on";
  const stalled = formData.get("stalled") === "on";
  const stickingPointRaw = formData.get("sticking_point") as string;
  const stickingPoint = (missed || stalled) && stickingPointRaw ? stickingPointRaw : null;

  if (!lift || !Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1) {
    return { success: false };
  }

  const e1rm = epley1RM(weight, reps);
  const loggedDate = new Date().toISOString().slice(0, 10);

  // Looked up before the insert below, so "prior best" never includes the
  // set we're about to add. A missed set is never PR-eligible — best_lifts
  // itself only aggregates non-missed sets (0007), so a missed rep can't
  // beat a best that was never computed from missed sets either.
  let priorBestE1rm: number | null = null;
  if (!missed) {
    const { data: priorBest } = await supabase
      .from("best_lifts")
      .select("best_e1rm")
      .eq("user_id", user.id)
      .eq("lift", lift)
      .maybeSingle();
    priorBestE1rm = priorBest?.best_e1rm ?? null;
  }

  const { data: newWorkout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      lift,
      weight,
      reps,
      rpe,
      e1rm,
      missed,
      stalled,
      sticking_point: stickingPoint,
      logged_date: loggedDate,
    })
    .select("id")
    .single();

  if (error || !newWorkout) return { success: false };

  const isNewPR = !missed && (priorBestE1rm === null || e1rm > priorBestE1rm);
  if (isNewPR) {
    const { error: prError } = await supabase.from("personal_records").insert({
      user_id: user.id,
      lift,
      e1rm,
      weight,
      reps,
      workout_id: newWorkout.id,
    });
    if (prError) {
      console.error("[logSet] personal_records insert failed:", prError);
    }
  }

  revalidatePath("/dashboard");
  return { success: true, isNewPR, lift, e1rm };
}

export async function deleteSet(id: string) {
  const supabase = await createClient();
  await supabase.from("workouts").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
