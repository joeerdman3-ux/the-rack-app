import { TIERS, type RatioThresholds, type Tier } from "./tables";

export function getTier(ratio: number, thresholds: RatioThresholds): Tier {
  if (ratio >= thresholds.Elite) return "Elite";
  if (ratio >= thresholds.Advanced) return "Advanced";
  if (ratio >= thresholds.Intermediate) return "Intermediate";
  if (ratio >= thresholds.Novice) return "Novice";
  return "Untrained";
}

export function tierIndex(tier: Tier): number {
  return TIERS.indexOf(tier);
}
