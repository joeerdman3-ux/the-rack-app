export type Experience = "new" | "intermediate" | "competitive";
export type DaysPerWeek = "low" | "moderate" | "high";
export type Goal = "base" | "peak" | "general";
export type Complexity = "simple" | "complex";

export interface QuizAnswers {
  experience: Experience;
  daysPerWeek: DaysPerWeek;
  goal: Goal;
  complexity: Complexity;
}

export interface QuizRecommendation {
  templateName: string;
  reason: string;
}

// Priority-ordered rules, first match wins — order matters more than any
// individual rule. Matches against the DB's program_templates.name field
// (program_templates is seeded outside this codebase, per 0014's own
// comment, so there's no template ID to hardcode here — only the name is
// something we can reasonably expect to match).
const RULES: ((a: QuizAnswers) => QuizRecommendation | null)[] = [
  (a) =>
    a.goal === "peak"
      ? {
          templateName: "Peaking",
          reason: "A dedicated taper block built to bring your numbers up for a specific date.",
        }
      : null,
  (a) =>
    a.experience === "new"
      ? {
          templateName: "Foundations",
          reason:
            "Straightforward, repeatable progression to build technique and a base before adding complexity.",
        }
      : null,
  (a) =>
    a.complexity === "complex" && a.experience === "competitive"
      ? {
          templateName: "Conjugate",
          reason:
            "The max-effort/dynamic-effort split rewards lifters with enough experience to manage that complexity.",
        }
      : null,
  (a) =>
    a.daysPerWeek === "high"
      ? {
          templateName: "Advanced",
          reason: "Higher frequency and volume that fits how much time you have to train.",
        }
      : null,
];

const DEFAULT_RECOMMENDATION: QuizRecommendation = {
  templateName: "Wave Cycle",
  reason: "Periodized rep/intensity waves — a solid default for building general strength.",
};

export function recommendTemplate(answers: QuizAnswers): QuizRecommendation {
  for (const rule of RULES) {
    const result = rule(answers);
    if (result) return result;
  }
  return DEFAULT_RECOMMENDATION;
}
