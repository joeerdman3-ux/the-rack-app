// Real AMRAP programming means only the LAST set of a group is AMRAP-to-
// target; prior sets are straight sets at the fixed rep count. is_amrap is
// stored once per program_exercises row (no per-set rows), so this expands
// that single row into the two-part display convention.
export function formatSetsReps(sets: number, reps: number, isAmrap: boolean): string {
  if (!isAmrap) return `${sets}×${reps}`;
  if (sets <= 1) return `1×${reps}+`;
  return `${sets - 1}×${reps}, 1×${reps}+`;
}
