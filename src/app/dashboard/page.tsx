import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

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

        <p className="text-neutral-300">Signed in as {user.email}</p>
        <p className="mt-1 text-sm text-neutral-500">
          Profile row created: {profile ? "yes" : "no"}
        </p>

        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900 p-6 text-neutral-400">
          Logging, standards, leaderboard, and coach view land here next.
        </div>
      </div>
    </div>
  );
}
