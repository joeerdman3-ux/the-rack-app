export const MAIN_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press"] as const;
export type MainLift = (typeof MAIN_LIFTS)[number];
