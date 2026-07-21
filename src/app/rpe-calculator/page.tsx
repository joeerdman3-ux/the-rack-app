import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RPECalculatorForm } from "./RPECalculatorForm";

export default async function RPECalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit")
    .eq("id", user.id)
    .single();
  const unit = profile?.unit ?? "lb";

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">RPE Calculator</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <RPECalculatorForm initialUnit={unit} />
      </div>
    </div>
  );
}
