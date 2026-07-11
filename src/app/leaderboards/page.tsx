import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, weightClassSortKey, type LeaderboardEntry } from "@/lib/leaderboards/rankings";
import type { LiftBenchmarkRow, SBDLift } from "@/lib/standards/benchmarks";
import { LeaderboardFilters } from "./LeaderboardFilters";

const VALID_LIFTS: SBDLift[] = ["Squat", "Bench Press", "Deadlift"];

function RankedList({ title, entries }: { title: string; entries: LeaderboardEntry[] }) {
  return (
    <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="mb-3 text-sm font-semibold text-neutral-300">{title}</h2>
      <ol className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.userId}
            className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-950 px-4 py-2.5"
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-right text-sm font-semibold text-neutral-500">
                {entry.rank}
              </span>
              <span className="text-white">{entry.nickname}</span>
            </span>
            <span className="font-semibold text-orange-400">{entry.e1rm}kg</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ lift?: string; sex?: string; groupBy?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const lift: SBDLift = VALID_LIFTS.includes(params.lift as SBDLift)
    ? (params.lift as SBDLift)
    : "Squat";
  const sex: "M" | "F" = params.sex === "F" ? "F" : "M";
  const groupBy: "weightClass" | "overall" = params.groupBy === "overall" ? "overall" : "weightClass";

  const { data: bestLifts } = await supabase
    .from("best_lifts")
    .select("user_id, lift, best_e1rm")
    .eq("lift", lift);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, gender, bodyweight, unit, leaderboard_opt_in");

  const { data: tieBreakWorkouts } = await supabase
    .from("workouts")
    .select("user_id, e1rm, logged_at")
    .eq("lift", lift)
    .eq("missed", false);

  let benchmarkRows: LiftBenchmarkRow[] = [];
  if (groupBy === "weightClass") {
    const { data } = await supabase
      .from("lift_benchmarks")
      .select(
        "weight_class, squat_p10, squat_p25, squat_p50, squat_p75, squat_p90, squat_p95, squat_p99, bench_p10, bench_p25, bench_p50, bench_p75, bench_p90, bench_p95, bench_p99, deadlift_p10, deadlift_p25, deadlift_p50, deadlift_p75, deadlift_p90, deadlift_p95, deadlift_p99",
      )
      .eq("Sex", sex);
    benchmarkRows = data ?? [];
  }

  const entries = getLeaderboard({
    lift,
    sex,
    groupBy,
    bestLifts: bestLifts ?? [],
    profiles: profiles ?? [],
    benchmarkRows,
    tieBreakWorkouts: tieBreakWorkouts ?? [],
  });

  const buckets = new Map<string, LeaderboardEntry[]>();
  if (groupBy === "weightClass") {
    for (const entry of entries) {
      const key = entry.weightClassLabel ?? "Unclassified";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(entry);
    }
  }
  const sortedBucketKeys = [...buckets.keys()].sort(
    (a, b) => weightClassSortKey(a) - weightClassSortKey(b),
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Leaderboards</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <LeaderboardFilters lift={lift} sex={sex} groupBy={groupBy} />

        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No opted-in lifters to show yet for this lift/filter combination.
          </p>
        ) : groupBy === "overall" ? (
          <RankedList title="Overall" entries={entries} />
        ) : (
          sortedBucketKeys.map((key) => (
            <RankedList key={key} title={key} entries={buckets.get(key)!} />
          ))
        )}
      </div>
    </div>
  );
}
