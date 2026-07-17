"use client";

import { useState } from "react";
import type { Unit } from "@/lib/lifting/plates";

export function WorkoutEntryForm({
  unit,
  onSubmit,
}: {
  unit: Unit;
  onSubmit?: (data: { exerciseName: string; weight: number; reps: number; sets: number }) => void;
}) {
  const [exerciseName, setExerciseName] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("1");
  const [sets, setSets] = useState("1");
  const weightStep = unit === "kg" ? 2.5 : 5;

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({
            exerciseName,
            weight: parseFloat(weight) || 0,
            reps: parseInt(reps, 10) || 0,
            sets: parseInt(sets, 10) || 0,
          });
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="exerciseName" className="mb-1 block text-sm text-neutral-300">
            Exercise name
          </label>
          <input
            id="exerciseName"
            name="exerciseName"
            type="text"
            required
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="weight" className="mb-1 block text-sm text-neutral-300">
              Weight ({unit})
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              inputMode="decimal"
              step={weightStep}
              min={0}
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="reps" className="mb-1 block text-sm text-neutral-300">
              Reps
            </label>
            <input
              id="reps"
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
            <label htmlFor="sets" className="mb-1 block text-sm text-neutral-300">
              Sets
            </label>
            <input
              id="sets"
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
          Log workout
        </button>
      </form>
    </div>
  );
}
