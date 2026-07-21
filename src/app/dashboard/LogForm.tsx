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
//
// ?repsTarget= is a variant of ?reps= used for an AMRAP set: instead of
// pre-filling a rep count that would be silently logged if untouched, the
// reps field starts empty with a "target: N+" placeholder.
export function LogForm({ unit, action }: { unit: Unit; action: typeof logSet }) {
  const searchParams = useSearchParams();
  const prefillLift = searchParams.get("lift");
  const prefillWeight = searchParams.get("weight");
  const prefillReps = searchParams.get("reps");
  const repsTarget = searchParams.get("repsTarget");

  const [weight, setWeight] = useState(prefillWeight ?? "135");
  const [lift, setLift] = useState<MainLift>(isMainLift(prefillLift) ? prefillLift : MAIN_LIFTS[0]);
  const [reps, setReps] = useState(prefillReps ?? (repsTarget ? "" : "1"));
  const [missed, setMissed] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [newPR, setNewPR] = useState<{ lift: string; e1rm: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const numericWeight = parseFloat(weight) || 0;
  const weightStep = unit === "kg" ? 2.5 : 5;

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <BarbellVisualizer weight={numericWeight} unit={unit} />

      {newPR && (
        <div className="rounded-md border border-orange-500 bg-orange-950 px-4 py-3 text-sm font-semibold text-orange-200">
          New PR! {newPR.lift} — {newPR.e1rm}
          {unit} e1RM
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-200">
          Couldn&apos;t save that set: {error}
        </div>
      )}

      <form
        action={async (formData) => {
          const result = await action(formData);
          setNewPR(result.success && result.isNewPR ? { lift: result.lift, e1rm: result.e1rm } : null);
          setError(result.success ? null : result.error);
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
              placeholder={repsTarget ? `target: ${repsTarget}+` : undefined}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="rpe" className="mb-1 block text-sm text-neutral-300">
              RPE <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="rpe"
              name="rpe"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={1}
              max={10}
              placeholder={
                missed || stalled ? "1-10, how hard you fought it" : "1-10, how hard it felt"
              }
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="missed"
              checked={missed}
              onChange={(e) => {
                setMissed(e.target.checked);
                if (e.target.checked) setStalled(false);
              }}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
            />
            Missed lift
          </label>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="stalled"
              checked={stalled}
              onChange={(e) => {
                setStalled(e.target.checked);
                if (e.target.checked) setMissed(false);
              }}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
            />
            Stalled / ground it out
          </label>
        </div>

        {(missed || stalled) && (
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
