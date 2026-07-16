import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProgram } from "./actions";

export default async function ProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: programs } = await supabase
    .from("programs")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Programs</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <form action={createProgram} className="mb-6 flex gap-3">
          <input
            type="text"
            name="name"
            placeholder="New program name..."
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"
          >
            Create Program
          </button>
        </form>

        {!programs || programs.length === 0 ? (
          <p className="text-sm text-neutral-500">No programs yet — create one above.</p>
        ) : (
          <ul className="space-y-2">
            {programs.map((program) => (
              <li key={program.id}>
                <Link
                  href={`/programs/${program.id}`}
                  className="block rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 text-white hover:border-orange-500"
                >
                  {program.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
