"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Unit } from "@/lib/lifting/plates";
import type { logAccessorySet } from "./accessoryActions";

export interface AccessoryExerciseOption {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
}

// Optional ?exerciseId=&weight=&reps= URL params pre-select the exercise and
// pre-fill the form on mount (e.g. from Today's Session "Log this set").
// Absent params fall back to the original defaults, so plain navigation to
// /dashboard is unchanged.
//
// ?repsTarget= is a variant of ?reps= used for an AMRAP set: instead of
// pre-filling a rep count that would be silently logged if untouched, the
// reps field starts empty with a "target: N+" placeholder.
export function AccessoryLogForm({
  unit,
  exercises,
  action,
}: {
  unit: Unit;
  exercises: AccessoryExerciseOption[];
  action: typeof logAccessorySet;
}) {
  const searchParams = useSearchParams();
  const prefillExerciseId = searchParams.get("exerciseId");
  const prefillWeight = searchParams.get("weight");
  const prefillReps = searchParams.get("reps");
  const repsTarget = searchParams.get("repsTarget");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    prefillExerciseId && exercises.some((e) => e.id === prefillExerciseId)
      ? prefillExerciseId
      : null,
  );
  const [weight, setWeight] = useState(prefillWeight ?? "");
  const [reps, setReps] = useState(prefillReps ?? (repsTarget ? "" : "1"));

  const selected = exercises.find((e) => e.id === selectedId) ?? null;

  // Same case-insensitive partial-match-on-name behavior as /exercises.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(query));
  }, [exercises, search]);

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      {!selected ? (
        <div>
          <label htmlFor="accessory-search" className="mb-1 block text-sm text-neutral-300">
            Exercise
          </label>
          <input
            id="accessory-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-sm text-neutral-500">No exercises match.</p>
            ) : (
              filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => setSelectedId(exercise.id)}
                  className="block w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-left text-sm hover:border-orange-500"
                >
                  <span className="text-white">{exercise.name}</span>
                  {(exercise.muscle_group || exercise.equipment) && (
                    <span className="ml-2 text-xs text-neutral-500">
                      {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
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
              onClick={() => setSelectedId(null)}
              className="text-xs text-orange-500 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="accessory-weight" className="mb-1 block text-sm text-neutral-300">
                Weight ({unit})
              </label>
              <input
                id="accessory-weight"
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
              <label htmlFor="accessory-reps" className="mb-1 block text-sm text-neutral-300">
                Reps
              </label>
              <input
                id="accessory-reps"
                name="reps"
                type="number"
                inputMode="numeric"
                step={1}
                min={1}
                required
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={repsTarget ? `target: ${repsTarget}+` : undefined}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="accessory-rpe" className="mb-1 block text-sm text-neutral-300">
                RPE
              </label>
              <input
                id="accessory-rpe"
                name="rpe"
                type="number"
                inputMode="decimal"
                step={0.5}
                min={1}
                max={10}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="accessory-notes" className="mb-1 block text-sm text-neutral-300">
              Notes
            </label>
            <textarea
              id="accessory-notes"
              name="notes"
              rows={2}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500"
          >
            Log accessory set
          </button>
        </form>
      )}
    </div>
  );
}
