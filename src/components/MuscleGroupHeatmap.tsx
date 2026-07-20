import { MUSCLE_GROUP_LABELS } from "@/lib/lifting/muscleGroups";
import type { MuscleGroupVolume } from "@/lib/history/muscleGroupVolume";

// No client interactivity yet (fixed 7-day window, no date picker), so
// this stays a plain server-renderable component rather than "use client".
export function MuscleGroupHeatmap({ volumes }: { volumes: MuscleGroupVolume[] }) {
  const maxSets = Math.max(...volumes.map((v) => v.sets), 0);

  if (maxSets === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No sets logged in the last 7 days yet — log some workouts or accessory sets to see your
        muscle-group breakdown.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {volumes.map((v) => {
        const pct = maxSets > 0 ? (v.sets / maxSets) * 100 : 0;
        return (
          <li key={v.muscleGroup}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-neutral-300">{MUSCLE_GROUP_LABELS[v.muscleGroup]}</span>
              <span className="text-neutral-500">{v.sets.toFixed(1)} sets</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-orange-600"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
