import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fromKg } from "@/lib/standards/benchmarks";
import { PRIMARY_LIFT_TO_MAIN_LIFT } from "@/lib/lifting/constants";
import { roundToLoadableIncrement } from "@/lib/lifting/plates";
import { formatSetsReps } from "@/lib/programs/setsReps";

interface ProgramExerciseRow {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  percent_of_max: number | null;
  sort_order: number;
  is_amrap: boolean;
}

// Routes by exercises.primary_lift, not by where the exercise sits in the
// program — a variation (e.g. Close-Grip Bench, primary_lift "general")
// logged as if it were the competition lift would corrupt e1rm/diagnosis/
// leaderboard data for that lift.
// When isAmrap is true, the row's last set is AMRAP-to-target (see
// formatSetsReps) — there's no per-set tracking, so the single Log-this-set
// link for this row can't tell straight sets from the AMRAP set apart. We
// therefore never silently pre-fill a rep count for an AMRAP row: reps
// travels as repsTarget (a placeholder hint only) instead of reps.
function buildLogHref(
  exerciseId: string,
  primaryLift: string | undefined,
  reps: number,
  isAmrap: boolean,
  resolvedWeight: number | null,
): string {
  const mainLift = primaryLift ? PRIMARY_LIFT_TO_MAIN_LIFT[primaryLift] : undefined;
  const params = new URLSearchParams();
  if (mainLift) {
    params.set("lift", mainLift);
  } else {
    params.set("exerciseId", exerciseId);
  }
  if (isAmrap) {
    params.set("repsTarget", String(reps));
  } else {
    params.set("reps", String(reps));
  }
  if (resolvedWeight != null) {
    params.set("weight", String(resolvedWeight));
  }
  return `/dashboard?${params.toString()}`;
}

// Phase 2: read-only resolved view. Does not pre-fill LogForm — that's Phase 3.
export default async function TodaysSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: program } = await supabase
    .from("programs")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!program) notFound();

  const { data: session } = await supabase
    .from("program_sessions")
    .select("id, program_week_id, session_number, name")
    .eq("id", sessionId)
    .single();
  if (!session) notFound();

  const { data: week } = await supabase
    .from("program_weeks")
    .select("id, program_id, week_number")
    .eq("id", session.program_week_id)
    .eq("program_id", program.id)
    .single();
  if (!week) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit")
    .eq("id", user.id)
    .single();
  const unit = profile?.unit ?? "lb";

  const { data: exercisesData } = await supabase
    .from("program_exercises")
    .select("id, exercise_id, sets, reps, percent_of_max, sort_order, is_amrap")
    .eq("program_session_id", session.id)
    .order("sort_order", { ascending: true });
  const sessionExercises: ProgramExerciseRow[] = exercisesData ?? [];

  const exerciseIds = [...new Set(sessionExercises.map((pe) => pe.exercise_id))];
  const { data: exerciseRows } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, name, primary_lift").in("id", exerciseIds)
      : { data: [] };
  const exerciseNameById = new Map((exerciseRows ?? []).map((e) => [e.id, e.name]));
  const primaryLiftById = new Map((exerciseRows ?? []).map((e) => [e.id, e.primary_lift]));

  const tmExerciseIds = [
    ...new Set(
      sessionExercises.filter((pe) => pe.percent_of_max != null).map((pe) => pe.exercise_id),
    ),
  ];
  const { data: trainingMaxRows } =
    tmExerciseIds.length > 0
      ? await supabase
          .from("program_training_maxes")
          .select("exercise_id, training_max_kg")
          .eq("program_id", program.id)
          .in("exercise_id", tmExerciseIds)
      : { data: [] };
  const trainingMaxKgByExerciseId = new Map(
    (trainingMaxRows ?? []).map((r) => [r.exercise_id, r.training_max_kg]),
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Today&apos;s Session</h1>
          <Link href={`/programs/${program.id}`} className="text-sm text-orange-500 hover:underline">
            Back to program
          </Link>
        </div>

        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">{program.name}</p>
          <h2 className="text-lg font-semibold text-white">
            Week {week.week_number} — {session.name || `Session ${session.session_number}`}
          </h2>
        </div>

        {sessionExercises.length === 0 ? (
          <p className="text-sm text-neutral-500">This session has no exercises yet.</p>
        ) : (
          <ul className="space-y-3">
            {sessionExercises.map((pe) => {
              const exerciseName = exerciseNameById.get(pe.exercise_id) ?? "Unknown exercise";
              const primaryLift = primaryLiftById.get(pe.exercise_id);
              const setsRepsDisplay = formatSetsReps(pe.sets, pe.reps, pe.is_amrap);

              if (pe.percent_of_max == null) {
                const logHref = buildLogHref(pe.exercise_id, primaryLift, pe.reps, pe.is_amrap, null);
                return (
                  <li
                    key={pe.id}
                    className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 p-4 text-white"
                  >
                    <span>
                      {exerciseName} — {setsRepsDisplay}
                    </span>
                    <Link href={logHref} className="text-sm text-orange-500 hover:underline">
                      Log this set
                    </Link>
                  </li>
                );
              }

              const trainingMaxKg = trainingMaxKgByExerciseId.get(pe.exercise_id);

              if (trainingMaxKg == null) {
                const logHref = buildLogHref(pe.exercise_id, primaryLift, pe.reps, pe.is_amrap, null);
                return (
                  <li
                    key={pe.id}
                    className="rounded-md border border-orange-700 bg-neutral-900 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white">
                        {exerciseName} — {setsRepsDisplay} @ {pe.percent_of_max}%
                      </p>
                      <Link href={logHref} className="text-sm text-orange-500 hover:underline">
                        Log this set
                      </Link>
                    </div>
                    <p className="mt-1 text-sm text-orange-500">
                      No training max set for this exercise yet.{" "}
                      <Link href={`/programs/${program.id}`} className="underline">
                        Set it on the program page
                      </Link>
                      .
                    </p>
                  </li>
                );
              }

              const resolvedWeight =
                Math.round(fromKg(trainingMaxKg * (pe.percent_of_max / 100), unit) * 10) / 10;
              const tmDisplay = Math.round(fromKg(trainingMaxKg, unit) * 10) / 10;
              const logHref = buildLogHref(
                pe.exercise_id,
                primaryLift,
                pe.reps,
                pe.is_amrap,
                roundToLoadableIncrement(resolvedWeight, unit),
              );

              return (
                <li
                  key={pe.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 p-4 text-white"
                >
                  <span>
                    {exerciseName} — {setsRepsDisplay} @ {resolvedWeight}
                    {unit}{" "}
                    <span className="text-sm text-neutral-400">
                      ({pe.percent_of_max}% of {tmDisplay}
                      {unit} TM)
                    </span>
                  </span>
                  <Link href={logHref} className="text-sm text-orange-500 hover:underline">
                    Log this set
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
