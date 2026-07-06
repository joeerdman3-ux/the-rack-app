import type { MainLift } from "@/lib/lifting/constants";

export interface WorkoutRow {
  lift: string;
  weight: number;
  reps: number;
  e1rm: number;
  missed: boolean;
  logged_date: string;
}

export interface Session {
  date: string;
  e1rm: number;
}

// Best (max) e1RM per calendar date, per lift, hit sets only, oldest first.
export function bestSessionsByLift(
  workouts: WorkoutRow[],
): Record<MainLift, Session[]> {
  const byLift = new Map<string, Map<string, number>>();

  for (const w of workouts) {
    if (w.missed) continue;
    if (!byLift.has(w.lift)) byLift.set(w.lift, new Map());
    const dates = byLift.get(w.lift)!;
    const existing = dates.get(w.logged_date);
    if (existing === undefined || w.e1rm > existing) {
      dates.set(w.logged_date, w.e1rm);
    }
  }

  const result = {} as Record<MainLift, Session[]>;
  for (const [lift, dates] of byLift) {
    result[lift as MainLift] = Array.from(dates.entries())
      .map(([date, e1rm]) => ({ date, e1rm }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return result;
}

export interface WeekTonnage {
  weekStart: string;
  tonnage: number;
}

function isoWeekStart(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

// Total tonnage (weight * reps, hit + missed) grouped by ISO week (Monday start).
export function weeklyTonnage(workouts: WorkoutRow[]): WeekTonnage[] {
  const byWeek = new Map<string, number>();
  for (const w of workouts) {
    const weekStart = isoWeekStart(w.logged_date);
    byWeek.set(weekStart, (byWeek.get(weekStart) ?? 0) + w.weight * w.reps);
  }
  return Array.from(byWeek.entries())
    .map(([weekStart, tonnage]) => ({ weekStart, tonnage }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

// Flags a lift whose best e1RM has gone flat or declined across its last 3 sessions.
export function isDeloading(sessions: Session[]): boolean {
  if (sessions.length < 3) return false;
  const [s1, s2, s3] = sessions.slice(-3);
  return s2.e1rm <= s1.e1rm && s3.e1rm <= s2.e1rm;
}
