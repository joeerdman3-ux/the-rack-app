import Image from "next/image";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 py-16 text-center">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="" width={44} height={42} priority />
        <h1 className="text-4xl font-bold text-white">The Rack</h1>
      </div>

      <h2 className="mt-6 max-w-lg text-2xl font-semibold text-white sm:text-3xl">
        Know exactly what&apos;s holding your lifts back
      </h2>
      <p className="mt-3 max-w-md text-neutral-400">
        Log your squat, bench, and deadlift, and The Rack tells you exactly what to work on next.
      </p>

      <div className="mt-8">
        <Image
          src="/dashboard-preview.png"
          alt="The Rack's weak-point diagnosis panel, showing a most-reported sticking point and prescribed accessory exercises for it"
          width={560}
          height={240}
          className="rounded-lg border border-neutral-800"
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <Link
            href="/signup"
            className="rounded-md bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-500"
          >
            Sign up
          </Link>
          <p className="text-xs text-neutral-500">Free to start — no credit card required.</p>
        </div>
        <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-300">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}
