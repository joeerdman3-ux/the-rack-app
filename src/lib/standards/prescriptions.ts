// src/lib/standards/prescriptions.ts
//
// Superseded 2026-07-09 by the sticking_point_prescriptions + exercises
// tables in Supabase (queried in src/app/dashboard/page.tsx, joined via
// src/lib/standards/stickingPoints.ts's mapPrescriptionRows). Nothing in
// the app imports PRESCRIPTIONS anymore — left in place as a reference/
// fallback data set, not wired into diagnosis.ts.
//
// Intentionally typed narrower than the live ExercisePrescription shape
// (no category/targetPercent/weight, added in 0025 for the real merge
// pipeline) — this reference data predates those fields and has no
// category/percent info to honestly fill in.

import type { StickingPoint } from "./stickingPoints";

interface ReferencePrescription {
  exercise: string;
  rationale: string;
  setsReps: string;
}

export const PRESCRIPTIONS: Record<StickingPoint, ReferencePrescription[]> = {
  bench_off_chest: [
    { exercise: 'Spoto Press', rationale: 'Removes chest bounce, forces control in the exact range where the miss happens', setsReps: '4x6-8' },
    { exercise: 'Dead Bench (off pins)', rationale: 'Eliminates stretch reflex, builds raw strength from a dead stop at the sticking point', setsReps: '3x3-5' },
    { exercise: 'Close-Grip Bench', rationale: 'Shifts more load to triceps/chest at the bottom, common weak link for off-chest misses', setsReps: '4x6-8' },
  ],
  bench_midrange: [
    { exercise: 'Board Press (2-board)', rationale: 'Targets the exact midrange position, allows heavier overload than full ROM', setsReps: '4x5' },
    { exercise: 'Larsen Press', rationale: 'Removes leg drive, forces upper body to control the midrange transition', setsReps: '3x6-8' },
  ],
  bench_lockout: [
    { exercise: 'Board Press (4-board)', rationale: 'Isolates the lockout portion, lets you overload triceps at end range', setsReps: '4x5' },
    { exercise: 'Close-Grip Bench', rationale: 'Triceps are the primary lockout driver; close grip directly targets them', setsReps: '4x6-8' },
    { exercise: 'Banded Bench Press', rationale: 'Accommodating resistance increases tension exactly where lockout tends to fail', setsReps: '4x5-6' },
  ],
  squat_hole: [
    { exercise: 'Pause Squat', rationale: 'Removes stretch reflex out of the hole, builds strength from a dead stop at the weakest point', setsReps: '4x3-5' },
    { exercise: 'Front Squat', rationale: 'Forces more upright torso, builds quad/core strength needed to control the bottom', setsReps: '3x5' },
  ],
  squat_parallel: [
    { exercise: 'Pin Squat (parallel pins)', rationale: 'Dead-stop overload at the exact sticking depth', setsReps: '4x4-6' },
    { exercise: 'Tempo Squat (3s down)', rationale: 'Builds control and strength through the transitional range', setsReps: '3x5' },
  ],
  squat_above_parallel: [
    { exercise: 'Box Squat (high box)', rationale: 'Trains the top-half strength curve where the miss occurs', setsReps: '4x5' },
    { exercise: 'Banded Squat', rationale: 'Accommodating resistance loads the top range harder, matching the strength curve', setsReps: '4x5' },
  ],
  deadlift_floor: [
    { exercise: 'Deficit Deadlift (1-2")', rationale: 'Increases ROM off the floor, builds strength in the exact position lifters miss', setsReps: '3x3-5' },
    { exercise: 'Snatch-Grip Deadlift', rationale: 'Wider grip increases starting ROM and back engagement off the floor', setsReps: '3x5' },
  ],
  deadlift_below_knee: [
    { exercise: 'Deficit Deadlift', rationale: 'Extends the pull path through the below-knee transition zone', setsReps: '3x3-5' },
    { exercise: 'Romanian Deadlift', rationale: 'Builds posterior chain strength through the exact range below the knee', setsReps: '3x6-8' },
  ],
  deadlift_knee: [
    { exercise: 'Block Pull (below knee)', rationale: 'Isolates the knee-passing transition with heavier overload', setsReps: '4x3-5' },
    { exercise: 'Romanian Deadlift', rationale: 'Strengthens the hip hinge pattern needed to clear the knee smoothly', setsReps: '3x6-8' },
  ],
  deadlift_lockout: [
    { exercise: 'Block Pull (above knee)', rationale: 'Isolates lockout range, allows heavy overload without floor-pull fatigue', setsReps: '4x3-5' },
    { exercise: 'Banded Deadlift', rationale: 'Accommodating resistance matches the strength curve, loading lockout hardest', setsReps: '4x5' },
  ],
  ohp_bottom: [
    { exercise: 'Pin Press (bottom pins)', rationale: 'Dead-stop strength from the exact bottom position', setsReps: '4x4-6' },
    { exercise: 'Push Press', rationale: 'Builds explosive drive to get through the weakest starting position', setsReps: '3x3-5' },
  ],
  ohp_midrange: [
    { exercise: 'Seated Strict Press', rationale: 'Removes leg drive, isolates shoulder strength through the midrange', setsReps: '4x6-8' },
    { exercise: 'Z-Press', rationale: 'Forces strict vertical bar path, exposing and strengthening midrange weakness', setsReps: '3x5-6' },
  ],
  ohp_lockout: [
    { exercise: 'Pin Press (top pins)', rationale: 'Isolates lockout portion for overload without full-ROM fatigue', setsReps: '4x4-6' },
    { exercise: 'Tricep Dips or Skull Crushers', rationale: 'Triceps are the primary driver of overhead lockout', setsReps: '3x8-10' },
  ],
};
