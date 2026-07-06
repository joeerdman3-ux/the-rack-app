// Epley formula: 1RM = weight * (1 + reps / 30)
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  const raw = weight * (1 + reps / 30);
  return Math.round(raw * 10) / 10;
}
