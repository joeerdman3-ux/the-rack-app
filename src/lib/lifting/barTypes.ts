import { toKg, fromKg } from "@/lib/standards/benchmarks";
import type { Unit } from "./plates";

export type BarTypeId = "standard" | "womens" | "safety-squat" | "trap-hex" | "custom";

export interface BarTypeDef {
  id: BarTypeId;
  label: string;
  // Canonical weight(s) this bar is actually manufactured/sold as, keyed
  // by unit. Standard and Women's/technique bars get an entry for BOTH
  // units — real, separately-manufactured products in each unit system,
  // not conversions of each other (45lb isn't exactly 20kg). Safety squat
  // and trap/hex bars only get an lb entry — there's no standard rounded
  // kg-denominated version of these — so resolveBarWeight() below falls
  // back to a straight conversion for kg mode. No separate "Metric
  // training bar (15kg)" entry: that would just duplicate Women's bar's
  // kg value.
  weights: Partial<Record<Unit, number>>;
}

export const BAR_TYPES: BarTypeDef[] = [
  { id: "standard", label: "Standard barbell", weights: { lb: 45, kg: 20 } },
  { id: "womens", label: "Women's / technique bar", weights: { lb: 35, kg: 15 } },
  { id: "safety-squat", label: "Safety squat bar", weights: { lb: 65 } },
  { id: "trap-hex", label: "Trap / hex bar", weights: { lb: 55 } },
  { id: "custom", label: "Custom", weights: {} },
];

export const DEFAULT_BAR_TYPE_ID: BarTypeId = "standard";

// Resolves a bar type + unit into the actual number to feed
// calculatePlates()/BarbellVisualizer. customWeight is only consulted for
// the "custom" id, and is interpreted literally in whichever unit is
// currently selected (no auto-conversion on unit toggle — same as the
// calculator's main target-weight input).
export function resolveBarWeight(barTypeId: BarTypeId, unit: Unit, customWeight: number): number {
  if (barTypeId === "custom") return customWeight;

  const def = BAR_TYPES.find((b) => b.id === barTypeId);
  const direct = def?.weights[unit];
  if (direct != null) return direct;

  const otherUnit: Unit = unit === "lb" ? "kg" : "lb";
  const otherValue = def?.weights[otherUnit];
  if (otherValue == null) return 0;

  const converted = fromKg(toKg(otherValue, otherUnit), unit);
  return Math.round(converted * 10) / 10;
}
