"use server";

// Thin call-site guard in front of programs/actions.ts's applyTemplate:
// verifies template_id actually exists in program_templates before
// delegating, since applyTemplate itself doesn't validate that (guarding
// here rather than modifying that action, per instruction).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyTemplate } from "@/app/programs/actions";

export async function applyTemplateChecked(formData: FormData) {
  // TEMP DEBUG — remove once the "Create Program" no-op bug is diagnosed.
  console.error("[applyTemplateChecked] invoked");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[applyTemplateChecked] EXIT: no authenticated user, redirecting to /login");
    redirect("/login");
  }

  const templateId = formData.get("template_id") as string;
  console.error("[applyTemplateChecked] template_id =", templateId);
  if (!templateId) {
    console.error("[applyTemplateChecked] EXIT: missing template_id in formData");
    return;
  }

  const { data: template, error: templateError } = await supabase
    .from("program_templates")
    .select("id")
    .eq("id", templateId)
    .maybeSingle();
  console.error("[applyTemplateChecked] template lookup:", { template, templateError });
  if (!template) {
    console.error(
      "[applyTemplateChecked] EXIT: template not found (bad id, or RLS blocked the read — see templateError above)",
    );
    return;
  }

  console.error("[applyTemplateChecked] template verified, delegating to applyTemplate");
  await applyTemplate(formData);
  console.error(
    "[applyTemplateChecked] applyTemplate() returned without redirecting — it should have redirected on success",
  );
}
