"use client";

import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/lib/lifting/muscleGroups";

export interface MuscleGroupRow {
  muscleGroup: string;
  ratio: string;
}

export const EMPTY_MUSCLE_GROUP_ROW: MuscleGroupRow = { muscleGroup: "", ratio: "" };
// Implied ratio for the common case: one muscle group means it's the whole
// contribution. Ratio only becomes a user-facing input once a second row
// is added and the split actually needs to be specified.
export const SINGLE_ROW_RATIO = "1";

// Renders the "muscle_group"/"ratio" form fields shared by exercise
// creation (LogSetsForm) and editing (ExerciseLibrary) — controlled by the
// parent so each caller owns its own reset/prefill behavior, this just
// owns the row add/remove/select logic and field rendering. Not a <form>
// itself: fields are named so the parent's own <form action={...}> picks
// them up via FormData.getAll("muscle_group") / .getAll("ratio").
export function MuscleGroupRowsFields({
  rows,
  onChange,
}: {
  rows: MuscleGroupRow[];
  onChange: (rows: MuscleGroupRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<MuscleGroupRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...rows, { ...EMPTY_MUSCLE_GROUP_ROW }]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    // Collapsing back to a single row means the split no longer applies —
    // that row is implicitly the whole contribution again.
    onChange(next.length === 1 ? [{ ...next[0], ratio: SINGLE_ROW_RATIO }] : next);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm text-neutral-300">Muscle group(s)</span>
      {rows.map((row, index) => {
        // Excludes groups already picked in OTHER rows, so the same
        // muscle group can't be added twice.
        const availableGroups = MUSCLE_GROUPS.filter(
          (mg) => mg === row.muscleGroup || !rows.some((r) => r.muscleGroup === mg),
        );
        return (
          <div key={index} className="flex gap-2">
            <select
              aria-label={`Muscle group ${index + 1}`}
              name="muscle_group"
              required
              value={row.muscleGroup}
              onChange={(e) => updateRow(index, { muscleGroup: e.target.value })}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            >
              <option value="" disabled>
                Select muscle group
              </option>
              {availableGroups.map((mg) => (
                <option key={mg} value={mg}>
                  {MUSCLE_GROUP_LABELS[mg]}
                </option>
              ))}
            </select>
            {rows.length > 1 ? (
              <>
                <input
                  aria-label={`Ratio for muscle group ${index + 1}`}
                  name="ratio"
                  type="number"
                  inputMode="decimal"
                  step={0.05}
                  min={0.01}
                  max={1}
                  required
                  value={row.ratio}
                  onChange={(e) => updateRow(index, { ratio: e.target.value })}
                  placeholder="Ratio"
                  className="w-20 shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-white outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="shrink-0 rounded-md border border-neutral-700 px-2 py-2 text-xs text-neutral-400 hover:bg-neutral-800"
                >
                  Remove
                </button>
              </>
            ) : (
              // Falls back to SINGLE_ROW_RATIO only when the row has no
              // ratio yet (a fresh create-flow row) — an existing row
              // opened for editing keeps its actual stored ratio even if
              // it isn't exactly 1.0, rather than silently overwriting it
              // on save.
              <input type="hidden" name="ratio" value={row.ratio || SINGLE_ROW_RATIO} />
            )}
          </div>
        );
      })}
      {rows.length < MUSCLE_GROUPS.length && (
        <button type="button" onClick={addRow} className="text-xs text-orange-500 hover:underline">
          + Add muscle group
        </button>
      )}
    </div>
  );
}
