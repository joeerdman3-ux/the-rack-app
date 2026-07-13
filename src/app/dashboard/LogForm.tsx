"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarbellVisualizer } from "@/components/BarbellVisualizer";
import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import { STICKING_POINTS_BY_LIFT, STICKING_POINT_LABELS } from "@/lib/standards/stickingPoints";
import type { Unit } from "@/lib/lifting/plates";
import type { logSet } from "./actions";

function isMainLift(value: string | null): value is MainLift {
  return value != null && (MAIN_LIFTS as readonly string[]).includes(value);
}

// Optional ?lift=&weight=&reps= URL params pre-fill the form on mount (e.g.
// from Today's Session "Log this set"). Absent params fall back to the
// original defaults, so plain navigation to /dashboard is unchanged.
export function LogForm({ unit, action }: { unit: Unit; action: typeof logSet }) {
  const searchParams = useSearchParams();
  const prefillLift = searchParams.get("lift");
  const prefillWeight = searchParams.get("weight");
  const prefillReps = searchParams.get("reps");

  const [weight, setWeight] = useState(prefillWeight ?? "135");
  const [lift, setLift] = useState<MainLift>(isMainLift(prefillLift) ? prefillLift : MAIN_LIFTS[0]);
  const [reps, setReps] = useState(prefillReps ?? "1");
  const [missed, setMissed] = useState(false);
  const numericWeight = parseFloat(weight) || 0;
  const weightStep = unit === "kg" ? 2.5 : 5;

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <BarbellVisualizer weight={numericWeight} unit={unit} />

      <form
        action={async (formData) => {
          await action(formData);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="lift" className="mb-1 block text-sm text-neutral-300">
            Lift
          </label>
          <select
            id="lift"
            name="lift"
            required
            value={lift}
            onChange={(e) => setLift(e.target.value as MainLift)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
          >
            {MAIN_LIFTS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
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
            <label htmlFor="rpe" className="mb-1 block text-sm text-neutral-300">
              RPE
            </label>
            <input
              id="rpe"
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

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="missed"
            checked={missed}
            onChange={(e) => setMissed(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
          />
          Missed lift
        </label>

        {missed && (
          <div>
            <label htmlFor="sticking_point" className="mb-1 block text-sm text-neutral-300">
              Where did it fail?
            </label>
            <select
              id="sticking_point"
              name="sticking_point"
              defaultValue=""
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            >
              <option value="">Not sure / didn&apos;t note it</option>
              {STICKING_POINTS_BY_LIFT[lift].map((point) => (
                <option key={point} value={point}>
                  {STICKING_POINT_LABELS[point]}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500"
        >
          Log set
        </button>
      </form>
    </div>
  );
}
