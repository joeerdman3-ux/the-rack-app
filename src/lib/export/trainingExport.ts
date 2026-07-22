import type { Unit } from "@/lib/lifting/plates";

export interface WorkoutExportRow {
  lift: string;
  weight: number;
  reps: number;
  rpe: number | null;
  missed: boolean;
  stalled: boolean;
  sticking_point: string | null;
  e1rm: number;
  logged_date: string;
  logged_at: string;
}

export interface AccessoryExportRow {
  exercise_id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  notes: string | null;
  logged_date: string;
  logged_at: string;
}

export interface ExportRow {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  rpe: number | null;
  // null for accessory rows — missed/stalled/sticking point/e1RM aren't
  // tracked for accessory work, so these render as blank cells rather
  // than "false"/0, which would misleadingly imply the concept applies.
  missed: boolean | null;
  stalled: boolean | null;
  stickingPoint: string | null;
  e1rm: number | null;
  notes: string | null;
}

// Combines workouts + accessory_logs (already scoped to the requesting
// user by the caller) into one row shape, sorted most-recent-first —
// matches History's existing convention. logged_at (not itself an
// exported column) is only used here to interleave both sources into a
// single correct chronological order.
export function buildExportRows(
  workoutRows: WorkoutExportRow[],
  accessoryRows: AccessoryExportRow[],
  exerciseNameById: Map<string, string>,
): ExportRow[] {
  const combined: (ExportRow & { loggedAt: string })[] = [
    ...workoutRows.map((w) => ({
      date: w.logged_date,
      exercise: w.lift,
      weight: w.weight,
      reps: w.reps,
      rpe: w.rpe,
      missed: w.missed,
      stalled: w.stalled,
      stickingPoint: w.sticking_point,
      e1rm: w.e1rm,
      notes: null,
      loggedAt: w.logged_at,
    })),
    ...accessoryRows.map((a) => ({
      date: a.logged_date,
      exercise: exerciseNameById.get(a.exercise_id) ?? "Unknown exercise",
      weight: a.weight,
      reps: a.reps,
      rpe: a.rpe,
      missed: null,
      stalled: null,
      stickingPoint: null,
      e1rm: null,
      notes: a.notes,
      loggedAt: a.logged_at,
    })),
  ];

  combined.sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : a.loggedAt > b.loggedAt ? -1 : 0));
  return combined.map((row) => ({
    date: row.date,
    exercise: row.exercise,
    weight: row.weight,
    reps: row.reps,
    rpe: row.rpe,
    missed: row.missed,
    stalled: row.stalled,
    stickingPoint: row.stickingPoint,
    e1rm: row.e1rm,
    notes: row.notes,
  }));
}

const CSV_HEADERS = [
  "Date",
  "Exercise",
  "Weight",
  "Unit",
  "Reps",
  "RPE",
  "Missed",
  "Stalled",
  "Sticking Point",
  "e1RM",
  "Notes",
];

// Quotes a field only when necessary (contains a comma, quote, or
// newline), doubling any internal quotes — the standard minimal CSV
// escaping rule, so plain values stay readable unquoted.
function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function boolCell(value: boolean | null): string {
  if (value === null) return "";
  return value ? "Yes" : "No";
}

// unit reflects the account's CURRENT profile.unit setting, applied to
// every row — there's no per-row unit stored anywhere in this app (weight/
// e1rm are saved in whatever unit was active at logging time, with no
// historical record of which), so this is the same best-effort assumption
// every other page already makes, not a new limitation introduced here.
export function toCsv(rows: ExportRow[], unit: Unit): string {
  const lines = [CSV_HEADERS.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.exercise,
        String(row.weight),
        unit,
        String(row.reps),
        row.rpe != null ? String(row.rpe) : "",
        boolCell(row.missed),
        boolCell(row.stalled),
        row.stickingPoint ?? "",
        row.e1rm != null ? String(row.e1rm) : "",
        row.notes ?? "",
      ]
        .map(csvField)
        .join(","),
    );
  }
  // CRLF line endings — the standard CSV convention, and what makes
  // Excel/Sheets most reliably recognize this as a proper CSV.
  return lines.join("\r\n");
}
