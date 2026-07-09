import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { logSet, deleteSet } from "./actions";
import { LogForm } from "./LogForm";
import { StandardsPanel } from "@/components/StandardsPanel";
import { diagnose, type Bests } from "@/lib/standards/diagnosis";
import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import {
  computeAgeBucket,
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

  const unit = profile?.unit ?? "lb";
  const today = new Date().toISOString().slice(0, 10);

  const { data: todaysSets } = await supabase
    .from("workouts")
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

  const { data: missedSets } = await supabase
    .from("workouts")
    .select("lift, sticking_point")
    .eq("user_id", user.id)
    .eq("missed", true);

  const gender = profile?.gender ?? null;
  const bodyweight = profile?.bodyweight ?? null;
  const birthdate = profile?.birthdate ?? null;

  const sbdThresholdsKg: Partial<Record<SBDLift, RatioThresholds>> = {};
  if (gender && bodyweight && birthdate) {
    const sex = genderToSex(gender);
    const ageBucket = computeAgeBucket(birthdate);
    const bodyweightKg = toKg(bodyweight, unit);

    const { data: benchmarkRows } = await supabase
      .from("lift_benchmarks")
      .select(
        "weight_class, squat_p25, squat_p50, squat_p75, squat_p90, bench_p25, bench_p50, bench_p75, bench_p90, deadlift_p25, deadlift_p50, deadlift_p75, deadlift_p90",
      )
      .eq("Sex", sex)
      .eq("age_bucket", ageBucket);

    const matchedRow = pickNearestBenchmarkRow(benchmarkRows ?? [], bodyweightKg);
    if (matchedRow) {
      for (const lift of SBD_LIFTS) {
        const thresholds = getSBDThresholdsKg(matchedRow, lift);
        if (thresholds) sbdThresholdsKg[lift] = thresholds;
      }
    }
  }

  const diagnosis = diagnose(
    bests,
    gender,
    bodyweight,
    missedSets ?? [],
    unit,
    sbdThresholdsKg,
  );
  const hasProfile = Boolean(gender && bodyweight && birthdate);

  // diagnose() determines *which* sticking point (if any) but stays DB-free;
  // fetch its prescriptions here and merge them in before rendering.
  if (diagnosis.stickingPointDiagnosis) {
    const { stickingPoint } = diagnosis.stickingPointDiagnosis;

    const { data: prescriptionRows } = await supabase
      .from("sticking_point_prescriptions")
      .select("exercise_id, rationale, sets_reps, sort_order")
      .eq("sticking_point", stickingPoint)
      .order("sort_order", { ascending: true });

    const exerciseIds = [...new Set((prescriptionRows ?? []).map((r) => r.exercise_id))];
    const { data: exerciseRows } =
      exerciseIds.length > 0
        ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
        : { data: [] };

    diagnosis.stickingPointDiagnosis.prescriptions = mapPrescriptionRows(
      prescriptionRows ?? [],
      exerciseRows ?? [],
    );
  }

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

        <LogForm unit={unit} action={logSet} />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Today&apos;s sets</h2>

          {!todaysSets || todaysSets.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing logged yet today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysSets.map((set) => (
                <li
                  key={set.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {set.lift} — {set.weight}
                      {unit} × {set.reps}
                      {set.rpe ? ` @ RPE ${set.rpe}` : ""}
                      {set.missed && (
                        <span className="ml-2 rounded bg-red-950 px-1.5 py-0.5 text-xs text-red-300">
                          Missed
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">e1RM: {set.e1rm}{unit}</p>
                  </div>
                  <form action={deleteSet.bind(null, set.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-red-800 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <StandardsPanel diagnosis={diagnosis} unit={unit} hasProfile={hasProfile} />
      </div>
    </div>
  );
}
