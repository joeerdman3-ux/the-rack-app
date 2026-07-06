import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteSet } from "@/app/dashboard/actions";
import { ProgressChart } from "@/components/ProgressChart";
import { bestSessionsByLift, weeklyTonnage, isDeloading } from "@/lib/history/aggregate";
import { MAIN_LIFTS } from "@/lib/lifting/constants";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit")
    .eq("id", user.id)
    .single();
  const unit = profile?.unit ?? "lb";

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_date", { ascending: false })
    .order("logged_at", { ascending: false });

  const rows = workouts ?? [];
  const sessionsByLift = bestSessionsByLift(rows);
  const tonnageByWeek = weeklyTonnage(rows);
  const deloadingLifts = MAIN_LIFTS.filter((lift) => isDeloading(sessionsByLift[lift] ?? []));

  const groupedByDate = new Map<string, typeof rows>();
  for (const w of rows) {
    if (!groupedByDate.has(w.logged_date)) groupedByDate.set(w.logged_date, []);
    groupedByDate.get(w.logged_date)!.push(w);
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">History</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        {deloadingLifts.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-900 bg-amber-950/40 p-4">
            <p className="text-sm text-amber-300">
              <span className="font-semibold">Deload signal:</span>{" "}
              {deloadingLifts.join(", ")} {deloadingLifts.length === 1 ? "has" : "have"} gone
              flat or dropped over the last 3 sessions. Consider backing off before pushing again.
            </p>
          </div>
        )}

        <ProgressChart sessionsByLift={sessionsByLift} weeklyTonnage={tonnageByWeek} unit={unit} />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">All logged sets</h2>

          {groupedByDate.size === 0 ? (
            <p className="text-sm text-neutral-500">Nothing logged yet.</p>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedByDate.entries()).map(([date, sets]) => (
                <div key={date}>
                  <h3 className="mb-2 text-sm font-medium text-neutral-400">
                    {new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </h3>
                  <ul className="space-y-2">
                    {sets.map((set) => (
                      <li
                        key={set.id}
                        className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {set.lift} — {set.weight}
                            {unit} × {set.reps}
                            {set.rpe ? ` @ RPE ${set.rpe}` : ""}
                            {set.missed && (
                              <span className="ml-2 rounded bg-red-950 px-1.5 py-0.5 text-xs text-red-300">
                                Missed
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-neutral-500">
                            e1RM: {set.e1rm}
                            {unit}
                          </p>
                        </div>
                        <form action={deleteSet.bind(null, set.id)}>
                          <button
                            type="submit"
                            className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-red-800 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
