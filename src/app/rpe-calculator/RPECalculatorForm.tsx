"use client";

import { useState } from "react";
import type { Unit } from "@/lib/lifting/plates";
import {
  RPE_VALUES,
  REP_COUNTS,
  getPercent1RM,
  roundToEstimateIncrement,
  type RPEValue,
  type RepCount,
} from "@/lib/lifting/rpeChart";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const UNIT_STORAGE_KEY = "rack-app:rpe-calculator:unit";

const selectClasses =
  "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500";

export function RPECalculatorForm({ initialUnit }: { initialUnit: Unit }) {
  const [rpe, setRpe] = useState<RPEValue>(8);
  const [reps, setReps] = useState<RepCount>(1);
  const [oneRepMax, setOneRepMax] = useState("");

  // Seeded once from the account's unit setting (same as every other
  // page), then persisted to localStorage on change so this page
  // specifically remembers the last toggle across visits — a pure
  // browser-local UI preference, not written to the DB.
  const [storedUnit, setStoredUnit] = useLocalStorageState(UNIT_STORAGE_KEY, initialUnit);
  const unit: Unit = storedUnit === "kg" ? "kg" : "lb";

  const percent = getPercent1RM(rpe, reps);
  const numericOneRepMax = parseFloat(oneRepMax) || 0;
  const estimatedWeight =
    numericOneRepMax > 0 ? roundToEstimateIncrement((percent / 100) * numericOneRepMax, unit) : null;

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rpe-select" className="mb-1 block text-sm text-neutral-300">
            RPE
          </label>
          <select
            id="rpe-select"
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value) as RPEValue)}
            className={selectClasses}
          >
            {RPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reps-select" className="mb-1 block text-sm text-neutral-300">
            Reps
          </label>
          <select
            id="reps-select"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value) as RepCount)}
            className={selectClasses}
          >
            {REP_COUNTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border border-neutral-700 bg-neutral-950 px-4 py-6 text-center">
        <p className="text-xs uppercase tracking-wide text-neutral-500">%1RM</p>
        <p className="text-4xl font-bold text-white">{percent}%</p>
      </div>

      <div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="rpe-1rm" className="mb-1 block text-sm text-neutral-300">
              Your 1RM ({unit}) <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="rpe-1rm"
              type="number"
              inputMode="decimal"
              step={unit === "kg" ? 2.5 : 5}
              min={0}
              value={oneRepMax}
              onChange={(e) => setOneRepMax(e.target.value)}
              placeholder="e.g. 315"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex w-fit rounded-md border border-neutral-700 text-sm">
            <button
              type="button"
              onClick={() => setStoredUnit("lb")}
              className={`rounded-l-md px-3 py-2 ${unit === "lb" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
            >
              lb
            </button>
            <button
              type="button"
              onClick={() => setStoredUnit("kg")}
              className={`rounded-r-md px-3 py-2 ${unit === "kg" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
            >
              kg
            </button>
          </div>
        </div>

        {estimatedWeight != null && (
          <p className="mt-3 text-sm text-neutral-300">
            Estimated weight: <span className="font-semibold text-white">{estimatedWeight}{unit}</span>
          </p>
        )}
      </div>
    </div>
  );
}
