"use client";

import { useState } from "react";
import type { updateProgramExercise } from "../actions";

// Editing existing values only — no reordering/add/remove here, that stays
// in ProgramExerciseForm (add) and the plain exercise list (no delete yet).
export function ProgramExerciseEditForm({
  id,
  programId,
  exerciseName,
  sets,
  reps,
  percentOfMax,
  isAmrap,
  action,
}: {
  id: string;
  programId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  percentOfMax: number | null;
  isAmrap: boolean;
  action: typeof updateProgramExercise;
}) {
  const [editing, setEditing] = useState(false);
  const repsDisplay = isAmrap ? `${reps}+` : `${reps}`;

  if (!editing) {
    return (
      <li className="flex items-center justify-between text-sm text-neutral-300">
        <span>
          {exerciseName} — {sets}×{repsDisplay}
          {percentOfMax != null && ` @ ${percentOfMax}%`}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-orange-500 hover:underline"
        >
          Edit
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-neutral-800 bg-neutral-950 p-3">
      <form
        action={async (formData) => {
          await action(formData);
          setEditing(false);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="program_id" value={programId} />
        <input type="hidden" name="program_exercise_id" value={id} />

        <p className="text-sm text-white">{exerciseName}</p>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor={`sets-${id}`} className="mb-1 block text-xs text-neutral-400">
              Sets
            </label>
            <input
              id={`sets-${id}`}
              name="sets"
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              required
              defaultValue={sets}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor={`reps-${id}`} className="mb-1 block text-xs text-neutral-400">
              Reps
            </label>
            <input
              id={`reps-${id}`}
              name="reps"
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              required
              defaultValue={reps}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor={`percent-${id}`} className="mb-1 block text-xs text-neutral-400">
              % of Max
            </label>
            <input
              id={`percent-${id}`}
              name="percent_of_max"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0}
              max={100}
              defaultValue={percentOfMax ?? ""}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="is_amrap"
            defaultChecked={isAmrap}
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
          />
          AMRAP (reps is a target, e.g. &quot;5+&quot;)
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}
