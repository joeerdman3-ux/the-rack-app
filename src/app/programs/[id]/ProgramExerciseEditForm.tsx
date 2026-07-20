"use client";

import { useState } from "react";
import type { updateProgramExercise, swapProgramExercise } from "../actions";
import { formatSetsReps } from "@/lib/programs/setsReps";
import { ExerciseSearchPicker, type ExercisePickerOption } from "@/components/ExerciseSearchPicker";
import { fromKg } from "@/lib/standards/benchmarks";
import type { Unit } from "@/lib/lifting/plates";

// Editing existing values only — no reordering/add/remove here, that stays
// in ProgramExerciseForm (add) and the plain exercise list (no delete yet).
export function ProgramExerciseEditForm({
  id,
  programId,
  exerciseName,
  exercises,
  sets,
  reps,
  percentOfMax,
  isAmrap,
  note,
  unit,
  trainingMaxKg,
  action,
  swapAction,
}: {
  id: string;
  programId: string;
  exerciseName: string;
  exercises: ExercisePickerOption[];
  sets: number;
  reps: number;
  percentOfMax: number | null;
  isAmrap: boolean;
  note: string | null;
  unit: Unit;
  trainingMaxKg: number | null;
  action: typeof updateProgramExercise;
  swapAction: typeof swapProgramExercise;
}) {
  const [editing, setEditing] = useState(false);
  const [changingExercise, setChangingExercise] = useState(false);
  const setsRepsDisplay = formatSetsReps(sets, reps, isAmrap);

  // Same calculation as the Session page's resolved view — rounded to 1
  // decimal, no loadable-increment rounding here, since that's only
  // applied downstream at the actual log-set step.
  const resolvedWeight =
    percentOfMax != null && trainingMaxKg != null
      ? Math.round(fromKg(trainingMaxKg * (percentOfMax / 100), unit) * 10) / 10
      : null;
  const tmDisplay = trainingMaxKg != null ? Math.round(fromKg(trainingMaxKg, unit) * 10) / 10 : null;

  if (!editing) {
    return (
      <li className="text-sm text-neutral-300">
        <div className="flex items-center justify-between">
          <span>
            {exerciseName} — {setsRepsDisplay}
            {percentOfMax != null &&
              (resolvedWeight != null && tmDisplay != null ? (
                <>
                  {" "}
                  @ {resolvedWeight}
                  {unit}{" "}
                  <span className="text-neutral-500">
                    ({percentOfMax}% of {tmDisplay}
                    {unit} TM)
                  </span>
                </>
              ) : (
                <>
                  {" "}
                  @ {percentOfMax}% <span className="text-orange-500">(no TM set)</span>
                </>
              ))}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-orange-500 hover:underline"
          >
            Edit
          </button>
        </div>
        {note && <p className="mt-0.5 text-xs italic text-neutral-500">{note}</p>}
      </li>
    );
  }

  return (
    <li className="rounded-md border border-neutral-800 bg-neutral-950 p-3">
      {changingExercise ? (
        <div className="mb-3">
          <ExerciseSearchPicker
            exercises={exercises}
            onSelect={async (exercise) => {
              const swapFormData = new FormData();
              swapFormData.set("program_id", programId);
              swapFormData.set("program_exercise_id", id);
              swapFormData.set("exercise_id", exercise.id);
              await swapAction(swapFormData);
              setChangingExercise(false);
            }}
          />
          <button
            type="button"
            onClick={() => setChangingExercise(false)}
            className="mt-2 text-xs text-neutral-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-white">{exerciseName}</p>
          <button
            type="button"
            onClick={() => setChangingExercise(true)}
            className="text-xs text-orange-500 hover:underline"
          >
            Change exercise
          </button>
        </div>
      )}

      <form
        action={async (formData) => {
          await action(formData);
          setEditing(false);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="program_id" value={programId} />
        <input type="hidden" name="program_exercise_id" value={id} />

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
