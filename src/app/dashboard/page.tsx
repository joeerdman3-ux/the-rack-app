import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { logSet, deleteSet } from "./actions";
import { LogForm } from "./LogForm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const unit = profile?.unit ?? "lb";
  const today = new Date().toISOString().slice(0, 10);

  const { data: todaysSets } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .eq("logged_date", today)
    .order("logged_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">The Rack</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Log out
            </button>
          </form>
        </div>

        <LogForm unit={unit} action={logSet} />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Today&apos;s sets</h2>

          {!todaysSets || todaysSets.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing logged yet today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysSets.map((set) => (
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
                    <p className="text-sm text-neutral-500">e1RM: {set.e1rm}{unit}</p>
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
          )}
        </section>
      </div>
    </div>
  );
}
