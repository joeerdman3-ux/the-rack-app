"use server";

// Thin call-site guard in front of programs/actions.ts's applyTemplate:
// verifies template_id actually exists in program_templates before
// delegating, since applyTemplate itself doesn't validate that (guarding
// here rather than modifying that action, per instruction).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyTemplate } from "@/app/programs/actions";

export async function applyTemplateChecked(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const templateId = formData.get("template_id") as string;
  if (!templateId) return;

  const { data: template } = await supabase
    .from("program_templates")
    .select("id")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return;

  await applyTemplate(formData);
}
