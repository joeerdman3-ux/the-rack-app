export interface DiagnosisSnapshotRow {
  lift: string;
  sticking_point: string;
  snapshot_date: string;
}

export type TrendDirection = "worsening" | "improving" | "stable";

export interface TrendResult {
  lift: string;
  stickingPoint: string;
  direction: TrendDirection;
  recentCount: number;
  priorCount: number;
  totalSnapshots: number;
}

// Below this many total snapshots for a (lift, sticking_point) pair, a
// trend read is too noisy to show — same sample-size-gating philosophy
// diagnosis.ts already applies before showing a diagnosis at all.
const MIN_SNAPSHOTS_FOR_TREND = 3;

// Below this many distinct days between the oldest and newest snapshot,
// the group could be entirely one bad training session (e.g. 3 missed
// sets in a single workout) rather than a real pattern over time — 14
// days reliably spans multiple sessions for any realistic training
// frequency without requiring months of history before a first read.
const MIN_DAY_SPAN_FOR_TREND = 14;

// Compares raw snapshot COUNT in the most recent 28 days against the 28
// days before that — NOT the stored confidence value. confidence is a
// proportional share (this sticking point's misses ÷ all tagged misses on
// the lift), which can rise or fall because OTHER sticking points changed,
// even when this one didn't — e.g. if off-chest misses resolve entirely,
// midrange's share rises even though midrange itself is unchanged. Raw
// count avoids that: more tagged misses in a window is unambiguously more
// misses, full stop.
const WINDOW_DAYS = 28;

// A swing of exactly 1 miss between windows is normal week-to-week noise
// for small integer counts; 2+ is treated as a real shift.
const STABLE_DELTA_THRESHOLD = 2;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daySpan(oldest: Date, newest: Date): number {
  return (newest.getTime() - oldest.getTime()) / MS_PER_DAY;
}

// Groups snapshots by (lift, sticking_point), applies both the count gate
// and the day-span gate, and returns a trend read only for groups that
// clear both. `now` is a parameter (not read internally) so this stays
// pure and deterministically testable rather than depending on the wall
// clock.
export function computeTrends(snapshots: DiagnosisSnapshotRow[], now: Date = new Date()): TrendResult[] {
  const groups = new Map<string, DiagnosisSnapshotRow[]>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.lift}::${snapshot.sticking_point}`;
    const list = groups.get(key) ?? [];
    list.push(snapshot);
    groups.set(key, list);
  }

  const recentBoundary = new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY);
  const priorBoundary = new Date(now.getTime() - WINDOW_DAYS * 2 * MS_PER_DAY);

  const results: TrendResult[] = [];
  for (const rows of groups.values()) {
    if (rows.length < MIN_SNAPSHOTS_FOR_TREND) continue;

    const dates = rows.map((r) => new Date(r.snapshot_date));
    const oldest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const newest = new Date(Math.max(...dates.map((d) => d.getTime())));
    if (daySpan(oldest, newest) < MIN_DAY_SPAN_FOR_TREND) continue;

    let recentCount = 0;
    let priorCount = 0;
    for (const date of dates) {
      if (date >= recentBoundary) recentCount++;
      else if (date >= priorBoundary) priorCount++;
    }

    const delta = recentCount - priorCount;
    const direction: TrendDirection =
      delta >= STABLE_DELTA_THRESHOLD
        ? "worsening"
        : delta <= -STABLE_DELTA_THRESHOLD
          ? "improving"
          : "stable";

    results.push({
      lift: rows[0].lift,
      stickingPoint: rows[0].sticking_point,
      direction,
      recentCount,
      priorCount,
      totalSnapshots: rows.length,
    });
  }

  return results;
}
