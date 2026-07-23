"use client";

import { useState } from "react";
import { BarbellVisualizer } from "@/components/BarbellVisualizer";
import { formatPlateSummary, type Unit } from "@/lib/lifting/plates";
import {
  BAR_TYPES,
  DEFAULT_BAR_TYPE_ID,
  resolveBarWeight,
  type BarTypeId,
} from "@/lib/lifting/barTypes";
import { generateWarmupSets } from "@/lib/lifting/warmup";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

// Separate localStorage keys from the plate calculator's — same
// precedent as the RPE calculator: each utility page owns its own
// persisted bar-type/unit preference rather than sharing state across
// pages.
const BAR_TYPE_STORAGE_KEY = "rack-app:warmup-calculator:barType";
const CUSTOM_BAR_WEIGHT_STORAGE_KEY = "rack-app:warmup-calculator:customBarWeight";

export function WarmupCalculatorForm({ initialUnit }: { initialUnit: Unit }) {
  const [weight, setWeight] = useState("315");
  const [unit, setUnit] = useState<Unit>(initialUnit);

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

  // Which step's full plate graphic is expanded, if any — only one at a
  // time, so the page stays a compact scannable list instead of 6-8
  // stacked BarbellVisualizers rendered all at once.
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

  const numericWeight = parseFloat(weight) || 0;
  const numericCustomBarWeight = parseFloat(customBarWeight) || 0;
  const barWeight = resolveBarWeight(barTypeId, unit, numericCustomBarWeight);

  const steps = numericWeight > 0 ? generateWarmupSets(numericWeight, unit, barWeight) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div>
          <label htmlFor="warmup-bar-type" className="mb-1 block text-sm text-neutral-300">
            Bar type
          </label>
          <select
            id="warmup-bar-type"
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
            <label htmlFor="warmup-custom-bar-weight" className="mb-1 block text-sm text-neutral-300">
              Custom bar weight ({unit})
            </label>
            <input
              id="warmup-custom-bar-weight"
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
            <label htmlFor="warmup-weight" className="mb-1 block text-sm text-neutral-300">
              Working weight ({unit})
            </label>
            <input
              id="warmup-weight"
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
      </div>

      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step) => {
            const expanded = expandedLabel === step.label;
            return (
              <div key={step.label}>
                <button
                  type="button"
                  onClick={() => setExpandedLabel(expanded ? null : step.label)}
                  className={`w-full rounded-lg border px-4 py-3 text-left ${
                    expanded
                      ? "border-orange-500 bg-neutral-900"
                      : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">
                      {step.kind === "bar" ? "Bar" : `${step.weight}${unit}`} × {step.reps}
                    </span>
                    <span className="text-xs text-neutral-500">{step.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatPlateSummary(step.plates, unit)}
                  </p>
                </button>

                {expanded && (
                  <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <BarbellVisualizer weight={step.weight} unit={unit} barWeight={barWeight} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
