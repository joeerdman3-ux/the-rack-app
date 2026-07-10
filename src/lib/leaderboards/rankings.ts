import {
  genderToSex,
  pickNearestBenchmarkRow,
  toKg,
  type LiftBenchmarkRow,
  type SBDLift,
} from "@/lib/standards/benchmarks";

// Minimal row shapes this function needs — page.tsx fetches these with plain
// (non-embedded) Supabase queries and passes the raw rows in; all joining
// happens here in JS, matching the pattern already used for lift_benchmarks
// and sticking_point_prescriptions.

export interface BestLiftRow {
  user_id: string;
  lift: string;
  best_e1rm: number;
}

export interface LeaderboardProfileRow {
  id: string;
  nickname: string | null;
  gender: "male" | "female" | null;
  bodyweight: number | null;
  unit: "lb" | "kg" | null;
  leaderboard_opt_in: boolean;
}

export interface TieBreakWorkoutRow {
  user_id: string;
  e1rm: number;
  logged_at: string;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  e1rm: number;
  weightClassLabel: string | null;
  rank: number;
}

export interface GetLeaderboardParams {
  lift: SBDLift;
  sex: "M" | "F";
  groupBy: "weightClass" | "overall";
  bestLifts: BestLiftRow[];
  profiles: LeaderboardProfileRow[];
  // lift_benchmarks rows for this sex (any age_bucket is fine — deduped by
  // weight_class internally so pickNearestBenchmarkRow isn't confused by
  // the same weight_class repeating across age brackets). Only needed for
  // groupBy "weightClass"; pass [] for "overall".
  benchmarkRows: LiftBenchmarkRow[];
  // Non-missed workouts for this lift, used only to resolve the "who hit
  // this e1RM first" tie-break.
  tieBreakWorkouts: TieBreakWorkoutRow[];
}

// "83" -> "83kg", "83+" -> "83kg+".
export function formatWeightClassLabel(rawWeightClass: string): string {
  const trimmed = rawWeightClass.trim();
  return trimmed.endsWith("+") ? `${trimmed.slice(0, -1)}kg+` : `${trimmed}kg`;
}

// For sorting bucket labels lightest-to-heaviest in the UI.
export function weightClassSortKey(label: string): number {
  const numeric = label.replace(/kg\+?$/, "");
  const value = parseFloat(numeric);
  return Number.isFinite(value) ? value : Infinity;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

interface Candidate {
  userId: string;
  nickname: string;
  e1rmKg: number;
  tieBreakAt: string;
  weightClassLabel: string | null;
}

export function getLeaderboard({
  lift,
  sex,
  groupBy,
  bestLifts,
  profiles,
  benchmarkRows,
  tieBreakWorkouts,
}: GetLeaderboardParams): LeaderboardEntry[] {
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Earliest logged_at per (user_id, e1rm) — resolves "who hit it first"
  // when two lifters tie on best_e1rm.
  const earliestByUserAndE1rm = new Map<string, string>();
  for (const w of tieBreakWorkouts) {
    const key = `${w.user_id}:${w.e1rm}`;
    const existing = earliestByUserAndE1rm.get(key);
    if (!existing || w.logged_at < existing) {
      earliestByUserAndE1rm.set(key, w.logged_at);
    }
  }

  // Dedupe by weight_class (the same classes repeat once per age_bucket in
  // lift_benchmarks) so pickNearestBenchmarkRow sees each class once.
  const distinctBenchmarkRows: LiftBenchmarkRow[] = [];
  const seenWeightClasses = new Set<string>();
  for (const row of benchmarkRows) {
    if (seenWeightClasses.has(row.weight_class)) continue;
    seenWeightClasses.add(row.weight_class);
    distinctBenchmarkRows.push(row);
  }

  const candidates: Candidate[] = [];

  for (const bestLift of bestLifts) {
    if (bestLift.lift !== lift) continue;

    const profile = profileById.get(bestLift.user_id);
    if (!profile || !profile.leaderboard_opt_in) continue;
    if (!profile.gender || genderToSex(profile.gender) !== sex) continue;
    // Without a known unit we can't fairly convert this lifter's e1RM
    // alongside everyone else's, in either view.
    if (!profile.unit) continue;

    let weightClassLabel: string | null = null;
    if (groupBy === "weightClass") {
      // Can't classify without a bodyweight — excluded from this view only.
      if (!profile.bodyweight) continue;
      const bodyweightKg = toKg(profile.bodyweight, profile.unit);
      const matched = pickNearestBenchmarkRow(distinctBenchmarkRows, bodyweightKg);
      if (!matched) continue;
      weightClassLabel = formatWeightClassLabel(matched.weight_class);
    }

    const e1rmKg = toKg(bestLift.best_e1rm, profile.unit);
    const tieBreakAt =
      earliestByUserAndE1rm.get(`${bestLift.user_id}:${bestLift.best_e1rm}`) ??
      "9999-12-31T23:59:59Z";

    candidates.push({
      userId: bestLift.user_id,
      nickname: profile.nickname?.trim() || "Anonymous",
      e1rmKg,
      tieBreakAt,
      weightClassLabel,
    });
  }

  const bySortOrder = (a: Candidate, b: Candidate) =>
    b.e1rmKg - a.e1rmKg || a.tieBreakAt.localeCompare(b.tieBreakAt);

  if (groupBy === "overall") {
    return candidates
      .sort(bySortOrder)
      .map((c, i) => ({
        userId: c.userId,
        nickname: c.nickname,
        e1rm: round1(c.e1rmKg),
        weightClassLabel: null,
        rank: i + 1,
      }));
  }

  // weightClass: rank resets within each bucket, not global.
  const byBucket = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const key = c.weightClassLabel as string;
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key)!.push(c);
  }

  const result: LeaderboardEntry[] = [];
  for (const bucketCandidates of byBucket.values()) {
    bucketCandidates.sort(bySortOrder);
    bucketCandidates.forEach((c, i) => {
      result.push({
        userId: c.userId,
        nickname: c.nickname,
        e1rm: round1(c.e1rmKg),
        weightClassLabel: c.weightClassLabel,
        rank: i + 1,
      });
    });
  }
  return result;
}
