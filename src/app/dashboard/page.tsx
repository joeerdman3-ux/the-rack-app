import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { logSet, deleteSet } from "./actions";
import { logAccessorySet, deleteAccessoryLog, createExercise } from "./accessoryActions";
import { LoggingSection } from "./LoggingSection";
import { StandardsPanel } from "@/components/StandardsPanel";
import {
  diagnose,
  type Bests,
  type StickingPointDiagnosis,
  type TiedStickingPointDiagnosis,
  type TaggedSet,
} from "@/lib/standards/diagnosis";
import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import type { ExerciseMuscleGroup } from "@/lib/lifting/muscleGroups";
import {
  computeAgeBucket,
  estimatePercentile,
  genderToSex,
  getSBDThresholdsKg,
  pickNearestBenchmarkRow,
  toKg,
  type SBDLift,
} from "@/lib/standards/benchmarks";
import type { RatioThresholds } from "@/lib/standards/tables";
import { mapPrescriptionRows } from "@/lib/standards/stickingPoints";

const SBD_LIFTS: SBDLift[] = ["Squat", "Bench Press", "Deadlift"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Teaser banner is hidden once the user's already on the waitlist — no
  // reason to keep advertising something they've already signed up for.
  const { data: waitlistEntry } = await supabase
    .from("premium_waitlist")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const alreadyOnWaitlist = waitlistEntry != null;

  const unit = profile?.unit ?? "lb";
  const today = new Date().toISOString().slice(0, 10);

  const { data: todaysSets } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .eq("logged_date", today)
    .order("logged_at", { ascending: false });

  const { data: todaysAccessoryLogs } = await supabase
    .from("accessory_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("logged_date", today)
    .order("logged_at", { ascending: false });

  const { data: hitSets } = await supabase
    .from("workouts")
    .select("lift, e1rm")
    .eq("user_id", user.id)
    .eq("missed", false)
    .order("e1rm", { ascending: false });

  const bests: Bests = {};
  for (const row of hitSets ?? []) {
    const lift = row.lift as MainLift;
    if (MAIN_LIFTS.includes(lift) && bests[lift] === undefined) {
      bests[lift] = row.e1rm;
    }
  }

  // Feeds diagnose(): both true misses and stalled (ground-out) reps carry
  // a sticking point and count toward a diagnosis, just at different
  // severity weight there. The `not (missed and stalled)` check constraint
  // guarantees every row this .or() returns is missed XOR stalled, so
  // `stalled` alone is enough to tell diagnose() which — no need to also
  // select `missed`.
  const { data: taggedRows } = await supabase
    .from("workouts")
    .select("lift, sticking_point, logged_date, stalled")
    .eq("user_id", user.id)
    .or("missed.eq.true,stalled.eq.true");
  const taggedSets: TaggedSet[] = taggedRows ?? [];

  const gender = profile?.gender ?? null;
  const bodyweight = profile?.bodyweight ?? null;
  const birthdate = profile?.birthdate ?? null;

  const sbdThresholdsKg: Partial<Record<SBDLift, RatioThresholds>> = {};
  const percentileEstimates: Partial<Record<SBDLift, string>> = {};
  if (gender && bodyweight && birthdate) {
    const sex = genderToSex(gender);
    const ageBucket = computeAgeBucket(birthdate);
    const bodyweightKg = toKg(bodyweight, unit);

    const { data: benchmarkRows } = await supabase
      .from("lift_benchmarks")
      .select(
        "weight_class, squat_p10, squat_p25, squat_p50, squat_p75, squat_p90, squat_p95, squat_p99, bench_p10, bench_p25, bench_p50, bench_p75, bench_p90, bench_p95, bench_p99, deadlift_p10, deadlift_p25, deadlift_p50, deadlift_p75, deadlift_p90, deadlift_p95, deadlift_p99",
      )
      .eq("Sex", sex)
      .eq("age_bucket", ageBucket);

    const matchedRow = pickNearestBenchmarkRow(benchmarkRows ?? [], bodyweightKg);
    if (matchedRow) {
      for (const lift of SBD_LIFTS) {
        const thresholds = getSBDThresholdsKg(matchedRow, lift);
        if (thresholds) sbdThresholdsKg[lift] = thresholds;

        const best = bests[lift];
        if (best !== undefined) {
          const estimate = estimatePercentile(matchedRow, lift, toKg(best, unit));
          if (estimate) percentileEstimates[lift] = estimate;
        }
      }
    }
  }

  const diagnosis = diagnose(
    bests,
    gender,
    bodyweight,
    taggedSets,
    unit,
    sbdThresholdsKg,
  );
  const hasProfile = Boolean(gender && bodyweight && birthdate);

  // diagnose() determines *which* sticking points (if any, one per lift
  // tied for lowest tier that's cleared the minimum-sample-size threshold)
  // but stays DB-free; fetch prescriptions for the "ready"/"tied" ones here
  // in one batch and merge them in before rendering. "pending" entries
  // (below threshold) have no stickingPoint(s)/prescriptions to look up.
  const needsPrescriptions = diagnosis.stickingPointDiagnoses.filter(
    (d): d is StickingPointDiagnosis | TiedStickingPointDiagnosis =>
      d.status === "ready" || d.status === "tied",
  );
  if (needsPrescriptions.length > 0) {
    const stickingPoints = [
      ...new Set(
        needsPrescriptions.flatMap((d) => (d.status === "ready" ? [d.stickingPoint] : d.stickingPoints)),
      ),
    ];

    const { data: prescriptionRows } = await supabase
      .from("sticking_point_prescriptions")
      .select("sticking_point, exercise_id, rationale, sets_reps, sort_order, category, target_percent")
      .in("sticking_point", stickingPoints)
      .order("sort_order", { ascending: true });

    const exerciseIds = [...new Set((prescriptionRows ?? []).map((r) => r.exercise_id))];
    const { data: exerciseRows } =
      exerciseIds.length > 0
        ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
        : { data: [] };

    type PrescriptionRow = NonNullable<typeof prescriptionRows>[number];
    const rowsByStickingPoint = new Map<string, PrescriptionRow[]>();
    for (const row of prescriptionRows ?? []) {
      const list = rowsByStickingPoint.get(row.sticking_point) ?? [];
      list.push(row);
      rowsByStickingPoint.set(row.sticking_point, list);
    }

    for (const d of needsPrescriptions) {
      // bests[d.lift] is already in the user's display unit (see
      // mapPrescriptionRows' comment) — no fromKg/toKg conversion here.
      const e1rm = bests[d.lift] ?? null;
      if (d.status === "ready") {
        d.prescriptions = mapPrescriptionRows(
          rowsByStickingPoint.get(d.stickingPoint) ?? [],
          exerciseRows ?? [],
          e1rm,
        );
      } else {
        d.prescriptions = d.stickingPoints.flatMap((sp) =>
          mapPrescriptionRows(rowsByStickingPoint.get(sp) ?? [], exerciseRows ?? [], e1rm),
        );
      }
    }
  }

  // For the Accessory logging picker — unrelated to the main-lift/standards
  // data above.
  const { data: accessoryExercisesRaw } = await supabase
    .from("exercises")
    .select("id, name, equipment")
    .order("name", { ascending: true });

  // exercise_muscle_groups is a separate table (many-to-many, ratio-weighted)
  // rather than a joined/embedded select — matches this file's existing
  // Map-based join pattern (see accessoryExerciseNameById just below) rather
  // than PostgREST's embedded-resource syntax, which nothing else here uses.
  const { data: muscleGroupRows } = await supabase
    .from("exercise_muscle_groups")
    .select("exercise_id, muscle_group, ratio");

  const muscleGroupsByExerciseId = new Map<string, ExerciseMuscleGroup[]>();
  for (const row of muscleGroupRows ?? []) {
    const list = muscleGroupsByExerciseId.get(row.exercise_id) ?? [];
    list.push({ muscle_group: row.muscle_group, ratio: row.ratio });
    muscleGroupsByExerciseId.set(row.exercise_id, list);
  }

  const accessoryExercises = (accessoryExercisesRaw ?? []).map((e) => ({
    ...e,
    muscle_groups: muscleGroupsByExerciseId.get(e.id) ?? [],
  }));

  const accessoryExerciseNameById = new Map(
    accessoryExercises.map((e) => [e.id, e.name]),
  );

  // "Today's sets" merges workouts (main lifts) and accessory_logs into one
  // time-ordered list. Each entry keeps its source table's own shape/fields
  // (accessory logs have no e1RM; main-lift sets have no notes) rather than
  // forcing a shared shape, and is tagged so the render can style/route
  // Delete differently per type. Purely additive: the main-lift branch below
  // renders identically to the old todaysSets-only list.
  type TodaysEntry =
    | {
        type: "main";
        id: string;
        logged_at: string;
        lift: string;
        weight: number;
        reps: number;
        rpe: number | null;
        missed: boolean;
        stalled: boolean;
        e1rm: number;
      }
    | {
        type: "accessory";
        id: string;
        logged_at: string;
        exerciseName: string;
        weight: number;
        reps: number;
        rpe: number | null;
        notes: string | null;
      };

  const todaysEntries: TodaysEntry[] = [
    ...(todaysSets ?? []).map(
      (set): TodaysEntry => ({
        type: "main",
        id: set.id,
        logged_at: set.logged_at,
        lift: set.lift,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        missed: set.missed,
        stalled: set.stalled,
        e1rm: set.e1rm,
      }),
    ),
    ...(todaysAccessoryLogs ?? []).map(
      (log): TodaysEntry => ({
        type: "accessory",
        id: log.id,
        logged_at: log.logged_at,
        exerciseName: accessoryExerciseNameById.get(log.exercise_id) ?? "Unknown exercise",
        weight: log.weight,
        reps: log.reps,
        rpe: log.rpe,
        notes: log.notes,
      }),
    ),
  ].sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1));

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">The Rack</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              History
            </Link>
            <Link
              href="/volume"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Volume
            </Link>
            <Link
              href="/leaderboards"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Leaderboards
            </Link>
            <Link
              href="/exercises"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Exercises
            </Link>
            <Link
              href="/templates"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Templates
            </Link>
            <Link
              href="/programs"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Programs
            </Link>
            <Link
              href="/settings"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Settings
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {!alreadyOnWaitlist && (
          <Link
            href="/settings"
            className="mb-6 block text-sm text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-300 hover:decoration-neutral-500 active:text-neutral-200"
          >
            Premium is coming — see what&apos;s included →
          </Link>
        )}

        <LoggingSection
          unit={unit}
          exercises={accessoryExercises}
          logSetAction={logSet}
          logAccessoryAction={logAccessorySet}
          createExerciseAction={createExercise}
        />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Today&apos;s sets</h2>

          {todaysEntries.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing logged yet today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysEntries.map((entry) =>
                entry.type === "main" ? (
                  <li
                    key={`main-${entry.id}`}
                    className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {entry.lift} — {entry.weight}
                        {unit} × {entry.reps}
                        {entry.rpe ? ` @ RPE ${entry.rpe}` : ""}
                        {entry.missed && (
                          <span className="ml-2 rounded bg-red-950 px-1.5 py-0.5 text-xs text-red-300">
                            Missed
                          </span>
                        )}
                        {entry.stalled && (
                          <span className="ml-2 rounded bg-amber-950 px-1.5 py-0.5 text-xs text-amber-300">
                            Stalled
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-neutral-500">e1RM: {entry.e1rm}{unit}</p>
                    </div>
                    <form action={deleteSet.bind(null, entry.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-red-800 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </form>
                  </li>
                ) : (
                  <li
                    key={`accessory-${entry.id}`}
                    className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">
                        <span className="mr-2 rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                          Accessory
                        </span>
                        {entry.exerciseName} — {entry.weight}
                        {unit} × {entry.reps}
                        {entry.rpe ? ` @ RPE ${entry.rpe}` : ""}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-neutral-500">{entry.notes}</p>
                      )}
                    </div>
                    <form action={deleteAccessoryLog.bind(null, entry.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-red-800 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </form>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>

        <StandardsPanel
          diagnosis={diagnosis}
          unit={unit}
          hasProfile={hasProfile}
          percentileEstimates={percentileEstimates}
        />
      </div>
    </div>
  );
}
