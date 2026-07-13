export const MAIN_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press"] as const;
export type MainLift = (typeof MAIN_LIFTS)[number];

// Maps exercises.primary_lift (squat/bench/deadlift/ohp/general) to the
// MainLift label LogForm expects. 'general' and anything else has no entry
// here — those exercises route to Accessory logging instead.
export const PRIMARY_LIFT_TO_MAIN_LIFT: Record<string, MainLift> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  ohp: "Overhead Press",
};
