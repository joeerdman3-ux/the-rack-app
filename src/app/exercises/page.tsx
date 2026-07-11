import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseLibrary } from "./ExerciseLibrary";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, primary_lift, movement_pattern, equipment, description, muscle_group, difficulty")
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <ExerciseLibrary exercises={exercises ?? []} />
      </div>
    </div>
  );
}
