"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  MUSCLE_GROUP_LABELS,
  formatMuscleGroups,
  type ExerciseMuscleGroup,
} from "@/lib/lifting/muscleGroups";
import {
  MuscleGroupRowsFields,
  EMPTY_MUSCLE_GROUP_ROW,
  type MuscleGroupRow,
} from "@/components/MuscleGroupRowsFields";
import type { updateExercise } from "./actions";

export interface Exercise {
  id: string;
  name: string;
  primary_lift: string;
  movement_pattern: string | null;
  equipment: string | null;
  description: string | null;
  muscle_groups: ExerciseMuscleGroup[];
  difficulty: string | null;
  // null = preset/seeded (locked); a user id = created by that user, the
  // only one who can edit it. See 0024_exercises_created_by.sql.
  created_by: string | null;
}

const PRIMARY_LIFT_LABELS: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  ohp: "Overhead Press",
  general: "General",
};

// Stored lowercase in the DB; labels are capitalized for display only.
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const NOT_RATED = "not_rated";

// Same badge shape as the strength-standards tier badges in StandardsPanel,
// just re-colored for a 3-level scale instead of 5. Untagged exercises (25
// of the original set predate this column) get the same neutral treatment
// as the "Untrained" tier badge rather than no badge at all.
const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-950 text-green-300",
  intermediate: "bg-blue-950 text-blue-300",
  advanced: "bg-purple-950 text-purple-300",
};
const NOT_RATED_STYLE = "bg-neutral-800 text-neutral-300";

const selectClasses =
  "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500";

export function ExerciseLibrary({
  exercises,
  updateExerciseAction,
  currentUserId,
}: {
  exercises: Exercise[];
  updateExerciseAction: typeof updateExercise;
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [primaryLift, setPrimaryLift] = useState("all");
  const [muscleGroup, setMuscleGroup] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMuscleGroupRows, setEditMuscleGroupRows] = useState<MuscleGroupRow[]>([
    { ...EMPTY_MUSCLE_GROUP_ROW },
  ]);
  const [saving, setSaving] = useState(false);

  function startEditing(exercise: Exercise) {
    setEditingId(exercise.id);
    setEditName(exercise.name);
    setEditMuscleGroupRows(
      exercise.muscle_groups.length > 0
        ? exercise.muscle_groups.map((mg) => ({
            muscleGroup: mg.muscle_group,
            ratio: String(mg.ratio),
          }))
        : [{ ...EMPTY_MUSCLE_GROUP_ROW }],
    );
  }

  // Data-derived (not the full canonical list) so the filter only offers
  // groups that actually match something currently loaded — unlike the
  // create-exercise picker in LogSetsForm, which needs every canonical
  // option regardless of what's in use yet.
  const muscleGroups = useMemo(
    () =>
      [...new Set(exercises.flatMap((e) => e.muscle_groups.map((mg) => mg.muscle_group)))].sort(),
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
      if (muscleGroup !== "all" && !e.muscle_groups.some((mg) => mg.muscle_group === muscleGroup)) return false;
      if (equipment !== "all" && e.equipment !== equipment) return false;
      if (difficulty === NOT_RATED) {
        if (e.difficulty !== null) return false;
      } else if (difficulty !== "all" && e.difficulty !== difficulty) {
        return false;
      }
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
                {MUSCLE_GROUP_LABELS[mg]}
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
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
            <option value={NOT_RATED}>Not rated</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">No exercises match your filters.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((exercise) => {
            if (editingId === exercise.id) {
              return (
                <li
                  key={exercise.id}
                  className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                >
                  <form
                    action={async (formData) => {
                      setSaving(true);
                      const result = await updateExerciseAction(formData);
                      setSaving(false);
                      if (result.success) {
                        setEditingId(null);
                      }
                    }}
                    className="space-y-3"
                  >
                    <input type="hidden" name="id" value={exercise.id} />
                    <div>
                      <label htmlFor="edit-exercise-name" className="block text-sm text-neutral-300">
                        Name
                      </label>
                      <input
                        id="edit-exercise-name"
                        name="name"
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    <MuscleGroupRowsFields rows={editMuscleGroupRows} onChange={setEditMuscleGroupRows} />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            const muscleGroupText = formatMuscleGroups(exercise.muscle_groups);
            return (
              <li
                key={exercise.id}
                className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{exercise.name}</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                      exercise.difficulty
                        ? (DIFFICULTY_STYLES[exercise.difficulty] ?? NOT_RATED_STYLE)
                        : NOT_RATED_STYLE
                    }`}
                  >
                    {exercise.difficulty ? DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty : "Not rated"}
                  </span>
                </div>
                {(muscleGroupText || exercise.equipment) && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {[muscleGroupText, exercise.equipment].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href={`/dashboard?logExerciseId=${exercise.id}`}
                    className="text-xs text-orange-500 hover:underline"
                  >
                    Log this
                  </Link>
                  {exercise.created_by === currentUserId && (
                    <button
                      type="button"
                      onClick={() => startEditing(exercise)}
                      className="text-xs text-orange-500 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
