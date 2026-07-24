import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyTemplateChecked } from "./actions";
import { UseTemplateForm } from "./UseTemplateForm";

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  source_attribution: string | null;
}

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: templatesData } = await supabase
    .from("program_templates")
    .select("id, name, description, source_attribution")
    .order("name", { ascending: true });
  const templates: TemplateRow[] = templatesData ?? [];

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <Link
          href="/templates/quiz"
          className="mb-6 block text-sm text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-300 hover:decoration-neutral-500 active:text-neutral-200"
        >
          Not sure which to pick? Take the quiz →
        </Link>

        {templates.length === 0 ? (
          <p className="text-sm text-neutral-500">No templates available yet.</p>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-6"
              >
                <h2 className="text-lg font-semibold text-white">{template.name}</h2>
                {template.description && (
                  <p className="mt-1 text-sm text-neutral-400">{template.description}</p>
                )}
                {template.source_attribution && (
                  <p className="mt-1 text-xs text-neutral-600">{template.source_attribution}</p>
                )}
                <div className="mt-4">
                  <UseTemplateForm
                    templateId={template.id}
                    templateName={template.name}
                    action={applyTemplateChecked}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
