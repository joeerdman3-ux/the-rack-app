"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bodyweightRaw = formData.get("bodyweight") as string;
  const bodyweight = bodyweightRaw ? parseFloat(bodyweightRaw) : null;
  const gender = (formData.get("gender") as string) || null;
  const unit = (formData.get("unit") as string) === "kg" ? "kg" : "lb";
  const birthdate = (formData.get("birthdate") as string) || null;

  await supabase
    .from("profiles")
    .update({
      bodyweight: bodyweight && bodyweight > 0 ? bodyweight : null,
      gender: gender === "male" || gender === "female" ? gender : null,
      birthdate,
      unit,
    })
    .eq("id", user.id);

  redirect("/dashboard");
}
