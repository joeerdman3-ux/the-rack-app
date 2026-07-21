import { MuscleType, type IExerciseData, type Muscle } from "react-body-highlighter";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "./muscleGroups";
import type { MuscleGroupTier } from "@/lib/history/muscleGroupVolume";

// Our schema tracks one volume number per group; react-body-highlighter's
// anatomical model splits some of those into multiple named sub-regions
// with no single node of their own (e.g. no "shoulders" or "back" region —
// only front/back-deltoids, or trapezius/upper-back/lower-back). Per
// product decision, a group's one value is duplicated across every
// sub-region it maps to rather than split proportionally — we have no
// sub-group data to split by. No two groups share a region, so summing
// per-region frequency in toBodyHighlighterData() below can't double-count.
export const MUSCLE_GROUP_REGIONS: Record<MuscleGroup, Muscle[]> = {
  chest: [MuscleType.CHEST],
  back: [MuscleType.TRAPEZIUS, MuscleType.UPPER_BACK, MuscleType.LOWER_BACK],
  shoulders: [MuscleType.FRONT_DELTOIDS, MuscleType.BACK_DELTOIDS],
  quads: [MuscleType.QUADRICEPS],
  hamstrings: [MuscleType.HAMSTRING],
  glutes: [MuscleType.GLUTEAL],
  biceps: [MuscleType.BICEPS],
  triceps: [MuscleType.TRICEPS],
  calves: [MuscleType.CALVES],
  core: [MuscleType.ABS, MuscleType.OBLIQUES],
  forearms: [MuscleType.FOREARM],
};

// Converts our per-group tiers into react-body-highlighter's <Model> data
// shape. Tier 0 ("no volume this window") is omitted entirely rather than
// passed as frequency: 0 — the library already treats an absent/zero
// frequency as unworked (default body color). One combined array is safe
// to feed both the anterior and posterior <Model> instances: each view's
// SVG only draws the regions it actually contains, silently ignoring any
// Muscle key from `muscles` that belongs to the other view.
export function toBodyHighlighterData(tiers: MuscleGroupTier[]): IExerciseData[] {
  return tiers
    .filter((t) => t.tier > 0)
    .map((t) => ({
      name: MUSCLE_GROUP_LABELS[t.muscleGroup],
      muscles: MUSCLE_GROUP_REGIONS[t.muscleGroup],
      frequency: t.tier,
    }));
}
