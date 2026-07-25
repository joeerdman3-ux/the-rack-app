import { PRIMARY_LIFT_TO_MAIN_LIFT, type MainLift } from "@/lib/lifting/constants";

export interface SessionProgramExercise {
  programExerciseId: string;
  exerciseId: string;
  primaryLift: string;
  percentOfMax: number | null;
}

export interface ReadyLiftPrescription {
  lift: MainLift;
  stickingPointLabel: string;
  suggestedExerciseId: string;
  suggestedExerciseName: string;
}

export interface AccessorySuggestion {
  programExerciseId: string;
  lift: MainLift;
  stickingPointLabel: string;
  suggestedExerciseId: string;
  suggestedExerciseName: string;
}

// Only surfaces suggestions for a session that has EXACTLY ONE main-lift
// row — a program_exercises entry whose exercise IS a literal competition
// lift (primary_lift in squat/bench/deadlift/ohp, not the 'general'
// catch-all every true accessory gets) with percent_of_max set, i.e. a
// real training-max-based main-lift set. A session with zero main-lift
// rows has nothing to attribute accessories to; a session with two or
// more (e.g. squat AND bench the same day) means there's no way to tell
// which accessory belongs to which lift — both cases return no
// suggestions at all rather than guessing. Same "return nothing rather
// than fabricate on insufficient signal" philosophy diagnosis.ts already
// applies.
export function computeAccessorySuggestions(
  sessionExercises: SessionProgramExercise[],
  readyLiftPrescriptions: ReadyLiftPrescription[],
): AccessorySuggestion[] {
  const mainLiftRows = sessionExercises.filter(
    (e) => PRIMARY_LIFT_TO_MAIN_LIFT[e.primaryLift] != null && e.percentOfMax != null,
  );
  if (mainLiftRows.length !== 1) return [];

  const sessionLift = PRIMARY_LIFT_TO_MAIN_LIFT[mainLiftRows[0].primaryLift];
  const prescription = readyLiftPrescriptions.find((p) => p.lift === sessionLift);
  if (!prescription) return [];

  const mainLiftRowId = mainLiftRows[0].programExerciseId;
  const suggestions: AccessorySuggestion[] = [];
  for (const e of sessionExercises) {
    if (e.programExerciseId === mainLiftRowId) continue;
    // Already the suggested exercise — nothing to suggest.
    if (e.exerciseId === prescription.suggestedExerciseId) continue;
    suggestions.push({
      programExerciseId: e.programExerciseId,
      lift: sessionLift,
      stickingPointLabel: prescription.stickingPointLabel,
      suggestedExerciseId: prescription.suggestedExerciseId,
      suggestedExerciseName: prescription.suggestedExerciseName,
    });
  }
  return suggestions;
}
