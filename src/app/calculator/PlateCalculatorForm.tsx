"use client";

import { useState } from "react";
import { BarbellVisualizer } from "@/components/BarbellVisualizer";
import type { Unit } from "@/lib/lifting/plates";
import {
  BAR_TYPES,
  DEFAULT_BAR_TYPE_ID,
  resolveBarWeight,
  type BarTypeId,
} from "@/lib/lifting/barTypes";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const BAR_TYPE_STORAGE_KEY = "rack-app:calculator:barType";
const CUSTOM_BAR_WEIGHT_STORAGE_KEY = "rack-app:calculator:customBarWeight";

export function PlateCalculatorForm({ initialUnit }: { initialUnit: Unit }) {
  const [weight, setWeight] = useState("135");
  const [unit, setUnit] = useState<Unit>(initialUnit);

  // Purely a client-side display preference (which bar the calculator
  // defaults to), never written to the DB — localStorage is the right
  // tool here, same as any other browser-local UI preference in this app.
  const [storedBarTypeId, setStoredBarTypeId] = useLocalStorageState(
    BAR_TYPE_STORAGE_KEY,
    DEFAULT_BAR_TYPE_ID,
  );
  const barTypeId: BarTypeId = BAR_TYPES.some((b) => b.id === storedBarTypeId)
    ? (storedBarTypeId as BarTypeId)
    : DEFAULT_BAR_TYPE_ID;
  const [customBarWeight, setCustomBarWeight] = useLocalStorageState(
    CUSTOM_BAR_WEIGHT_STORAGE_KEY,
    String(BAR_TYPES[0].weights[initialUnit] ?? 45),
  );

  const numericWeight = parseFloat(weight) || 0;
  const numericCustomBarWeight = parseFloat(customBarWeight) || 0;
  const barWeight = resolveBarWeight(barTypeId, unit, numericCustomBarWeight);

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <div>
        <label htmlFor="calc-bar-type" className="mb-1 block text-sm text-neutral-300">
          Bar type
        </label>
        <select
          id="calc-bar-type"
          value={barTypeId}
          onChange={(e) => setStoredBarTypeId(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
        >
          {BAR_TYPES.map((bar) => (
            <option key={bar.id} value={bar.id}>
              {bar.label}
            </option>
          ))}
        </select>
      </div>

      {barTypeId === "custom" && (
        <div>
          <label htmlFor="calc-custom-bar-weight" className="mb-1 block text-sm text-neutral-300">
            Custom bar weight ({unit})
          </label>
          <input
            id="calc-custom-bar-weight"
            type="number"
            inputMode="decimal"
            step={unit === "kg" ? 2.5 : 5}
            min={0}
            value={customBarWeight}
            onChange={(e) => setCustomBarWeight(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="calc-weight" className="mb-1 block text-sm text-neutral-300">
            Target weight ({unit})
          </label>
          <input
            id="calc-weight"
            type="number"
            inputMode="decimal"
            step={unit === "kg" ? 2.5 : 5}
            min={0}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex w-fit rounded-md border border-neutral-700 text-sm">
          <button
            type="button"
            onClick={() => setUnit("lb")}
            className={`rounded-l-md px-3 py-2 ${unit === "lb" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
          >
            lb
          </button>
          <button
            type="button"
            onClick={() => setUnit("kg")}
            className={`rounded-r-md px-3 py-2 ${unit === "kg" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
          >
            kg
          </button>
        </div>
      </div>

      {numericWeight > 0 && numericWeight < barWeight && (
        <p className="text-sm text-amber-300">
          Target ({numericWeight}
          {unit}) is below bar weight ({barWeight}
          {unit}) — nothing to load.
        </p>
      )}

      <BarbellVisualizer weight={numericWeight} unit={unit} barWeight={barWeight} />
    </div>
  );
}
