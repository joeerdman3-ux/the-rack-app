"use client";

import { useMemo, useState } from "react";
import type { Unit } from "@/lib/lifting/plates";
import { ExerciseSearchPicker, type ExercisePickerOption } from "@/components/ExerciseSearchPicker";
import type { logAccessorySet, createExercise } from "./accessoryActions";

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
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState("");
  const [creating, setCreating] = useState(false);

  // Same derivation as the Exercise Library's filter: the set of
  // muscle_group values already in use, so new exercises stay consistent
  // with existing ones instead of introducing free-text variants.
  const muscleGroups = useMemo(
    () =>
      [...new Set(exercises.map((e) => e.muscle_group).filter((v): v is string => Boolean(v)))].sort(),
    [exercises],
  );

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
                  setNewExerciseName("");
                  setNewExerciseMuscleGroup("");
                }
              }}
              className="space-y-2 rounded-md border border-neutral-800 bg-neutral-950 p-3"
            >
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
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
              <label htmlFor="new-exercise-muscle-group" className="block text-sm text-neutral-300">
                Muscle group
              </label>
              <select
                id="new-exercise-muscle-group"
                name="muscle_group"
                required
                value={newExerciseMuscleGroup}
                onChange={(e) => setNewExerciseMuscleGroup(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
              >
                <option value="" disabled>
                  Select muscle group
                </option>
                {muscleGroups.map((mg) => (
                  <option key={mg} value={mg}>
                    {mg}
                  </option>
                ))}
              </select>
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
                    setNewExerciseName("");
                    setNewExerciseMuscleGroup("");
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
