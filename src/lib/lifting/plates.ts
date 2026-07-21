export type Unit = "lb" | "kg";

export interface PlateDef {
  weight: number;
  color: string;
  textColor: string;
  diameter?: number;
}

// IPF competition colors: same diameter for every calibrated plate,
// distinguished by color (and thickness, handled at render time).
export const KG_PLATES: PlateDef[] = [
  { weight: 25, color: "#dc2626", textColor: "#fff" },
  { weight: 20, color: "#2563eb", textColor: "#fff" },
  { weight: 15, color: "#eab308", textColor: "#1c1917" },
  { weight: 10, color: "#16a34a", textColor: "#fff" },
  { weight: 5, color: "#f4f4f5", textColor: "#1c1917" },
  { weight: 2.5, color: "#18181b", textColor: "#fff" },
  { weight: 1.25, color: "#a1a1aa", textColor: "#1c1917" },
];

// Blackened iron: uncalibrated, diameter grows with weight, no color coding.
export const LB_PLATES: PlateDef[] = [
  { weight: 45, color: "#27272a", textColor: "#d4d4d8", diameter: 170 },
  { weight: 35, color: "#27272a", textColor: "#d4d4d8", diameter: 154 },
  { weight: 25, color: "#27272a", textColor: "#d4d4d8", diameter: 138 },
  { weight: 10, color: "#27272a", textColor: "#d4d4d8", diameter: 108 },
  { weight: 5, color: "#27272a", textColor: "#d4d4d8", diameter: 90 },
  { weight: 2.5, color: "#27272a", textColor: "#d4d4d8", diameter: 74 },
];

export const BAR_WEIGHT: Record<Unit, number> = { lb: 45, kg: 20 };

// Smallest total (both-sides) increment loadable with the standard plate
// set: 2 x 2.5lb or 2 x 1.25kg. Matches LogForm's weight input step.
export const LOADABLE_INCREMENT: Record<Unit, number> = { lb: 5, kg: 2.5 };

export function roundToLoadableIncrement(weight: number, unit: Unit): number {
  const increment = LOADABLE_INCREMENT[unit];
  return Math.round(weight / increment) * increment;
}

export function getPlateDefs(unit: Unit): PlateDef[] {
  return unit === "kg" ? KG_PLATES : LB_PLATES;
}

export interface PlateCount {
  weight: number;
  count: number;
}

export interface PlateResult {
  barWeight: number;
  perSide: PlateCount[];
  remainder: number;
}

// Greedy largest-first plate selection, assuming unlimited plates of each size.
// barWeight defaults to the standard 45lb/20kg bar when omitted, so every
// existing caller (LogForm via BarbellVisualizer) is unaffected — only the
// calculator page passes a different bar type through explicitly.
export function calculatePlates(
  totalWeight: number,
  unit: Unit,
  barWeight: number = BAR_WEIGHT[unit],
): PlateResult {
  const plateDefs = getPlateDefs(unit);
  let perSideWeight = (totalWeight - barWeight) / 2;

  if (!Number.isFinite(perSideWeight) || perSideWeight <= 0) {
    return { barWeight, perSide: [], remainder: 0 };
  }

  const perSide: PlateCount[] = [];
  const epsilon = 0.001;

  for (const plate of plateDefs) {
    let count = 0;
    while (perSideWeight + epsilon >= plate.weight) {
      perSideWeight -= plate.weight;
      count++;
    }
    if (count > 0) perSide.push({ weight: plate.weight, count });
  }

  return { barWeight, perSide, remainder: Math.max(perSideWeight, 0) };
}
