import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProgramName, addWeek, addSession, addProgramExercise } from "../actions";
import { ProgramExerciseForm } from "./ProgramExerciseForm";

interface WeekRow {
  id: string;
  week_number: number;
}

interface SessionRow {
  id: string;
  program_week_id: string;
  session_number: number;
  name: string | null;
}

interface ProgramExerciseRow {
  id: string;
  program_session_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  percent_of_max: number | null;
  sort_order: number;
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: program } = await supabase
    .from("programs")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!program) notFound();

  const { data: weeksData } = await supabase
    .from("program_weeks")
    .select("id, week_number")
    .eq("program_id", program.id)
    .order("week_number", { ascending: true });
  const weeks: WeekRow[] = weeksData ?? [];
  const weekIds = weeks.map((w) => w.id);

  const { data: sessionsData } =
    weekIds.length > 0
      ? await supabase
          .from("program_sessions")
          .select("id, program_week_id, session_number, name")
          .in("program_week_id", weekIds)
          .order("session_number", { ascending: true })
      : { data: [] as SessionRow[] };
  const sessions: SessionRow[] = sessionsData ?? [];
  const sessionIds = sessions.map((s) => s.id);

  const { data: programExercisesData } =
    sessionIds.length > 0
      ? await supabase
          .from("program_exercises")
          .select("id, program_session_id, exercise_id, sets, reps, percent_of_max, sort_order")
          .in("program_session_id", sessionIds)
          .order("sort_order", { ascending: true })
      : { data: [] as ProgramExerciseRow[] };
  const programExercises: ProgramExerciseRow[] = programExercisesData ?? [];

  const exerciseIds = [...new Set(programExercises.map((pe) => pe.exercise_id))];
  const { data: exerciseNameRows } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
      : { data: [] };
  const exerciseNameById = new Map((exerciseNameRows ?? []).map((e) => [e.id, e.name]));

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment")
    .order("name", { ascending: true });

  const sessionsByWeek = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    if (!sessionsByWeek.has(s.program_week_id)) sessionsByWeek.set(s.program_week_id, []);
    sessionsByWeek.get(s.program_week_id)!.push(s);
  }

  const exercisesBySession = new Map<string, ProgramExerciseRow[]>();
  for (const pe of programExercises) {
    if (!exercisesBySession.has(pe.program_session_id)) {
      exercisesBySession.set(pe.program_session_id, []);
    }
    exercisesBySession.get(pe.program_session_id)!.push(pe);
  }

  const nextWeekNumber =
    weeks.length > 0 ? Math.max(...weeks.map((w) => w.week_number)) + 1 : 1;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Program Builder</h1>
          <Link href="/programs" className="text-sm text-orange-500 hover:underline">
            Back to programs
          </Link>
        </div>

        <form action={updateProgramName} className="mb-6 flex gap-3">
          <input type="hidden" name="program_id" value={program.id} />
          <input
            type="text"
            name="name"
            defaultValue={program.name}
            required
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-lg font-semibold text-white outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            Save
          </button>
        </form>

        <div className="space-y-6">
          {weeks.map((week) => {
            const weekSessions = sessionsByWeek.get(week.id) ?? [];
            const nextSessionNumber =
              weekSessions.length > 0
                ? Math.max(...weekSessions.map((s) => s.session_number)) + 1
                : 1;

            return (
              <div key={week.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Week {week.week_number}</h2>

                <div className="space-y-4">
                  {weekSessions.map((session) => {
                    const sessionExercises = exercisesBySession.get(session.id) ?? [];
                    const nextSortOrder =
                      sessionExercises.length > 0
                        ? Math.max(...sessionExercises.map((e) => e.sort_order)) + 1
                        : 0;

                    return (
                      <div
                        key={session.id}
                        className="rounded-md border border-neutral-800 bg-neutral-950 p-4"
                      >
                        <h3 className="mb-2 text-sm font-semibold text-neutral-300">
                          {session.name || `Session ${session.session_number}`}
                        </h3>

                        {sessionExercises.length > 0 && (
                          <ul className="mb-3 space-y-1">
                            {sessionExercises.map((pe) => (
                              <li key={pe.id} className="text-sm text-neutral-300">
                                {exerciseNameById.get(pe.exercise_id) ?? "Unknown exercise"}
                                {" — "}
                                {pe.sets}×{pe.reps}
                                {pe.percent_of_max != null && ` @ ${pe.percent_of_max}%`}
                              </li>
                            ))}
                          </ul>
                        )}

                        <ProgramExerciseForm
                          programId={program.id}
                          sessionId={session.id}
                          exercises={allExercises ?? []}
                          nextSortOrder={nextSortOrder}
                          action={addProgramExercise}
                        />
                      </div>
                    );
                  })}
                </div>

                <form action={addSession} className="mt-4 flex gap-3">
                  <input type="hidden" name="program_id" value={program.id} />
                  <input type="hidden" name="week_id" value={week.id} />
                  <input type="hidden" name="next_session_number" value={nextSessionNumber} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Session name (optional, e.g. Squat Day)"
                    className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                  >
                    + Add Session
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        <form action={addWeek} className="mt-6">
          <input type="hidden" name="program_id" value={program.id} />
          <input type="hidden" name="next_week_number" value={nextWeekNumber} />
          <button
            type="submit"
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            + Add Week
          </button>
        </form>
      </div>
    </div>
  );
}
