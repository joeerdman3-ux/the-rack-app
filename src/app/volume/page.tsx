import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MAIN_LIFTS } from "@/lib/lifting/constants";
import { computeMuscleGroupVolume } from "@/lib/history/muscleGroupVolume";
import { MuscleGroupHeatmap } from "@/components/MuscleGroupHeatmap";
import type { ExerciseMuscleGroup } from "@/lib/lifting/muscleGroups";

const WINDOW_DAYS = 7;

export default async function VolumePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Trailing 7 calendar days, inclusive of today.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (WINDOW_DAYS - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // No missed-set filter — matches weeklyTonnage's existing "hit + missed"
  // convention (aggregate.ts): a missed rep is still real training volume.
  const { data: workoutSets } = await supabase
    .from("workouts")
    .select("lift")
    .eq("user_id", user.id)
    .gte("logged_date", cutoffStr);

  const { data: accessorySets } = await supabase
    .from("accessory_logs")
    .select("exercise_id")
    .eq("user_id", user.id)
    .gte("logged_date", cutoffStr);

  // workouts.lift is free text with no FK — bridged to exercises.id via an
  // exact name match on the 4 canonical MAIN_LIFTS rows (confirmed as the
  // safe join; primary_lift is shared by variation exercises like Safety
  // Bar Squat and would misattribute volume).
  const { data: mainLiftExercises } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", MAIN_LIFTS);
  const exerciseIdByLiftName = new Map(
    (mainLiftExercises ?? []).map((e) => [e.name, e.id]),
  );

  // Full table, unfiltered — same pattern as every other
  // exercise_muscle_groups consumer (dashboard/exercises/programs pages).
  const { data: muscleGroupRows } = await supabase
    .from("exercise_muscle_groups")
    .select("exercise_id, muscle_group, ratio");
  const muscleGroupsByExerciseId = new Map<string, ExerciseMuscleGroup[]>();
  for (const row of muscleGroupRows ?? []) {
    const list = muscleGroupsByExerciseId.get(row.exercise_id) ?? [];
    list.push({ muscle_group: row.muscle_group, ratio: row.ratio });
    muscleGroupsByExerciseId.set(row.exercise_id, list);
  }

  const volumes = computeMuscleGroupVolume(
    workoutSets ?? [],
    accessorySets ?? [],
    exerciseIdByLiftName,
    muscleGroupsByExerciseId,
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Muscle Volume</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Last 7 days</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Weighted set count per muscle group, combining main lifts and accessory work. Exercises
            without muscle groups assigned yet aren&apos;t counted.
          </p>
          <MuscleGroupHeatmap volumes={volumes} />
        </div>
      </div>
    </div>
  );
}
