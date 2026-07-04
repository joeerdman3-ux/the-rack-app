import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <h1 className="text-4xl font-bold text-white">The Rack</h1>
      <p className="mt-3 max-w-md text-neutral-400">
        Log lifts, track PRs, and see exactly what to work on next.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-700 px-4 py-2 font-semibold text-neutral-300 hover:bg-neutral-900"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
