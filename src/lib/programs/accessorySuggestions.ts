import { PRIMARY_LIFT_TO_MAIN_LIFT, type MainLift } from "@/lib/lifting/constants";

export type ExerciseCategory = "compound" | "isolation";

export interface SessionProgramExercise {
  programExerciseId: string;
  exerciseId: string;
  primaryLift: string;
  percentOfMax: number | null;
  category: ExerciseCategory | null;
}

export interface ReadyLiftPrescription {
  lift: MainLift;
  stickingPointLabel: string;
  suggestedExerciseId: string;
  suggestedExerciseName: string;
  category: ExerciseCategory;
}

export interface AccessorySuggestion {
  programExerciseId: string;
  lift: MainLift;
  stickingPointLabel: string;
  suggestedExerciseId: string;
  suggestedExerciseName: string;
}

// Only surfaces a suggestion for a session that has EXACTLY ONE main-lift
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
//
// Among the session's other rows, only ones whose exercise category
// (compound/isolation, sourced from sticking_point_prescriptions —
// null when that exercise never appears there, i.e. unknown) matches the
// prescription's category are eligible: swapping a compound prescription
// into an isolation slot (or vice versa) changes what the slot is for,
// not just which exercise fills it. A null category is never treated as
// a match — no signal means no guess. At most ONE suggestion is ever
// returned per session (the first eligible slot in sort_order), not one
// per matching row, so the same prescription doesn't get duplicated
// across every accessory in the session.
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
  const candidate = sessionExercises.find(
    (e) =>
      e.programExerciseId !== mainLiftRowId &&
      e.exerciseId !== prescription.suggestedExerciseId &&
      e.category === prescription.category,
  );
  if (!candidate) return [];

  return [
    {
      programExerciseId: candidate.programExerciseId,
      lift: sessionLift,
      stickingPointLabel: prescription.stickingPointLabel,
      suggestedExerciseId: prescription.suggestedExerciseId,
      suggestedExerciseName: prescription.suggestedExerciseName,
    },
  ];
}
