"use client";

import { useMemo, useState } from "react";

export interface Exercise {
  id: string;
  name: string;
  primary_lift: string;
  movement_pattern: string | null;
  equipment: string | null;
  description: string | null;
  muscle_group: string | null;
  difficulty: string | null;
}

const PRIMARY_LIFT_LABELS: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  ohp: "Overhead Press",
  general: "General",
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

// Same badge shape as the strength-standards tier badges in StandardsPanel,
// just re-colored for a 3-level scale instead of 5.
const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-green-950 text-green-300",
  Intermediate: "bg-blue-950 text-blue-300",
  Advanced: "bg-purple-950 text-purple-300",
};

const selectClasses =
  "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500";

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState("");
  const [primaryLift, setPrimaryLift] = useState("all");
  const [muscleGroup, setMuscleGroup] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const muscleGroups = useMemo(
    () =>
      [...new Set(exercises.map((e) => e.muscle_group).filter((v): v is string => Boolean(v)))].sort(),
    [exercises],
  );
  const equipmentOptions = useMemo(
    () =>
      [...new Set(exercises.map((e) => e.equipment).filter((v): v is string => Boolean(v)))].sort(),
    [exercises],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (query && !e.name.toLowerCase().includes(query)) return false;
      if (primaryLift !== "all" && e.primary_lift !== primaryLift) return false;
      if (muscleGroup !== "all" && e.muscle_group !== muscleGroup) return false;
      if (equipment !== "all" && e.equipment !== equipment) return false;
      if (difficulty !== "all" && e.difficulty !== difficulty) return false;
      return true;
    });
  }, [exercises, search, primaryLift, muscleGroup, equipment, difficulty]);

  return (
    <div>
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={primaryLift}
            onChange={(e) => setPrimaryLift(e.target.value)}
            className={selectClasses}
          >
            <option value="all">All Lifts</option>
            {Object.entries(PRIMARY_LIFT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className={selectClasses}
          >
            <option value="all">All Muscle Groups</option>
            {muscleGroups.map((mg) => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>

          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className={selectClasses}
          >
            <option value="all">All Equipment</option>
            {equipmentOptions.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={selectClasses}
          >
            <option value="all">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">No exercises match your filters.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((exercise) => (
            <li
              key={exercise.id}
              className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-white">{exercise.name}</span>
                {exercise.difficulty && (
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                      DIFFICULTY_STYLES[exercise.difficulty] ?? "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {exercise.difficulty}
                  </span>
                )}
              </div>
              {(exercise.muscle_group || exercise.equipment) && (
                <p className="mt-1 text-sm text-neutral-500">
                  {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
