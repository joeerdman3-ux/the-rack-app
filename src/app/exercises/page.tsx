import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseLibrary } from "./ExerciseLibrary";
import type { ExerciseMuscleGroup } from "@/lib/lifting/muscleGroups";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, primary_lift, movement_pattern, equipment, description, difficulty")
    .order("name", { ascending: true });

  // exercise_muscle_groups is a separate table (many-to-many, ratio-weighted)
  // rather than a joined/embedded select — matches this codebase's existing
  // pattern of flat queries + app-side grouping (e.g. accessoryExerciseNameById
  // in dashboard/page.tsx) rather than PostgREST's embedded-resource syntax.
  const { data: muscleGroupRows } = await supabase
    .from("exercise_muscle_groups")
    .select("exercise_id, muscle_group, ratio");

  const muscleGroupsByExerciseId = new Map<string, ExerciseMuscleGroup[]>();
  for (const row of muscleGroupRows ?? []) {
    const list = muscleGroupsByExerciseId.get(row.exercise_id) ?? [];
    list.push({ muscle_group: row.muscle_group, ratio: row.ratio });
    muscleGroupsByExerciseId.set(row.exercise_id, list);
  }

  const exercisesWithMuscleGroups = (exercises ?? []).map((e) => ({
    ...e,
    muscle_groups: muscleGroupsByExerciseId.get(e.id) ?? [],
  }));

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <ExerciseLibrary exercises={exercisesWithMuscleGroups} />
      </div>
    </div>
  );
}
