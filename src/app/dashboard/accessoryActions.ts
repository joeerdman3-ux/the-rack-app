"use server";

// Deliberately kept separate from ./actions.ts (logSet/deleteSet, which
// power the main-lift flow that feeds standards/diagnosis/leaderboards) so
// this new accessory-logging path can never risk touching that code.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  if (
    !exerciseId ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isInteger(reps) ||
    reps < 1
  ) {
    return;
  }

  const loggedDate = new Date().toISOString().slice(0, 10);

  await supabase.from("accessory_logs").insert({
    user_id: user.id,
    exercise_id: exerciseId,
    weight,
    reps,
    rpe,
    notes,
    logged_date: loggedDate,
  });

  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function deleteAccessoryLog(id: string) {
  const supabase = await createClient();
  await supabase.from("accessory_logs").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
