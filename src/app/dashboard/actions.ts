"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { epley1RM } from "@/lib/lifting/e1rm";
import { diagnose, type TaggedSet } from "@/lib/standards/diagnosis";

export async function logSet(formData: FormData): Promise<
  | { success: true; isNewPR: boolean; lift: string; e1rm: number }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to log a set." };

  const lift = formData.get("lift") as string;
  const weight = parseFloat(formData.get("weight") as string);
  const reps = parseInt(formData.get("reps") as string, 10);
  const rpeRaw = formData.get("rpe") as string;
  const rpe = rpeRaw ? parseFloat(rpeRaw) : null;
  const missed = formData.get("missed") === "on";
  const stalled = formData.get("stalled") === "on";
  const stickingPointRaw = formData.get("sticking_point") as string;
  const stickingPoint = (missed || stalled) && stickingPointRaw ? stickingPointRaw : null;
  const notesRaw = (formData.get("notes") as string) || "";
  const notes = notesRaw.trim() || null;
  const videoUrlRaw = ((formData.get("video_url") as string) || "").trim();
  const videoUrl = videoUrlRaw || null;

  if (!lift || !Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1) {
    return { success: false, error: "Enter a valid lift, weight, and reps." };
  }

  if (videoUrl) {
    try {
      new URL(videoUrl);
    } catch {
      return { success: false, error: "Video link doesn't look like a valid URL." };
    }
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
      notes,
      video_url: videoUrl,
      logged_date: loggedDate,
    })
    .select("id")
    .single();

  if (error || !newWorkout) {
    console.error("[logSet] workouts insert failed:", error);
    return { success: false, error: error?.message ?? "Failed to save set." };
  }

  const isNewPR = !missed && (priorBestE1rm === null || e1rm > priorBestE1rm);
  if (isNewPR) {
    // unit is read from the profile rather than trusted from the client —
    // it's the same source of truth every other unit-aware read in this
    // app already defers to, and it captures "what was actually active
    // when this PR landed" for the ratio-trend reconstruction in
    // ratioTrend.ts (0030).
    const { data: profile } = await supabase
      .from("profiles")
      .select("unit")
      .eq("id", user.id)
      .single();

    const { error: prError } = await supabase.from("personal_records").insert({
      user_id: user.id,
      lift,
      e1rm,
      weight,
      reps,
      workout_id: newWorkout.id,
      unit: profile?.unit ?? null,
    });
    if (prError) {
      console.error("[logSet] personal_records insert failed:", prError);
    }
  }

  // Trend tracking (v1): every qualifying tagged set re-runs the SAME
  // diagnose() this lift's dashboard card uses, scoped to just this lift,
  // and records a snapshot only when that recomputation lands on "ready"
  // (a single confident sticking point) — "pending" has no confident
  // answer yet, and "tied" has no single winner to record. bests/gender/
  // bodyweight/sbdThresholdsKg are passed as benign stand-ins ({}, null,
  // null, {}) rather than re-fetched: diagnose()'s standings/weakestLifts
  // (which those arguments feed) only affect the zero-tagged-set edge
  // case, which can't apply here since this lift now has >=1 tagged set.
  if ((missed || stalled) && stickingPoint) {
    const { data: taggedRows } = await supabase
      .from("workouts")
      .select("lift, sticking_point, logged_date, stalled")
      .eq("user_id", user.id)
      .eq("lift", lift)
      .or("missed.eq.true,stalled.eq.true");
    const taggedSets: TaggedSet[] = taggedRows ?? [];

    const diagnosis = diagnose({}, null, null, taggedSets, "lb", {});
    const liftDiagnosis = diagnosis.stickingPointDiagnoses.find((d) => d.lift === lift);

    if (liftDiagnosis?.status === "ready") {
      const { error: snapshotError } = await supabase.from("diagnosis_snapshots").insert({
        user_id: user.id,
        lift,
        sticking_point: liftDiagnosis.stickingPoint,
        confidence: liftDiagnosis.count / liftDiagnosis.totalTaggedMisses,
      });
      if (snapshotError) {
        console.error("[logSet] diagnosis_snapshots insert failed:", snapshotError);
      }
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
