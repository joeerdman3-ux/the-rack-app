"use client";

import { useMemo, useState } from "react";

export interface ExercisePickerOption {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
}

// Same case-insensitive partial-match-on-name search behavior and styling
// as /exercises and the accessory-logging picker. Extracted as a shared
// component rather than duplicated again for the Program Builder — note
// AccessoryLogForm was deliberately left with its own inline copy rather
// than refactored to use this, to keep zero risk to that already-verified
// flow.
export function ExerciseSearchPicker({
  exercises,
  onSelect,
}: {
  exercises: ExercisePickerOption[];
  onSelect: (exercise: ExercisePickerOption) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(query));
  }, [exercises, search]);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises..."
        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-500"
      />
      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-sm text-neutral-500">No exercises match.</p>
        ) : (
          filtered.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onSelect(exercise)}
              className="block w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-left text-sm hover:border-orange-500"
            >
              <span className="text-white">{exercise.name}</span>
              {(exercise.muscle_group || exercise.equipment) && (
                <span className="ml-2 text-xs text-neutral-500">
                  {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
