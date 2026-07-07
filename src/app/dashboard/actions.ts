"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { epley1RM } from "@/lib/lifting/e1rm";

export async function logSet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const lift = formData.get("lift") as string;
  const weight = parseFloat(formData.get("weight") as string);
  const reps = parseInt(formData.get("reps") as string, 10);
  const rpeRaw = formData.get("rpe") as string;
  const rpe = rpeRaw ? parseFloat(rpeRaw) : null;
  const missed = formData.get("missed") === "on";
  const stickingPointRaw = formData.get("sticking_point") as string;
  const stickingPoint = missed && stickingPointRaw ? stickingPointRaw : null;

  if (!lift || !Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1) {
    return;
  }

  const e1rm = epley1RM(weight, reps);
  const loggedDate = new Date().toISOString().slice(0, 10);

  await supabase.from("workouts").insert({
    user_id: user.id,
    lift,
    weight,
    reps,
    rpe,
    e1rm,
    missed,
    sticking_point: stickingPoint,
    logged_date: loggedDate,
  });

  revalidatePath("/dashboard");
}

export async function deleteSet(id: string) {
  const supabase = await createClient();
  await supabase.from("workouts").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
