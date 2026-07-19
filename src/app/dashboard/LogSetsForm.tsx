"use client";

import { useState } from "react";
import type { Unit } from "@/lib/lifting/plates";
import { ExerciseSearchPicker, type ExercisePickerOption } from "@/components/ExerciseSearchPicker";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/lib/lifting/muscleGroups";
import type { logAccessorySet, createExercise } from "./accessoryActions";

interface MuscleGroupRow {
  muscleGroup: string;
  ratio: string;
}

const EMPTY_MUSCLE_GROUP_ROW: MuscleGroupRow = { muscleGroup: "", ratio: "" };
// Implied ratio for the common case: one muscle group means it's the whole
// contribution. Ratio only becomes a user-facing input once a second row
// is added and the split actually needs to be specified.
const SINGLE_ROW_RATIO = "1";

// Writes to accessory_logs via exercise_id — same table/shape as the
// Accessory tab, not workouts and not a free-text lift field — so this can
// never corrupt leaderboards/PRs/diagnosis, which all key off workouts.lift
// being one of the four fixed competition-lift strings.
export function LogSetsForm({
  unit,
  exercises: initialExercises,
  action,
  createExerciseAction,
}: {
  unit: Unit;
  exercises: ExercisePickerOption[];
  action: typeof logAccessorySet;
  createExerciseAction: typeof createExercise;
}) {
  const [exercises, setExercises] = useState(initialExercises);
  const [selected, setSelected] = useState<ExercisePickerOption | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [muscleGroupRows, setMuscleGroupRows] = useState<MuscleGroupRow[]>([
    { ...EMPTY_MUSCLE_GROUP_ROW },
  ]);
  const [creating, setCreating] = useState(false);

  function updateMuscleGroupRow(index: number, patch: Partial<MuscleGroupRow>) {
    setMuscleGroupRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addMuscleGroupRow() {
    setMuscleGroupRows((prev) => [...prev, { ...EMPTY_MUSCLE_GROUP_ROW }]);
  }

  function removeMuscleGroupRow(index: number) {
    setMuscleGroupRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Collapsing back to a single row means the split no longer applies —
      // that row is implicitly the whole contribution again.
      return next.length === 1 ? [{ ...next[0], ratio: SINGLE_ROW_RATIO }] : next;
    });
  }

  function resetNewExerciseForm() {
    setNewExerciseName("");
    setMuscleGroupRows([{ ...EMPTY_MUSCLE_GROUP_ROW }]);
  }

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("1");
  const [sets, setSets] = useState("1");

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      {!selected ? (
        <div className="space-y-3">
          <ExerciseSearchPicker exercises={exercises} onSelect={setSelected} />

          {addingNew ? (
            <form
              action={async (formData) => {
                setCreating(true);
                const result = await createExerciseAction(formData);
                setCreating(false);
                if (result.success) {
                  setExercises((prev) => [...prev, result.exercise]);
                  setSelected(result.exercise);
                  setAddingNew(false);
                  resetNewExerciseForm();
                }
              }}
              className="space-y-3 rounded-md border border-neutral-800 bg-neutral-950 p-3"
            >
              <div>
                <label htmlFor="new-exercise-name" className="block text-sm text-neutral-300">
                  New exercise name
                </label>
                <input
                  id="new-exercise-name"
                  name="name"
                  type="text"
                  required
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-sm text-neutral-300">Muscle group(s)</span>
                {muscleGroupRows.map((row, index) => {
                  // Excludes groups already picked in OTHER rows, so the
                  // same muscle group can't be added twice.
                  const availableGroups = MUSCLE_GROUPS.filter(
                    (mg) => mg === row.muscleGroup || !muscleGroupRows.some((r) => r.muscleGroup === mg),
                  );
                  return (
                    <div key={index} className="flex gap-2">
                      <select
                        aria-label={`Muscle group ${index + 1}`}
                        name="muscle_group"
                        required
                        value={row.muscleGroup}
                        onChange={(e) => updateMuscleGroupRow(index, { muscleGroup: e.target.value })}
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
                      {muscleGroupRows.length > 1 ? (
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
                            onChange={(e) => updateMuscleGroupRow(index, { ratio: e.target.value })}
                            placeholder="Ratio"
                            className="w-20 shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-white outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeMuscleGroupRow(index)}
                            className="shrink-0 rounded-md border border-neutral-700 px-2 py-2 text-xs text-neutral-400 hover:bg-neutral-800"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <input type="hidden" name="ratio" value={SINGLE_ROW_RATIO} />
                      )}
                    </div>
                  );
                })}
                {muscleGroupRows.length < MUSCLE_GROUPS.length && (
                  <button
                    type="button"
                    onClick={addMuscleGroupRow}
                    className="text-xs text-orange-500 hover:underline"
                  >
                    + Add muscle group
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create & select"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingNew(false);
                    resetNewExerciseForm();
                  }}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="text-sm text-orange-500 hover:underline"
            >
              + Add new exercise
            </button>
          )}
        </div>
      ) : (
        <form
          action={async (formData) => {
            await action(formData);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="exercise_id" value={selected.id} />

          <div className="flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2">
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
              <label htmlFor="logsets-weight" className="mb-1 block text-sm text-neutral-300">
                Weight ({unit})
              </label>
              <input
                id="logsets-weight"
                name="weight"
                type="number"
                inputMode="decimal"
                step={unit === "kg" ? 2.5 : 5}
                min={0}
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="logsets-reps" className="mb-1 block text-sm text-neutral-300">
                Reps
              </label>
              <input
                id="logsets-reps"
                name="reps"
                type="number"
                inputMode="numeric"
                step={1}
                min={1}
                required
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="logsets-sets" className="mb-1 block text-sm text-neutral-300">
                Sets
              </label>
              <input
                id="logsets-sets"
                name="sets"
                type="number"
                inputMode="numeric"
                step={1}
                min={1}
                required
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500"
          >
            Log sets
          </button>
        </form>
      )}
    </div>
  );
}
