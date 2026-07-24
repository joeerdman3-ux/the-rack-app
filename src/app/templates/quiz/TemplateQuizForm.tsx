"use client";

import { useState } from "react";
import { UseTemplateForm } from "../UseTemplateForm";
import type { applyTemplateChecked } from "../actions";
import {
  recommendTemplate,
  type Complexity,
  type DaysPerWeek,
  type Experience,
  type Goal,
  type QuizAnswers,
} from "@/lib/programs/templateQuiz";

interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
}

interface QuestionOption<T extends string> {
  value: T;
  label: string;
}

interface Question<T extends string> {
  key: keyof QuizAnswers;
  prompt: string;
  options: QuestionOption<T>[];
}

const EXPERIENCE_QUESTION: Question<Experience> = {
  key: "experience",
  prompt: "Training age / experience level",
  options: [
    { value: "new", label: "New to structured programming" },
    { value: "intermediate", label: "1+ years of structured training" },
    { value: "competitive", label: "Competitive lifter / advanced" },
  ],
};

const DAYS_QUESTION: Question<DaysPerWeek> = {
  key: "daysPerWeek",
  prompt: "Days per week available to train",
  options: [
    { value: "low", label: "2-3 days" },
    { value: "moderate", label: "4 days" },
    { value: "high", label: "5-6 days" },
  ],
};

const GOAL_QUESTION: Question<Goal> = {
  key: "goal",
  prompt: "Primary goal right now",
  options: [
    { value: "base", label: "Build a base / get stronger overall" },
    { value: "peak", label: "Peak for a meet or specific date" },
    { value: "general", label: "General strength, no specific event" },
  ],
};

const COMPLEXITY_QUESTION: Question<Complexity> = {
  key: "complexity",
  prompt: "Preference for structure",
  options: [
    { value: "simple", label: "Straightforward and repeatable" },
    { value: "complex", label: "Don't mind higher complexity (e.g. conjugate method)" },
  ],
};

type PartialAnswers = Partial<QuizAnswers>;

function QuestionFieldset<T extends string>({
  question,
  value,
  onChange,
}: {
  question: Question<T>;
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-white">{question.prompt}</legend>
      <div className="space-y-2">
        {question.options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-neutral-300"
          >
            <input
              type="radio"
              name={question.key}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 border-neutral-700 bg-neutral-950"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TemplateQuizForm({
  templates,
  action,
}: {
  templates: TemplateOption[];
  action: typeof applyTemplateChecked;
}) {
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [submitted, setSubmitted] = useState(false);

  const isComplete =
    answers.experience != null &&
    answers.daysPerWeek != null &&
    answers.goal != null &&
    answers.complexity != null;

  if (submitted && isComplete) {
    const recommendation = recommendTemplate(answers as QuizAnswers);
    // program_templates is seeded outside this codebase (0014's own
    // comment), so this match is against live data — case-insensitive
    // exact match on name, with a graceful fallback if it's ever missing
    // rather than a broken link.
    const matchedTemplate = templates.find(
      (t) => t.name.toLowerCase() === recommendation.templateName.toLowerCase(),
    );

    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <p className="mb-1 text-sm text-neutral-500">We&apos;d recommend</p>
        <h2 className="mb-2 text-xl font-bold text-white">{recommendation.templateName}</h2>
        <p className="mb-4 text-sm text-neutral-300">{recommendation.reason}</p>

        {matchedTemplate ? (
          <>
            {matchedTemplate.description && (
              <p className="mb-4 text-sm text-neutral-400">{matchedTemplate.description}</p>
            )}
            <UseTemplateForm
              templateId={matchedTemplate.id}
              templateName={matchedTemplate.name}
              action={action}
            />
          </>
        ) : (
          <p className="mb-4 text-sm text-amber-300">
            We couldn&apos;t find that template right now — take a look at the full list instead.
          </p>
        )}

        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-orange-500 hover:underline"
        >
          Retake the quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <QuestionFieldset
        question={EXPERIENCE_QUESTION}
        value={answers.experience}
        onChange={(value) => setAnswers((prev) => ({ ...prev, experience: value }))}
      />
      <QuestionFieldset
        question={DAYS_QUESTION}
        value={answers.daysPerWeek}
        onChange={(value) => setAnswers((prev) => ({ ...prev, daysPerWeek: value }))}
      />
      <QuestionFieldset
        question={GOAL_QUESTION}
        value={answers.goal}
        onChange={(value) => setAnswers((prev) => ({ ...prev, goal: value }))}
      />
      <QuestionFieldset
        question={COMPLEXITY_QUESTION}
        value={answers.complexity}
        onChange={(value) => setAnswers((prev) => ({ ...prev, complexity: value }))}
      />

      <button
        type="button"
        onClick={() => setSubmitted(true)}
        disabled={!isComplete}
        className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Get my recommendation
      </button>
    </div>
  );
}
