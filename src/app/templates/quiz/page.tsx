import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyTemplateChecked } from "../actions";
import { TemplateQuizForm } from "./TemplateQuizForm";

export default async function TemplateQuizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: templatesData } = await supabase
    .from("program_templates")
    .select("id, name, description")
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Which template?</h1>
          <Link href="/templates" className="text-sm text-orange-500 hover:underline">
            Back to Templates
          </Link>
        </div>

        <TemplateQuizForm templates={templatesData ?? []} action={applyTemplateChecked} />
      </div>
    </div>
  );
}
