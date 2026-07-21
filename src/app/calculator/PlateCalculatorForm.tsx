"use client";

import { useState } from "react";
import { BarbellVisualizer } from "@/components/BarbellVisualizer";
import { BAR_WEIGHT, type Unit } from "@/lib/lifting/plates";

export function PlateCalculatorForm({ initialUnit }: { initialUnit: Unit }) {
  const [weight, setWeight] = useState("135");
  const [unit, setUnit] = useState<Unit>(initialUnit);
  const numericWeight = parseFloat(weight) || 0;
  const barWeight = BAR_WEIGHT[unit];

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
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

      <BarbellVisualizer weight={numericWeight} unit={unit} />
    </div>
  );
}
