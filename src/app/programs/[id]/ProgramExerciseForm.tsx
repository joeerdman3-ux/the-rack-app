"use client";

import { useState } from "react";
import { ExerciseSearchPicker, type ExercisePickerOption } from "@/components/ExerciseSearchPicker";
import type { addProgramExercise } from "../actions";

export function ProgramExerciseForm({
  programId,
  sessionId,
  exercises,
  nextSortOrder,
  action,
}: {
  programId: string;
  sessionId: string;
  exercises: ExercisePickerOption[];
  nextSortOrder: number;
  action: typeof addProgramExercise;
}) {
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<ExercisePickerOption | null>(null);

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
      >
        + Add Exercise
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-950 p-4">
      {!selected ? (
        <>
          <ExerciseSearchPicker exercises={exercises} onSelect={setSelected} />
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="mt-2 text-xs text-neutral-500 hover:underline"
          >
            Cancel
          </button>
        </>
      ) : (
        <form
          action={async (formData) => {
            await action(formData);
            setSelected(null);
            setAdding(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="program_id" value={programId} />
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="exercise_id" value={selected.id} />
          <input type="hidden" name="sort_order" value={nextSortOrder} />

          <div className="flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2">
            <span className="text-white">{selected.name}</span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-orange-500 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="pe-sets" className="mb-1 block text-sm text-neutral-300">
                Sets
              </label>
              <input
                id="pe-sets"
                name="sets"
                type="number"
                inputMode="numeric"
                step={1}
                min={1}
                required
                defaultValue={3}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="pe-reps" className="mb-1 block text-sm text-neutral-300">
                Reps
              </label>
              <input
                id="pe-reps"
                name="reps"
                type="number"
                inputMode="numeric"
                step={1}
                min={1}
                required
                defaultValue={5}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="pe-percent" className="mb-1 block text-sm text-neutral-300">
                % of Max
              </label>
              <input
                id="pe-percent"
                name="percent_of_max"
                type="number"
                inputMode="decimal"
                step={0.5}
                min={0}
                max={100}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="is_amrap"
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
            />
            AMRAP (reps is a target, e.g. &quot;5+&quot;)
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500"
          >
            Add to session
          </button>
        </form>
      )}
    </div>
  );
}
